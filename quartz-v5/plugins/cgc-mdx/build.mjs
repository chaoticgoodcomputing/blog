// Bundles the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's singletons (peerDependencies) and esbuild, which is native.
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
  // The island runtime ships as text: Quartz injects it as the body's `afterDOMLoaded`.
  loader: { ".inline.js": "text" },
  logLevel: "warning",
})
