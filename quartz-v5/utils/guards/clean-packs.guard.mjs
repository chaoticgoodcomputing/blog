// Repo guard: every publishable package packs cleanly (#89, #98).
//
// `pnpm pack --dry-run` of each publishable package, every plugin in `plugins/` that is not repo-only,
// lists only its built `dist/`, its README, its LICENSE and `package.json`, and has each of them: what
// a downstream site installs, which needs no build (ADR-0005). The site plugins and the site package
// are repo-only and never packed. Libraries are left to the publishing ticket (#90), which decides
// whether they are published at all. This reads built output: a pack with no `dist/` fails.
//
//   node quartz-v5/utils/guards/clean-packs.guard.mjs [--repo <dir>]
//
// Test and how to break it by hand: utils/test/guard-clean-packs.test.mjs.
import path from "node:path"
import { spawn } from "node:child_process"
import { REPO_ROOT } from "../core-tiers.mjs"
import { ourPackages } from "../packages.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

const ALLOWED = /^(dist\/.+|README(\.md)?|LICENSE(\.md|\.txt)?|package\.json)$/i
const REQUIRED = [
  ["dist/", (file) => file.startsWith("dist/"), " (build it)"],
  ["README.md", (file) => /^README(\.md)?$/i.test(file), ""],
  ["LICENSE", (file) => /^LICENSE(\.md|\.txt)?$/i.test(file), ""],
  ["package.json", (file) => file === "package.json", ""],
]

/** The files `pnpm pack --dry-run` would put in the package at `dir`. pnpm switches to the version the repo pins. */
function packFiles(dir) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["pack", "--dry-run", "--json"], { cwd: dir, stdio: ["ignore", "pipe", "pipe"] })
    let out = ""
    let err = ""
    child.stdout.on("data", (chunk) => (out += chunk))
    child.stderr.on("data", (chunk) => (err += chunk))
    child.on("error", reject)
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`pnpm pack exited ${code}: ${(err || out).trim()}`))
      try {
        // Anything pnpm prints before the JSON (a version switch notice, say) is not part of it.
        resolve(JSON.parse(out.slice(out.indexOf("{"))).files.map((file) => file.path))
      } catch (parse) {
        reject(new Error(`pnpm pack printed no JSON: ${out.trim()}`))
      }
    })
  })
}

await guard(import.meta, "Every publishable package packs only dist/, README, LICENSE and package.json", async (argv) => {
  const repo = path.resolve(option(argv, "repo", REPO_ROOT))
  const publishable = ourPackages(repo, ["plugin"]).filter(({ pkg }) => pkg.private !== true)
  if (publishable.length === 0) throw new CannotCheck(`no publishable plugins under ${repo}`)
  const reports = await Promise.all(
    publishable.map(async ({ rel, path: at }) => {
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
  return reports.flat()
})
