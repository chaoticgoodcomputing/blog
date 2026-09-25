// Bundles the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's singletons (peerDependencies). Node's own modules stay imports.
import esbuild from "esbuild"
import fs from "node:fs"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies ?? {})

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
