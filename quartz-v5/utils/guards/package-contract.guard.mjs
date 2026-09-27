// Repo guard: every plugin and site plugin meets the package contract (#89, #98).
//
// For each package in `plugins/` and `site-plugins/`:
//   - names: a plugin is the directory `quartz-<name>`, the Nx project `quartz-<name>`, the package
//     `@chaoticgoodcomputing/quartz-<name>` and the manifest name `cgc-<name>`; a site plugin is
//     `site-<name>` for all but its package, `@chaoticgoodcomputing/site-<name>`, and its manifest
//     name, which stays `site-<name>` (#96);
//   - `exports` has `"./package.json": "./package.json"`, which Quartz reads the manifest through, and
//     every other entry is `{ types, import }`, both of them emitted (so this reads built output);
//   - `files` is `["dist"]`, `license` is MIT, `publishConfig` is public, and `repository` names this
//     repo and the package's directory;
//   - it is repo-only (`"private": true`) exactly when it is a site plugin. The site package,
//     `quartz-v5/package.json`, is repo-only too;
//   - its manifest (`quartz`, or the older `manifest`) never sets `requiresInstall`, which would make
//     Quartz run `npm install --no-save` into Core behind pnpm's back, even for a package source.
//
//   node quartz-v5/utils/guards/package-contract.guard.mjs [--repo <dir>]
//
// Test and how to break it by hand: utils/test/guard-package-contract.test.mjs.
import fs from "node:fs"
import path from "node:path"
import { isDeepStrictEqual } from "node:util"
import { REPO_ROOT } from "../core-tiers.mjs"
import { REPOSITORY_URL, SCOPE, ourPackages, sitePackage } from "../packages.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

const PREFIX = { plugin: "quartz-", "site-plugin": "site-" }

function contract({ kind, dir, rel, path: at, pkg, project }) {
  const problems = []
  const say = (message) => problems.push(`${rel}: ${message}`)

  // Names.
  if (!new RegExp(`^${PREFIX[kind]}[a-z0-9-]+$`).test(dir)) {
    say(`a ${kind === "plugin" ? "plugin" : "site plugin"}'s directory is named "${PREFIX[kind]}<name>"`)
  } else {
    const manifestName = kind === "plugin" ? `cgc-${dir.slice(PREFIX.plugin.length)}` : dir
    if (pkg.name !== `${SCOPE}/${dir}`) say(`its package name is "${pkg.name}", not "${SCOPE}/${dir}"`)
    if (project?.name !== dir) say(project ? `its Nx project is "${project.name}", not "${dir}"` : `it has no project.json (Nx project "${dir}")`)
    if (pkg.quartz?.name !== manifestName) say(`its manifest name is "${pkg.quartz?.name}", not "${manifestName}"`)
  }

  // Exports, and the output they point at.
  if (!pkg.exports || typeof pkg.exports !== "object") say("it has no exports")
  else {
    if (pkg.exports["./package.json"] !== "./package.json") say('exports has no "./package.json": "./package.json"')
    for (const [entry, target] of Object.entries(pkg.exports)) {
      if (entry === "./package.json") continue
      if (typeof target !== "object" || typeof target?.types !== "string" || typeof target?.import !== "string") {
        say(`exports "${entry}" is not { types, import }`)
        continue
      }
      for (const file of [target.import, target.types]) {
        if (!fs.existsSync(path.join(at, file))) say(`exports "${entry}" has no emitted ${file} (build it)`)
      }
    }
  }

  // What a publish needs.
  if (!isDeepStrictEqual(pkg.files, ["dist"])) say('its files is not ["dist"]')
  if (pkg.license !== "MIT") say('its license is not "MIT"')
  if (!isDeepStrictEqual(pkg.publishConfig, { access: "public" })) say('its publishConfig is not { access: "public" }')
  const repository = { type: "git", url: REPOSITORY_URL, directory: rel }
  if (!isDeepStrictEqual(pkg.repository, repository)) {
    say(`its repository is not { type: "git", url: "${REPOSITORY_URL}", directory: "${rel}" }`)
  }

  // Repo-only exactly for the site plugins.
  if (kind === "site-plugin" && pkg.private !== true) say('a site plugin is repo-only: set "private": true')
  if (kind === "plugin" && pkg.private !== undefined) {
    say("it is repo-only (private), but only site plugins and the site package are: a plugin is published")
  }

  // requiresInstall, under either key Quartz reads the manifest from (gitLoader.ts).
  for (const key of ["quartz", "manifest"]) {
    if (pkg[key] && typeof pkg[key] === "object" && "requiresInstall" in pkg[key]) {
      say(`its manifest sets requiresInstall (${key}.requiresInstall): Quartz would npm install into Core; drop it`)
    }
  }
  return problems
}

await guard(import.meta, "Every plugin and site plugin meets the package contract", (argv) => {
  const repo = path.resolve(option(argv, "repo", REPO_ROOT))
  let packages, site
  try {
    packages = ourPackages(repo, ["plugin", "site-plugin"])
    site = sitePackage(repo)
  } catch (err) {
    throw new CannotCheck(`cannot read the packages under ${repo}: ${err.message}`)
  }
  if (packages.length === 0) throw new CannotCheck(`no plugins under ${repo}`)
  const violations = packages.flatMap(contract)
  if (site.pkg.private !== true) violations.push(`${site.rel}: the site package is repo-only: set "private": true`)
  return violations
})
