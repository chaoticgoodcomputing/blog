// Builds the plugin to dist/, in quartz-community/plugin-template's shape: `dist/index.js` is the
// emitter that ships the stylesheet and writes the pages under each tag, `dist/components/index.js`
// the component. The host's singletons (peerDependencies) stay external; our libraries,
// @chaoticgoodcomputing/tags-core and @chaoticgoodcomputing/icons, ship as TypeScript source and are
// inlined (ADR-0005). The icons library's own dependencies, Iconify's packages, stay external too:
// they run while the site builds and can't all be inlined, so they are this plugin's `dependencies`,
// at the library's versions (libs/icons/docs/adr/0001).
//
// The component's browser script is TypeScript too. An `inline:` import is bundled for the browser
// here, on its own, and handed to the component as text, which core runs once per document.
//
// The stylesheet is checked first, and the build fails if it breaks ADR-0003's library-CSS rules.
// It is checked, not rewritten, so the selectors that ship are the ones a reader sees in the source:
// - every rule sits in this package's family layer, `@layer cgc.<name>` (rule 11);
// - every selector is built from this package's BEM block, `.cgc-<name>`, its `__elements` and
//   `--modifiers`, plus pseudo-classes: no tags, ids, attributes or other classes (rules 1, 2, 4);
// - no colour literal and no `font-family`: skin comes from the theme's properties (rule 5);
// - every custom property it defines is `--cgc-` prefixed (rule 7);
// - its one media query is the drawer's, which the plugin rewrites to the site's breakpoint.
import esbuild from "esbuild"
import fs from "node:fs"
import path from "node:path"
import postcss from "postcss"
import selectorParser from "postcss-selector-parser"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies)
const iconsLib = JSON.parse(
  fs.readFileSync("node_modules/@chaoticgoodcomputing/icons/package.json", "utf8"),
).dependencies
const drift = Object.entries(iconsLib).filter(([name, spec]) => pkg.dependencies?.[name] !== spec)
if (drift.length) {
  console.error(
    `package.json must carry @chaoticgoodcomputing/icons' dependencies, at its versions:\n${drift
      .map(
        ([name, spec]) => `  "${name}": "${spec}" (here: ${pkg.dependencies?.[name] ?? "missing"})`,
      )
      .join("\n")}`,
  )
  process.exit(1)
}
const external = [...peers, ...Object.keys(iconsLib)]
const block = pkg.name
const layer = `cgc.${block.replace(/^cgc-/, "")}`
const stylesheet = "src/style.css"
// The drawer's query, at the default breakpoint (src/index.ts rewrites it).
const DRAWER_QUERY = "(max-width: 800px)"

const errors = checkStylesheet(fs.readFileSync(stylesheet, "utf8"))
if (errors.length) {
  console.error(
    `${stylesheet} breaks ADR-0003's library-CSS rules:\n${errors.map((e) => `  ${e}`).join("\n")}`,
  )
  process.exit(1)
}

// `import script from "inline:./x.ts"`: x.ts and what it imports, bundled for the browser into one
// function that runs once, as text.
const inlineScripts = {
  name: "inline-scripts",
  setup(build) {
    build.onResolve({ filter: /^inline:/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.slice("inline:".length)),
      namespace: "inline-script",
    }))
    build.onLoad({ filter: /.*/, namespace: "inline-script" }, async (args) => {
      const result = await esbuild.build({
        entryPoints: [args.path],
        bundle: true,
        write: false,
        format: "iife",
        platform: "browser",
        target: "es2020",
        minify: true,
        logLevel: "warning",
      })
      return { contents: result.outputFiles[0].text, loader: "text", watchFiles: [args.path] }
    })
  },
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
  external: [...external, ...external.map((p) => `${p}/*`)],
  // The stylesheet ships as text, which the emitter hands to Quartz from externalResources().
  // Quartz writes it to its own file under static/, minified by lightningcss.
  loader: { ".css": "text" },
  plugins: [inlineScripts],
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
    } else if (rule.name === "media" && rule.params !== DRAWER_QUERY) {
      errors.push(
        `${at(rule)}: @media ${rule.params} — the only media query is the drawer's, ${DRAWER_QUERY}`,
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
    if (
      /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i.test(
        decl.value,
      )
    ) {
      errors.push(
        `${at(decl)}: ${decl.prop}: ${decl.value} — a colour literal; use the theme's properties`,
      )
    }
    if (decl.prop.startsWith("--") && !decl.prop.startsWith("--cgc-"))
      errors.push(`${at(decl)}: ${decl.prop} — our custom properties are --cgc- prefixed`)
  })
  return errors
}
