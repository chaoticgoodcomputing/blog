// Builds the fixture site for the suite.
//
// Quartz reads `process.cwd()/quartz.config.yaml` and nothing else, so the fixture cannot share
// the vendored root with the real site. Each variant gets a fixture root: a directory that
// symlinks every entry of the vendored copy except the config, which is written fresh from
// `tests/quartz.config.yaml`. Plugin installs (`.quartz/plugins/`) are cwd-relative, so they stay
// isolated too. See docs/adr/0004.
import fs from "node:fs"
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
  const packages = fs.existsSync(pluginsRoot)
    ? fs.readdirSync(pluginsRoot).filter((dir) => fs.existsSync(path.join(pluginsRoot, dir, "package.json")))
    : []
  await Promise.all(packages.map((dir) => run("npm", ["run", "build", "--silent"], { cwd: path.join(pluginsRoot, dir) })))
  return packages
}

export async function buildSite(variant) {
  writeFixtureRoot(variant)
  const root = fixtureRoot(variant)
  await run("node", [path.join(root, "quartz/bootstrap-cli.mjs"), "build", "-d", "../content-fixture", "-o", outputFor(variant)], { cwd: root })
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
