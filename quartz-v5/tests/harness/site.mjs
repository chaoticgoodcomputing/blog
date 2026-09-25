// Builds the fixture site for the suite.
//
// Quartz reads `process.cwd()/quartz.config.yaml` and nothing else, so the fixture cannot share
// the vendored root with the real site. Each variant gets a fixture root: a directory that
// symlinks every entry of the vendored copy except the config, which is written fresh from
// `tests/quartz.config.yaml`. Plugin installs (`.quartz/plugins/`) are cwd-relative, so they stay
// isolated too. See docs/adr/0004.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { createRequire } from "node:module"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"

const run = promisify(execFile)
const here = path.dirname(fileURLToPath(import.meta.url))
export const testsRoot = path.resolve(here, "..")
export const vendored = path.resolve(testsRoot, "../quartz")
const pluginsRoot = path.resolve(testsRoot, "../plugins")
const YAML = createRequire(path.join(vendored, "package.json"))("yaml")

// "main" is the fixture site as configured. "baseline" is the same site with every one of our
// plugins disabled; the no-bleed spec compares the two.
export const VARIANTS = ["main", "baseline"]
export const fixtureRoot = (variant) => path.join(testsRoot, variant === "main" ? ".site" : `.site-${variant}`)
export const outputFor = (variant) => path.join(fixtureRoot(variant), "public")

const LINKED = ["package.json", "quartz", "node_modules", "tsconfig.json", "quartz.ts", "globals.d.ts", "index.d.ts"]
const isOurs = (source) => typeof source === "string" && source.startsWith("../../plugins/")

function writeFixtureRoot(variant) {
  const root = fixtureRoot(variant)
  fs.mkdirSync(root, { recursive: true })
  for (const entry of LINKED) {
    const link = path.join(root, entry)
    if (!fs.existsSync(link)) fs.symlinkSync(path.join(vendored, entry), link)
  }
  const config = YAML.parseDocument(fs.readFileSync(path.join(testsRoot, "quartz.config.yaml"), "utf8"))
  if (variant === "baseline") {
    for (const entry of config.get("plugins").items) {
      if (isOurs(entry.get("source"))) entry.set("enabled", false)
    }
  }
  fs.writeFileSync(path.join(root, "quartz.config.yaml"), String(config))
}

// Quartz symlinks a local plugin into `.quartz/plugins/` but never builds it — only git sources
// get `npm run build` — so every package is built here first.
export async function buildPlugins() {
  linkHostModules()
  const packages = fs.existsSync(pluginsRoot)
    ? fs.readdirSync(pluginsRoot).filter((dir) => fs.existsSync(path.join(pluginsRoot, dir, "package.json")))
    : []
  await Promise.all(
    packages.map(async (dir) => {
      const cwd = path.join(pluginsRoot, dir)
      // A package with build-time dependencies of its own carries a lockfile; install it once.
      if (fs.existsSync(path.join(cwd, "package-lock.json")) && !fs.existsSync(path.join(cwd, "node_modules"))) {
        await run("npm", ["ci", "--omit=peer", "--no-audit", "--no-fund"], { cwd })
      }
      await run("npm", ["run", "build", "--silent"], { cwd })
    }),
  )
  return packages
}

// A git-installed plugin lives at `.quartz/plugins/<name>/` inside the Quartz root, so its bare
// imports of Quartz's own dependencies (preact, unified, vfile — the loader's shared externals)
// resolve to the host's copies. A local plugin is only symlinked there, and Node resolves from the
// symlink's target under `quartz-v5/plugins/`, which would walk up to the v4 tree's `node_modules`
// at the repo root instead: a second Preact. This gitignored link restores the git-install lookup.
function linkHostModules() {
  const link = path.join(pluginsRoot, "node_modules")
  if (!fs.existsSync(link)) fs.symlinkSync(path.join("..", "quartz", "node_modules"), link)
}

export async function buildSite(variant) {
  writeFixtureRoot(variant)
  const root = fixtureRoot(variant)
  await run("node", [path.join(root, "quartz/bootstrap-cli.mjs"), "build", "-d", "../content-fixture", "-o", outputFor(variant)], { cwd: root })
}

// A one-off site for a spec that needs content the shared fixture must not carry — chiefly a build
// that is supposed to fail. `files` maps content paths to their text. Uses the main variant's
// config, and assumes `buildPlugins` has already run (global setup does it). Resolves with the
// exit code and combined output rather than throwing.
export async function buildScratchSite(name, files) {
  const root = path.join(testsRoot, `.site-scratch-${name}`)
  // Outside the repo: Quartz's content glob honours .gitignore, which covers every fixture root.
  const content = fs.mkdtempSync(path.join(os.tmpdir(), `cgc-scratch-${name}-`))
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(content, rel)), { recursive: true })
    fs.writeFileSync(path.join(content, rel), text)
  }
  fs.mkdirSync(root, { recursive: true })
  for (const entry of LINKED) {
    const link = path.join(root, entry)
    if (!fs.existsSync(link)) fs.symlinkSync(path.join(vendored, entry), link)
  }
  fs.copyFileSync(path.join(testsRoot, "quartz.config.yaml"), path.join(root, "quartz.config.yaml"))
  try {
    const { stdout, stderr } = await run("node", [path.join(root, "quartz/bootstrap-cli.mjs"), "build", "-d", content, "-o", "public"], { cwd: root })
    return { code: 0, output: stdout + stderr }
  } catch (err) {
    return { code: err.code ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` }
  } finally {
    fs.rmSync(content, { recursive: true, force: true })
  }
}

export async function buildAll() {
  await buildPlugins()
  await Promise.all(VARIANTS.map(buildSite))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const start = performance.now()
  await buildAll()
  console.log(`built ${VARIANTS.join(" + ")} in ${Math.round(performance.now() - start)}ms`)
}
