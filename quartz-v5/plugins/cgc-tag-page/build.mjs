// Bundles the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's copies (peerDependencies), which here is everything the plugin
// imports. esbuild is this package's own devDependency, so the build runs stand-alone in a clone
// (ADR-0005).
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
  external: [...peers, ...peers.map((p) => `${p}/*`)],
  logLevel: "warning",
})
