// Repo guard: Quartz Core matches its pinned ref, with no drift beyond the recorded vendored
// changes (#89, #97). Today's `site:diff-upstream`, as a guard.
//
// Drift (utils/core-drift.mjs) is every file of Core source or scaffolding, or any other file at
// Core's root, that differs from upstream's tree at the pinned ref. Steering files, pruned files and
// Core's pnpm files never count. Each drifted file must be one the vendored-changes table in
// quartz/VENDORED.md records; each one it does not is a violation. So is each file the table
// records that no longer drifts: upstream took the change, or it was reverted, and its row should go.
//
//   node quartz/utils/guards/core-drift.guard.mjs [--core <dir>] [--upstream <dir>] [--record <file>]
//
// `--upstream` defaults to the pinned ref's tree, fetched once into quartz/.upstream-cache/trees/
// (utils/upstream-tree.mjs). `pnpm nx run site:diff-upstream` shows the drift itself.
// Test and how to break it by hand: utils/test/guard-core-drift.test.mjs.
import fs from "node:fs"
import path from "node:path"
import { CORE_DIR, REPO_ROOT } from "../core-tiers.mjs"
import { drift, recordedChanges } from "../core-drift.mjs"
import { upstreamTree } from "../upstream-tree.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

await guard(import.meta, "Quartz Core has no drift from its pinned ref but its recorded vendored changes", (argv) => {
  const core = path.resolve(option(argv, "core", CORE_DIR))
  const recordFile = path.resolve(option(argv, "record", path.join(REPO_ROOT, "quartz", "VENDORED.md")))
  const upstream = path.resolve(option(argv, "upstream", "") || upstreamTree())
  for (const dir of [core, upstream]) {
    if (!fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory()) throw new CannotCheck(`no tree at ${dir}`)
  }
  const recorded = recordedChanges(fs.readFileSync(recordFile, "utf-8"))
  if (!recorded) throw new CannotCheck(`${recordFile} has no table under "Current vendored changes": nothing records what drift is allowed`)

  const drifted = drift(core, upstream)
  const driftedFiles = new Set(drifted.map(({ rel }) => rel))
  return [
    ...drifted
      .filter(({ rel }) => !recorded.includes(rel))
      .map(({ rel, kind }) => `${kind.padEnd(13)} ${rel}: not a recorded vendored change. Revert it, or record it in VENDORED.md with its ticket.`),
    ...recorded
      .filter((rel) => !driftedFiles.has(rel))
      .map((rel) => `${rel} is recorded as a vendored change, but matches upstream: remove it from VENDORED.md's table (and retire its ticket if upstream took it).`),
  ]
})
