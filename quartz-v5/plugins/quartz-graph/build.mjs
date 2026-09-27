// Builds the plugin to dist/, in quartz-community/plugin-template's shape: `dist/index.js` is the
// emitter, which publishes the graph's index and ships the stylesheet, and `dist/components/index.js`
// the component. The host's singletons (peerDependencies) stay external; our libraries,
// @chaoticgoodcomputing/tags-core and @chaoticgoodcomputing/icons, ship as TypeScript source and are
// inlined (ADR-0005). The icons library's own dependencies, Iconify's packages, stay external too:
// they run while the site builds and can't all be inlined, so they are this plugin's `dependencies`,
// at the library's versions (libs/icons/docs/adr/0001).
//
// Two bundles, in order, then the declarations:
//
// 1. The browser runtime, `src/runtime/main.ts`, with d3's force, drag and zoom modules and tween.js
//    inlined: one self-contained script, minified, that the component ships as its `afterDOMLoaded`.
//    Quartz runs it as a module in a build and wraps it in a function under `serve`, so it is an IIFE,
//    which is both. It stays in memory: the component imports it as text, as `cgc-graph:runtime`.
// 2. The plugin itself, for Node.
// 3. Its type declarations, a `.d.ts` beside each entry, by @chaoticgoodcomputing/declarations:
//    Quartz's generated plugin index skips a package without `dist/index.d.ts`, and a TypeScript site
//    reads the plugin's options from them. The peers and Iconify's packages stay imports there too.
//
// The stylesheet is checked first, by @chaoticgoodcomputing/css-check, and the build fails if it
// breaks ADR-0003's library-CSS rules: every rule in this package's family layer,
// `@layer cgc.<name>`, every selector inside its BEM block, `.cgc-<name>`, every name it defines
// in the block's namespace, and skin only from the theme's properties (the library's CONTEXT.md
// has the rules). It is checked, not rewritten, so the selectors that ship are the ones a
// reader sees in the source.
import esbuild from "esbuild"
import fs from "node:fs"
import path from "node:path"
import { checkStylesheet } from "@chaoticgoodcomputing/css-check"
import { emitDeclarations } from "@chaoticgoodcomputing/declarations"

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
// The CSS is named for the manifest's name, `cgc-graph`, never the package's scoped name: the
// published class names don't change with the package's (quartz-v5/CONTEXT.md, "Manifest name").
const block = pkg.quartz.name
const layer = `cgc.${block.replace(/^cgc-/, "")}`
const stylesheet = "src/style.css"

const problems = checkStylesheet(fs.readFileSync(stylesheet, "utf8"), {
  from: stylesheet,
  block,
  layer,
})
if (problems.length) {
  console.error(
    `${stylesheet} breaks ADR-0003's library-CSS rules:\n${problems.map((p) => `  ${p}`).join("\n")}`,
  )
  process.exit(1)
}

// d3-force gets a timer that never runs: the graph ticks its simulation from the frame loop that draws
// it (src/runtime/still-timer.ts). Only d3-force's: d3-zoom's transitions keep d3-timer's own.
const stillTimer = {
  name: "still-timer",
  setup(build) {
    build.onResolve({ filter: /^d3-timer$/ }, (args) =>
      /[\\/]d3-force[\\/]/.test(args.importer)
        ? { path: path.resolve("src/runtime/still-timer.ts") }
        : undefined,
    )
  },
}

const runtime = await esbuild.build({
  entryPoints: ["src/runtime/main.ts"],
  outfile: "runtime.js",
  write: false,
  bundle: true,
  format: "iife",
  platform: "browser",
  // Quartz's own browser targets (core componentResources.ts).
  target: ["chrome109", "edge115", "firefox102", "safari15"],
  minify: true,
  legalComments: "none",
  plugins: [stillTimer],
  logLevel: "warning",
})
const RUNTIME = "cgc-graph:runtime"
const runtimeModule = {
  name: "runtime",
  setup(build) {
    build.onResolve({ filter: new RegExp(`^${RUNTIME}$`) }, (args) => ({
      path: args.path,
      namespace: RUNTIME,
    }))
    build.onLoad({ filter: /.*/, namespace: RUNTIME }, () => ({
      contents: runtime.outputFiles[0].text,
      loader: "text",
    }))
  },
}

const entryPoints = { index: "src/index.ts", "components/index": "src/components/index.ts" }
await esbuild.build({
  entryPoints,
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  jsx: "automatic",
  jsxImportSource: "preact",
  external: [...external, ...external.map((p) => `${p}/*`)],
  // The stylesheet ships as text, which the emitter hands to Quartz from externalResources(); the
  // runtime as text, which the component hands to Quartz as its script.
  loader: { ".css": "text" },
  plugins: [runtimeModule],
  logLevel: "warning",
})

await emitDeclarations({ entries: entryPoints, external })
