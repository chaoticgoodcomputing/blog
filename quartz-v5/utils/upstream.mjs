#!/usr/bin/env node
/**
 * Vendored-Quartz upstream tooling.
 *
 *   node quartz-v5/utils/upstream.mjs diff          diff the vendored copy against its pinned ref
 *   node quartz-v5/utils/upstream.mjs diff --latest diff against the tip of the tracked branch
 *   node quartz-v5/utils/upstream.mjs sync <ref>    re-vendor at <ref> (commit, tag, or branch)
 *
 * The vendored tree must stay byte-identical to its pinned upstream commit — see ADR-0001 and
 * quartz-v5/VENDORED.md. `diff` is what makes that checkable: a clean run means we carry no
 * undocumented changes. Any drift it reports is either a change that needs a ticket and a
 * `quartz:vendored` label, or a change that needs reverting.
 */
import { execFileSync } from "child_process"
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, renameSync } from "fs"
import { tmpdir } from "os"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const VENDOR_DIR = join(REPO_ROOT, "quartz-v5", "quartz")
const MANIFEST = join(REPO_ROOT, "quartz-v5", "upstream.json")

// Build artefacts, installed deps and generated files are not part of the vendored source.
// `quartz.config.yaml` is ours but has to sit here: quartz/cli/constants.js reads ./package.json
// at module load and quartz/plugins/loader/config-loader.ts reads process.cwd()/quartz.config.yaml,
// so cwd is pinned to the vendored root and there is no --config flag. It is a gitignored symlink
// to ../quartz.config.yaml, recreated by prebuild. See quartz-v5/VENDORED.md.
const EXCLUDES = [
  ".git",
  "node_modules",
  ".quartz",
  ".quartz-cache",
  "public",
  "tsconfig.tsbuildinfo",
  "quartz.config.yaml",
]

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf-8", stdio: "pipe", ...opts })

const readManifest = () => JSON.parse(readFileSync(MANIFEST, "utf-8"))

/** Clone `ref` into a temp dir and return its path. Caller removes it. */
function cloneUpstream(repo, ref) {
  const dir = mkdtempSync(join(tmpdir(), "quartz-upstream-"))
  process.stderr.write(`  fetching ${ref.slice(0, 12)} from upstream…\n`)
  sh("git", ["clone", "--quiet", "--no-checkout", repo, dir])
  sh("git", ["-C", dir, "checkout", "--quiet", ref])
  return dir
}

function resolveLatest(repo, branch) {
  const out = sh("git", ["ls-remote", repo, `refs/heads/${branch}`])
  const sha = out.split(/\s+/)[0]
  if (!sha) throw new Error(`could not resolve ${branch} on ${repo}`)
  return sha
}

function diffAgainst(dir) {
  const args = ["-rq", ...EXCLUDES.flatMap((e) => ["--exclude", e]), VENDOR_DIR, dir]
  try {
    execFileSync("diff", args, { encoding: "utf-8", stdio: "pipe" })
    return []
  } catch (err) {
    // diff exits 1 when differences exist — that is data, not a failure.
    if (err.status === 1) return String(err.stdout).trim().split("\n").filter(Boolean)
    throw err
  }
}

function cmdDiff({ latest }) {
  const m = readManifest()
  const ref = latest ? resolveLatest(m.repo, m.branch) : m.commit
  if (latest) process.stderr.write(`  ${m.branch} tip is ${ref.slice(0, 12)}\n`)

  const dir = cloneUpstream(m.repo, ref)
  try {
    const lines = diffAgainst(dir)
    if (!latest) {
      if (lines.length === 0) {
        console.log(`\n  CLEAN — vendored copy is byte-identical to ${ref.slice(0, 12)}.\n`)
        return 0
      }
      console.log(`\n  DRIFT — ${lines.length} difference(s) from pinned ${ref.slice(0, 12)}:\n`)
      lines.forEach((l) => console.log(`    ${l}`))
      console.log(
        `\n  Every line above must be either a tracked 'quartz:vendored' change or reverted.` +
          `\n  See ADR-0001 and quartz-v5/VENDORED.md.\n`,
      )
      return 1
    }
    // --latest is informational: it shows what an upgrade would pull in.
    console.log(
      lines.length === 0
        ? `\n  Vendored copy already matches the tip of ${m.branch}.\n`
        : `\n  ${lines.length} difference(s) vs tip of ${m.branch} (pinned at ${m.commit.slice(0, 12)}):\n`,
    )
    lines.forEach((l) => console.log(`    ${l}`))
    if (lines.length)
      console.log(`\n  To take them:  pnpm nx run site-v5:sync --args="--ref=${ref}"\n`)
    return 0
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function cmdSync(ref) {
  const m = readManifest()
  if (!ref) throw new Error('sync needs a ref: --args="--ref=<commit|tag|branch>"')

  const drift = (() => {
    const d = cloneUpstream(m.repo, m.commit)
    try {
      return diffAgainst(d)
    } finally {
      rmSync(d, { recursive: true, force: true })
    }
  })()
  if (drift.length) {
    console.error(
      `\n  REFUSING TO SYNC — the vendored copy has ${drift.length} uncommitted difference(s)`,
    )
    console.error(`  from its pinned ref. Syncing would silently discard them:\n`)
    drift.forEach((l) => console.error(`    ${l}`))
    console.error(`\n  Resolve these first (see quartz-v5/VENDORED.md), then sync.\n`)
    return 1
  }

  const resolved = /^[0-9a-f]{40}$/.test(ref) ? ref : resolveLatest(m.repo, ref)
  const dir = cloneUpstream(m.repo, resolved)
  try {
    // Keep installed deps across the swap; they are re-validated by `install`.
    const deps = join(VENDOR_DIR, "node_modules")
    const parked = deps + ".parked"
    const hadDeps = existsSync(deps)
    if (hadDeps) renameSync(deps, parked)

    rmSync(join(dir, ".git"), { recursive: true, force: true })
    rmSync(VENDOR_DIR, { recursive: true, force: true })
    renameSync(dir, VENDOR_DIR)
    if (hadDeps) renameSync(parked, deps)

    const version = JSON.parse(readFileSync(join(VENDOR_DIR, "package.json"), "utf-8")).version
    writeFileSync(
      MANIFEST,
      JSON.stringify(
        { ...m, commit: resolved, version, vendoredOn: new Date().toISOString().slice(0, 10) },
        null,
        2,
      ) + "\n",
    )
    console.log(`\n  Synced to ${resolved.slice(0, 12)} (v${version}).`)
    console.log(`  Next: update the table in quartz-v5/VENDORED.md, then`)
    console.log(`        pnpm nx run site-v5:install\n`)
    return 0
  } catch (err) {
    rmSync(dir, { recursive: true, force: true })
    throw err
  }
}

const [cmd, ...rest] = process.argv.slice(2)
const refArg = rest.find((a) => a.startsWith("--ref="))?.slice("--ref=".length)
try {
  const code =
    cmd === "diff"
      ? cmdDiff({ latest: rest.includes("--latest") })
      : cmd === "sync"
        ? cmdSync(refArg ?? rest.find((a) => !a.startsWith("-")))
        : (console.error("usage: upstream.mjs diff [--latest] | sync --ref=<ref>"), 2)
  process.exit(code)
} catch (err) {
  console.error(`\n  ${err.message}\n`)
  process.exit(1)
}
