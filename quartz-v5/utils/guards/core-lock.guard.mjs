// Repo guard: Core's package.json and lock are upstream's at the pinned ref (#89, #91, #97).
//
// - Core's `package.json` is upstream's, byte for byte: nothing of ours is in it. Each top-level
//   field that differs is a violation.
// - Core's `pnpm-lock.yaml` holds exactly the packages of upstream's `package-lock.json`, each at
//   upstream's version (the lock check, `compareLocks` in utils/core-lock.mjs). Each package at another
//   version, or on one side only, is a violation.
// - And it is exactly what a fresh `pnpm import` of that npm lock writes, with Core's pnpm settings,
//   so the conversion can't drift silently either. The import runs in a temp project with pnpm 11 by
//   exact version, as `site-v5:install` does, and reuses pnpm's metadata cache.
//
//   node quartz-v5/utils/guards/core-lock.guard.mjs [--core <dir>] [--upstream <dir>]
//
// `--upstream` defaults to the pinned ref's tree, fetched once into quartz-v5/.upstream-cache/trees/
// (utils/upstream-tree.mjs), where the pruned npm lock is still upstream's.
// Test and how to break it by hand: utils/test/guard-core-lock.test.mjs.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { CORE_DIR, CORE_PNPM } from "../core-tiers.mjs"
import { compareLocks } from "../core-lock.mjs"
import { upstreamTree } from "../upstream-tree.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

const read = (file) => (fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : undefined)
const brief = (value) => {
  const text = JSON.stringify(value)
  return text.length > 60 ? `${text.slice(0, 57)}...` : text
}

// Each top-level field of Core's package.json that is not upstream's.
function packageJsonViolations(ours, theirs) {
  if (ours === theirs) return []
  const [a, b] = [JSON.parse(ours), JSON.parse(theirs)]
  const fields = [...new Set([...Object.keys(b), ...Object.keys(a)])]
  const violations = fields.flatMap((key) =>
    !(key in a)
      ? [`package.json "${key}" is upstream's only: Core's lacks it`]
      : !(key in b)
        ? [`package.json "${key}" is ours only: upstream's has no such field`]
        : JSON.stringify(a[key]) === JSON.stringify(b[key])
          ? []
          : [`package.json "${key}" differs from upstream's: ours ${brief(a[key])}, upstream's ${brief(b[key])}`],
  )
  return violations.length ? violations : ["package.json differs from upstream's in formatting (or field order) only"]
}

// What a fresh `pnpm import` of upstream's npm lock writes, with Core's pnpm settings.
function freshImport(upstream, core) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "core-lock-import-"))
  try {
    for (const [from, file] of [
      [upstream, "package.json"],
      [upstream, "package-lock.json"],
      [core, "pnpm-workspace.yaml"],
    ]) {
      if (!fs.existsSync(path.join(from, file))) throw new CannotCheck(`no ${file} at ${from}`)
      fs.copyFileSync(path.join(from, file), path.join(work, file))
    }
    try {
      execFileSync("npx", ["--yes", CORE_PNPM, "import"], { cwd: work, stdio: "pipe", encoding: "utf-8" })
    } catch (err) {
      throw new CannotCheck(`\`pnpm import\` failed in a temp project: ${String(err.stderr || err.stdout || err.message).trim()}`)
    }
    return fs.readFileSync(path.join(work, "pnpm-lock.yaml"), "utf-8")
  } finally {
    fs.rmSync(work, { recursive: true, force: true })
  }
}

await guard(import.meta, "Core's package.json and pnpm lock are upstream's at the pinned ref", (argv) => {
  const core = path.resolve(option(argv, "core", CORE_DIR))
  const upstream = path.resolve(option(argv, "upstream", "") || upstreamTree())
  const theirPackage = read(path.join(upstream, "package.json"))
  const npmLock = read(path.join(upstream, "package-lock.json"))
  if (!theirPackage || !npmLock) throw new CannotCheck(`upstream's tree at ${upstream} has no package.json or package-lock.json`)
  const ourPackage = read(path.join(core, "package.json"))
  const pnpmLock = read(path.join(core, "pnpm-lock.yaml"))

  const violations = ourPackage ? packageJsonViolations(ourPackage, theirPackage) : [`Core has no package.json at ${core}`]
  if (!pnpmLock) return [...violations, `Core has no pnpm-lock.yaml at ${core}: import it from upstream's package-lock.json (VENDORED.md, Dependencies)`]

  const { onlyNpm, onlyPnpm, differing } = compareLocks({ npmLock, pnpmLock })
  const moved = new Set(differing.map(({ name }) => name))
  const nameOf = (key) => key.slice(0, key.lastIndexOf("@"))
  violations.push(
    ...differing.map(({ name, npm, pnpm }) => `${name}: ${npm.join(", ")} in upstream's package-lock.json, ${pnpm.join(", ")} in pnpm-lock.yaml`),
    ...onlyNpm.filter((key) => !moved.has(nameOf(key))).map((key) => `pnpm-lock.yaml lacks ${key}, which upstream's package-lock.json has`),
    ...onlyPnpm.filter((key) => !moved.has(nameOf(key))).map((key) => `pnpm-lock.yaml has ${key}, which upstream's package-lock.json lacks`),
  )

  const fresh = freshImport(upstream, core)
  if (fresh !== pnpmLock) {
    const [ours, theirs] = [pnpmLock.split("\n"), fresh.split("\n")]
    const differ = Array.from({ length: Math.max(ours.length, theirs.length) }, (_, i) => i).filter((i) => ours[i] !== theirs[i])
    const first = differ[0]
    violations.push(
      `pnpm-lock.yaml is not what a fresh \`pnpm import\` of upstream's package-lock.json writes: ${differ.length} line(s) differ, ` +
        `the first at line ${first + 1} (ours ${JSON.stringify(ours[first] ?? "")}, a fresh import's ${JSON.stringify(theirs[first] ?? "")})`,
    )
  }
  return violations
})
