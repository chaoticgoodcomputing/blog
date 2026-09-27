#!/usr/bin/env node
/**
 * Quartz Core's upstream tooling.
 *
 *   node quartz-v5/utils/upstream.mjs diff          full unified diff of Core's drift from its pinned ref
 *   node quartz-v5/utils/upstream.mjs diff --latest files that differ from the tip of the tracked branch
 *   node quartz-v5/utils/upstream.mjs log           commits that changed Core since the last sync
 *   node quartz-v5/utils/upstream.mjs sync <ref>    re-vendor at <ref> (commit, tag, or branch)
 *
 * Core matches its pinned upstream commit except for vendored changes, each of which carries a
 * ticket (ADR-0001, quartz-v5/VENDORED.md). Only drift counts: steering files, pruned files and
 * Core's pnpm files are left out of every diff and log (`core-tiers.mjs`). Nothing about the vendored
 * changes is stored by hand: `diff` generates the whole of them from the tree, and `log` names the
 * commits that made them, flagging any that cite no ticket.
 */
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { CORE_DIR, CORE_REL, MANIFEST_REL, PNPM_FILES, PRUNED, REPO_ROOT, STEERING, countsAsDrift, tierOf } from "./core-tiers.mjs"
import { cloneUpstream, readManifest, resolveLatest, sh } from "./upstream-git.mjs"

// The files a tree holds: what git tracks there, and any new file git doesn't ignore. Installed
// dependencies, build output and caches are gitignored, so they are never compared.
const trackedFiles = (dir, pathspec = ".") =>
  sh("git", ["-C", dir, "ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", pathspec])
    .split("\0")
    .filter(Boolean)

const coreFiles = () =>
  trackedFiles(REPO_ROOT, CORE_REL)
    .map((file) => file.slice(CORE_REL.length + 1))
    .filter((rel) => existsSync(join(CORE_DIR, rel)))

/**
 * Core's drift from the upstream tree checked out at `dir`: every file, relative to Core's root,
 * that differs, is only upstream's, or is only Core's, leaving out the tiers that are not drift.
 */
function drift(dir) {
  const upstream = new Set(trackedFiles(dir))
  const core = new Set(coreFiles())
  const same = (rel) => readFileSync(join(dir, rel)).equals(readFileSync(join(CORE_DIR, rel)))
  return [...new Set([...upstream, ...core])]
    .filter(countsAsDrift)
    .sort()
    .flatMap((rel) =>
      !core.has(rel) ? [{ rel, kind: "only upstream" }] : !upstream.has(rel) ? [{ rel, kind: "only Core" }] : same(rel) ? [] : [{ rel, kind: "changed" }],
    )
}

// One file's difference as a patch `git apply` takes from the repo root.
function patchFor(dir, { rel, kind }) {
  const at = `${CORE_REL}/${rel}`
  const [from, to] = [kind === "only Core" ? "/dev/null" : join(dir, rel), kind === "only upstream" ? "/dev/null" : join(CORE_DIR, rel)]
  let body
  try {
    body = execFileSync("diff", ["-u", from, to], { encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 })
  } catch (err) {
    if (err.status !== 1) throw err // diff exits 1 when the files differ: that is data, not a failure.
    body = String(err.stdout)
  }
  const lines = body.split("\n")
  lines[0] = `--- ${kind === "only Core" ? "/dev/null" : `a/${at}`}`
  lines[1] = `+++ ${kind === "only upstream" ? "/dev/null" : `b/${at}`}`
  const mode = kind === "only Core" ? ["new file mode 100644"] : kind === "only upstream" ? ["deleted file mode 100644"] : []
  return [`diff --git a/${at} b/${at}`, ...mode, ...lines].join("\n")
}

function cmdDiff({ latest }) {
  const m = readManifest()
  const ref = latest ? resolveLatest(m.repo, m.branch) : m.commit
  if (latest) process.stderr.write(`  ${m.branch} tip is ${ref.slice(0, 12)}\n`)

  const dir = cloneUpstream(m.repo, ref)
  try {
    const files = drift(dir)
    if (latest) {
      // Informational: what an upgrade would pull in, and would collide with our changes.
      console.log(
        files.length === 0
          ? `\n  Quartz Core already matches the tip of ${m.branch}.\n`
          : `\n  ${files.length} difference(s) vs tip of ${m.branch} (pinned at ${m.commit.slice(0, 12)}):\n`,
      )
      files.forEach(({ rel, kind }) => console.log(`    ${kind.padEnd(13)} ${rel}`))
      if (files.length) console.log(`\n  To take them:  pnpm nx run site-v5:sync --args="--ref=${ref}"\n`)
      return 0
    }
    // The whole of our vendored changes, generated from the tree. stdout is a patch that applies
    // with `git apply` from the repo root; the summary goes to stderr so redirection keeps it clean.
    if (files.length) process.stdout.write(files.map((file) => patchFor(dir, file)).join(""))
    process.stderr.write(
      files.length === 0
        ? `\n  CLEAN — Quartz Core is byte-identical to ${ref.slice(0, 12)}, outside its steering, pruned and pnpm files.\n\n`
        : `\n  ${files.length} file(s) differ from pinned ${ref.slice(0, 12)}. Every one must trace to a ticketed` +
            `\n  commit — see \`pnpm nx run site-v5:vendored-log\`.\n\n`,
    )
    return 0
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// Every commit that changed Core since it was last synced, oldest first, and the drift each made. A
// sync is the most recent commit to touch upstream.json; every commit after it that changed Core is
// ours and must cite a ticket (`#<n>` anywhere in the message). A commit that only moved Core's files,
// or only changed files that are not drift, is left out. Core has moved before (into
// `quartz-v5/core/`, #91) and will again at cutover (#81), so the walk follows its renames back
// through history rather than naming its old paths. Uncommitted drift is listed too.
function cmdLog() {
  const git = (...args) => sh("git", ["-C", REPO_ROOT, ...args]).trim()
  const lastSync = git("log", "-1", "--format=%H", "--", MANIFEST_REL)
  const range = lastSync ? `${lastSync}..HEAD` : "HEAD"
  const shas = git("log", "--format=%H", range).split("\n").filter(Boolean) // newest first

  // Where Core lived as of each commit, newest first: a rename of Core source into one of its
  // roots names the root it came from.
  const roots = [CORE_REL]
  const inCore = (file) => roots.map((root) => (file.startsWith(`${root}/`) ? file.slice(root.length + 1) : null)).find((rel) => rel !== null)
  // The drift among one change's `--name-status` lines, as paths relative to Core's root.
  const driftIn = (nameStatus) => {
    const changes = nameStatus.split("\n").filter(Boolean).map((line) => line.split("\t"))
    for (const [status, from, to] of changes) {
      const rel = to && inCore(to)
      if (status.startsWith("R") && rel !== undefined && inCore(from) === undefined && tierOf(rel) === "source" && from.endsWith(`/${rel}`)) {
        const root = from.slice(0, from.length - rel.length - 1)
        if (!roots.includes(root)) roots.push(root)
      }
    }
    const files = []
    for (const [status, from, to] of changes) {
      const rel = inCore(to ?? from)
      if (rel === undefined) continue
      if (status === "R100" && inCore(from) === rel) continue // Core moved, this file unchanged
      if (countsAsDrift(rel)) files.push(rel)
    }
    return files
  }
  const nameStatus = (...args) => sh("git", ["-C", REPO_ROOT, ...args, "--name-status", "-M", "-l0"])

  // Uncommitted first: it is newer than any commit, and may itself be a move of Core.
  const untrackedFiles = sh("git", ["-C", REPO_ROOT, "ls-files", "--others", "--exclude-standard", "--", CORE_REL])
    .split("\n")
    .filter(Boolean)
    .map((file) => `A\t${file}`)
    .join("\n")
  const dirty = driftIn(`${nameStatus("diff", "HEAD")}\n${untrackedFiles}`)
  const commits = []
  for (const sha of shas) {
    const files = driftIn(nameStatus("show", "--format=", sha))
    if (files.length) commits.unshift({ sha, files })
  }

  if (lastSync) console.log(`\n  Last sync: ${git("log", "-1", "--format=%h %ad %s", "--date=short", lastSync)}`)
  console.log(`\n  ${commits.length} commit(s) have changed Quartz Core (${CORE_REL}/) since:\n`)
  let untracked = 0
  for (const { sha, files } of commits) {
    const [line, body] = [git("log", "-1", "--format=%h %ad %s", "--date=short", sha), git("log", "-1", "--format=%B", sha)]
    const tickets = [...new Set(body.match(/#\d+/g) ?? [])]
    if (!tickets.length) untracked++
    console.log(`    ${line}`)
    console.log(`      ${tickets.length ? `tickets: ${tickets.join(", ")}` : "NO TICKET — cite one, or revert"}`)
    files.forEach((f) => console.log(`      ${f}`))
  }
  if (dirty.length) {
    console.log(`\n  Uncommitted changes (no commit, so no ticket yet):\n`)
    dirty.forEach((l) => console.log(`    ${l}`))
  }
  if (untracked) console.log(`\n  ${untracked} commit(s) cite no ticket.`)
  console.log()
  return 0
}

// Re-vendor at `ref`, replacing the tree. Kept as it was until the upgrade (#99) replaces it, except
// that it keeps what the tiers say an upgrade keeps: the steering files and Core's pnpm files are
// carried across the swap, and the pruned files are deleted after it.
function cmdSync(ref, { force }) {
  const m = readManifest()
  if (!ref) throw new Error('sync needs a ref: --args="--ref=<commit|tag|branch>"')

  const current = (() => {
    const d = cloneUpstream(m.repo, m.commit)
    try {
      return drift(d)
    } finally {
      rmSync(d, { recursive: true, force: true })
    }
  })()
  if (current.length && !force) {
    console.error(`\n  REFUSING TO SYNC — Quartz Core differs from its pinned ref in ${current.length} file(s).`)
    console.error(`  Syncing replaces the tree, so these vendored changes would be discarded:\n`)
    current.forEach(({ rel, kind }) => console.error(`    ${kind.padEnd(13)} ${rel}`))
    console.error(
      `\n  Save them first:  node quartz-v5/utils/upstream.mjs diff > vendored.patch` +
        `\n  then sync with --force, and re-apply what upstream has not taken:  git apply vendored.patch\n`,
    )
    return 1
  }

  const resolved = /^[0-9a-f]{40}$/.test(ref) ? ref : resolveLatest(m.repo, ref)
  const dir = cloneUpstream(m.repo, resolved)
  try {
    // Keep installed deps, the steering files and Core's pnpm files across the swap.
    const kept = ["node_modules", ...STEERING, ...PNPM_FILES].filter((rel) => existsSync(join(CORE_DIR, rel)))
    for (const rel of kept) renameSync(join(CORE_DIR, rel), join(dir, `${rel}.kept`))

    rmSync(join(dir, ".git"), { recursive: true, force: true })
    for (const rel of PRUNED) rmSync(join(dir, rel), { recursive: true, force: true })
    for (const rel of kept) {
      rmSync(join(dir, rel), { recursive: true, force: true })
      renameSync(join(dir, `${rel}.kept`), join(dir, rel))
    }
    rmSync(CORE_DIR, { recursive: true, force: true })
    renameSync(dir, CORE_DIR)

    const version = JSON.parse(readFileSync(join(CORE_DIR, "package.json"), "utf-8")).version
    writeFileSync(
      join(REPO_ROOT, MANIFEST_REL),
      JSON.stringify({ ...m, commit: resolved, version, vendoredOn: new Date().toISOString().slice(0, 10) }, null, 2) + "\n",
    )
    console.log(`\n  Synced to ${resolved.slice(0, 12)} (v${version}).`)
    console.log(`  Next: update the Provenance table in quartz-v5/VENDORED.md, re-apply any vendored changes,`)
    console.log(`        re-import Core's lock from the new package-lock.json, then pnpm nx run site-v5:install\n`)
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
