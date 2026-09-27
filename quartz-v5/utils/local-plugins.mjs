// Getting our local plugins ready for Quartz, which only symlinks a local source into
// `.quartz/plugins/` and never builds it (ADR-0004). One module for both of the places that build
// them: the real site's prebuild (`prebuild.mjs`) and the e2e harness (`tests/harness/site.mjs`).
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

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const nx = path.join(repo, "node_modules", ".bin", "nx")

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
