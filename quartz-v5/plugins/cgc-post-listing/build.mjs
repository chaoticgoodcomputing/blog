// Builds the plugin to dist/, in quartz-community/plugin-template's shape: `dist/index.js` is the
// transformer that ships the stylesheet, `dist/components/index.js` the component. The host's
// singletons (peerDependencies) stay external; our library, @chaoticgoodcomputing/tags-core, ships
// as TypeScript source and is inlined (ADR-0005), as is reading-time's word counter.
//
// The stylesheet is checked first, and the build fails if it breaks ADR-0003's library-CSS rules.
// It is checked, not rewritten, so the selectors that ship are the ones a reader sees in the source:
// - every rule sits in this package's family layer, `@layer cgc.<name>` (rule 11);
// - every selector is built from this package's BEM block, `.cgc-<name>`, its `__elements` and
//   `--modifiers`, plus pseudo-classes: no tags, ids, attributes or other classes (rules 1, 2, 4);
// - no colour literal and no `font-family`: skin comes from the theme's properties (rule 5);
// - every custom property it defines is `--cgc-` prefixed (rule 7).
import esbuild from "esbuild"
import fs from "node:fs"
import postcss from "postcss"
import selectorParser from "postcss-selector-parser"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies)
const block = pkg.name
const layer = `cgc.${block.replace(/^cgc-/, "")}`
const stylesheet = "src/style.css"

const errors = checkStylesheet(fs.readFileSync(stylesheet, "utf8"))
if (errors.length) {
  console.error(
    `${stylesheet} breaks ADR-0003's library-CSS rules:\n${errors.map((e) => `  ${e}`).join("\n")}`,
  )
  process.exit(1)
}

await esbuild.build({
  entryPoints: { index: "src/index.ts", "components/index": "src/components/index.ts" },
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  jsx: "automatic",
  jsxImportSource: "preact",
  external: [...peers, ...peers.map((p) => `${p}/*`)],
  // The stylesheet ships as text, which the transformer hands to Quartz from externalResources().
  // Quartz writes it to its own file under static/, minified by lightningcss.
  loader: { ".css": "text" },
  logLevel: "warning",
})

function checkStylesheet(css) {
  const errors = []
  const ours = (name) =>
    name === block || name.startsWith(`${block}__`) || name.startsWith(`${block}--`)
  const root = postcss.parse(css, { from: stylesheet })
  const at = (node) => `${stylesheet}:${node.source?.start?.line}`

  root.walkAtRules((rule) => {
    if (rule.name === "layer" && !(rule.params === layer && rule.nodes && rule.parent === root)) {
      errors.push(
        `${at(rule)}: @layer ${rule.params} — the only layer is a top-level @layer ${layer} { … }`,
      )
    } else if (!["layer", "media", "supports", "container"].includes(rule.name)) {
      errors.push(`${at(rule)}: @${rule.name} is not allowed in library CSS`)
    }
  })
  root.walkRules((rule) => {
    let parent = rule.parent
    while (parent.type === "atrule" && parent.name !== "layer") parent = parent.parent
    if (!(parent.type === "atrule" && parent.params === layer)) {
      errors.push(`${at(rule)}: ${rule.selector} is outside @layer ${layer}`)
    }
    selectorParser((selectors) => {
      selectors.walk((node) => {
        if (node.type === "class" && !ours(node.value)) {
          errors.push(
            `${at(rule)}: .${node.value} in "${rule.selector}" is not this package's (.${block}…)`,
          )
        } else if (["tag", "id", "universal", "attribute", "nesting"].includes(node.type)) {
          errors.push(
            `${at(rule)}: ${String(node).trim()} in "${rule.selector}" selects what this package does not own`,
          )
        }
      })
      selectors.each((selector) => {
        if (!selector.some((node) => node.type === "class"))
          errors.push(`${at(rule)}: "${String(selector).trim()}" names no class of this package`)
      })
    }).processSync(rule.selector)
  })
  root.walkDecls((decl) => {
    if (decl.prop.toLowerCase() === "font-family")
      errors.push(`${at(decl)}: font-family — fonts come from the theme`)
    if (/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i.test(decl.value)) {
      errors.push(
        `${at(decl)}: ${decl.prop}: ${decl.value} — a colour literal; use the theme's properties`,
      )
    }
    if (decl.prop.startsWith("--") && !decl.prop.startsWith("--cgc-"))
      errors.push(`${at(decl)}: ${decl.prop} — our custom properties are --cgc- prefixed`)
  })
  return errors
}
