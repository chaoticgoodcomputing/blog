// Our packages as the package guards read them (#89, #98): every plugin, site plugin and library in
// a repo shaped like this one, with its manifest, and the site package. Pure reads of the files on
// disk, no install needed, so each guard can point it at a scratch repo instead of the real one.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { CORE_REL, REPO_ROOT } from "./core-tiers.mjs"

/** The site's root, relative to the repo root: the site package, the plugin roots and the tests. */
export const SITE_REL = "quartz-v5"
/** The scope every package of ours is published under. */
export const SCOPE = "@chaoticgoodcomputing"
/** The package's repository, as each `package.json` names it. */
export const REPOSITORY_URL = "git+https://github.com/chaoticgoodcomputing/blog.git"

/**
 * Quartz's shared packages: the host's own copies, which a plugin takes as peers and must never carry
 * a copy of, installed or bundled, or a page gets two Preacts (VENDORED.md, "Dependencies"). A name
 * ending in `/` is a scope: every package in it.
 */
export const SHARED = ["preact", "preact-render-to-string", "vfile", "unified", "lightningcss", "@quartz-community/"]

/** Whether `name` is one of Quartz's shared packages. */
export const isShared = (name) => SHARED.some((shared) => (shared.endsWith("/") ? name.startsWith(shared) : name === shared))

/** The kinds of package, by the directory each lives in under the site's root. */
export const KINDS = { plugin: "plugins", "site-plugin": "site-plugins", library: "libs" }

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf-8"))

/**
 * Every package of ours under `repo`: `{ kind, dir, rel, name, pkg, project }`, where `dir` is the
 * directory's basename, `rel` its path from the repo root, `pkg` its package.json and `project` its
 * project.json (or null). A directory with no package.json is skipped, as pnpm skips it.
 */
export function ourPackages(repo = REPO_ROOT, kinds = Object.keys(KINDS)) {
  const packages = []
  for (const kind of kinds) {
    const root = path.join(repo, SITE_REL, KINDS[kind])
    if (!fs.existsSync(root)) continue
    for (const dir of fs.readdirSync(root).sort()) {
      const at = path.join(root, dir)
      if (dir === "node_modules" || !fs.existsSync(path.join(at, "package.json"))) continue
      const project = path.join(at, "project.json")
      packages.push({
        kind,
        dir,
        rel: path.relative(repo, at).split(path.sep).join("/"),
        path: at,
        pkg: readJson(path.join(at, "package.json")),
        project: fs.existsSync(project) ? readJson(project) : null,
      })
    }
  }
  return packages
}

/** The site package, `quartz-v5/package.json`: `{ rel, pkg }`. */
export function sitePackage(repo = REPO_ROOT) {
  const rel = `${SITE_REL}/package.json`
  return { rel, pkg: readJson(path.join(repo, rel)) }
}

/** Core's `node_modules`, where every shared package must resolve to. */
export const coreModules = (repo = REPO_ROOT) => path.join(repo, CORE_REL, "node_modules")

/**
 * Parse YAML with Core's own parser, as Quartz and prebuild do (Core must be installed). Core is read
 * from the real repo whatever `repo` a guard checks, since a scratch repo has no install.
 */
export function parseYaml(text) {
  return createRequire(path.join(REPO_ROOT, CORE_REL, "package.json"))("yaml").parse(text)
}
