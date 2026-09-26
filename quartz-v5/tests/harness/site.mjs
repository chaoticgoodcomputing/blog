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
import { buildLocalPlugin, installLibs } from "../../utils/local-plugins.mjs"

const run = promisify(execFile)
const here = path.dirname(fileURLToPath(import.meta.url))
export const testsRoot = path.resolve(here, "..")
export const vendored = path.resolve(testsRoot, "../quartz")
const pluginsRoot = path.resolve(testsRoot, "../plugins")
// Site plugins (VENDORED.md layout): no fixture config lists one, but scratch sites built from the
// site config do, so they are built and linked alongside our plugins.
const sitePluginsRoot = path.resolve(testsRoot, "../site-plugins")
const PLUGIN_ROOTS = [pluginsRoot, sitePluginsRoot]
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
// the same root, and one inside a map of options, such as an icon collection's directory in
// `iconCollections`. A map shared through a YAML anchor is rebased once, where it is anchored.
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
    rebaseOptions(entry.get("options"), rebase)
  }
  return String(config)
}

function rebaseOptions(map, rebase) {
  for (const option of YAML.isMap(map) ? map.items : []) {
    if (YAML.isScalar(option.value) && /^\.\.?\//.test(option.value.value)) {
      option.value.value = rebase(option.value.value)
    } else if (YAML.isMap(option.value)) {
      rebaseOptions(option.value, rebase)
    }
  }
}

// The fixture's own config as YAML text: what a scratch site is built from unless given another.
export const fixtureConfig = () => fs.readFileSync(path.join(testsRoot, "quartz.config.yaml"), "utf8")

// Every plugin entry in `config` (YAML text), as plain values, in YAML order.
export const pluginEntries = (config) => YAML.parse(config).plugins

// The `source` of every plugin entry in `config` (YAML text), in YAML order.
export const pluginSources = (config) => pluginEntries(config).map((entry) => entry.source)

// `config` (YAML text) as `edit(doc, entry)` leaves it, for a scratch site's config: `doc` is the
// parsed YAML document, and `entry(source)` the plugin entry whose `source` is `source`. Every alias
// becomes a copy of what it names first, so replacing a value that holds an anchor, such as
// cgc-tag-list's `&iconCollections`, leaves the entries that alias it their value.
export function editConfig(config, edit) {
  const doc = YAML.parseDocument(config)
  YAML.visit(doc, {
    Alias(_, alias) {
      const copy = alias.resolve(doc).clone()
      copy.anchor = undefined
      return copy
    },
  })
  const entry = (source) => {
    const found = doc.get("plugins").items.find((item) => item.get("source") === source)
    if (!found) throw new Error(`no plugin entry has the source ${source}`)
    return found
  }
  edit(doc, entry)
  return String(doc)
}

// `config` (YAML text) with each of `entries` in its plugin list: an entry replaces the one with the
// same `source`, or is appended. Appending puts a plugin last in YAML order, which decides nothing
// its `order` doesn't: plugins run, and emit their CSS, sorted by `order`.
export const withPlugins = (config, entries) =>
  editConfig(config, (doc) => {
    const plugins = doc.get("plugins")
    for (const entry of entries) {
      const at = plugins.items.findIndex((item) => item.get("source") === entry.source)
      if (at < 0) plugins.add(doc.createNode(entry))
      else plugins.set(at, doc.createNode(entry))
    }
  })

// Entries for `withPlugins` that turn off every package under `quartz-v5/plugins/` that `config`
// lists, except those named in `keep`: for a build that must fail in one plugin's words, which
// another that checks the same thing, such as another plugin that draws icons, would otherwise fail
// first. Fixture plugins are left as they are.
export const othersOff = (config, keep) =>
  pluginSources(config)
    .filter((source) => typeof source === "string" && source.startsWith("../../plugins/"))
    .filter((source) => !keep.includes(path.basename(source)))
    .map((source) => ({ source, enabled: false }))

const LINKED = ["package.json", "quartz", "node_modules", "tsconfig.json", "quartz.ts", "globals.d.ts", "index.d.ts"]
// Ours: a package under `quartz-v5/plugins/`, or a fixture plugin standing in for one.
const isOurs = (source) =>
  typeof source === "string" && (source.startsWith("../../plugins/") || source.startsWith("../fixture-plugins/"))
// A stock plugin one of ours replaces, which the baseline turns back on in its place, where the
// baseline would otherwise lose pages: without stock tag-page it has no tag pages, and no-bleed
// would compare ours with the 404 page. So the pages ours makes are compared with the stock pages
// they stand in for, as an .mdx page is with its .md twin.
const STANDS_IN_FOR = { "../../plugins/cgc-tag-page": "@quartz-community/tag-page" }

// Fixture pins: what a fixture build would otherwise fetch from the network, pinned by hand. The
// directory mirrors a fixture root's `.cache/` (cgc-annotator's source documents, by mirror name,
// under `cgc-annotator/`) and is copied in before every build, so the fixture needs no network.
const fixtureCache = path.join(testsRoot, "fixture-cache")

// Links a fixture or scratch root to the vendored copy: everything but the config it holds itself.
function linkVendored(root) {
  for (const entry of LINKED) {
    const link = path.join(root, entry)
    if (!fs.existsSync(link)) fs.symlinkSync(path.join(vendored, entry), link)
  }
}

function writeFixtureRoot(variant) {
  const root = fixtureRoot(variant)
  fs.mkdirSync(root, { recursive: true })
  linkVendored(root)
  if (fs.existsSync(fixtureCache)) fs.cpSync(fixtureCache, path.join(root, ".cache"), { recursive: true })
  const config = YAML.parseDocument(fixtureConfig())
  if (variant === "baseline") {
    const standIns = new Set()
    for (const entry of config.get("plugins").items) {
      const source = entry.get("source")
      if (!isOurs(source)) continue
      if (entry.get("enabled") && STANDS_IN_FOR[source]) standIns.add(STANDS_IN_FOR[source])
      entry.set("enabled", false)
    }
    for (const entry of config.get("plugins").items) {
      if (standIns.has(entry.get("source"))) entry.set("enabled", true)
    }
  }
  fs.writeFileSync(path.join(root, "quartz.config.yaml"), String(config))
}

// Quartz symlinks a local plugin into `.quartz/plugins/` but never builds it — only git sources
// get `npm run build` — so every package is built here first, as the real site's prebuild builds
// the ones its config enables (utils/local-plugins.mjs).
export async function buildPlugins() {
  linkHostModules()
  await installLibs(run)
  const packages = PLUGIN_ROOTS.flatMap((root) =>
    fs.existsSync(root)
      ? fs.readdirSync(root).filter((dir) => fs.existsSync(path.join(root, dir, "package.json"))).map((dir) => path.join(root, dir))
      : [],
  )
  await Promise.all(packages.map((cwd) => buildLocalPlugin(cwd, run)))
  return packages
}

// A copy of our package `name` (a directory under `quartz-v5/plugins/`), changed by `edit(copy)`
// and built by its own build script, outside the repo: for a build that must refuse, such as one of
// a stylesheet that selects what the package doesn't own (ADR-0003 rule 3). The copy shares the
// package's install. Resolves with the exit code, the combined output of a failed build, and whether
// the build wrote `dist/`, and deletes the copy.
export async function buildPluginCopy(name, edit) {
  const source = path.join(pluginsRoot, name)
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-copy-`))
  try {
    for (const entry of ["package.json", "build.mjs", "src"]) {
      fs.cpSync(path.join(source, entry), path.join(copy, entry), { recursive: true })
    }
    fs.symlinkSync(path.join(source, "node_modules"), path.join(copy, "node_modules"))
    edit(copy)
    const build = await run("node", ["build.mjs"], { cwd: copy }).then(
      () => ({ code: 0, output: "" }),
      (err) => ({ code: err.code, output: `${err.stdout}${err.stderr}` }),
    )
    return { ...build, dist: fs.existsSync(path.join(copy, "dist")) }
  } finally {
    fs.rmSync(copy, { recursive: true, force: true })
  }
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
// atomic (ADR-0004). It holds an empty file named for each process the build runs in: the worker
// that took it, and the build's own once it has started. A worker that times out mid-build is
// stopped before it can let the lock go, so a lock none of whose processes is still running is free,
// and so, whatever holds it, is one older than any build.
export const BUILD_LOCK = path.join(testsRoot, ".site-build-lock")
const STALE_MS = 5 * 60 * 1000
const running = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err.code === "EPERM"
  }
}
function lockIsStale() {
  const pids = fs.readdirSync(BUILD_LOCK).map(Number).filter(Number.isInteger)
  if (Date.now() - fs.statSync(BUILD_LOCK).mtimeMs > STALE_MS) return true
  // Just taken, before its taker has named itself: not stale.
  return pids.length > 0 && !pids.some(running)
}
async function withBuildLock(fn) {
  for (;;) {
    try {
      fs.mkdirSync(BUILD_LOCK)
      break
    } catch (err) {
      if (err.code !== "EEXIST") throw err
      try {
        if (lockIsStale()) fs.rmSync(BUILD_LOCK, { recursive: true, force: true })
      } catch {}
      await new Promise((done) => setTimeout(done, 50))
    }
  }
  const holds = (pid) => fs.writeFileSync(path.join(BUILD_LOCK, String(pid)), "")
  try {
    holds(process.pid)
    return await fn(holds)
  } finally {
    fs.rmSync(BUILD_LOCK, { recursive: true, force: true })
  }
}

const quartzBuild = (root, args) =>
  withBuildLock((holds) => {
    const build = run("node", [path.join(root, "quartz/bootstrap-cli.mjs"), "build", ...args], { cwd: root })
    holds(build.child.pid)
    return build
  })

// `quartz build --serve` at `root`, for what a plugin does differently under serve (ADR-0004 keeps
// it out of everything else), run under a build lock the caller holds, which `holds` names it in.
// Its ports are the OS's pick, so it never collides with the suite's own servers or another copy of
// the suite. Resolves with the server once it is up, which is after the first build has been
// emitted: its `output` so far, `exited()`, and `stop()`. Rejects like `quartzBuild`, with the exit
// code and output, if it exits before serving, and gives up after `SERVE_TIMEOUT_MS`.
const SERVE_TIMEOUT_MS = 2 * 60 * 1000
const spawnServe = (root, args, holds) =>
  new Promise((resolve, reject) => {
    const cli = path.join(root, "quartz/bootstrap-cli.mjs")
    const child = spawn("node", [cli, "build", "--serve", "--port", "0", "--wsPort", "0", ...args], { cwd: root })
    holds(child.pid)
    const closed = new Promise((done) => child.on("close", done))
    const server = {
      output: "",
      exited: () => child.exitCode !== null || child.signalCode !== null,
      stop: async () => {
        child.kill()
        await closed
      },
    }
    const timer = setTimeout(() => child.kill(), SERVE_TIMEOUT_MS)
    const collect = (chunk) => {
      server.output += chunk
      if (server.output.includes("Started a Quartz server")) {
        clearTimeout(timer)
        resolve(server)
      }
    }
    child.stdout.on("data", collect)
    child.stderr.on("data", collect)
    closed.then((code) => {
      clearTimeout(timer)
      reject(Object.assign(new Error(`quartz build --serve exited before serving\n${server.output}`), { code: code ?? 1, stdout: server.output }))
    })
  })

// A serve run left up: it holds the build lock until its server is up, and its rebuilds run without it.
const startServe = (root, args) => withBuildLock((holds) => spawnServe(root, args, holds))

// A serve run stopped as soon as its server is up. It holds the build lock until the server has
// exited, since serve's source watcher lives as long as the server does.
const quartzServe = (root, args) =>
  withBuildLock(async (holds) => {
    const server = await spawnServe(root, args, holds)
    await server.stop()
    return { stdout: server.output, stderr: "" }
  })

export async function buildSite(variant) {
  writeFixtureRoot(variant)
  await quartzBuild(fixtureRoot(variant), ["-d", "../content-fixture", "-o", outputFor(variant)])
}

// A scratch site's root, made `at` a place (see SCRATCH_PARENT) under a name of its own, since the
// same spec runs once per colour scheme, possibly at the same time, with `config` (YAML text) as its
// config. Its content goes outside the repo, because Quartz's content glob honours .gitignore, which
// covers every fixture root. `put(rel, text)` writes a content file, and `remove()` deletes the root
// and the content, never a link's target.
function makeScratchRoot(name, files, { config = fixtureConfig(), at = "fixture" } = {}) {
  const root = fs.mkdtempSync(path.join(SCRATCH_PARENT[at], `.site-scratch-${name}-`))
  const content = fs.mkdtempSync(path.join(os.tmpdir(), `cgc-scratch-${name}-`))
  const remove = () => {
    for (const dir of [content, root]) fs.rmSync(dir, { recursive: true, force: true })
  }
  const put = (rel, text) => {
    const file = path.join(content, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    if (text?.symlink) fs.symlinkSync(text.symlink, file)
    else fs.writeFileSync(file, text)
  }
  try {
    for (const [rel, text] of Object.entries(files)) put(rel, text)
    linkVendored(root)
    fs.writeFileSync(path.join(root, "quartz.config.yaml"), config)
  } catch (err) {
    remove()
    throw err
  }
  return { root, content, put, remove }
}

// A one-off site for a spec that needs content the shared fixture must not carry — chiefly a build
// that is supposed to fail. `files` maps content paths to their text (or bytes), or to
// `{ symlink: target }` for a link to somewhere else, such as a `node_modules` the content's own
// imports resolve from, the way the vault's resolve from the repo root's. Uses the fixture's config
// unless `options.config` supplies one (a YAML string), and assumes `buildPlugins` has already run
// (global setup does it). Resolves with the exit code and combined output rather than throwing.
// `options.serve` builds it as `quartz build --serve` does, stopping the server once it is up.
// `options.at` is where the root is made: `fixture` (the default) or `site`, see SCRATCH_PARENT. The
// site is deleted afterwards unless `options.keep` is set; the result then also carries `public`
// (the built site) and `remove()`, which the caller must call once it is done with the site.
export async function buildScratchSite(name, files, options = {}) {
  const scratch = makeScratchRoot(name, files, options)
  const kept = options.keep ? { public: path.join(scratch.root, "public"), remove: scratch.remove } : {}
  try {
    const build = options.serve ? quartzServe : quartzBuild
    const { stdout, stderr } = await build(scratch.root, ["-d", scratch.content, "-o", "public"])
    return { code: 0, output: stdout + stderr, ...kept }
  } catch (err) {
    return { code: err.code ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}`, ...kept }
  } finally {
    // The content is read by now: a kept site keeps only its root.
    if (options.keep) fs.rmSync(scratch.content, { recursive: true, force: true })
    else scratch.remove()
  }
}

// What serve prints as a rebuild starts, and as it ends either way.
const [DETECTED, DONE, FAILED] = ["Detected change", "Done rebuilding", "Rebuild failed"]
const REBUILD_LINES = [DETECTED, DONE, FAILED]

// A serve run left up, for what Quartz does when content changes under `quartz build --serve`: a
// spec edits the content and reads the rebuilt site. It loads the plugins built for this run, so
// ADR-0004's objection to serve, a long-lived process that never reloads a rebuilt plugin, doesn't
// arise. Only the first build holds the build lock: a rebuild re-runs what the process has already
// imported. The output is outside the Quartz root, because serve's source watcher watches every
// `.ts` and `.tsx` under it, and would take a copied widget's source for Quartz's own and
// re-transpile Quartz, which is what the lock guards. Takes `files` as `buildScratchSite` does, with
// the fixture's config, and resolves once the server is up with the built site, `public`;
// `write(rel, text)`, which changes a content file and resolves once the rebuild that follows is
// done, writing it again if serve's watcher missed it; and `stop()`, which the caller must call: it
// stops the server and deletes the site.
export async function serveScratchSite(name, files) {
  const scratch = makeScratchRoot(name, files)
  const site = fs.mkdtempSync(path.join(os.tmpdir(), `cgc-scratch-${name}-public-`))
  const remove = () => {
    scratch.remove()
    fs.rmSync(site, { recursive: true, force: true })
  }
  let server
  try {
    server = await startServe(scratch.root, ["-d", scratch.content, "-o", site])
  } catch (err) {
    remove()
    throw err
  }

  const count = (text) => server.output.split(text).length - 1
  // Whether `done()` comes true within `ms`. Throws if the server exits first.
  const within = async (ms, done) => {
    for (const start = Date.now(); !done(); await new Promise((tick) => setTimeout(tick, 50))) {
      if (server.exited()) throw new Error(`quartz build --serve exited\n${server.output}`)
      if (Date.now() - start > ms) return false
    }
    return true
  }
  return {
    public: site,
    async write(rel, text) {
      const before = Object.fromEntries(REBUILD_LINES.map((line) => [line, count(line)]))
      const since = (line) => count(line) - before[line]
      // Serve's content watcher starts as its server does, and misses a write it isn't ready for
      // yet, which a loaded machine makes likely: the write is made again until the watcher sees it.
      scratch.put(rel, text)
      for (let tries = 1; !(await within(5_000, () => since(DETECTED) > 0)); tries++) {
        if (tries === 6) throw new Error(`quartz build --serve: no rebuild after writing ${rel}\n${server.output}`)
        scratch.put(rel, text)
      }
      // Every rebuild the write set off has finished.
      if (!(await within(30_000, () => since(DETECTED) <= since(DONE) + since(FAILED)))) {
        throw new Error(`quartz build --serve: the rebuild after writing ${rel} never finished\n${server.output}`)
      }
      if (since(FAILED) > 0) throw new Error(`quartz build --serve: the rebuild after writing ${rel} failed\n${server.output}`)
    },
    async stop() {
      await server.stop()
      remove()
    },
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
