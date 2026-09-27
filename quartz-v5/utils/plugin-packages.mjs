// Getting our plugins ready for Quartz, which imports a package source by name and never builds it
// (ADR-0004). One module for both of the places that build them: the real site's prebuild
// (`prebuild.mjs`) and the e2e harness (`tests/harness/site.mjs`).
// Each runs the commands its own way, through `run(command, args, { cwd })`, which may return a
// promise or run synchronously.
//
// Every plugin of ours is a package, loaded by name (#89, #96): the shareable ones in `plugins/`,
// `@chaoticgoodcomputing/quartz-<name>`, and the site's own in `site-plugins/`,
// `@chaoticgoodcomputing/site-<name>`, repo-only. Each is a member of the repo's one pnpm workspace
// (#92), so getting them ready is two steps: a frozen install of the workspace, which is a no-op when
// nothing has moved, then an Nx build of the packages, which Nx takes from its cache for any package
// whose sources, libraries and dependencies are unchanged. Nothing here reads a local `source:` path:
// the only ones left are the e2e fixture's own plugins, which need no build (tests/CONTEXT.md).
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ourPackages } from "./packages.mjs"

const v5 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const repo = path.dirname(v5)
const nx = path.join(repo, "node_modules", ".bin", "nx")

// Where our plugins live: shareable ones in `plugins/`, the site's own in `site-plugins/`.
export const PLUGIN_ROOTS = [path.join(v5, "plugins"), path.join(v5, "site-plugins")]

// Our plugins by package name (#89): every package under the plugin roots, `name` → its directory.
// A site lists each by this name and loads it through the site package's `node_modules`
// (VENDORED.md). Read from the manifests, so it needs no install.
export function pluginPackages() {
  return new Map(ourPackages(repo, ["plugin", "site-plugin"]).map(({ pkg, root }) => [pkg.name, root]))
}

// What a config `source:` names: the string itself, or an object source's `repo`, `{ repo, name }`
// being how a site lists one package more than once. Undefined for anything else.
export const specOf = (source) => (typeof source === "string" ? source : source?.repo)

// The directory of the plugin of ours a config `source:` names by package name. Undefined for anyone
// else's package, such as `@quartz-community/*`, and for anything that is not a package name. An
// object source is read by its `repo` (`specOf`).
export function pluginDirOf(source, packages = pluginPackages()) {
  const spec = specOf(source)
  return typeof spec === "string" ? packages.get(spec) : undefined
}

// Make `at` a symlink to `target`, replacing a symlink to anywhere else but never a real file or
// directory: prebuild's `node_modules` links beside our plugins, and the harness's links from a
// fixture root to Core.
export function relink(at, target) {
  const stat = fs.lstatSync(at, { throwIfNoEntry: false })
  if (stat && !stat.isSymbolicLink()) throw new Error(`${at} is not a symlink. Move it aside: see quartz-v5/VENDORED.md.`)
  if (stat && fs.readlinkSync(at) === target) return
  fs.rmSync(at, { force: true })
  fs.symlinkSync(target, at)
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

// Builds the packages at `dirs` through their cacheable Nx `build` targets.
export async function buildPackages(dirs, run) {
  if (dirs.length === 0) return
  const projects = [...new Set(dirs.map(projectOf))]
  await run(nx, ["run-many", "-t", "build", "-p", projects.join(","), "--outputStyle=static"], { cwd: repo })
}

// Quartz links a plugin listed by a local source into `<root>/.quartz/plugins/<name>` and never prunes
// the directory, so a plugin once listed by a local source and now by package name (#93–#96), or
// renamed, leaves its link in every root built before: it reads as the plugin still being installed
// there, and a link to a plugin that has gone points nowhere. Every plugin of ours loads by package
// name now, so any link into `plugins/` or `site-plugins/` is one of those. Called before each build,
// it removes them and every link to nowhere, and leaves every other link (a fixture plugin's), and a
// git install's real directory, alone.
export function pruneGonePlugins(root) {
  const plugins = path.join(root, ".quartz", "plugins")
  if (!fs.existsSync(plugins)) return
  const ours = (target) => PLUGIN_ROOTS.some((dir) => target.startsWith(`${dir}${path.sep}`))
  for (const name of fs.readdirSync(plugins)) {
    const entry = path.join(plugins, name)
    if (!fs.lstatSync(entry).isSymbolicLink()) continue
    if (!fs.existsSync(entry) || ours(path.resolve(plugins, fs.readlinkSync(entry)))) fs.rmSync(entry)
  }
}
