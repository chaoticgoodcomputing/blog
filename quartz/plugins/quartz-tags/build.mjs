// Bundles the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's own packages (peerDependencies). That includes our library,
// @chaoticgoodcomputing/tags-core, which ships as TypeScript source (ADR-0005).
//
// Last, @chaoticgoodcomputing/declarations writes a `.d.ts` beside each entry: Quartz's generated
// plugin index skips a package without `dist/index.d.ts`, and a TypeScript site reads the plugin's
// options from them. The peers stay imports there too.
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
  external: [...peers, ...peers.map((p) => `${p}/*`)],
  logLevel: "warning",
})

await emitDeclarations({ entries: entryPoints, external: peers })
