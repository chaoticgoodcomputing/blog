// Builds the plugin to dist/, in quartz-community/plugin-template's shape: `dist/index.js` is the
// transformer that ships the stylesheet, `dist/components/index.js` the component. The host's
// singletons (peerDependencies) stay external.
//
// Three steps:
// 1. The stylesheet is checked, and the build fails if it breaks ADR-0003's library-CSS rules. It is
//    checked, not rewritten, so the selectors that ship are the ones a reader sees in the source:
//    - every rule sits in this package's family layer, `@layer cgc.<name>` (rule 11);
//    - every selector is built from this package's BEM block, `.cgc-<name>`, its `__elements` and
//      `--modifiers`, plus pseudo-classes: no tags, ids, attributes or other classes (rules 1, 2, 4);
//    - no colour literal and no `font-family`: skin comes from the theme's properties (rule 5);
//    - every custom property it defines, and every keyframes name, is this package's (rule 7).
// 2. The cards' browser script, src/client/, is bundled for the browser into one plain script, with
//    our library's Bluesky client and renderer inlined (`@chaoticgoodcomputing/widgets/bluesky`,
//    ADR-0005). The renderer brings the post card's stylesheet, which the library's own lint checks;
//    it joins ours in this package's family layer.
// 3. The plugin is bundled for Node, with the script and the stylesheet as text, through the
//    virtual module `cgc-social:client` (src/client.d.ts).
import esbuild from "esbuild"
import fs from "node:fs"
import postcss from "postcss"
import selectorParser from "postcss-selector-parser"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies)
const block = pkg.name
const layer = `cgc.${block.replace(/^cgc-/, "")}`
const stylesheet = "src/style.css"

const own = fs.readFileSync(stylesheet, "utf8")
const errors = checkStylesheet(own)
if (errors.length) {
  console.error(
    `${stylesheet} breaks ADR-0003's library-CSS rules:\n${errors.map((e) => `  ${e}`).join("\n")}`,
  )
  process.exit(1)
}

// The browser script, and the stylesheet the libraries it inlines bring with them.
const client = await esbuild.build({
  entryPoints: { social: "src/client/social.ts" },
  outdir: "dist/client",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  minify: true,
  write: false,
  logLevel: "warning",
})
const output = (ext) => client.outputFiles.find((file) => file.path.endsWith(ext))?.text ?? ""
// One spelling of the layer in the whole stylesheet, dotted: lightningcss inverts sublayer order in a
// file that mixes dotted and nested names (ADR-0003's family-layer amendment).
const bundled = output(".css").trim()
const css = `${bundled ? `@layer ${layer} {\n${bundled}\n}\n` : ""}${own}`

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
  plugins: [
    {
      name: "cgc-social-client",
      setup(build) {
        build.onResolve({ filter: /^cgc-social:client$/ }, (args) => ({
          path: args.path,
          namespace: "cgc-social-client",
        }))
        build.onLoad({ filter: /.*/, namespace: "cgc-social-client" }, () => ({
          contents: `export const script = ${JSON.stringify(output(".js"))}\nexport const stylesheet = ${JSON.stringify(css)}\n`,
          loader: "js",
        }))
      },
    },
  ],
  logLevel: "warning",
})

function checkStylesheet(css) {
  const errors = []
  const ours = (name) =>
    name === block || name.startsWith(`${block}__`) || name.startsWith(`${block}--`)
  const root = postcss.parse(css, { from: stylesheet })
  const at = (node) => `${stylesheet}:${node.source?.start?.line}`
  const inKeyframes = (node) => {
    for (let parent = node.parent; parent; parent = parent.parent)
      if (parent.type === "atrule" && /keyframes$/i.test(parent.name)) return true
    return false
  }

  root.walkAtRules((rule) => {
    if (rule.name === "layer" && !(rule.params === layer && rule.nodes && rule.parent === root)) {
      errors.push(
        `${at(rule)}: @layer ${rule.params} — the only layer is a top-level @layer ${layer} { … }`,
      )
    } else if (rule.name === "keyframes") {
      if (!(rule.params === block || rule.params.startsWith(`${block}-`)))
        errors.push(`${at(rule)}: @keyframes ${rule.params} — our keyframes are named ${block}-…`)
      if (!(rule.parent.type === "atrule" && rule.parent.params === layer))
        errors.push(`${at(rule)}: @keyframes ${rule.params} is outside @layer ${layer}`)
    } else if (!["layer", "media", "supports", "container", "keyframes"].includes(rule.name)) {
      errors.push(`${at(rule)}: @${rule.name} is not allowed in library CSS`)
    }
  })
  root.walkRules((rule) => {
    // A keyframe's `from`, `to` or percentage is a point in the animation, not a selector.
    if (inKeyframes(rule)) return
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
    if (decl.prop.startsWith("--") && !decl.prop.startsWith(`--${block}-`))
      errors.push(`${at(decl)}: ${decl.prop} — our custom properties are --${block}- prefixed`)
  })
  return errors
}
