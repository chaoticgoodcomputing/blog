// Repo guard: pruned files are absent from Quartz Core (#89, #97).
//
// Every entry on the pruned list (`PRUNED` in utils/core-tiers.mjs) must be missing from Core's
// root, whether git tracks it or not: an `npm install` in Core writes `package-lock.json`, and an
// old sync would bring `docs/` back. Each one present is a violation.
//
//   node quartz-v5/utils/guards/core-pruned.guard.mjs [--core <dir>]
//
// Test and how to break it by hand: utils/test/guard-core-pruned.test.mjs.
import fs from "node:fs"
import path from "node:path"
import { CORE_DIR, PRUNED } from "../core-tiers.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

await guard(import.meta, "Pruned files are absent from Quartz Core", (argv) => {
  const core = path.resolve(option(argv, "core", CORE_DIR))
  if (!fs.statSync(core, { throwIfNoEntry: false })?.isDirectory()) throw new CannotCheck(`no Quartz Core at ${core}`)
  return PRUNED.filter((rel) => fs.lstatSync(path.join(core, rel), { throwIfNoEntry: false })).map(
    (rel) => `${rel} is present (${path.join(core, rel)}). It is pruned: delete it.`,
  )
})
