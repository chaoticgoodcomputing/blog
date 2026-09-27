// Bundles the plugin to dist/, following quartz-community/plugin-template's tsup config: inline
// everything except the host's copies (peerDependencies). esbuild is this package's own
// devDependency, so the build runs stand-alone in a clone (ADR-0005).
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
  jsx: "automatic",
  jsxImportSource: "preact",
  external: [...peers, ...peers.map((p) => `${p}/*`)],
  // reading-time is CommonJS and requires Node builtins, which an ESM bundle can only reach through
  // a real `require`. Stock og-image's tsup build carries the same shim.
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
  logLevel: "warning",
})

// Its type declarations, a `.d.ts` beside each entry (@chaoticgoodcomputing/declarations): Quartz's
// generated plugin index skips a package without `dist/index.d.ts`, and a TypeScript site reads the
// plugin's options from them. The peers stay imports there too.
await emitDeclarations({ entries: entryPoints, external: peers })
