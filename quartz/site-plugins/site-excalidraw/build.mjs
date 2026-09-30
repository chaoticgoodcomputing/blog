// Bundles the plugin to dist/. `dist/index.js` holds both factories, the transformer and the filter.
// The host's singletons (peerDependencies) stay external. There is no stylesheet: the drawings' CSS
// is the site's application CSS, in site-styles' components tier (ADR-0003's site-plugin amendment).
import esbuild from "esbuild"
import fs from "node:fs"
import { emitDeclarations } from "@chaoticgoodcomputing/declarations"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies)

const entryPoints = { index: "src/index.ts" }
fs.rmSync("dist", { recursive: true, force: true })
await esbuild.build({
  entryPoints,
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: [...peers, ...peers.map((p) => `${p}/*`)],
  logLevel: "warning",
})

// Its type declarations, `dist/index.d.ts` (@chaoticgoodcomputing/declarations), as every plugin of
// ours has (the package contract, #98). The peers stay imports there too.
await emitDeclarations({ entries: entryPoints, external: peers })
