#!/usr/bin/env node
/**
 * The upgrade (#89, #99): move Quartz Core to another upstream commit, keeping what's ours.
 *
 *   pnpm nx run site:upgrade --ref=<commit|branch|tag> [--verify]
 *   pnpm nx run site:upgrade-report --ref=<ref>
 *   node quartz/utils/upgrade.mjs --ref=<ref> [--upstream=<url>] [--report-only | --verify]
 *
 * In order, stopping at the first step that fails, before anything of Core's is written:
 *   1. refuse a dirty tree: uncommitted changes anywhere but the private vault (content/private);
 *   2. fetch the pinned ref and the target into the upstream cache (`upstream-cache.mjs`);
 *   -  print the API-surface report (`api-report.mjs`, #100): what changed between the two refs in
 *      every upstream API the site depends on. `--report-only` stops here, having written nothing;
 *   3. re-apply our vendored changes, hunk by hunk, to the target's Core source: stop on a conflict
 *      and name its hunks, and report the hunks upstream has absorbed;
 *   4. take the scaffolding: `package.json` verbatim, the rest three-way merged;
 *   5. leave the steering files alone, and show upstream's template changes to them;
 *   6. keep the pruning: no pruned file comes back;
 *   7. convert the lock: `pnpm import` of the target's npm lock under Core's pnpm settings, checked
 *      by the lock check (`core-lock.mjs`), then written to Core and installed frozen;
 *   8. record the new pinned ref in `upstream.json`, only once all of the above has succeeded;
 *   -  with `--verify`, prove the result: the repo guards, the typechecks, the e2e suite, the
 *      real-site build, stopping at the first that fails (`VERIFY_STEPS`).
 *
 * Upgrading to the pinned ref changes nothing. `npx quartz upgrade` is a different thing, and does
 * not work here (VENDORED.md).
 *
 * `--upstream` (or QUARTZ_UPSTREAM) fetches from another repo than the one upstream.json names, and
 * `--root` treats another directory as the repo root: the tests point both at a fixture.
 */
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { apiReport, formatReport, unifiedDiff } from "./api-report.mjs"
import { compareLocks, formatComparison } from "./core-lock.mjs"
import { CORE_PNPM, CORE_REL, MANIFEST_REL, REPO_ROOT, tierOf } from "./core-tiers.mjs"
import { CACHE_REL, commitFiles, fetchRef, openCache, readBlob } from "./upstream-cache.mjs"
import { sh } from "./upstream-git.mjs"

/** Core's pnpm, run by exact version whatever pnpm the repo root pins (VENDORED.md). */
const PNPM = ["--yes", CORE_PNPM]

/** A step's refusal: the upgrade stops, and says why. */
export class Stop extends Error {
  constructor(lines) {
    super(lines[0])
    this.lines = lines
  }
}

const say = (...lines) => lines.forEach((line) => console.log(line ? `  ${line}` : ""))
// Run `fn(dir)` in a fresh temp dir holding `files` (name → content), and remove the dir after.
function withScratch(prefix, files, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  try {
    for (const [name, content] of Object.entries(files))
      fs.writeFileSync(path.join(dir, name), content)
    return fn(dir)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}
const same = (a, b) => (a === null ? b === null : b !== null && a.equals(b))
const isBinary = (buf) => buf !== null && buf.subarray(0, 8000).includes(0)

// --- The context every step reads and extends --------------------------------------------------

/**
 * `{ root, ref, upstream, coreDir, manifestFile, manifest }`, then, as the steps run: `cache`,
 * `pinned` and `target` (commit ids), `base`, `next` and `ours` (the pinned tree, the target tree and
 * Core, as Maps of path → `{ content: Buffer, mode }`), `plan` (Core as the upgrade will leave it, the
 * same shape) and `absorbed` (the vendored hunks upstream has taken).
 */
export function context({ root = REPO_ROOT, ref, upstream } = {}) {
  if (!ref) throw new Stop(["The upgrade needs a ref: --ref=<commit|branch|tag>."])
  const manifestFile = path.join(root, MANIFEST_REL)
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf-8"))
  return {
    root,
    ref,
    upstream: upstream || manifest.repo,
    coreDir: path.join(root, CORE_REL),
    manifestFile,
    manifest,
  }
}

// Core's files as git sees them: tracked, plus new files git doesn't ignore.
const coreFiles = (ctx) =>
  sh("git", [
    "-C",
    ctx.root,
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
    "--",
    CORE_REL,
  ])
    .split("\0")
    .filter(Boolean)
    .map((file) => file.slice(CORE_REL.length + 1))
    .filter((rel) => {
      try {
        return Boolean(fs.lstatSync(path.join(ctx.coreDir, rel)))
      } catch {
        return false
      }
    })

/**
 * A symbolic link's mode, as git records it (120000). A link is carried as its target's path, and
 * recreated as a link, never written as a regular file holding that path.
 */
const SYMLINK = 0o120000

function readCore(ctx) {
  const files = new Map()
  for (const rel of coreFiles(ctx)) {
    const at = path.join(ctx.coreDir, rel)
    const stat = fs.lstatSync(at)
    files.set(
      rel,
      stat.isSymbolicLink()
        ? { content: Buffer.from(fs.readlinkSync(at)), mode: SYMLINK }
        : { content: fs.readFileSync(at), mode: stat.mode & 0o111 ? 0o755 : 0o644 },
    )
  }
  return files
}

const GIT_MODES = { 100644: 0o644, 100755: 0o755, 120000: SYMLINK }

function readTree(cache, sha) {
  const files = new Map()
  for (const [rel, { mode, blob }] of commitFiles(cache, sha)) {
    if (!(mode in GIT_MODES))
      throw new Stop([
        `Stopped: upstream's ${rel} has git mode ${mode}, which the upgrade cannot carry.`,
      ])
    files.set(rel, { content: readBlob(cache, blob), mode: GIT_MODES[mode] })
  }
  return files
}

const contentOf = (files, rel) => files.get(rel)?.content ?? null
const allPaths = (ctx) =>
  [...new Set([...ctx.base.keys(), ...ctx.next.keys(), ...ctx.ours.keys()])].sort()

// --- 1. Refuse a dirty tree ----------------------------------------------------------------------

/**
 * The one path the dirty-tree check leaves out: the private vault, a submodule of its own that the
 * owner's checkout routinely has uncommitted notes in. The upgrade never writes there.
 */
export const DIRTY_EXEMPT = "content/private"

function refuseDirty(ctx) {
  const dirty = sh("git", [
    "-C",
    ctx.root,
    "status",
    "--porcelain",
    "--untracked-files=all",
    "--",
    ".",
    `:(exclude)${DIRTY_EXEMPT}`,
  ])
    .split("\n")
    .filter(Boolean)
  if (dirty.length)
    throw new Stop([
      `Refusing to upgrade: the working tree has uncommitted changes (only ${DIRTY_EXEMPT} may).`,
      "Commit or stash them first, so the upgrade, and --verify's checks, never mix with work in progress:",
      "",
      ...dirty.map((line) => `  ${line}`),
    ])
}

// --- 2. Fetch -----------------------------------------------------------------------------------

function fetchRefs(ctx) {
  ctx.cache = openCache(path.join(ctx.root, CACHE_REL))
  try {
    ctx.pinned = fetchRef(ctx.cache, ctx.upstream, ctx.manifest.commit)
    ctx.target = fetchRef(ctx.cache, ctx.upstream, ctx.ref)
  } catch (err) {
    throw new Stop([`Stopped: ${err.message}`])
  }
  ctx.base = readTree(ctx.cache, ctx.pinned)
  ctx.next = readTree(ctx.cache, ctx.target)
  ctx.ours = readCore(ctx)
  ctx.plan = new Map()
  say(
    `Pinned ${ctx.pinned.slice(0, 12)}, target ${ctx.target.slice(0, 12)} (${ctx.ref}), from ${ctx.upstream}.`,
  )
  if (ctx.pinned === ctx.target)
    say("The target is the pinned ref: the upgrade should change nothing.")
}

// --- The API-surface report (#100) ---------------------------------------------------------------

// What changed between the pinned ref and the target in every upstream API the site depends on
// (`api-report.mjs`). Informational: it never stops the upgrade, and it runs before anything is
// written, so the owner reads it before trusting the result.
function report(ctx) {
  say(
    `API-surface report: pinned ${ctx.pinned.slice(0, 12)} → target ${ctx.target.slice(0, 12)} (${ctx.ref})`,
    "",
  )
  say(
    ...formatReport(
      apiReport({ base: ctx.base, next: ctx.next, ours: ctx.ours, siteRoot: ctx.root }),
    ),
  )
  ctx.reported = true
}

// --- 3. Vendored changes ------------------------------------------------------------------------

// The hunks of `diff -u base ours`, each as a patch of its own on a file named `f`.
function hunks(base, ours) {
  return withScratch("quartz-upgrade-diff-", { base, ours }, (dir) => {
    const res = spawnSync("diff", ["-u", "base", "ours"], {
      cwd: dir,
      encoding: "utf-8",
      maxBuffer: 256 * 1024 * 1024,
    })
    if (res.status === 0) return []
    if (res.status !== 1) throw new Error(`diff failed: ${res.stderr}`)
    const body = res.stdout.split("\n").slice(2)
    if (body.at(-1) === "") body.pop()
    const out = []
    for (const line of body) {
      if (line.startsWith("@@")) out.push([line])
      else out.at(-1).push(line)
    }
    return out.map((lines) => ({
      header: lines[0],
      patch: ["--- a/f", "+++ b/f", ...lines, ""].join("\n"),
    }))
  })
}

/**
 * Re-apply one file's vendored change (`base` → `ours`) to upstream's new version of it, `next`.
 * Any of the three may be null (no such file). Returns `{ result, applied, absorbed, conflicts }`:
 * the file as the upgrade leaves it (null for none), and the hunks re-applied, found already in
 * `next`, or neither.
 */
function reapply(base, ours, next) {
  const whole = (header) => [{ header }]
  if (same(base, ours)) return { result: next, applied: [], absorbed: [], conflicts: [] }
  if (same(ours, next))
    return { result: next, applied: [], absorbed: whole("the whole file"), conflicts: [] }
  if (same(base, next)) {
    const applied =
      base !== null && ours !== null && !isBinary(base) && !isBinary(ours)
        ? hunks(base, ours)
        : whole("the whole file")
    return { result: ours, applied, absorbed: [], conflicts: [] }
  }
  if (base === null)
    return {
      result: next,
      applied: [],
      absorbed: [],
      conflicts: whole("added here, and upstream added a different file of the same name"),
    }
  if (ours === null)
    return {
      result: next,
      applied: [],
      absorbed: [],
      conflicts: whole("deleted here, and changed upstream"),
    }
  if (next === null)
    return {
      result: null,
      applied: [],
      absorbed: [],
      conflicts: whole("changed here, and deleted upstream"),
    }
  if (isBinary(base) || isBinary(ours) || isBinary(next))
    return {
      result: next,
      applied: [],
      absorbed: [],
      conflicts: whole("a binary file changed here and upstream"),
    }

  return withScratch("quartz-upgrade-apply-", { f: next }, (dir) => {
    const apply = (patch, ...flags) =>
      spawnSync("git", ["apply", "--whitespace=nowarn", ...flags, "-"], {
        cwd: dir,
        input: patch,
        encoding: "utf-8",
      }).status === 0
    const out = { applied: [], absorbed: [], conflicts: [] }
    for (const hunk of hunks(base, ours)) {
      if (apply(hunk.patch, "--reverse", "--check")) out.absorbed.push(hunk)
      else if (apply(hunk.patch)) out.applied.push(hunk)
      else out.conflicts.push(hunk)
    }
    return { result: fs.readFileSync(path.join(dir, "f")), ...out }
  })
}

function reapplyVendored(ctx) {
  ctx.absorbed = []
  const conflicts = []
  let applied = 0
  for (const rel of allPaths(ctx).filter((rel) => tierOf(rel) === "source")) {
    const [base, ours, next] = [
      contentOf(ctx.base, rel),
      contentOf(ctx.ours, rel),
      contentOf(ctx.next, rel),
    ]
    const out = reapply(base, ours, next)
    applied += out.applied.length
    ctx.absorbed.push(...out.absorbed.map((hunk) => ({ rel, ...hunk })))
    conflicts.push(...out.conflicts.map((hunk) => ({ rel, ...hunk })))
    if (out.result !== null) {
      const mode = (
        same(out.result, ours) ? ctx.ours.get(rel) : (ctx.next.get(rel) ?? ctx.ours.get(rel))
      ).mode
      ctx.plan.set(rel, { content: out.result, mode })
    }
  }
  if (conflicts.length)
    throw new Stop([
      `Stopped: ${conflicts.length} hunk(s) of our vendored changes conflict with the target's Core source.`,
      "Nothing has been written. Resolve each by hand, as a vendored change with its ticket:",
      "",
      ...conflicts.flatMap(({ rel, header, patch }) => [
        `  ${rel}  ${header}`,
        ...(patch
          ? patch
              .split("\n")
              .slice(3, -1)
              .map((l) => `      ${l}`)
          : []),
      ]),
    ])
  say(
    `Vendored changes: ${applied} hunk(s) re-applied, ${ctx.absorbed.length} absorbed by upstream.`,
  )
  if (ctx.absorbed.length) {
    say("Upstream has absorbed these, so their ticket and upstream proposal can be retired:")
    ctx.absorbed.forEach(({ rel, header }) => say(`  ${rel}  ${header}`))
  }
}

// --- 4. Scaffolding, and files in no tier --------------------------------------------------------

// A three-way merge of one file: our version, upstream's old one and upstream's new one. Returns
// `{ result, conflict }`, with null for no file.
function merge3(ours, base, next) {
  if (same(ours, next) || same(base, next)) return { result: ours }
  if (same(ours, base) || ours === null) return { result: next }
  if (next === null) return { result: ours, conflict: "changed here, and deleted upstream" }
  const files = { ours, base: base ?? Buffer.alloc(0), next }
  return withScratch("quartz-upgrade-merge-", files, (dir) => {
    const res = spawnSync(
      "git",
      [
        "merge-file",
        "-p",
        "-L",
        "ours",
        "-L",
        "upstream (pinned)",
        "-L",
        "upstream (target)",
        "ours",
        "base",
        "next",
      ],
      {
        cwd: dir,
        encoding: "buffer",
      },
    )
    if (res.status < 0 || res.status === null || res.status > 127)
      throw new Error(`git merge-file failed: ${res.stderr}`)
    return {
      result: res.stdout,
      conflict: res.status > 0 ? `${res.status} conflicting region(s)` : undefined,
    }
  })
}

function takeScaffolding(ctx) {
  const conflicts = []
  const unclassified = []
  for (const rel of allPaths(ctx).filter((rel) => ["scaffolding", null].includes(tierOf(rel)))) {
    const [base, ours, next] = [
      contentOf(ctx.base, rel),
      contentOf(ctx.ours, rel),
      contentOf(ctx.next, rel),
    ]
    if (tierOf(rel) === null && next !== null && base === null) unclassified.push(rel)
    const { result, conflict } =
      rel === "package.json" ? { result: next } : merge3(ours, base, next)
    if (conflict) conflicts.push(`${rel}: ${conflict}`)
    if (result !== null)
      ctx.plan.set(rel, { content: result, mode: (ctx.next.get(rel) ?? ctx.ours.get(rel)).mode })
  }
  if (!ctx.plan.has("package.json")) throw new Stop(["Stopped: the target has no package.json."])
  if (conflicts.length)
    throw new Stop([
      "Stopped: the scaffolding does not merge cleanly. Nothing has been written.",
      "",
      ...conflicts.map((line) => `  ${line}`),
    ])
  say("Scaffolding: package.json taken verbatim, the rest merged.")
  if (unclassified.length) {
    say(
      "Upstream added files at Core's root that are in no tier. They were taken; add each to utils/core-tiers.mjs:",
    )
    unclassified.forEach((rel) => say(`  ${rel}`))
  }
}

// --- 5. Steering files --------------------------------------------------------------------------

function keepSteering(ctx) {
  const changed = []
  for (const rel of allPaths(ctx).filter((rel) => tierOf(rel) === "steering")) {
    if (ctx.ours.has(rel)) ctx.plan.set(rel, ctx.ours.get(rel))
    const [base, next] = [contentOf(ctx.base, rel), contentOf(ctx.next, rel)]
    if (same(base, next)) continue
    // The report has already shown the quartz.ts template's diff: name it, and don't diff it twice.
    const inReport = rel === "quartz.ts" && ctx.reported
    changed.push({ rel, diff: inReport ? null : unifiedDiff(rel, base, next) })
  }
  if (changed.length === 1 && changed[0].diff === null)
    return say(
      "Steering files: left alone. Upstream's quartz.ts template changed: its diff is in the API-surface report above.",
    )
  if (!changed.length)
    return say("Steering files: left alone. Upstream's templates of them have not changed.")
  say(
    "Steering files: left alone. Upstream's templates of them changed; merge what you want by hand:",
  )
  for (const { rel, diff } of changed) {
    say("", `  ${rel}`)
    if (diff === null) say("    (its diff is in the API-surface report above)")
    else diff.forEach((line) => say(`    ${line}`))
  }
}

// --- 6. Pruned files ----------------------------------------------------------------------------

function keepPruning(ctx) {
  const back = [...ctx.next.keys()].filter((rel) => tierOf(rel) === "pruned")
  for (const rel of back) ctx.plan.delete(rel)
  say(`Pruned files: ${back.length} of upstream's left out again.`)
}

// --- 7. The lock --------------------------------------------------------------------------------

const pnpm = (cwd, args) =>
  spawnSync("npx", [...PNPM, ...args], { cwd, encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 })

function convertLock(ctx) {
  const npmLock = contentOf(ctx.next, "package-lock.json")
  const workspace = contentOf(ctx.ours, "pnpm-workspace.yaml")
  if (npmLock === null) throw new Stop(["Stopped: the target has no package-lock.json to convert."])
  if (workspace === null)
    throw new Stop([
      `Stopped: Core has no pnpm-workspace.yaml, so there are no pnpm settings to convert under.`,
    ])

  const project = {
    "package.json": ctx.plan.get("package.json").content,
    "package-lock.json": npmLock,
    "pnpm-workspace.yaml": workspace,
  }
  withScratch("quartz-upgrade-lock-", project, (dir) => {
    const res = pnpm(dir, ["import"])
    if (res.status !== 0)
      throw new Stop([
        "Stopped: pnpm import failed.",
        "",
        ...`${res.stdout}${res.stderr}`.trim().split("\n"),
      ])
    const pnpmLock = fs.readFileSync(path.join(dir, "pnpm-lock.yaml"))
    const result = compareLocks({
      npmLock: npmLock.toString("utf-8"),
      pnpmLock: pnpmLock.toString("utf-8"),
    })
    if (!result.ok)
      throw new Stop([
        "Stopped: the converted lock does not match upstream's npm lock (the lock check).",
        "",
        ...formatComparison(result),
      ])
    ctx.plan.set("pnpm-workspace.yaml", ctx.ours.get("pnpm-workspace.yaml"))
    ctx.plan.set("pnpm-lock.yaml", { content: pnpmLock, mode: 0o644 })
    say(`Lock: converted by pnpm import; ${formatComparison(result)[0]}`)
  })
}

// --- Writing Core, and installing ---------------------------------------------------------------

function writeCore(ctx) {
  let [written, removed] = [0, 0]
  for (const rel of ctx.ours.keys()) {
    if (ctx.plan.has(rel)) continue
    fs.rmSync(path.join(ctx.coreDir, rel), { force: true })
    removed++
    // Remove directories the removal emptied, up to Core's root.
    for (
      let dir = path.dirname(path.join(ctx.coreDir, rel));
      dir !== ctx.coreDir && fs.readdirSync(dir).length === 0;
      dir = path.dirname(dir)
    )
      fs.rmdirSync(dir)
  }
  for (const [rel, { content, mode }] of ctx.plan) {
    const now = ctx.ours.get(rel)
    if (now && same(now.content, content) && now.mode === mode) continue
    const at = path.join(ctx.coreDir, rel)
    fs.mkdirSync(path.dirname(at), { recursive: true })
    if (mode === SYMLINK || now?.mode === SYMLINK) fs.rmSync(at, { force: true })
    if (mode === SYMLINK) fs.symlinkSync(content.toString("utf-8"), at)
    else {
      fs.writeFileSync(at, content)
      fs.chmodSync(at, mode)
    }
    written++
  }
  say(`Core: ${written} file(s) written, ${removed} removed.`)
}

// Put Core's files back as they were committed. The tree was clean when the upgrade started.
function restoreCore(ctx) {
  sh("git", ["-C", ctx.root, "checkout", "--quiet", "HEAD", "--", CORE_REL])
  sh("git", ["-C", ctx.root, "clean", "--quiet", "-fd", "--", CORE_REL])
}

function install(ctx) {
  const res = pnpm(ctx.coreDir, ["install", "--frozen-lockfile"])
  if (res.status !== 0) {
    restoreCore(ctx)
    throw new Stop([
      "Stopped: the frozen install into Core failed. Core's files are restored; run pnpm nx run site:install",
      "to put its node_modules back as they were.",
      "",
      ...`${res.stdout}${res.stderr}`.trim().split("\n"),
    ])
  }
  say("Installed: a frozen install of the converted lock into Core.")
}

// --- 8. Record ----------------------------------------------------------------------------------

function record(ctx) {
  if (ctx.target === ctx.manifest.commit)
    return say(`Pinned ref unchanged: ${MANIFEST_REL} still pins ${ctx.target.slice(0, 12)}.`)
  const version = JSON.parse(ctx.plan.get("package.json").content.toString("utf-8")).version
  const manifest = {
    ...ctx.manifest,
    commit: ctx.target,
    version,
    vendoredOn: new Date().toISOString().slice(0, 10),
  }
  fs.writeFileSync(ctx.manifestFile, JSON.stringify(manifest, null, 2) + "\n")
  ctx.recorded = true
  say(
    `Pinned ref recorded: ${ctx.target.slice(0, 12)} (v${version}) in ${MANIFEST_REL}.`,
    "",
    "Next: review the changes, update the Provenance table in quartz/VENDORED.md, retire any vendored",
    "change upstream absorbed (its row there, its ticket and its upstream proposal), then commit.",
  )
}

// --- --verify (#100) ----------------------------------------------------------------------------

/**
 * `--verify`'s checks, in order: each a command run from the repo root. The repo guards are one Nx target
 * (site:guards), so every repo guard, Core's and the packages', runs there. The typechecks are
 * every project's `typecheck` target: the packages', and site's, which checks Core's source and
 * the site's quartz.ts.
 */
export const VERIFY_STEPS = [
  { name: "the repo guards", command: ["pnpm", "nx", "run", "site:guards"] },
  { name: "the typechecks", command: ["pnpm", "nx", "run-many", "-t", "typecheck"] },
  { name: "the e2e suite", command: ["pnpm", "nx", "run", "site-e2e:e2e"] },
  { name: "the real-site build", command: ["pnpm", "nx", "run", "site:build"] },
]

// The steps `--verify` runs: VERIFY_STEPS, or, for the tests, stand-ins from the JSON file
// QUARTZ_VERIFY_STEPS names (the same shape).
const verifySteps = () =>
  process.env.QUARTZ_VERIFY_STEPS
    ? JSON.parse(fs.readFileSync(process.env.QUARTZ_VERIFY_STEPS, "utf-8"))
    : VERIFY_STEPS

function verify(ctx) {
  const steps = verifySteps()
  for (const [i, { name, command }] of steps.entries()) {
    say(`[${i + 1}/${steps.length}] ${name}: ${command.join(" ")}`)
    const res = spawnSync(command[0], command.slice(1), { cwd: ctx.root, stdio: "inherit" })
    if (res.status !== 0)
      throw new Stop([
        `Stopped: --verify failed at ${name} (exit ${res.status ?? res.signal ?? res.error?.message}).`,
        "The upgrade itself is done and recorded, but not safe to commit. Fix what failed and rerun",
        "the upgrade with --verify, or undo it all with git (git checkout and git clean on quartz/core",
        "and quartz/upstream.json, then pnpm nx run site:install).",
      ])
  }
  say(`Verified: all ${steps.length} check(s) passed. The upgrade is safe to commit.`)
}

/**
 * The upgrade's steps, in order. Each takes the context and throws a `Stop` to end the upgrade. The
 * steps before `write Core` only plan, so a stop there leaves the repo as it was. `--verify` adds
 * `VERIFY` at the end, and `--report-only` runs `REPORT_ONLY` instead.
 */
const FETCH = { name: "fetch", run: fetchRefs }
const REPORT = { name: "report the API surface", run: report }

export const STEPS = [
  { name: "refuse a dirty tree", run: refuseDirty },
  FETCH,
  REPORT,
  { name: "re-apply vendored changes", run: reapplyVendored },
  { name: "take the scaffolding", run: takeScaffolding },
  { name: "leave the steering files", run: keepSteering },
  { name: "keep the pruning", run: keepPruning },
  { name: "convert the lock", run: convertLock },
  { name: "write Core", run: writeCore },
  { name: "install", run: install },
  { name: "record the pinned ref", run: record },
]

/** The report alone: it reads Core and the two refs, and writes nothing but the upstream cache. */
export const REPORT_ONLY = [FETCH, REPORT]

/** `--verify`: run after the upgrade has succeeded. */
export const VERIFY = { name: "verify", run: verify }

/** Run `steps` over the context. Returns an exit code: 0 on success, 1 when a step stops. */
export function runUpgrade(ctx, steps = STEPS) {
  for (const step of steps) {
    try {
      say("", `▸ ${step.name}`)
      step.run(ctx)
    } catch (err) {
      if (!(err instanceof Stop)) throw err
      say(
        "",
        ...err.lines,
        "",
        ctx.recorded ? `${MANIFEST_REL} records the target.` : `${MANIFEST_REL} is unchanged.`,
        "",
      )
      return 1
    }
  }
  say("")
  return 0
}

// The flags that take a value, always as `--<name>=<value>`.
const VALUE_FLAGS = ["ref", "upstream", "root"]

function parseArgs(argv) {
  const spaced = argv.find((a) => VALUE_FLAGS.some((name) => a === `--${name}`))
  if (spaced) throw new Stop([`${spaced} takes its value as ${spaced}=<value>.`])
  const flag = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
  const has = (name) => argv.includes(`--${name}`)
  const reportOnly = has("report-only")
  const verify = has("verify")
  if (reportOnly && verify) throw new Stop(["--report-only and --verify do not go together."])
  return {
    options: {
      ref: flag("ref") ?? argv.find((a) => !a.startsWith("-")),
      upstream: flag("upstream") ?? process.env.QUARTZ_UPSTREAM,
      root: flag("root") ? path.resolve(flag("root")) : REPO_ROOT,
    },
    steps: reportOnly ? REPORT_ONLY : verify ? [...STEPS, VERIFY] : STEPS,
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { options, steps } = parseArgs(process.argv.slice(2))
    process.exitCode = runUpgrade(context(options), steps)
  } catch (err) {
    if (err instanceof Stop) say("", ...err.lines, "")
    else console.error(`\n  ${err.stack ?? err.message}\n`)
    process.exitCode = err instanceof Stop ? 1 : 2
  }
}
