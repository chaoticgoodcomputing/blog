// Builds the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's singletons (peerDependencies). Node's own modules stay imports. That
// includes our libraries, which ship as TypeScript source (ADR-0005). Three things are built:
//
//   1. The stylesheet, from src/styles/: PDF.js's text-layer CSS is prefixed into the Viewer's block,
//      everything is checked against ADR-0003's library-CSS rules (@chaoticgoodcomputing/css-check),
//      and it goes in the family layer. The frame's CSS is in it too (docs/adr/0004).
//   2. The Viewer's browser files, into dist/client/, which the emitter copies to the site: its island
//      entry and chunks (PDF.js among them, fetched only when a Viewer hydrates), and PDF.js's worker
//      and wasm, copied out of pdfjs-dist (#37).
//   3. The plugin itself, dist/index.js, with the stylesheet, the entry's file name and the frame's
//      script written in, and its frame, dist/frames/index.js, which Quartz's loader imports from
//      the package's `./frames`.
import esbuild from "esbuild"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import postcss from "postcss"
import selectorParser from "postcss-selector-parser"
import { checkStylesheet } from "@chaoticgoodcomputing/css-check"
import { emitDeclarations } from "@chaoticgoodcomputing/declarations"

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
// PDF.js's own custom properties: read here, never declared. Its script writes the first four on the
// text layer's elements. The last three are read by its inline sizes, so pdf.ts writes them on each
// page under PDF.js's names. This is the one place the plugin sets unprefixed properties (ADR-0003
// rule 7), and PDF.js forces it.
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

const sheets = [
  ["src/styles/pdfjs-text-layer.css", (css, from) => prefixTextLayer(css, from)],
  ["src/styles/annotator.css", (css) => css],
  ["src/styles/frame.css", (css) => css],
].map(([file, transform]) => [file, transform(fs.readFileSync(file, "utf8"), file)])

// A package that ships a frame owns the markup the frame renders (the repo's ADR-0003, "packages
// that ship a frame"), and may reach core's two elements around it: the page, under the frame's
// name, and its body. The check sees them as elements of the frame's block; everything else a
// selector names is still held to it.
const FRAME_ROOTS = [
  ['.page[data-frame="cgc-annotation"] > #quartz-body', ".cgc-annotator-frame__quartz-body"],
  ['.page[data-frame="cgc-annotation"]', ".cgc-annotator-frame__quartz-page"],
]
const asChecked = (css) => FRAME_ROOTS.reduce((out, [root, stand]) => out.replaceAll(root, stand), css)

// ADR-0003's library-CSS rules, checked on the CSS as it will ship, with no layer yet: this build adds
// it. Every block is this plugin's, and a selector may reach anything inside an element of one,
// since PDF.js writes the text layer's markup, and the frame places the site's components.
const problems = sheets.flatMap(([file, css]) =>
  // `cgc-drawer` is the family's host-drawer container, which the frame's ☰ drawer declares.
  checkStylesheet(asChecked(css), { from: file, block: ["cgc-annotator", "cgc-annotator-viewer", "cgc-annotator-frame", "cgc-drawer"], reach: "inside" }),
)
if (problems.length) {
  console.error(`cgc-annotator's stylesheet breaks ADR-0003's library-CSS rules:\n${problems.map((p) => `  ${p}`).join("\n")}`)
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

// The frame's script, shipped with the page body's `afterDOMLoaded`: one browser script, no imports.
const frameScript = await esbuild.build({
  entryPoints: ["src/frame/script.inline.ts"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: true,
  write: false,
  logLevel: "warning",
})

const entryPoints = { index: "src/index.ts", "frames/index": "src/frame/index.tsx" }
await esbuild.build({
  entryPoints,
  outdir: "dist",
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
    __CGC_ANNOTATOR_FRAME_SCRIPT__: JSON.stringify(frameScript.outputFiles[0].text),
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

// Its type declarations, a `.d.ts` beside each entry (@chaoticgoodcomputing/declarations): Quartz's
// generated plugin index skips a package without `dist/index.d.ts`, and a TypeScript site reads the
// plugin's options from them. The peers stay imports there too.
await emitDeclarations({ entries: entryPoints, external: peers })
