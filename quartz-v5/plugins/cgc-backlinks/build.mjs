// Builds the plugin to dist/, in quartz-community/plugin-template's shape: `dist/index.js` is the
// transformer that ships the stylesheet, `dist/components/index.js` the component. The host's
// singletons (peerDependencies) stay external; our libraries, @chaoticgoodcomputing/icons and
// @chaoticgoodcomputing/tags-core, ship as TypeScript source and are inlined (ADR-0005). The icons
// library's own dependencies, Iconify's packages, stay external too: they run while the site builds
// and can't all be inlined, so they are this plugin's `dependencies`, at the library's versions
// (libs/icons/docs/adr/0001).
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
  // The stylesheet ships as text, which the transformer hands to Quartz from externalResources().
  // Quartz writes it to its own file under static/, minified by lightningcss.
  loader: { ".css": "text" },
  logLevel: "warning",
})
