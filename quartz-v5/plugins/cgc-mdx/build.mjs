// Bundles the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's singletons (peerDependencies) and esbuild, which is native. That
// includes our libraries, which ship as TypeScript source (ADR-0005).
// esbuild is used directly because it is already a runtime dependency; tsup would only wrap it.
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
  jsx: "automatic",
  jsxImportSource: "preact",
  external: [...peers, ...peers.map((p) => `${p}/*`), "esbuild"],
  logLevel: "warning",
})
