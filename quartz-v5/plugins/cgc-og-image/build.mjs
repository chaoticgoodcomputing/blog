// Bundles the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's copies (peerDependencies). esbuild is this package's own
// devDependency, so the build runs stand-alone in a clone (ADR-0005).
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
  // reading-time is CommonJS and requires Node builtins, which an ESM bundle can only reach through
  // a real `require`. Stock og-image's tsup build carries the same shim.
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
  logLevel: "warning",
})
