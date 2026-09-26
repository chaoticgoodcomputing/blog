// Getting our local plugins ready for Quartz, which only symlinks a local source into
// `.quartz/plugins/` and never builds it (ADR-0004). One module for both of the places that build
// them: the real site's prebuild (`prebuild.mjs`) and the e2e harness (`tests/harness/site.mjs`).
// Each runs the commands its own way, through `run(command, args, { cwd })`, which may return a
// promise or run synchronously.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const libs = path.join(root, "libs")

// True when a package's lockfile names a package, or a version, that npm's record of its last
// install (`node_modules/.package-lock.json`) lacks: say, after a merge added a library. Peers are
// never installed here, and optional packages only on their own platform.
function installIsStale(dir) {
  const installed = path.join(dir, "node_modules", ".package-lock.json")
  if (!fs.existsSync(installed)) return true
  const wanted = JSON.parse(fs.readFileSync(path.join(dir, "package-lock.json"), "utf8")).packages
  const have = JSON.parse(fs.readFileSync(installed, "utf8")).packages
  const id = (entry) => entry?.version ?? entry?.resolved
  return Object.entries(wanted).some(([key, entry]) => key && !entry.peer && !entry.optional && id(have[key]) !== id(entry))
}

// Our libraries' own dependencies install through the repo's pnpm workspace (ADR-0005), never
// through the plugins that inline them: npm installs nothing behind a `file:` link, and a library
// with no install of its own would silently resolve its imports from the v4 tree's. So when a
// library with dependencies has none, the workspace is installed.
export async function installLibs(run) {
  const missing = (fs.existsSync(libs) ? fs.readdirSync(libs) : []).some((dir) => {
    const manifest = path.join(libs, dir, "package.json")
    if (!fs.existsSync(manifest)) return false
    const { dependencies = {}, devDependencies = {} } = JSON.parse(fs.readFileSync(manifest, "utf8"))
    return Object.keys({ ...dependencies, ...devDependencies }).length > 0 && !fs.existsSync(path.join(libs, dir, "node_modules"))
  })
  if (missing) await run("pnpm", ["install", "--frozen-lockfile"], { cwd: path.dirname(root) })
}

// Builds the local plugin at `dir`. A package with build-time dependencies of its own carries a
// lockfile, and installs them first, once, and again whenever the lockfile moves on from what is
// installed. Never its peers: its `node_modules` must not shadow a host singleton (VENDORED.md).
export async function buildLocalPlugin(dir, run) {
  if (fs.existsSync(path.join(dir, "package-lock.json")) && installIsStale(dir)) {
    await run("npm", ["ci", "--omit=peer", "--no-audit", "--no-fund"], { cwd: dir })
  }
  await run("npm", ["run", "build", "--silent"], { cwd: dir })
}
