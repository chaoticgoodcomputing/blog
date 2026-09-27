// Prepares Quartz Core to build the real site. Run by site-v5's `build` and `serve` targets.
//
// 1. The site config is a steering file, tracked inside Core at `core/quartz.config.yaml`, where
//    Quartz reads it from its cwd. Upstream's default config is pruned (VENDORED.md), so a build
//    with no site config would not fall back to it: prebuild refuses one that is missing or empty,
//    loudly, before Quartz runs.
// 2. A plugin of ours, listed by local path or by package name, runs from its real path under
//    `plugins/` or `site-plugins/`, and resolves Quartz's own dependencies (Preact above all) through
//    a gitignored `node_modules` link to Core's install beside it (VENDORED.md, "Dependencies"). The e2e harness makes the same link for its fixture sites.
// 3. Quartz imports a plugin of ours listed by package name (`@chaoticgoodcomputing/quartz-<name>`)
//    through the site package's `node_modules`, and only symlinks one listed by local path into
//    `.quartz/plugins/`; it builds neither (ADR-0004). So every plugin of ours the site config
//    enables, by either kind of source, is built here, through its cacheable Nx `build` target,
//    after a frozen install of the repo's pnpm workspace (VENDORED.md). `local-plugins.mjs` holds
//    those steps, and the e2e harness takes them from it for the fixture (`tests/harness/site.mjs`).
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { buildLocalPlugins, installWorkspace, pluginDirOf, pluginPackages } from "./local-plugins.mjs"

const core = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "core")
const siteConfig = path.join(core, "quartz.config.yaml")
const YAML = createRequire(path.join(core, "package.json"))("yaml")

// Make `at` a symlink to `target`, replacing a stale symlink but never a real file or directory.
function link(at, target) {
  const stat = fs.lstatSync(at, { throwIfNoEntry: false })
  if (stat && !stat.isSymbolicLink()) {
    throw new Error(`${at} is not a symlink. Move it aside: see quartz-v5/VENDORED.md.`)
  }
  if (stat && fs.readlinkSync(at) === target) return
  fs.rmSync(at, { force: true })
  fs.symlinkSync(target, at)
}

const config = fs.existsSync(siteConfig) ? YAML.parse(fs.readFileSync(siteConfig, "utf8")) : undefined
if (!Array.isArray(config?.plugins)) {
  console.error(
    `\n  No site config: ${siteConfig} is ${config === undefined ? "missing" : "not a config with a plugins list"}.` +
      `\n  It is a steering file, tracked in Core (quartz-v5/VENDORED.md). Restore it with` +
      `\n  git checkout -- quartz-v5/core/quartz.config.yaml. Refusing to build.\n`,
  )
  process.exit(1)
}
const { plugins } = config
// A source is a path or a package name, or an object whose `repo` is a path: the site lists a local
// plugin that places more than one component once per component, each entry named for it
// (site-components). Each plugin is built once however often it is listed. Anyone else's package,
// such as `@quartz-community/*`, is Core's to install.
const packages = pluginPackages()
const ours = [
  ...new Set(
    plugins
      .filter(({ enabled }) => enabled !== false)
      .map(({ source }) => pluginDirOf(source, core, packages))
      .filter(Boolean),
  ),
]

for (const dir of new Set(ours.map((plugin) => path.dirname(plugin)))) {
  link(path.join(dir, "node_modules"), path.relative(dir, path.join(core, "node_modules")))
}

const run = (command, args, options) => execFileSync(command, args, { ...options, stdio: "inherit" })
await installWorkspace(run)
await buildLocalPlugins(ours, run)
console.log(`built ${ours.length} plugin(s) of ours`)
