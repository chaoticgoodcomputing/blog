// Builds the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's singletons (peerDependencies). Node's own modules stay imports. That
// includes our libraries, which ship as TypeScript source (ADR-0005). Three things are built:
//
//   1. The stylesheet, from src/styles/: PDF.js's text-layer CSS is prefixed into the Viewer's block,
//      everything is checked against ADR-0003's library-CSS rules, and it goes in the family layer.
//   2. The Viewer's browser files, into dist/client/, which the emitter copies to the site: its island
//      entry and chunks (PDF.js among them, fetched only when a Viewer hydrates), and PDF.js's worker
//      and wasm, copied out of pdfjs-dist (#37).
//   3. The plugin itself, dist/index.js, with the stylesheet and the entry's file name written in.
import esbuild from "esbuild"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import postcss from "postcss"
import selectorParser from "postcss-selector-parser"

const require = createRequire(import.meta.url)
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies ?? {})
const LAYER = "cgc.annotator"
const CLIENT = "dist/client"

fs.rmSync("dist", { recursive: true, force: true })

// 1. The stylesheet ----------------------------------------------------------------------------

// ADR-0003 rule 3, a prefixing pass that fails the build on escape. PDF.js's text-layer CSS is
// third-party CSS in this plugin's own markup, so it is prefixed into the Viewer's block rather than
// left in rule 9's vendor layer, below core, where core's own element rules would reach its spans.
const TEXT_LAYER = { from: "textLayer", to: "cgc-annotator-viewer__text-layer" }
// Custom properties PDF.js's script writes on its own elements: read, never declared here.
const PDFJS_PROPERTIES = ["--min-font-size", "--font-height", "--scale-x", "--rotate", "--total-scale-factor", "--scale-round-x", "--scale-round-y"]

function prefixTextLayer(css, from) {
  const root = postcss.parse(css, { from })
  const fallbacks = new Map()
  const declared = new Set()
  root.walkDecls((decl) => {
    if (!decl.prop.startsWith("--")) return
    if (PDFJS_PROPERTIES.includes(decl.prop)) {
      fallbacks.set(decl.prop, decl.value.trim())
      decl.remove()
    } else declared.add(decl.prop)
  })
  root.walkDecls((decl) => {
    if (declared.has(decl.prop)) decl.prop = `--cgc-annotator-viewer-${decl.prop.slice(2)}`
    decl.value = decl.value.replace(/var\(\s*(--[\w-]+)\s*\)/g, (whole, name) => {
      if (fallbacks.has(name)) return `var(${name}, ${fallbacks.get(name)})`
      if (declared.has(name)) return `var(--cgc-annotator-viewer-${name.slice(2)})`
      return whole
    })
  })
  root.walkRules((rule) => {
    rule.selector = selectorParser((selectors) => {
      selectors.walkClasses((node) => {
        if (node.value === TEXT_LAYER.from) node.value = TEXT_LAYER.to
      })
    }).processSync(rule.selector)
  })
  return root.toString()
}

// Rules 1, 2, 4, 5 and 7, checked on the CSS as it will ship.
function checkStylesheet(css, from) {
  const errors = []
  const ours = (name) => name === "cgc-annotator" || name.startsWith("cgc-annotator__") || name.startsWith("cgc-annotator--") || name.startsWith("cgc-annotator-viewer")
  const root = postcss.parse(css, { from })
  const at = (node) => `${from}:${node.source?.start?.line}`
  root.walkAtRules((rule) => {
    if (!["media", "supports", "container"].includes(rule.name)) errors.push(`${at(rule)}: @${rule.name} — build.mjs adds the only layer, and nothing else is allowed`)
  })
  root.walkRules((rule) => {
    selectorParser((selectors) => {
      selectors.each((selector) => {
        // The element a rule starts at must be ours; what it reaches inside an element of ours is ours too.
        let anchored = false
        for (const node of selector.nodes) {
          if (node.type === "combinator") break
          if (node.type === "class" && ours(node.value)) anchored = true
        }
        if (!anchored) errors.push(`${at(rule)}: "${String(selector).trim()}" doesn't start at an element of this plugin's (.cgc-annotator…)`)
        selector.walkCombinators((node) => {
          if (node.value.trim() === "+" || node.value.trim() === "~") errors.push(`${at(rule)}: "${String(selector).trim()}" reaches a sibling this plugin may not own`)
        })
      })
    }).processSync(rule.selector)
  })
  root.walkDecls((decl) => {
    if (decl.prop.toLowerCase() === "font-family") errors.push(`${at(decl)}: font-family — fonts come from the theme`)
    if (/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i.test(decl.value)) {
      errors.push(`${at(decl)}: ${decl.prop}: ${decl.value} — a colour literal; use the theme's properties`)
    }
    if (decl.prop.startsWith("--") && !decl.prop.startsWith("--cgc-annotator")) errors.push(`${at(decl)}: ${decl.prop} — this plugin's custom properties are --cgc-annotator…`)
  })
  return errors
}

const sheets = [
  ["src/styles/pdfjs-text-layer.css", (css, from) => prefixTextLayer(css, from)],
  ["src/styles/annotator.css", (css) => css],
].map(([file, transform]) => [file, transform(fs.readFileSync(file, "utf8"), file)])
const errors = sheets.flatMap(([file, css]) => checkStylesheet(css, file))
if (errors.length) {
  console.error(`cgc-annotator's stylesheet breaks ADR-0003's library-CSS rules:\n${errors.map((e) => `  ${e}`).join("\n")}`)
  process.exit(1)
}
// One spelling of the layer per file: lightningcss inverts sublayer order when a file mixes them.
const stylesheet = `@layer ${LAYER} {\n${sheets.map(([, css]) => css.trim()).join("\n\n")}\n}\n`

// 2. The Viewer's browser files ----------------------------------------------------------------

// The island entry is island-runtime's contract, generated by the library itself. The library is
// TypeScript that imports its runtime as text, so it is bundled for this script first.
const lib = await esbuild.build({
  entryPoints: [require.resolve("@chaoticgoodcomputing/island-runtime")],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  logLevel: "warning",
})
const { islandEntrySource } = await import(`data:text/javascript;base64,${Buffer.from(lib.outputFiles[0].text).toString("base64")}`)

const client = await esbuild.build({
  stdin: {
    contents: islandEntrySource("./src/viewer/Viewer.tsx"),
    resolveDir: process.cwd(),
    sourcefile: "viewer-entry.js",
    loader: "js",
  },
  outdir: CLIENT,
  entryNames: "viewer-[hash]",
  chunkNames: "chunk-[hash]",
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  // PDF.js 5 is written for ES2022 (#37).
  target: "es2022",
  minify: true,
  metafile: true,
  jsx: "automatic",
  jsxImportSource: "preact",
  logLevel: "warning",
})
const entry = Object.entries(client.metafile.outputs).find(([, meta]) => meta.entryPoint)[0]

const pdfjs = path.dirname(require.resolve("pdfjs-dist/package.json"))
// Renamed `.js`: every static host serves that as JavaScript, which a module worker requires.
fs.copyFileSync(path.join(pdfjs, "build/pdf.worker.min.mjs"), path.join(CLIENT, "pdf.worker.min.js"))
fs.mkdirSync(path.join(CLIENT, "wasm"), { recursive: true })
for (const file of fs.readdirSync(path.join(pdfjs, "wasm"))) {
  // The decoders and their no-wasm fallback, with their licences.
  fs.copyFileSync(path.join(pdfjs, "wasm", file), path.join(CLIENT, "wasm", file))
}

// 3. The plugin --------------------------------------------------------------------------------

await esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  jsx: "automatic",
  jsxImportSource: "preact",
  external: [...peers, ...peers.map((p) => `${p}/*`)],
  define: {
    __CGC_ANNOTATOR_CSS__: JSON.stringify(stylesheet),
    __CGC_ANNOTATOR_ENTRY__: JSON.stringify(path.basename(entry)),
  },
  plugins: [
    {
      // The Viewer is rendered here at build time, but PDF.js only ever runs in the browser.
      name: "browser-only",
      setup(build) {
        build.onResolve({ filter: /^\.\/pdf$/ }, () => ({ path: "pdf", namespace: "browser-only" }))
        build.onLoad({ filter: /.*/, namespace: "browser-only" }, () => ({ contents: "export {}", loader: "js" }))
      },
    },
  ],
  logLevel: "warning",
})
