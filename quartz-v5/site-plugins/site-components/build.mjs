// Bundles the plugin to dist/, in quartz-community/plugin-template's shape: `dist/components/index.js`
// holds the components the loader registers from package.json's `quartz.components`,
// `dist/frames/index.js` the frames it registers from `quartz.frames`, and `dist/index.js` is the
// main entry the loader imports for a component-only plugin. The host's singletons
// (peerDependencies) stay external. There is no stylesheet: the components' and the frame's CSS is
// the site's application CSS, in site-styles (ADR-0003's site-plugin amendment).
import esbuild from "esbuild"
import fs from "node:fs"
import { emitDeclarations } from "@chaoticgoodcomputing/declarations"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies)

const entryPoints = { index: "src/index.ts", "components/index": "src/components/index.ts", "frames/index": "src/frames/index.tsx" }
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
  logLevel: "warning",
})

// Its type declarations, a `.d.ts` beside each entry (@chaoticgoodcomputing/declarations), as every
// plugin of ours has (the package contract, #98). The peers stay imports there too.
await emitDeclarations({ entries: entryPoints, external: peers })
