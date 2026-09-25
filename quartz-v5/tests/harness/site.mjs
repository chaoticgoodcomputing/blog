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
import { execFile, spawn } from "node:child_process"
import { createRequire } from "node:module"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"

const run = promisify(execFile)
const here = path.dirname(fileURLToPath(import.meta.url))
export const testsRoot = path.resolve(here, "..")
export const vendored = path.resolve(testsRoot, "../quartz")
const pluginsRoot = path.resolve(testsRoot, "../plugins")
// Site plugins (VENDORED.md layout): no fixture config lists one, but scratch sites built from the
// site config do, so they are built and linked alongside our plugins.
const sitePluginsRoot = path.resolve(testsRoot, "../site-plugins")
const PLUGIN_ROOTS = [pluginsRoot, sitePluginsRoot]
const libsRoot = path.resolve(testsRoot, "../libs")
const YAML = createRequire(path.join(vendored, "package.json"))("yaml")

// "main" is the fixture site as configured. "baseline" is the same site with every one of our
// plugins disabled; the no-bleed spec compares the two.
export const VARIANTS = ["main", "baseline"]
export const fixtureRoot = (variant) => path.join(testsRoot, variant === "main" ? ".site" : `.site-${variant}`)
export const outputFor = (variant) => path.join(fixtureRoot(variant), "public")

// The file a request path reaches in a built site, with Quartz's extensionless URLs: `/a` is `a`,
// `a.html` or `a/index.html`. Anything else gets the site's 404 page.
export function fileFor(root, pathname) {
  const hit = [pathname, `${pathname}.html`, path.join(pathname, "index.html")]
    .map((candidate) => path.join(root, candidate))
    .find((file) => fs.existsSync(file) && fs.statSync(file).isFile())
  return hit ? { file: hit, status: 200 } : { file: path.join(root, "404.html"), status: 404 }
}

// Where a scratch root is made. `fixture`, the default, is beside the fixture roots, where the
// fixture config's `../../plugins/<name>` sources resolve. `site` is beside the vendored copy, at the
// real site root's depth, where the site config's `../plugins/<name>` sources resolve unchanged: for
// a spec about the source strings themselves, such as a dependency declared by plugin name (#40).
const SCRATCH_PARENT = { fixture: testsRoot, site: path.dirname(vendored) }

// The real site's config, tracked at `quartz-v5/quartz.config.yaml`, for a scratch site that has to
// be built the way the real site is. Its local `source:` paths resolve against the vendored root,
// where the real site builds (VENDORED.md), so they are rebased onto the scratch roots made `at`
// the given place. At `site`, that leaves a `../` path as it is. So is a plugin option that is a
// relative path (`./…` or `../…`), such as cgc-og-image's `icon`, which a plugin resolves against
// the same root.
//
// `offline` switches off the one fetch a build of it makes that fails the build when the network
// does: core downloading the site's Google Fonts to self-host them (`fontOrigin: googleFonts` with
// `cdnCaching: false`). The pages then fall back to system fonts, so only a spec that doesn't look at
// type should ask for it.
export const siteConfigFile = path.resolve(testsRoot, "../quartz.config.yaml")
export function siteConfig({ at = "fixture", offline = false } = {}) {
  const config = YAML.parseDocument(fs.readFileSync(siteConfigFile, "utf8"))
  if (offline) config.setIn(["configuration", "theme", "fontOrigin"], "local")
  const scratchRoot = path.join(SCRATCH_PARENT[at], ".site-scratch")
  const rebase = (local) => path.relative(scratchRoot, path.resolve(vendored, local))
  for (const entry of config.get("plugins").items) {
    const source = entry.get("source")
    if (typeof source === "string" && source.startsWith(".")) {
      entry.set("source", rebase(source))
    } else if (YAML.isMap(source) && String(source.get("repo")).startsWith(".")) {
      // An object source, `{ repo, name }`: how the site lists one local plugin more than once
      // (site-components, one entry per component).
      source.set("repo", rebase(source.get("repo")))
    }
    for (const option of YAML.isMap(entry.get("options")) ? entry.get("options").items : []) {
      if (YAML.isScalar(option.value) && /^\.\.?\//.test(option.value.value)) option.value.value = rebase(option.value.value)
    }
  }
  return String(config)
}

// The fixture's own config as YAML text: what a scratch site is built from unless given another.
export const fixtureConfig = () => fs.readFileSync(path.join(testsRoot, "quartz.config.yaml"), "utf8")

// The `source` of every plugin entry in `config` (YAML text), in YAML order.
export const pluginSources = (config) => YAML.parse(config).plugins.map((entry) => entry.source)

// `config` (YAML text) with each of `entries` in its plugin list: an entry replaces the one with the
// same `source`, or is appended. Appending puts a plugin last in YAML order, which decides nothing
// its `order` doesn't: plugins run, and emit their CSS, sorted by `order`.
export function withPlugins(config, entries) {
  const doc = YAML.parseDocument(config)
  const plugins = doc.get("plugins")
  for (const entry of entries) {
    const at = plugins.items.findIndex((item) => item.get("source") === entry.source)
    if (at < 0) plugins.add(doc.createNode(entry))
    else plugins.set(at, doc.createNode(entry))
  }
  return String(doc)
}

const LINKED = ["package.json", "quartz", "node_modules", "tsconfig.json", "quartz.ts", "globals.d.ts", "index.d.ts"]
// Ours: a package under `quartz-v5/plugins/`, or a fixture plugin standing in for one.
const isOurs = (source) =>
  typeof source === "string" && (source.startsWith("../../plugins/") || source.startsWith("../fixture-plugins/"))

function writeFixtureRoot(variant) {
  const root = fixtureRoot(variant)
  fs.mkdirSync(root, { recursive: true })
  for (const entry of LINKED) {
    const link = path.join(root, entry)
    if (!fs.existsSync(link)) fs.symlinkSync(path.join(vendored, entry), link)
  }
  const config = YAML.parseDocument(fixtureConfig())
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
  await installLibs()
  const packages = PLUGIN_ROOTS.flatMap((root) =>
    fs.existsSync(root)
      ? fs.readdirSync(root).filter((dir) => fs.existsSync(path.join(root, dir, "package.json"))).map((dir) => path.join(root, dir))
      : [],
  )
  await Promise.all(
    packages.map(async (cwd) => {
      // A package with build-time dependencies of its own carries a lockfile; install it once, and
      // again whenever the lockfile moves on from what is installed.
      if (fs.existsSync(path.join(cwd, "package-lock.json")) && installIsStale(cwd)) {
        await run("npm", ["ci", "--omit=peer", "--no-audit", "--no-fund"], { cwd })
      }
      await run("npm", ["run", "build", "--silent"], { cwd })
    }),
  )
  return packages
}

// True when a package's lockfile names a package, or a version, that npm's record of its last
// install (`node_modules/.package-lock.json`) lacks: say, after a merge added a library. Peers are
// never installed here, and optional packages only on their own platform.
function installIsStale(cwd) {
  const installed = path.join(cwd, "node_modules", ".package-lock.json")
  if (!fs.existsSync(installed)) return true
  const wanted = JSON.parse(fs.readFileSync(path.join(cwd, "package-lock.json"), "utf8")).packages
  const have = JSON.parse(fs.readFileSync(installed, "utf8")).packages
  const id = (entry) => entry?.version ?? entry?.resolved
  return Object.entries(wanted).some(([key, entry]) => key && !entry.peer && !entry.optional && id(have[key]) !== id(entry))
}

// Our libraries' own dependencies install through the repo's pnpm workspace (ADR-0005), never
// through the plugins that inline them: npm installs nothing behind a `file:` link. So a library
// with dependencies and no install of its own gets the workspace's.
async function installLibs() {
  const missing = (fs.existsSync(libsRoot) ? fs.readdirSync(libsRoot) : []).some((dir) => {
    const manifest = path.join(libsRoot, dir, "package.json")
    if (!fs.existsSync(manifest)) return false
    const { dependencies = {}, devDependencies = {} } = JSON.parse(fs.readFileSync(manifest, "utf8"))
    return Object.keys({ ...dependencies, ...devDependencies }).length > 0 && !fs.existsSync(path.join(libsRoot, dir, "node_modules"))
  })
  if (missing) await run("pnpm", ["install", "--frozen-lockfile"], { cwd: path.resolve(testsRoot, "../..") })
}

// A git-installed plugin lives at `.quartz/plugins/<name>/` inside the Quartz root, so its bare
// imports of Quartz's own dependencies (preact, unified, vfile — the loader's shared externals)
// resolve to the host's copies. A local plugin is only symlinked there, and Node resolves from the
// symlink's target under `quartz-v5/plugins/`, which would walk up to the v4 tree's `node_modules`
// at the repo root instead: a second Preact. This gitignored link restores the git-install lookup,
// in `site-plugins/` as in `plugins/`.
function linkHostModules() {
  for (const root of PLUGIN_ROOTS) {
    const link = path.join(root, "node_modules")
    if (fs.existsSync(root) && !fs.existsSync(link)) fs.symlinkSync(path.join("..", "quartz", "node_modules"), link)
  }
}

// Every fixture root symlinks the vendored `quartz/` source directory, and the Quartz CLI
// transpiles itself to `quartz/.quartz-cache/transpiled-build.mjs` before importing it. So all
// builds share that one file, and two at once can import it half-written ("buildQuartz is not a
// function"). One build at a time, across every worker process: a directory lock, since mkdir is
// atomic. A lock older than any build is taken to be stale.
const LOCK = path.join(testsRoot, ".site-build-lock")
const STALE_MS = 5 * 60 * 1000
async function withBuildLock(fn) {
  for (;;) {
    try {
      fs.mkdirSync(LOCK)
      break
    } catch (err) {
      if (err.code !== "EEXIST") throw err
      try {
        if (Date.now() - fs.statSync(LOCK).mtimeMs > STALE_MS) fs.rmSync(LOCK, { recursive: true, force: true })
      } catch {}
      await new Promise((done) => setTimeout(done, 50))
    }
  }
  try {
    return await fn()
  } finally {
    fs.rmSync(LOCK, { recursive: true, force: true })
  }
}

const quartzBuild = (root, args) =>
  withBuildLock(() => run("node", [path.join(root, "quartz/bootstrap-cli.mjs"), "build", ...args], { cwd: root }))

// `quartz build --serve`, for the one thing a spec may need it for: what a plugin does differently
// under serve (ADR-0004 keeps it out of everything else). Stopped as soon as its server is up, which
// is after the first build has been emitted. Its ports are the OS's pick, so it never collides with
// the suite's own servers or another copy of the suite. Rejects like `quartzBuild` when the build
// fails, and gives up after `SERVE_TIMEOUT_MS`.
const SERVE_TIMEOUT_MS = 2 * 60 * 1000
const quartzServe = (root, args) =>
  withBuildLock(
    () =>
      new Promise((resolve, reject) => {
        const cli = path.join(root, "quartz/bootstrap-cli.mjs")
        const child = spawn("node", [cli, "build", "--serve", "--port", "0", "--wsPort", "0", ...args], { cwd: root })
        let output = ""
        let started = false
        const timer = setTimeout(() => child.kill(), SERVE_TIMEOUT_MS)
        const collect = (chunk) => {
          output += chunk
          if (!started && output.includes("Started a Quartz server")) {
            started = true
            child.kill()
          }
        }
        child.stdout.on("data", collect)
        child.stderr.on("data", collect)
        child.on("close", (code) => {
          clearTimeout(timer)
          if (started) resolve({ stdout: output, stderr: "" })
          else reject(Object.assign(new Error("quartz build --serve exited before serving"), { code: code ?? 1, stdout: output }))
        })
      }),
  )

export async function buildSite(variant) {
  writeFixtureRoot(variant)
  await quartzBuild(fixtureRoot(variant), ["-d", "../content-fixture", "-o", outputFor(variant)])
}

// A one-off site for a spec that needs content the shared fixture must not carry — chiefly a build
// that is supposed to fail. `files` maps content paths to their text. Uses the main variant's
// config unless `options.config` supplies one (a YAML string), and assumes `buildPlugins` has
// already run (global setup does it). Resolves with the exit code and combined output rather than
// throwing. `options.args` are extra `quartz build` flags. `options.serve` builds it as
// `quartz build --serve` does, stopping the server once it is up. `options.at` is where the root is
// made: `fixture` (the default) or `site`, see SCRATCH_PARENT. The site is deleted afterwards unless
// `options.keep` is set; the result then also carries `root` and `public` (the built site), and
// the caller removes `root`.
export async function buildScratchSite(name, files, options = {}) {
  // Unique per call: the same spec runs once per colour scheme, possibly at the same time.
  const root = fs.mkdtempSync(path.join(SCRATCH_PARENT[options.at ?? "fixture"], `.site-scratch-${name}-`))
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
  const config = options.config ?? fixtureConfig()
  fs.writeFileSync(path.join(root, "quartz.config.yaml"), config)
  const kept = options.keep ? { root, public: path.join(root, "public") } : {}
  try {
    const build = options.serve ? quartzServe : quartzBuild
    const { stdout, stderr } = await build(root, ["-d", content, "-o", "public", ...(options.args ?? [])])
    return { code: 0, output: stdout + stderr, ...kept }
  } catch (err) {
    return { code: err.code ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}`, ...kept }
  } finally {
    fs.rmSync(content, { recursive: true, force: true })
    if (!options.keep) fs.rmSync(root, { recursive: true, force: true })
  }
}

// A serve run left up, for what Quartz does when content changes under `quartz build --serve`: a
// spec edits the content and reads the rebuilt site. It loads the plugins built for this run, so
// ADR-0004's objection to serve, a long-lived process that never reloads a rebuilt plugin, doesn't
// arise. Only the first build holds the build lock: a rebuild re-runs what the process has already
// imported. The output is outside the Quartz root, because serve's source watcher watches every
// `.ts` and `.tsx` under it, and would take a copied widget's source for Quartz's own and
// re-transpile Quartz, which is what the lock guards. Takes `files`, `options.config` and
// `options.at` as `buildScratchSite` does, and resolves once the server is up with the site's `root`, `public` and
// `content` directories, its `output` so far, `write(rel, text)`, which changes a content file and
// resolves once the rebuild that follows is done, and `stop()`, which the caller must call: it
// stops the server and deletes the site.
export async function serveScratchSite(name, files, options = {}) {
  const root = fs.mkdtempSync(path.join(SCRATCH_PARENT[options.at ?? "fixture"], `.site-scratch-${name}-`))
  const content = fs.mkdtempSync(path.join(os.tmpdir(), `cgc-scratch-${name}-`))
  const site = fs.mkdtempSync(path.join(os.tmpdir(), `cgc-scratch-${name}-public-`))
  const put = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(content, rel)), { recursive: true })
    fs.writeFileSync(path.join(content, rel), text)
  }
  for (const [rel, text] of Object.entries(files)) put(rel, text)
  for (const entry of LINKED) fs.symlinkSync(path.join(vendored, entry), path.join(root, entry))
  fs.writeFileSync(path.join(root, "quartz.config.yaml"), options.config ?? fixtureConfig())

  let output = ""
  let child
  let closed
  const until = async (done, timeout, what) => {
    for (const start = Date.now(); !done(); await new Promise((tick) => setTimeout(tick, 50))) {
      if (child.exitCode !== null || Date.now() - start > timeout) throw new Error(`quartz build --serve: ${what}\n${output}`)
    }
  }
  const stop = async () => {
    child?.kill()
    await closed
    for (const dir of [content, site, root]) fs.rmSync(dir, { recursive: true, force: true })
  }
  try {
    await withBuildLock(() => {
      const cli = path.join(root, "quartz/bootstrap-cli.mjs")
      child = spawn("node", [cli, "build", "--serve", "--port", "0", "--wsPort", "0", "-d", content, "-o", site], { cwd: root })
      closed = new Promise((done) => child.on("close", done))
      child.stdout.on("data", (chunk) => (output += chunk))
      child.stderr.on("data", (chunk) => (output += chunk))
      return until(() => output.includes("Started a Quartz server"), SERVE_TIMEOUT_MS, "never served")
    })
  } catch (err) {
    await stop()
    throw err
  }

  const count = (text) => output.split(text).length - 1
  return {
    root,
    content,
    public: site,
    output: () => output,
    async write(rel, text) {
      const [done, failed] = [count("Done rebuilding"), count("Rebuild failed")]
      put(rel, text)
      await until(() => count("Done rebuilding") > done || count("Rebuild failed") > failed, 30_000, `no rebuild after writing ${rel}`)
      if (count("Rebuild failed") > failed) throw new Error(`quartz build --serve: the rebuild after writing ${rel} failed\n${output}`)
    },
    stop,
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
