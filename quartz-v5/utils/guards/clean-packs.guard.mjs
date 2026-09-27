// Repo guard: every publishable package packs cleanly, and no repo-only package is published (#89, #98).
//
// `pnpm pack --dry-run` of each publishable package, every plugin in `plugins/` that is not repo-only,
// lists only its built `dist/`, its README, its LICENSE and `package.json`, and has each of them: what
// a downstream site installs, which needs no build (ADR-0005). This reads built output: a pack with no
// `dist/` fails.
//
// The site plugins and the site package are repo-only and never packed. A workspace publish, the way
// every package would be published (#90), leaves each of them out: pnpm drops a private package before
// it asks the registry anything, and a single-package `pnpm publish --dry-run` stops before that
// check, so the guard asks the workspace (`pnpm -r --filter <each> publish --dry-run`). It needs no
// network: offline, the one registry lookup fails without retries and the dry run carries on.
//
// Publishable here means the plugins only. The libraries in `libs/` are not repo-only, yet this guard
// leaves them out on purpose: whether they are published at all is #90's to decide (#89, Out of
// Scope), and each packs its `src/`, not a `dist/`. #90 either marks them repo-only or brings them in.
//
//   node quartz-v5/utils/guards/clean-packs.guard.mjs [--repo <dir>]
//
// Test and how to break it by hand: utils/test/guard-clean-packs.test.mjs.
import path from "node:path"
import { spawn } from "node:child_process"
import { REPO_ROOT } from "../core-tiers.mjs"
import { ourPackages, sitePackage } from "../packages.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

const ALLOWED = /^(dist\/.+|README(\.md)?|LICENSE(\.md|\.txt)?|package\.json)$/i
const REQUIRED = [
  ["dist/", (file) => file.startsWith("dist/"), " (build it)"],
  ["README.md", (file) => /^README(\.md)?$/i.test(file), ""],
  ["LICENSE", (file) => /^LICENSE(\.md|\.txt)?$/i.test(file), ""],
  ["package.json", (file) => file === "package.json", ""],
]

/**
 * Run pnpm with `args` at `cwd`: what it printed, `{ out, err }`, or a rejection naming it. pnpm
 * switches to the version the repo pins. With no fetch retries, a registry pnpm cannot reach costs
 * nothing offline (with retries, each call waited over a minute).
 */
function pnpm(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", [...args, "--config.fetch-retries=0"], { cwd, stdio: ["ignore", "pipe", "pipe"] })
    let out = ""
    let err = ""
    child.stdout.on("data", (chunk) => (out += chunk))
    child.stderr.on("data", (chunk) => (err += chunk))
    child.on("error", reject)
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`pnpm ${args[0]} exited ${code}: ${(err || out).trim()}`))
      resolve({ out, err })
    })
  })
}

/** The files `pnpm pack --dry-run` would put in the package at `dir`. */
function packFiles(dir) {
  return pnpm(["pack", "--dry-run", "--json"], dir).then(({ out }) => {
    try {
      // Anything pnpm prints before the JSON (a version switch notice, say) is not part of it.
      return JSON.parse(out.slice(out.indexOf("{"))).files.map((file) => file.path)
    } catch {
      throw new Error(`pnpm pack printed no JSON: ${out.trim()}`)
    }
  })
}

/**
 * Every repo-only package a workspace publish would publish anyway. Offline, pnpm's one registry
 * lookup (does this version exist yet?) fails at once, and the dry run goes on, so the answer never
 * needs the network. A publish that cannot run at all is a CannotCheck.
 */
async function published(repo, repoOnly) {
  const filters = repoOnly.flatMap(({ pkg }) => ["--filter", pkg.name])
  let out
  try {
    const printed = await pnpm(["-r", ...filters, "publish", "--dry-run", "--no-git-checks"], repo)
    out = `${printed.out}${printed.err}`
  } catch (err) {
    throw new CannotCheck(`could not run a workspace publish of the repo-only packages: ${err.message}`)
  }
  return repoOnly
    .filter(({ pkg }) => out.includes(`${pkg.name}@`))
    .map(({ rel, pkg }) => `${rel}: a workspace publish would publish ${pkg.name}: it must be repo-only`)
}

await guard(import.meta, "Every publishable package packs only dist/, README, LICENSE and package.json, and no repo-only one is published", async (argv) => {
  const repo = path.resolve(option(argv, "repo", REPO_ROOT))
  const publishable = ourPackages(repo, ["plugin"]).filter(({ pkg }) => pkg.private !== true)
  if (publishable.length === 0) throw new CannotCheck(`no publishable plugins under ${repo}`)
  const reports = await Promise.all(
    publishable.map(async ({ rel, root: at }) => {
      let files
      try {
        files = await packFiles(at)
      } catch (err) {
        return [`${rel}: could not pack it: ${err.message}`]
      }
      return [
        ...files.filter((file) => !ALLOWED.test(file)).sort().map((file) => `${rel}: its pack has ${file}, which is not dist/, README, LICENSE or package.json`),
        ...REQUIRED.filter(([, has]) => !files.some(has)).map(([name, , hint]) => `${rel}: its pack has no ${name}${hint}`),
      ]
    }),
  )
  const site = sitePackage(repo)
  const repoOnly = [...ourPackages(repo, ["site-plugin"]), { rel: site.rel.replace(/\/package\.json$/, ""), pkg: site.pkg }]
  return [...reports.flat(), ...(await published(repo, repoOnly))]
})
