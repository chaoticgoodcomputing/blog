// Core's drift from an upstream tree, and the record of what drift is allowed.
//
// Drift is any difference between Quartz Core and its pinned ref except in steering files, pruned
// files and Core's pnpm files (`countsAsDrift` in core-tiers.mjs). The upstream tooling
// (`upstream.mjs`: diff-upstream, diff-latest) prints it, and the `core-drift` repo guard fails on any
// that is not a recorded vendored change.
import fs from "node:fs"
import path from "node:path"
import { countsAsDrift } from "./core-tiers.mjs"
import { sh } from "./upstream-git.mjs"

/**
 * The files of the tree at `dir`, relative to it: what git tracks there, and any new file git
 * doesn't ignore, that is on disk. Installed dependencies, build output and caches are gitignored, so
 * they are never compared. `dir` may be a git checkout of its own, or a directory inside one.
 */
const checkoutFiles = (dir) =>
  sh("git", ["-C", dir, "ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", "."])
    .split("\0")
    .filter((rel) => rel && fs.existsSync(path.join(dir, rel)))

/**
 * Core's drift from the upstream tree at `upstreamDir`: every file, relative to Core's root, that
 * differs (`changed`), is only upstream's (`only upstream`) or is only Core's (`only Core`), sorted,
 * leaving out the tiers that are not drift.
 */
export function drift(coreDir, upstreamDir) {
  const upstream = new Set(checkoutFiles(upstreamDir))
  const core = new Set(checkoutFiles(coreDir))
  const same = (rel) => fs.readFileSync(path.join(upstreamDir, rel)).equals(fs.readFileSync(path.join(coreDir, rel)))
  return [...new Set([...upstream, ...core])]
    .filter(countsAsDrift)
    .sort()
    .flatMap((rel) =>
      !core.has(rel) ? [{ rel, kind: "only upstream" }] : !upstream.has(rel) ? [{ rel, kind: "only Core" }] : same(rel) ? [] : [{ rel, kind: "changed" }],
    )
}

/**
 * The files the vendored changes are recorded as touching: every `code span` in the first column of
 * the table under "Current vendored changes" in VENDORED.md (`markdown`), relative to Core's root.
 * `null` if there is no such table.
 */
export function recordedChanges(markdown) {
  const lines = markdown.split("\n")
  const heading = lines.findIndex((line) => /^current vendored changes/i.test(line.trim()))
  if (heading === -1) return null
  const start = lines.findIndex((line, i) => i > heading && line.trim().startsWith("|"))
  if (start === -1) return null
  let end = start
  while (end < lines.length && lines[end].trim().startsWith("|")) end++
  // The header row, then the separator row, then one row per vendored change.
  return lines
    .slice(start + 2, end)
    .flatMap((row) => [...(row.trim().slice(1).split("|")[0].matchAll(/`([^`]+)`/g))].map((match) => match[1]))
}
