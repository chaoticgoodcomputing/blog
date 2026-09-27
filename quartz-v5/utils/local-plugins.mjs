// Getting our plugins ready for Quartz, which only symlinks a local source into `.quartz/plugins/`,
// and imports a package source by name, and never builds either (ADR-0004). One module for both of
// the places that build them: the real site's prebuild (`prebuild.mjs`) and the e2e harness
// (`tests/harness/site.mjs`).
// Each runs the commands its own way, through `run(command, args, { cwd })`, which may return a
// promise or run synchronously.
//
// Every package of ours outside Quartz Core is a member of the repo's one pnpm workspace (#92), so
// getting them ready is two steps: a frozen install of the workspace, which is a no-op when nothing
// has moved, then an Nx build of the plugins, which Nx takes from its cache for any plugin whose
// sources, libraries and dependencies are unchanged.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const v5 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const repo = path.dirname(v5)
const nx = path.join(repo, "node_modules", ".bin", "nx")

// Where our plugins live: shareable ones in `plugins/`, the site's own in `site-plugins/`.
export const PLUGIN_ROOTS = [path.join(v5, "plugins"), path.join(v5, "site-plugins")]

// Our plugins by package name (#89): every package under the plugin roots, `name` → its directory.
// A site lists a converted plugin by this name, `@chaoticgoodcomputing/quartz-<name>`, and loads it
// through the site package's `node_modules` (VENDORED.md), while the rest still load by local path
// until they are converted (#95, #96). Read from the manifests, so it needs no install.
export function pluginPackages() {
  const packages = new Map()
  for (const root of PLUGIN_ROOTS) {
    if (!fs.existsSync(root)) continue
    for (const dir of fs.readdirSync(root)) {
      const manifest = path.join(root, dir, "package.json")
      if (fs.existsSync(manifest)) packages.set(JSON.parse(fs.readFileSync(manifest, "utf8")).name, path.join(root, dir))
    }
  }
  return packages
}

// The directory a config `source:` names: a local path, resolved against `base`, the root the site
// builds from, or the package name of a plugin of ours. Undefined for anyone else's package, such as
// `@quartz-community/*`. An object source, `{ repo, name }`, is read by its `repo`, as Quartz reads it.
export function pluginDirOf(source, base, packages = pluginPackages()) {
  const spec = typeof source === "string" ? source : source?.repo
  if (typeof spec !== "string") return undefined
  if (spec.startsWith(".")) return path.resolve(base, spec)
  return packages.get(spec)
}

// The workspace's own install, from its one lock: our libraries, plugins, site plugins and the e2e
// suite. Peers are never installed beside a plugin (`autoInstallPeers: false`), so a plugin's
// Preact is Quartz Core's, through the host link beside it (VENDORED.md, "Dependencies").
export async function installWorkspace(run) {
  await run("pnpm", ["install", "--frozen-lockfile"], { cwd: repo })
}

// The Nx project a package directory is, from its project.json.
function projectOf(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8")).name
}

// Builds the local plugins at `dirs` through their cacheable Nx `build` targets.
export async function buildLocalPlugins(dirs, run) {
  if (dirs.length === 0) return
  const projects = [...new Set(dirs.map(projectOf))]
  await run(nx, ["run-many", "-t", "build", "-p", projects.join(","), "--outputStyle=static"], { cwd: repo })
}

// Quartz links a local plugin into `<root>/.quartz/plugins/<name>` and never prunes the directory, so
// a plugin renamed, or turned into a package and loaded by name (#93–#96), leaves a link to nowhere
// in every root built before: it reads as the plugin still being installed there. Called before each
// build, it removes those links, and leaves every live link, and a git install's real directory, alone.
export function pruneGonePlugins(root) {
  const plugins = path.join(root, ".quartz", "plugins")
  if (!fs.existsSync(plugins)) return
  for (const name of fs.readdirSync(plugins)) {
    const entry = path.join(plugins, name)
    if (fs.lstatSync(entry).isSymbolicLink() && !fs.existsSync(entry)) fs.rmSync(entry)
  }
}
