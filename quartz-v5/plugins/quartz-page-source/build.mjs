// Builds the plugin to dist/, in quartz-community/plugin-template's shape: `dist/index.js` is the
// transformer that ships the stylesheet, `dist/components/index.js` the component. The host's
// singletons (peerDependencies) stay external.
//
// The stylesheet is checked first, by @chaoticgoodcomputing/css-check, and the build fails if it
// breaks ADR-0003's library-CSS rules: every rule in this package's family layer,
// `@layer cgc.<name>`, every selector inside its BEM block, `.cgc-<name>`, every name it defines
// in the block's namespace, and skin only from the theme's properties (the library's CONTEXT.md
// has the rules). It is checked, not rewritten, so the selectors that ship are the ones a
// reader sees in the source.
import esbuild from "esbuild"
import fs from "node:fs"
import { checkStylesheet } from "@chaoticgoodcomputing/css-check"
import { emitDeclarations } from "@chaoticgoodcomputing/declarations"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies)
const block = pkg.quartz.name
const layer = `cgc.${block.replace(/^cgc-/, "")}`
const stylesheet = "src/style.css"

const problems = checkStylesheet(fs.readFileSync(stylesheet, "utf8"), { from: stylesheet, block, layer })
if (problems.length) {
  console.error(
    `${stylesheet} breaks ADR-0003's library-CSS rules:\n${problems.map((p) => `  ${p}`).join("\n")}`,
  )
  process.exit(1)
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
  external: [...peers, ...peers.map((p) => `${p}/*`)],
  // The stylesheet ships as text, which the transformer hands to Quartz from externalResources().
  // Quartz writes it to its own file under static/, minified by lightningcss.
  loader: { ".css": "text" },
  logLevel: "warning",
})

// Its type declarations, a `.d.ts` beside each entry (@chaoticgoodcomputing/declarations): Quartz's
// generated plugin index skips a package without `dist/index.d.ts`, and a TypeScript site reads the
// plugin's options from them. The peers stay imports there too.
await emitDeclarations({ entries: entryPoints, external: peers })
