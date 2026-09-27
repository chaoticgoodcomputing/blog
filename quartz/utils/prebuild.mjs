// Prepares Quartz Core to build the real site. Run by site's `build` and `serve` targets.
//
// 1. The site config is a steering file, tracked inside Core at `core/quartz.config.yaml`, where
//    Quartz reads it from its cwd. Upstream's default config is pruned (VENDORED.md), so a build
//    with no site config would not fall back to it: prebuild refuses one that is missing or empty,
//    loudly, before Quartz runs.
// 2. Every plugin of ours is a package, listed by its package name (`@chaoticgoodcomputing/quartz-<name>`,
//    or `@chaoticgoodcomputing/site-<name>` for the site's own, #96). It runs from its real path under
//    `plugins/` or `site-plugins/`, and resolves Quartz's own dependencies (Preact above all) through
//    a gitignored `node_modules` link to Core's install beside it (VENDORED.md, "Dependencies"). The
//    e2e harness makes the same link for its fixture sites.
// 3. Quartz imports a package source through the site package's `node_modules`, and never builds it
//    (ADR-0004). So every plugin of ours the site config enables is built here, through its
//    cacheable Nx `build` target, after a frozen install of the repo's pnpm workspace (VENDORED.md).
//    `plugin-packages.mjs` holds those steps, and the e2e harness takes them from it for the fixture
//    (`tests/harness/site.mjs`). The site config lists no local source.
// 4. Quartz never prunes `.quartz/plugins/`, so a plugin renamed or turned into a package leaves its
//    old link there, live or pointing nowhere. Prebuild removes every link to nowhere, and every link
//    into `plugins/` or `site-plugins/`, before Quartz runs, as the harness does before each fixture
//    or scratch build (`pruneGonePlugins`).
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { parseYaml } from "./packages.mjs"
import { buildPackages, installWorkspace, pluginDirOf, pluginPackages, pruneGonePlugins, relink } from "./plugin-packages.mjs"

const core = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "core")
const siteConfig = path.join(core, "quartz.config.yaml")

const config = fs.existsSync(siteConfig) ? parseYaml(fs.readFileSync(siteConfig, "utf8")) : undefined
if (!Array.isArray(config?.plugins)) {
  console.error(
    `\n  No site config: ${siteConfig} is ${config === undefined ? "missing" : "not a config with a plugins list"}.` +
      `\n  It is a steering file, tracked in Core (quartz/VENDORED.md). Restore it with` +
      `\n  git checkout -- quartz/core/quartz.config.yaml. Refusing to build.\n`,
  )
  process.exit(1)
}
const { plugins } = config
// A source is a package name, or an object whose `repo` is one: the site lists a package that places
// more than one component once per component, each entry named for it (site-components). Each
// package is built once however often it is listed. Anyone else's package, such as
// `@quartz-community/*`, is Core's to install.
const packages = pluginPackages()
const ours = [
  ...new Set(
    plugins
      .filter(({ enabled }) => enabled !== false)
      .map(({ source }) => pluginDirOf(source, packages))
      .filter(Boolean),
  ),
]

for (const dir of new Set(ours.map((plugin) => path.dirname(plugin)))) {
  relink(path.join(dir, "node_modules"), path.relative(dir, path.join(core, "node_modules")))
}

const run = (command, args, options) => execFileSync(command, args, { ...options, stdio: "inherit" })
await installWorkspace(run)
await buildPackages(ours, run)
pruneGonePlugins(core)
console.log(`built ${ours.length} plugin(s) of ours`)
