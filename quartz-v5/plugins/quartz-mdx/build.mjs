// Bundles the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's singletons (peerDependencies) and esbuild, which is native. That
// includes our libraries, which ship as TypeScript source (ADR-0005).
// esbuild is used directly because it is already a runtime dependency; tsup would only wrap it.
import esbuild from "esbuild"
import fs from "node:fs"
import { emitDeclarations } from "@chaoticgoodcomputing/declarations"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies)

const entryPoints = { index: "src/index.ts" }
const external = [...peers, "esbuild"]
await esbuild.build({
  entryPoints,
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  jsx: "automatic",
  jsxImportSource: "preact",
  external: [...external, ...peers.map((p) => `${p}/*`)],
  logLevel: "warning",
})

// Its type declarations, a `.d.ts` beside each entry (@chaoticgoodcomputing/declarations): Quartz's
// generated plugin index skips a package without `dist/index.d.ts`, and a TypeScript site reads the
// plugin's options from them. The peers stay imports there too.
await emitDeclarations({ entries: entryPoints, external })
