// Bundles the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's singletons (peerDependencies). The browser script is imported as
// text (src/index.ts), which esbuild honours with no loader configuration.
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

// Its type declarations, a `.d.ts` beside each entry (@chaoticgoodcomputing/declarations): Quartz's
// generated plugin index skips a package without `dist/index.d.ts`, and a TypeScript site reads the
// plugin's options from them. The peers stay imports there too.
await emitDeclarations({ entries: entryPoints, external: peers })
