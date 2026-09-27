// Repo guard: sources and dependencies (#89, #98).
//
//   - Every source of ours in the site config (`core/quartz.config.yaml`) and the fixture config
//     (`tests/quartz.config.yaml`) is a package name, as a downstream site lists it: never a local
//     path, which Quartz links into `.quartz/plugins/`, nor a git source. "Of ours" is any local path,
//     and any source naming chaoticgoodcomputing. The one exception, written down on #96 (tests/
//     CONTEXT.md, "Fixture plugin"), is the fixture config's own plugins, `../fixture-plugins/<name>`,
//     which exist only for the suite; each must name a fixture plugin that exists.
//   - Every package source of ours names a package in the workspace (pnpm-workspace.yaml).
//   - Every manifest dependency (`quartz.dependencies`) of a plugin, site plugin or fixture plugin
//     names a package in the workspace: an engine by its package name, never its manifest name.
//   - Every plugin of ours either config enables is a dependency of the site package, under the name
//     Quartz imports it by: its package name, or for an object source `{ repo, name }`, its `name`, an
//     alias of `repo` (`"<name>": "workspace:<repo>@*"`). The fixture loads through the site package
//     too, so it is held to the same.
//
//   node quartz-v5/utils/guards/package-sources.guard.mjs [--repo <dir>]
//
// Test and how to break it by hand: utils/test/guard-package-sources.test.mjs.
import fs from "node:fs"
import path from "node:path"
import { CORE_REL, REPO_ROOT } from "../core-tiers.mjs"
import { SCOPE, SITE_REL, ourPackages, parseYaml, sitePackage } from "../packages.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

const SITE_CONFIG = `${CORE_REL}/quartz.config.yaml`
const FIXTURE_CONFIG = `${SITE_REL}/tests/quartz.config.yaml`
const FIXTURE_PLUGINS = `${SITE_REL}/tests/fixture-plugins`
const FIXTURE_PLUGIN = /^\.\.\/fixture-plugins\/([^/]+)$/

const isLocal = (spec) => /^(\.{1,2}\/|\/|[A-Za-z]:[\\/])/.test(spec)
const isOurs = (spec) => isLocal(spec) || spec.includes(SCOPE.slice(1))
const isPackageName = (spec) => /^@[^/:\s]+\/[^/:\s]+$/.test(spec) || /^[^@./:\s][^/:\s]*$/.test(spec)

/** The name of every package in the workspace, from pnpm-workspace.yaml's `packages` globs. */
function workspacePackages(repo) {
  const file = path.join(repo, "pnpm-workspace.yaml")
  if (!fs.existsSync(file)) throw new CannotCheck(`no pnpm-workspace.yaml at ${repo}`)
  const names = new Set()
  for (const glob of parseYaml(fs.readFileSync(file, "utf-8")).packages ?? []) {
    const dirs = glob.endsWith("/*")
      ? (fs.existsSync(path.join(repo, glob.slice(0, -2))) ? fs.readdirSync(path.join(repo, glob.slice(0, -2))).map((d) => path.join(glob.slice(0, -2), d)) : [])
      : [glob]
    for (const dir of dirs) {
      const manifest = path.join(repo, dir, "package.json")
      if (fs.existsSync(manifest)) names.add(JSON.parse(fs.readFileSync(manifest, "utf-8")).name)
    }
  }
  return names
}

function checkConfig(repo, rel, { workspace, dependencies, fixture }) {
  const file = path.join(repo, rel)
  if (!fs.existsSync(file)) throw new CannotCheck(`no config at ${rel}`)
  const plugins = parseYaml(fs.readFileSync(file, "utf-8"))?.plugins
  if (!Array.isArray(plugins)) throw new CannotCheck(`${rel} has no plugins list`)
  const violations = []
  plugins.forEach((entry, i) => {
    const say = (message) => violations.push(`${rel}: plugins[${i}] ${message}`)
    const source = entry?.source
    const spec = typeof source === "string" ? source : source?.repo
    if (typeof spec !== "string" || !isOurs(spec)) return

    if (isLocal(spec)) {
      const fixturePlugin = fixture && typeof source === "string" && spec.match(FIXTURE_PLUGIN)
      if (!fixturePlugin) return say(`lists a plugin of ours by the local path "${spec}": list it by its package name`)
      if (!fs.existsSync(path.join(repo, FIXTURE_PLUGINS, fixturePlugin[1], "package.json"))) {
        say(`lists "${spec}", but there is no fixture plugin ${FIXTURE_PLUGINS}/${fixturePlugin[1]}`)
      }
      return
    }
    if (!isPackageName(spec)) return say(`lists a plugin of ours by "${spec}", not a package name`)
    if (!workspace.has(spec)) return say(`names "${spec}", which is no package in the workspace`)

    if (entry.enabled === false) return
    // Quartz imports a package source by its name, and an object source by its `name` if it has one.
    const imported = typeof source === "object" && typeof source.name === "string" ? source.name : spec
    const dependency = dependencies[imported]
    if (dependency === undefined) {
      say(`enables "${imported}", which the site package (${SITE_REL}/package.json) does not depend on`)
    } else if (imported !== spec && !dependency.startsWith(`workspace:${spec}@`)) {
      say(`enables "${imported}", but the site package depends on it as "${dependency}", not "workspace:${spec}@*"`)
    }
  })
  return violations
}

await guard(import.meta, "Every source of ours is a package name the workspace has and the site package depends on", (argv) => {
  const repo = path.resolve(option(argv, "repo", REPO_ROOT))
  const workspace = workspacePackages(repo)
  const dependencies = sitePackage(repo).pkg.dependencies ?? {}

  const violations = [
    ...checkConfig(repo, SITE_CONFIG, { workspace, dependencies, fixture: false }),
    ...checkConfig(repo, FIXTURE_CONFIG, { workspace, dependencies, fixture: true }),
  ]

  const fixtureRoot = path.join(repo, FIXTURE_PLUGINS)
  const manifests = [
    ...ourPackages(repo, ["plugin", "site-plugin"]).map(({ rel, pkg }) => ({ rel, pkg })),
    ...(fs.existsSync(fixtureRoot) ? fs.readdirSync(fixtureRoot).sort() : [])
      .filter((dir) => fs.existsSync(path.join(fixtureRoot, dir, "package.json")))
      .map((dir) => ({ rel: `${FIXTURE_PLUGINS}/${dir}`, pkg: JSON.parse(fs.readFileSync(path.join(fixtureRoot, dir, "package.json"), "utf-8")) })),
  ]
  for (const { rel, pkg } of manifests) {
    for (const dependency of (pkg.quartz ?? pkg.manifest)?.dependencies ?? []) {
      if (!workspace.has(dependency)) violations.push(`${rel}: its manifest dependency "${dependency}" names no package in the workspace`)
    }
  }
  return violations
})
