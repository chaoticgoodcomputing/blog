#!/usr/bin/env node
/**
 * The upgrade (#89, #99): move Quartz Core to another upstream commit, keeping what's ours.
 *
 *   pnpm nx run site-v5:upgrade --ref=<commit|branch|tag>
 *   node quartz-v5/utils/upgrade.mjs --ref=<ref> [--upstream=<url>]
 *
 * In order, stopping at the first step that fails, before anything of Core's is written:
 *   1. refuse a dirty tree: uncommitted changes in Core or the pinned ref's record;
 *   2. fetch the pinned ref and the target into the upstream cache (`upstream-cache.mjs`);
 *   3. re-apply our vendored changes, hunk by hunk, to the target's Core source: stop on a conflict
 *      and name its hunks, and report the hunks upstream has absorbed;
 *   4. take the scaffolding: `package.json` verbatim, the rest three-way merged;
 *   5. leave the steering files alone, and show upstream's template changes to them;
 *   6. keep the pruning: no pruned file comes back;
 *   7. convert the lock: `pnpm import` of the target's npm lock under Core's pnpm settings, checked
 *      by the lock check (`core-lock.mjs`), then written to Core and installed frozen;
 *   8. record the new pinned ref in `upstream.json`, only once all of the above has succeeded.
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
import { compareLocks, formatComparison } from "./core-lock.mjs"
import { CORE_REL, MANIFEST_REL, REPO_ROOT, tierOf } from "./core-tiers.mjs"
import { CACHE_REL, fetchRef, openCache, readBlob, treeFiles } from "./upstream-cache.mjs"
import { sh } from "./upstream-git.mjs"

/** Core's pnpm, run by exact version whatever pnpm the repo root pins (VENDORED.md). */
const PNPM = ["--yes", "pnpm@11.27.1"]

/** A step's refusal: the upgrade stops, and says why. */
export class Stop extends Error {
  constructor(lines) {
    super(lines[0])
    this.lines = lines
  }
}

const say = (...lines) => lines.forEach((line) => console.log(line ? `  ${line}` : ""))
const temp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix))
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
    .filter((rel) => fs.existsSync(path.join(ctx.coreDir, rel)))

function readCore(ctx) {
  const files = new Map()
  for (const rel of coreFiles(ctx)) {
    const at = path.join(ctx.coreDir, rel)
    files.set(rel, {
      content: fs.readFileSync(at),
      mode: fs.statSync(at).mode & 0o111 ? 0o755 : 0o644,
    })
  }
  return files
}

function readTree(cache, sha) {
  const files = new Map()
  for (const [rel, { mode, blob }] of treeFiles(cache, sha)) {
    files.set(rel, { content: readBlob(cache, blob), mode: mode === "100755" ? 0o755 : 0o644 })
  }
  return files
}

const contentOf = (files, rel) => files.get(rel)?.content ?? null
const allPaths = (ctx) =>
  [...new Set([...ctx.base.keys(), ...ctx.next.keys(), ...ctx.ours.keys()])].sort()

// --- 1. Refuse a dirty tree ----------------------------------------------------------------------

function refuseDirty(ctx) {
  const dirty = sh("git", [
    "-C",
    ctx.root,
    "status",
    "--porcelain",
    "--untracked-files=all",
    "--",
    CORE_REL,
    MANIFEST_REL,
  ])
    .split("\n")
    .filter(Boolean)
  if (dirty.length)
    throw new Stop([
      `Refusing to upgrade: Quartz Core or ${MANIFEST_REL} has uncommitted changes.`,
      "Commit or stash them first, so the upgrade never mixes with work in progress:",
      "",
      ...dirty.map((line) => `  ${line}`),
    ])
}

// --- 2. Fetch -----------------------------------------------------------------------------------

function fetch(ctx) {
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

// --- 3. Vendored changes ------------------------------------------------------------------------

// The hunks of `diff -u base ours`, each as a patch of its own on a file named `f`.
function hunks(base, ours) {
  const dir = temp("quartz-upgrade-diff-")
  try {
    fs.writeFileSync(path.join(dir, "base"), base)
    fs.writeFileSync(path.join(dir, "ours"), ours)
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
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
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

  const dir = temp("quartz-upgrade-apply-")
  const apply = (patch, ...flags) =>
    spawnSync("git", ["apply", "--whitespace=nowarn", ...flags, "-"], {
      cwd: dir,
      input: patch,
      encoding: "utf-8",
    }).status === 0
  try {
    fs.writeFileSync(path.join(dir, "f"), next)
    const out = { applied: [], absorbed: [], conflicts: [] }
    for (const hunk of hunks(base, ours)) {
      if (apply(hunk.patch, "--reverse", "--check")) out.absorbed.push(hunk)
      else if (apply(hunk.patch)) out.applied.push(hunk)
      else out.conflicts.push(hunk)
    }
    return { result: fs.readFileSync(path.join(dir, "f")), ...out }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function replaceSource(ctx) {
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
  const dir = temp("quartz-upgrade-merge-")
  try {
    for (const [name, content] of [
      ["ours", ours],
      ["base", base ?? Buffer.alloc(0)],
      ["next", next],
    ])
      fs.writeFileSync(path.join(dir, name), content)
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
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
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

function unifiedDiff(rel, a, b) {
  const dir = temp("quartz-upgrade-template-")
  try {
    fs.writeFileSync(path.join(dir, "a"), a ?? "")
    fs.writeFileSync(path.join(dir, "b"), b ?? "")
    const res = spawnSync(
      "diff",
      [
        "-u",
        "--label",
        `upstream (pinned)/${rel}`,
        "--label",
        `upstream (target)/${rel}`,
        "a",
        "b",
      ],
      {
        cwd: dir,
        encoding: "utf-8",
      },
    )
    return res.stdout.replace(/\n$/, "").split("\n")
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function keepSteering(ctx) {
  const changed = []
  for (const rel of allPaths(ctx).filter((rel) => tierOf(rel) === "steering")) {
    if (ctx.ours.has(rel)) ctx.plan.set(rel, ctx.ours.get(rel))
    const [base, next] = [contentOf(ctx.base, rel), contentOf(ctx.next, rel)]
    if (!same(base, next)) changed.push({ rel, diff: unifiedDiff(rel, base, next) })
  }
  if (!changed.length)
    return say("Steering files: left alone. Upstream's templates of them have not changed.")
  say(
    "Steering files: left alone. Upstream's templates of them changed; merge what you want by hand:",
  )
  for (const { rel, diff } of changed) {
    say("", `  ${rel}`)
    diff.forEach((line) => say(`    ${line}`))
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

  const dir = temp("quartz-upgrade-lock-")
  try {
    fs.writeFileSync(path.join(dir, "package.json"), ctx.plan.get("package.json").content)
    fs.writeFileSync(path.join(dir, "package-lock.json"), npmLock)
    fs.writeFileSync(path.join(dir, "pnpm-workspace.yaml"), workspace)
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
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
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
    fs.writeFileSync(at, content)
    fs.chmodSync(at, mode)
    written++
  }
  ctx.wrote = written + removed > 0
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
      "Stopped: the frozen install into Core failed. Core's files are restored; run pnpm nx run site-v5:install",
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
  say(
    `Pinned ref recorded: ${ctx.target.slice(0, 12)} (v${version}) in ${MANIFEST_REL}.`,
    "",
    "Next: review the changes, update the Provenance table in quartz-v5/VENDORED.md, retire any vendored",
    "change upstream absorbed (its row there, its ticket and its upstream proposal), then commit.",
  )
}

/**
 * The upgrade's steps, in order. Each takes the context and throws a `Stop` to end the upgrade. The
 * steps before `write Core` only plan, so a stop there leaves the repo as it was.
 *
 * #100 adds the API-surface report after `fetch`, before the tree is touched, and `--verify` after
 * `record`.
 */
export const STEPS = [
  { name: "refuse a dirty tree", run: refuseDirty },
  { name: "fetch", run: fetch },
  { name: "re-apply vendored changes", run: replaceSource },
  { name: "take the scaffolding", run: takeScaffolding },
  { name: "leave the steering files", run: keepSteering },
  { name: "keep the pruning", run: keepPruning },
  { name: "convert the lock", run: convertLock },
  { name: "write Core", run: writeCore },
  { name: "install", run: install },
  { name: "record the pinned ref", run: record },
]

/** Run `steps` over the context. Returns an exit code: 0 on success, 1 when a step stops. */
export function runUpgrade(ctx, steps = STEPS) {
  for (const step of steps) {
    try {
      say("", `▸ ${step.name}`)
      step.run(ctx)
    } catch (err) {
      if (!(err instanceof Stop)) throw err
      say("", ...err.lines, "", `${MANIFEST_REL} is unchanged.`, "")
      return 1
    }
  }
  say("")
  return 0
}

function parseArgs(argv) {
  const flag = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
  return {
    ref: flag("ref") ?? argv.find((a) => !a.startsWith("-")),
    upstream: flag("upstream") ?? process.env.QUARTZ_UPSTREAM,
    root: flag("root") ? path.resolve(flag("root")) : REPO_ROOT,
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = runUpgrade(context(parseArgs(process.argv.slice(2))))
  } catch (err) {
    if (err instanceof Stop) say("", ...err.lines, "")
    else console.error(`\n  ${err.stack ?? err.message}\n`)
    process.exitCode = err instanceof Stop ? 1 : 2
  }
}
