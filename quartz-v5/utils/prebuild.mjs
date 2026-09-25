// Prepares the vendored copy to build the real site. Run by site-v5's `build` and `serve` targets.
//
// 1. Quartz reads `quartz.config.yaml` from its cwd, the vendored root, and nowhere else, so the
//    tracked config one level up is reached through a gitignored symlink there (VENDORED.md).
// 2. A local plugin resolves Quartz's own dependencies (Preact above all) through a gitignored
//    `node_modules` link to the vendored install, beside it in `plugins/` or `site-plugins/`
//    (VENDORED.md, "Dependencies"). The e2e harness makes the same link for its fixture sites.
// 3. Quartz only symlinks a local plugin into `.quartz/plugins/`, never builds it (ADR-0004), so
//    every local plugin the config enables is built here, after a one-off install of its own
//    build-time dependencies.
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const vendored = path.join(root, "quartz")
const tracked = path.join(root, "quartz.config.yaml")
const YAML = createRequire(path.join(vendored, "package.json"))("yaml")

// Make `at` a symlink to `target`, replacing a stale symlink but never a real file or directory.
function link(at, target) {
  const stat = fs.lstatSync(at, { throwIfNoEntry: false })
  if (stat && !stat.isSymbolicLink()) {
    throw new Error(`${path.relative(root, at)} is not a symlink. Move it aside: see quartz-v5/VENDORED.md.`)
  }
  if (stat && fs.readlinkSync(at) === target) return
  fs.rmSync(at, { force: true })
  fs.symlinkSync(target, at)
}

link(path.join(vendored, "quartz.config.yaml"), path.relative(vendored, tracked))

const { plugins } = YAML.parse(fs.readFileSync(tracked, "utf8"))
const local = plugins
  .filter(({ source, enabled }) => enabled !== false && typeof source === "string" && source.startsWith("."))
  .map(({ source }) => path.resolve(vendored, source))

for (const dir of new Set(local.map((plugin) => path.dirname(plugin)))) {
  link(path.join(dir, "node_modules"), path.relative(dir, path.join(vendored, "node_modules")))
}

for (const plugin of local) {
  const npm = (...args) => execFileSync("npm", args, { cwd: plugin, stdio: "inherit" })
  if (fs.existsSync(path.join(plugin, "package-lock.json")) && !fs.existsSync(path.join(plugin, "node_modules"))) {
    npm("ci", "--omit=peer", "--no-audit", "--no-fund")
  }
  npm("run", "build", "--silent")
}
console.log(`linked quartz.config.yaml; built ${local.length} local plugin(s)`)
