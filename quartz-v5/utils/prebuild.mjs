// Prepares Quartz Core to build the real site. Run by site-v5's `build` and `serve` targets.
//
// 1. The site config is a steering file, tracked inside Core at `core/quartz.config.yaml`, where
//    Quartz reads it from its cwd. Upstream's default config is pruned (VENDORED.md), so a build
//    with no site config would not fall back to it: prebuild refuses one that is missing or empty,
//    loudly, before Quartz runs.
// 2. A local plugin resolves Quartz's own dependencies (Preact above all) through a gitignored
//    `node_modules` link to Core's install, beside it in `plugins/` or `site-plugins/`
//    (VENDORED.md, "Dependencies"). The e2e harness makes the same link for its fixture sites.
// 3. Quartz only symlinks a local plugin into `.quartz/plugins/`, never builds it (ADR-0004), so
//    every local plugin the site config enables is built here, after an install of its own
//    build-time dependencies whenever its lockfile has moved on from what is installed, and of our
//    libraries' dependencies, which a plugin inlines (VENDORED.md). `local-plugins.mjs` holds those
//    steps, and the e2e harness takes them from it for the fixture (`tests/harness/site.mjs`).
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { buildLocalPlugin, installLibs } from "./local-plugins.mjs"

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
// A source is a path, or an object whose `repo` is one: the site lists a local plugin that places
// more than one component once per component, each entry named for it (site-components). Each
// plugin is built once however often it is listed.
const pathOf = (source) => (typeof source === "string" ? source : source?.repo)
const local = [
  ...new Set(
    plugins
      .filter(({ source, enabled }) => enabled !== false && String(pathOf(source)).startsWith("."))
      .map(({ source }) => path.resolve(core, pathOf(source))),
  ),
]

for (const dir of new Set(local.map((plugin) => path.dirname(plugin)))) {
  link(path.join(dir, "node_modules"), path.relative(dir, path.join(core, "node_modules")))
}

const run = (command, args, options) => execFileSync(command, args, { ...options, stdio: "inherit" })
await installLibs(run)
for (const plugin of local) await buildLocalPlugin(plugin, run)
console.log(`built ${local.length} local plugin(s)`)
