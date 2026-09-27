// Repo guard: the plugins' tag's description note carries the DAG the packages declare (#86).
//
// The note, `content/public/tags/projects/site/plugins/index.md` (or `…/plugins.md` once the cutover
// rename, #43, moves it; never both), holds a Mermaid flowchart of how our packages depend on each
// other, between two generated markers. The owner decided it is generated and guarded (review notes,
// 2026-09-26): its block must be exactly what `utils/plugin-dag.mjs` writes from the packages'
// manifests today, so a manifest change that moves the DAG fails here until the note is regenerated
// (`pnpm nx run site:plugin-dag`). A manifest dependency the DAG cannot draw, such as an engine
// named by its manifest name, fails too.
//
//   node quartz/utils/guards/plugin-dag.guard.mjs [--repo <dir>]
//
// Test and how to break it by hand: utils/test/guard-plugin-dag.test.mjs.
import fs from "node:fs"
import path from "node:path"
import { REPO_ROOT } from "../core-tiers.mjs"
import { SITE_REL } from "../packages.mjs"
import { blockOf, generatedBlock, readPackages } from "../plugin-dag.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

const TAG = "projects/site/plugins"
const VAULT = "content/public"

await guard(import.meta, "The plugins' tag's description note carries the DAG the packages declare", (argv) => {
  const repo = path.resolve(option(argv, "repo", REPO_ROOT))
  const shapes = [`${VAULT}/tags/${TAG}/index.md`, `${VAULT}/tags/${TAG}.md`].filter((rel) => fs.existsSync(path.join(repo, rel)))
  if (shapes.length === 0) throw new CannotCheck(`no description note for the plugins' tag under ${path.join(repo, VAULT)}`)

  const violations = []
  if (shapes.length > 1) violations.push(`the plugins' tag's description note is in both shapes, ${shapes.join(" and ")}: keep one`)
  // plugin-dag.mjs writes the renamed shape when it exists, so that is the one read.
  const note = shapes.at(-1)
  const block = blockOf(fs.readFileSync(path.join(repo, note), "utf-8"))
  if (block === null) return [...violations, `${note}: has no generated block between the plugin-dag markers`]

  let wanted
  try {
    wanted = generatedBlock(readPackages(path.join(repo, SITE_REL)))
  } catch (err) {
    return [...violations, `the DAG cannot be drawn: ${err.message}`]
  }
  if (block !== wanted) violations.push(`${note}: its DAG has drifted from the packages' manifests: pnpm nx run site:plugin-dag`)
  return violations
})
