// Bundles the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's own packages (peerDependencies). That includes our library,
// @chaoticgoodcomputing/tags-core, which ships as TypeScript source (ADR-0005).
import esbuild from "esbuild"
import fs from "node:fs"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies)

await esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: [...peers, ...peers.map((p) => `${p}/*`)],
  logLevel: "warning",
})
