// Publish every plugin at the version `nx release version` wrote into the working tree (#90, ADR-0005).
//
// The release is one version for every plugin, which lives in its `v<semver>` tag and never in a commit
// (nx.json, `//release`), so this publishes the working tree as `nx release version` left it. For each
// publishable plugin, the same set clean-packs checks, this:
//
//   1. copies `version` into the manifest's `quartz.version`, which Quartz reports the plugin by;
//   2. packs it with pnpm, which rewrites `workspace:*` to real versions;
//   3. publishes the tarball with npm. pnpm cannot publish through npm trusted publishing, and npm
//      11.5.1+ can: in CI it signs in through GitHub's OIDC token and records provenance, with no
//      stored token. Run locally, it publishes as whoever `npm login` signed in.
//
// A version already on the registry is skipped, so a run that failed partway can be run again. Refuses
// to run unless every plugin has the same version and it is not main's `0.0.0`.
//
//   node quartz/utils/publish.mjs [--dry-run]
//
// Nx target: site:release-publish, which builds every plugin first.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import { REPO_ROOT } from "./core-tiers.mjs"
import { ourPackages } from "./packages.mjs"

const dryRun = process.argv.includes("--dry-run")

/**
 * Run `command` with `args` at `cwd`: `{ code, out, err }`. With `inherit`, output goes to the terminal
 * instead, so npm can ask for a second factor.
 */
function run(command, args, cwd, { inherit = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"] })
    let out = ""
    let err = ""
    child.stdout?.on("data", (chunk) => (out += chunk))
    child.stderr?.on("data", (chunk) => (err += chunk))
    child.on("error", reject)
    child.on("close", (code) => resolve({ code, out, err }))
  })
}

/** Whether `name@version` is already on the registry. Anything but a clean yes or a 404 fails the run. */
async function isPublished(name, version) {
  const { code, out, err } = await run("npm", ["view", `${name}@${version}`, "version"], REPO_ROOT)
  if (code === 0) return out.trim() === version
  if (/E404/.test(err)) return false
  throw new Error(`could not ask the registry about ${name}@${version}: ${err.trim()}`)
}

/** Pack the package at `root` into `dest` with pnpm: the tarball's path. */
async function pack(root, dest) {
  const { code, out, err } = await run("pnpm", ["pack", "--pack-destination", dest, "--json"], root)
  if (code !== 0) throw new Error(`pnpm pack failed in ${root}: ${(err || out).trim()}`)
  // Anything pnpm prints before the JSON (a version switch notice, say) is not part of it.
  return path.resolve(dest, JSON.parse(out.slice(out.indexOf("{"))).filename)
}

const plugins = ourPackages(REPO_ROOT, ["plugin"]).filter(({ pkg }) => pkg.private !== true)
const versions = [...new Set(plugins.map(({ pkg }) => pkg.version))]
if (versions.length !== 1) {
  console.error(`The plugins are at ${versions.length} versions (${versions.join(", ")}); a release is one version for every plugin.`)
  process.exit(1)
}
const [version] = versions
if (version === "0.0.0") {
  console.error("Every plugin is at main's 0.0.0: run `nx release version` first, which writes the release's version.")
  process.exit(1)
}

const dest = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-publish-"))
const published = []
const skipped = []
for (const { rel, root, pkg } of plugins) {
  if (await isPublished(pkg.name, version)) {
    skipped.push(pkg.name)
    console.log(`${pkg.name}@${version} is already published, skipped`)
    continue
  }
  if (pkg.quartz?.version !== version) {
    const file = path.join(root, "package.json")
    const manifest = JSON.parse(fs.readFileSync(file, "utf-8"))
    manifest.quartz.version = version
    fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
  }
  const tarball = await pack(root, dest)
  console.log(`\n${dryRun ? "Would publish" : "Publishing"} ${pkg.name}@${version} (${rel})`)
  const { code } = await run("npm", ["publish", tarball, "--access", "public", ...(dryRun ? ["--dry-run"] : [])], REPO_ROOT, { inherit: true })
  if (code !== 0) {
    console.error(`\nnpm publish failed for ${pkg.name}@${version}. Fix it and run this again: what is published is skipped.`)
    process.exit(1)
  }
  published.push(pkg.name)
}

console.log(`\n${dryRun ? "Would publish" : "Published"} ${published.length} plugin(s) at ${version}; ${skipped.length} already published.`)
