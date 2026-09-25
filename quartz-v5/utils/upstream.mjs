#!/usr/bin/env node
/**
 * Vendored-Quartz upstream tooling.
 *
 *   node quartz-v5/utils/upstream.mjs diff          full unified diff of the vendored copy vs its pinned ref
 *   node quartz-v5/utils/upstream.mjs diff --latest files that differ from the tip of the tracked branch
 *   node quartz-v5/utils/upstream.mjs log           commits that changed the vendored copy since the last sync
 *   node quartz-v5/utils/upstream.mjs sync <ref>    re-vendor at <ref> (commit, tag, or branch)
 *
 * The vendored tree matches its pinned upstream commit except for vendored changes, each of which
 * carries a ticket — see ADR-0001 and quartz-v5/VENDORED.md. Nothing about those changes is stored
 * by hand: `diff` generates the whole of them from the tree, and `log` names the commits that made
 * them, flagging any that cite no ticket.
 */
import { execFileSync } from "child_process"
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, renameSync } from "fs"
import { tmpdir } from "os"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const VENDOR_DIR = join(REPO_ROOT, "quartz-v5", "quartz")
const MANIFEST = join(REPO_ROOT, "quartz-v5", "upstream.json")
const VENDOR_REL = "quartz-v5/quartz"

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

/** `diff` output against `dir`: `-rq` for a file list, `-ruN` for a unified diff. */
function diffAgainst(dir, mode = "-rq") {
  const args = [mode, ...EXCLUDES.flatMap((e) => ["--exclude", e]), dir, VENDOR_DIR]
  try {
    execFileSync("diff", args, { encoding: "utf-8", stdio: "pipe", maxBuffer: 256 * 1024 * 1024 })
    return ""
  } catch (err) {
    // diff exits 1 when differences exist — that is data, not a failure.
    if (err.status === 1) return String(err.stdout)
    throw err
  }
}

const differingFiles = (dir) => diffAgainst(dir).trim().split("\n").filter(Boolean)

function cmdDiff({ latest }) {
  const m = readManifest()
  const ref = latest ? resolveLatest(m.repo, m.branch) : m.commit
  if (latest) process.stderr.write(`  ${m.branch} tip is ${ref.slice(0, 12)}\n`)

  const dir = cloneUpstream(m.repo, ref)
  try {
    if (latest) {
      // Informational: what an upgrade would pull in, and would collide with our changes.
      const lines = differingFiles(dir)
      console.log(
        lines.length === 0
          ? `\n  Vendored copy already matches the tip of ${m.branch}.\n`
          : `\n  ${lines.length} difference(s) vs tip of ${m.branch} (pinned at ${m.commit.slice(0, 12)}):\n`,
      )
      lines.forEach((l) => console.log(`    ${l}`))
      if (lines.length) console.log(`\n  To take them:  pnpm nx run site-v5:sync --args="--ref=${ref}"\n`)
      return 0
    }
    // The whole of our vendored changes, generated from the tree. stdout is a patch that applies
    // with `git apply` from the repo root; the summary goes to stderr so redirection keeps it clean.
    const patch = diffAgainst(dir, "-ruN")
      .split("\n")
      .map((line) =>
        line.startsWith("diff -ruN")
          ? ((rel) => `diff --git a/${VENDOR_REL}/${rel} b/${VENDOR_REL}/${rel}`)(line.slice(line.lastIndexOf(VENDOR_DIR) + VENDOR_DIR.length + 1))
          : line.startsWith("--- ")
            ? line.replace(dir, `a/${VENDOR_REL}`).replace(/\t.*$/, "")
            : line.startsWith("+++ ")
              ? line.replace(VENDOR_DIR, `b/${VENDOR_REL}`).replace(/\t.*$/, "")
              : line,
      )
      .join("\n")
    const files = differingFiles(dir)
    if (patch) process.stdout.write(patch)
    process.stderr.write(
      files.length === 0
        ? `\n  CLEAN — vendored copy is byte-identical to ${ref.slice(0, 12)}.\n\n`
        : `\n  ${files.length} file(s) differ from pinned ${ref.slice(0, 12)}. Every one must trace to a ticketed` +
            `\n  commit — see \`pnpm nx run site-v5:vendored-log\`.\n\n`,
    )
    return 0
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// Every commit that changed the vendored copy since it was last synced, oldest first. A sync is
// the most recent commit to touch upstream.json; everything after it is ours and must cite a ticket
// (`#<n>` anywhere in the message). Uncommitted edits are listed too, since they have no commit yet.
function cmdLog() {
  const git = (...args) => sh("git", ["-C", REPO_ROOT, ...args]).trim()
  const lastSync = git("log", "-1", "--format=%H", "--", "quartz-v5/upstream.json")
  const range = lastSync ? `${lastSync}..HEAD` : "HEAD"
  const shas = git("log", "--reverse", "--format=%H", range, "--", VENDOR_REL).split("\n").filter(Boolean)

  if (lastSync) console.log(`\n  Last sync: ${git("log", "-1", "--format=%h %ad %s", "--date=short", lastSync)}`)
  console.log(`\n  ${shas.length} commit(s) have changed ${VENDOR_REL}/ since:\n`)
  let untracked = 0
  for (const sha of shas) {
    const [line, body] = [git("log", "-1", "--format=%h %ad %s", "--date=short", sha), git("log", "-1", "--format=%B", sha)]
    const tickets = [...new Set(body.match(/#\d+/g) ?? [])]
    const files = git("show", "--format=", "--name-only", sha, "--", VENDOR_REL).split("\n").filter(Boolean)
    if (!tickets.length) untracked++
    console.log(`    ${line}`)
    console.log(`      ${tickets.length ? `tickets: ${tickets.join(", ")}` : "NO TICKET — cite one, or revert"}`)
    files.forEach((f) => console.log(`      ${f.slice(VENDOR_REL.length + 1)}`))
  }
  // Not `git()`: trimming would eat the status column of the first line.
  const dirty = sh("git", ["-C", REPO_ROOT, "status", "--porcelain", "--", VENDOR_REL]).split("\n").filter(Boolean)
  if (dirty.length) {
    console.log(`\n  Uncommitted changes (no commit, so no ticket yet):\n`)
    dirty.forEach((l) => console.log(`    ${l}`))
  }
  if (untracked) console.log(`\n  ${untracked} commit(s) cite no ticket.`)
  console.log()
  return 0
}

function cmdSync(ref, { force }) {
  const m = readManifest()
  if (!ref) throw new Error('sync needs a ref: --args="--ref=<commit|tag|branch>"')

  const drift = (() => {
    const d = cloneUpstream(m.repo, m.commit)
    try {
      return differingFiles(d)
    } finally {
      rmSync(d, { recursive: true, force: true })
    }
  })()
  if (drift.length && !force) {
    console.error(`\n  REFUSING TO SYNC — the vendored copy differs from its pinned ref in ${drift.length} file(s).`)
    console.error(`  Syncing replaces the tree, so these vendored changes would be discarded:\n`)
    drift.forEach((l) => console.error(`    ${l}`))
    console.error(
      `\n  Save them first:  node quartz-v5/utils/upstream.mjs diff > vendored.patch` +
        `\n  then sync with --force, and re-apply what upstream has not taken:  git apply vendored.patch\n`,
    )
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
    console.log(`  Next: update the Provenance table in quartz-v5/VENDORED.md, re-apply any vendored changes, then`)
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
      : cmd === "log"
        ? cmdLog()
        : cmd === "sync"
          ? cmdSync(refArg ?? rest.find((a) => !a.startsWith("-")), { force: rest.includes("--force") })
          : (console.error("usage: upstream.mjs diff [--latest] | log | sync --ref=<ref> [--force]"), 2)
  process.exit(code)
} catch (err) {
  console.error(`\n  ${err.message}\n`)
  process.exit(1)
}
