#!/usr/bin/env node
// The lock check (#89, #91): Quartz Core's pnpm lock, `pnpm import`ed from upstream's
// `package-lock.json`, must hold exactly the packages the npm lock does. Every package at the same
// version, and nothing on either side the other lacks. So Core runs the dependency versions upstream
// shipped and tested, and the conversion can never drift silently.
//
//   node quartz/utils/core-lock.mjs                      Core's lock against the pinned ref's npm lock
//   node quartz/utils/core-lock.mjs --npm-lock <file>    against a local npm lock instead (no fetch)
//   node quartz/utils/core-lock.mjs --pnpm-lock <file>   check another pnpm lock
//
// Prints every difference and exits 1 if there is any, 0 when the locks match. As a module it reads
// no files: `compareLocks` takes both locks' text, and needs no dependency, so it runs before any
// install (the upgrade's lock conversion, the repo guards).
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { CORE_DIR } from "./core-tiers.mjs"
import { readManifest } from "./upstream-git.mjs"
import { upstreamTree } from "./upstream-tree.mjs"

// "name@version" → [name, version], for a scoped name too.
const split = (key) => {
  const at = key.lastIndexOf("@")
  return at > 0 ? [key.slice(0, at), key.slice(at + 1)] : [key, ""]
}

/**
 * Every package an npm lock (lockfileVersion 2 or 3) installs, as sorted, unique `name@version`
 * strings. Its root and workspace links are not packages. An alias (`"x": "npm:y@1"`) counts as the
 * package it installs, `y`.
 */
export function npmLockPackages(lockText) {
  const { packages } = JSON.parse(lockText)
  if (!packages) throw new Error("not an npm lock with a `packages` map (lockfileVersion 2 or 3)")
  const keys = Object.entries(packages)
    .filter(([at, entry]) => at !== "" && !entry.link && at.includes("node_modules/"))
    .map(([at, entry]) => `${entry.name ?? at.slice(at.lastIndexOf("node_modules/") + "node_modules/".length)}@${entry.version}`)
  return [...new Set(keys)].sort()
}

/**
 * Every package a pnpm lock (lockfileVersion 9) resolves, as sorted, unique `name@version` strings:
 * the keys of its top-level `packages:` map. Read line by line rather than with a YAML parser, so it
 * needs nothing installed.
 */
export function pnpmLockPackages(lockText) {
  const lines = lockText.split(/\r?\n/)
  const start = lines.indexOf("packages:")
  if (start === -1) throw new Error("not a pnpm lock with a `packages:` map (lockfileVersion 9)")
  const keys = []
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break // the next top-level key, `snapshots:`
    const key = line.match(/^ {2}(?! )(.+):\s*$/)?.[1] ?? line.match(/^ {2}(?! )(.+?):\s*\{/)?.[1]
    if (key) keys.push(key.replace(/^'(.*)'$/, "$1").replace(/^"(.*)"$/, "$1"))
  }
  return [...new Set(keys)].sort()
}

/**
 * Compare an npm lock with a pnpm lock, both as text. Returns
 * `{ ok, matched, onlyNpm, onlyPnpm, differing }`: `matched` counts the `name@version` both hold;
 * `onlyNpm` and `onlyPnpm` list the `name@version` strings only one side holds; `differing` groups
 * those by package name where both sides hold the name, as `{ name, npm: [versions], pnpm: [versions] }`.
 * `ok` is true exactly when neither side holds anything the other lacks.
 */
export function compareLocks({ npmLock, pnpmLock }) {
  const npm = new Set(npmLockPackages(npmLock))
  const pnpm = new Set(pnpmLockPackages(pnpmLock))
  const onlyNpm = [...npm].filter((key) => !pnpm.has(key))
  const onlyPnpm = [...pnpm].filter((key) => !npm.has(key))
  const versions = (keys, name) => keys.filter((key) => split(key)[0] === name).map((key) => split(key)[1])
  const names = [...new Set([...onlyNpm, ...onlyPnpm].map((key) => split(key)[0]))].sort()
  const differing = names
    .map((name) => ({ name, npm: versions(onlyNpm, name), pnpm: versions(onlyPnpm, name) }))
    .filter(({ npm, pnpm }) => npm.length && pnpm.length)
  return {
    ok: onlyNpm.length === 0 && onlyPnpm.length === 0,
    matched: [...npm].filter((key) => pnpm.has(key)).length,
    total: new Set([...npm, ...pnpm]).size,
    onlyNpm,
    onlyPnpm,
    differing,
  }
}

/** The report `compareLocks`' result prints as, one line per string. */
export function formatComparison(result) {
  const lines = [`${result.matched} of ${result.total} packages match.`]
  if (result.differing.length) {
    lines.push("", "At another version:")
    for (const { name, npm, pnpm } of result.differing) lines.push(`  ${name}: npm ${npm.join(", ")}, pnpm ${pnpm.join(", ")}`)
  }
  if (result.onlyNpm.length) lines.push("", "only in the npm lock:", ...result.onlyNpm.map((key) => `  ${key}`))
  if (result.onlyPnpm.length) lines.push("", "only in the pnpm lock:", ...result.onlyPnpm.map((key) => `  ${key}`))
  lines.push("", result.ok ? "The locks match exactly." : "The locks differ.")
  return lines
}

function main(argv) {
  const flag = (name) => {
    const at = argv.indexOf(name)
    return at === -1 ? undefined : argv[at + 1]
  }
  const pnpmFile = flag("--pnpm-lock") ?? path.join(CORE_DIR, "pnpm-lock.yaml")
  let npmLock
  if (flag("--npm-lock")) {
    npmLock = fs.readFileSync(flag("--npm-lock"), "utf8")
    console.log(`\n  npm lock: ${flag("--npm-lock")}`)
  } else {
    const { repo, commit } = readManifest()
    npmLock = fs.readFileSync(path.join(upstreamTree({ repo, ref: commit }), "package-lock.json"), "utf8")
    console.log(`\n  npm lock: package-lock.json at the pinned ref, ${commit.slice(0, 12)}`)
  }
  console.log(`  pnpm lock: ${path.relative(process.cwd(), pnpmFile) || pnpmFile}\n`)
  const result = compareLocks({ npmLock, pnpmLock: fs.readFileSync(pnpmFile, "utf8") })
  formatComparison(result).forEach((line) => console.log(line && `  ${line}`))
  console.log()
  return result.ok ? 0 : 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2))
  } catch (err) {
    console.error(`\n  ${err.message}\n`)
    process.exitCode = 2
  }
}
