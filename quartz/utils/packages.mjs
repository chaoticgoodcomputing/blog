// Our packages (#89, #98): every plugin, site plugin and library in a repo shaped like this one, with
// its manifest, the e2e fixture's plugins, the site package and the workspace's members. The one walk
// of our package directories: the package guards, the plugin steps (plugin-packages.mjs) and the
// upgrade's report all read packages through it. Pure reads of the files on disk,
// no install needed, so each guard can point it at a scratch repo instead of the real one.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { CORE_REL, REPO_ROOT } from "./core-tiers.mjs"

/** The site's root, relative to the repo root: the site package, the plugin roots and the tests. */
export const SITE_REL = "quartz"
/** The scope every package of ours is published under. */
export const SCOPE = "@chaoticgoodcomputing"
/** The package's repository, as each `package.json` names it. */
export const REPOSITORY_URL = "git+https://github.com/chaoticgoodcomputing/blog.git"

/**
 * Quartz's shared packages: the host's own copies, which a plugin takes as peers and must never carry
 * a copy of, installed or bundled, or a page gets two Preacts (VENDORED.md, "Dependencies"). `names`
 * are single packages; `scopes` are whole scopes, every package in each.
 */
export const SHARED = {
  names: ["preact", "preact-render-to-string", "vfile", "unified", "lightningcss"],
  scopes: ["@quartz-community"],
}

/** Whether `name` is one of Quartz's shared packages. */
export const isShared = (name) =>
  SHARED.names.includes(name) || SHARED.scopes.some((scope) => name.startsWith(`${scope}/`))

/**
 * The kinds of package, by the directory each lives in under the site's root. A fixture plugin
 * (tests/CONTEXT.md) exists only for the e2e suite, so it is read only when asked for by kind.
 */
export const KINDS = {
  plugin: "plugins",
  "site-plugin": "site-plugins",
  library: "libs",
  "fixture-plugin": "tests/fixture-plugins",
}

/** The kinds `ourPackages` reads by default: every package we ship or build, not the fixture's. */
export const OUR_KINDS = ["plugin", "site-plugin", "library"]

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf-8"))

/**
 * Every package of ours under `repo` of the given kinds, in that order, each sorted by directory:
 * `{ kind, dir, rel, root, pkg, project }`, where `dir` is the directory's basename, `rel` its path
 * from the repo root, `root` its absolute path, `pkg` its package.json and `project` its
 * project.json (or null). A directory with no package.json is skipped, as pnpm skips it. The kind
 * directories are read under `siteRoot`, the site's root in `repo` unless given another.
 */
export function ourPackages(repo = REPO_ROOT, kinds = OUR_KINDS, siteRoot = path.join(repo, SITE_REL)) {
  const packages = []
  for (const kind of kinds) {
    const root = path.join(siteRoot, KINDS[kind])
    if (!fs.existsSync(root)) continue
    for (const dir of fs.readdirSync(root).sort()) {
      const at = path.join(root, dir)
      if (dir === "node_modules" || !fs.existsSync(path.join(at, "package.json"))) continue
      const project = path.join(at, "project.json")
      packages.push({
        kind,
        dir,
        rel: path.relative(repo, at).split(path.sep).join("/"),
        root: at,
        pkg: readJson(path.join(at, "package.json")),
        project: fs.existsSync(project) ? readJson(project) : null,
      })
    }
  }
  return packages
}

/** The site package, `quartz/package.json`: `{ rel, pkg }`. */
export function sitePackage(repo = REPO_ROOT) {
  const rel = `${SITE_REL}/package.json`
  return { rel, pkg: readJson(path.join(repo, rel)) }
}

/** Core's `node_modules`, where every shared package must resolve to. */
export const coreModules = (repo = REPO_ROOT) => path.join(repo, CORE_REL, "node_modules")

/**
 * Parse YAML with Core's own parser, the one Quartz reads its config with (Core must be installed):
 * the one YAML reader of the tooling (prebuild, the guards, the site-config validator, the upgrade's
 * report). Core is read from the real repo whatever `repo` a guard checks, since a scratch repo has
 * no install.
 */
export function parseYaml(text) {
  return createRequire(path.join(REPO_ROOT, CORE_REL, "package.json"))("yaml").parse(text)
}

/**
 * Every member of `repo`'s pnpm workspace, from `pnpm-workspace.yaml`'s `packages` (a `dir/*` glob
 * one level deep): `{ rel, pkg }`, `rel` from the repo root. Null when the repo has no
 * pnpm-workspace.yaml.
 */
export function workspacePackages(repo = REPO_ROOT) {
  const file = path.join(repo, "pnpm-workspace.yaml")
  if (!fs.existsSync(file)) return null
  const dirs = (parseYaml(fs.readFileSync(file, "utf-8"))?.packages ?? []).flatMap((glob) => {
    if (!glob.endsWith("/*")) return [glob]
    const parent = glob.slice(0, -2)
    return fs.existsSync(path.join(repo, parent)) ? fs.readdirSync(path.join(repo, parent)).sort().map((dir) => `${parent}/${dir}`) : []
  })
  return dirs
    .filter((rel) => fs.existsSync(path.join(repo, rel, "package.json")))
    .map((rel) => ({ rel, pkg: readJson(path.join(repo, rel, "package.json")) }))
}
