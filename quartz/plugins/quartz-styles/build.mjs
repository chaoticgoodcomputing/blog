// Compiles the plugin to dist/, the path Quartz's loader imports. It has no runtime dependencies,
// so there is nothing to inline or leave external: esbuild only strips the types. Then
// @chaoticgoodcomputing/declarations writes `dist/index.d.ts`, which Quartz's generated plugin index
// needs to take the package in; the host's types (peerDependencies) stay imports there.
import esbuild from "esbuild"
import fs from "node:fs"
import { emitDeclarations } from "@chaoticgoodcomputing/declarations"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies)
const entryPoints = { index: "src/index.ts" }
await esbuild.build({
  entryPoints,
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  logLevel: "warning",
})

await emitDeclarations({ entries: entryPoints, external: peers })
