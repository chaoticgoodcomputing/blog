// Probe plugins, for a library's own specs. A library has no Quartz hooks, so it is exercised
// through a plugin that inlines it (ADR-0004). Until the real consumer of a capability exists, a
// spec supplies a probe instead: a small plugin, compiled from source here the way a plugin's own
// build compiles it, and loaded into a scratch site as a local source.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import { vendored } from "./site.mjs"

const require = createRequire(path.join(vendored, "package.json"))
const esbuild = require("esbuild")

// Bundles `<source>/index.ts` into a fresh plugin directory called `name` (the plugin's identity,
// as for any local source), with `quartz` as its manifest. Everything is inlined, so the probe
// needs no install. Resolves with the plugin's absolute path and a `remove()` for afterwards.
export async function buildProbePlugin(source, name, quartz) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-probe-"))
  const root = path.join(parent, name)
  fs.mkdirSync(root)
  const pkg = {
    name,
    version: "0.0.0",
    private: true,
    type: "module",
    exports: { ".": "./dist/index.js" },
  }
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ ...pkg, quartz: { name, ...quartz } }, null, 2),
  )
  await esbuild.build({
    entryPoints: [path.join(source, "index.ts")],
    outfile: path.join(root, "dist/index.js"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    logLevel: "warning",
  })
  return { path: root, remove: () => fs.rmSync(parent, { recursive: true, force: true }) }
}
