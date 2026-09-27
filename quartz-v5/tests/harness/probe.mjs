// Probe plugins, for a library's own specs. A library has no Quartz hooks, so it is exercised
// through a plugin that inlines it (ADR-0004). Until the real consumer of a capability exists, a
// spec supplies a probe instead: a small plugin, compiled from source here the way a plugin's own
// build compiles it, and loaded into a scratch site as a local source.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import { core } from "./site.mjs"
import { isShared } from "../../utils/packages.mjs"

const require = createRequire(path.join(core, "package.json"))
const esbuild = require("esbuild")

// Quartz's shared packages (vfile, unified, Preact, …) are peers of a library, never installed beside
// it (the shared-packages repo guard, #98), so the probe takes Core's copies, the ones a plugin that
// inlines the library resolves at run time. Bundled, since the probe lives outside the repo.
const hostCopies = {
  name: "host-copies",
  setup(build) {
    build.onResolve({ filter: /^[^./]/ }, (args) => {
      const name = args.path.split("/").slice(0, args.path.startsWith("@") ? 2 : 1).join("/")
      return isShared(name) ? { path: require.resolve(args.path) } : undefined
    })
  },
}

// Bundles `<source>/index.ts` into a fresh plugin directory called `name` (the plugin's identity,
// as for any local source), with `quartz` as its manifest. Everything is inlined, Quartz's shared
// packages as Core's copies, so the probe needs no install. Resolves with the plugin's absolute path and a `remove()` for afterwards.
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
    plugins: [hostCopies],
    logLevel: "warning",
  })
  return { path: root, remove: () => fs.rmSync(parent, { recursive: true, force: true }) }
}
