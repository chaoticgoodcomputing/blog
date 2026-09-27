// Repo guard `plugin-dag` (#86): the plugins' tag's description note carries the DAG the packages
// declare, exactly as `utils/plugin-dag.mjs` would write it, and the note is in one shape: at the
// vault's current convention, `tags/projects/site/plugins/index.md`, or where the cutover rename (#43)
// moves it, `tags/projects/site/plugins.md`, never both. The owner decided the DAG is generated and
// guarded (review notes, 2026-09-26).
//
// To reproduce a failure by hand: add `"@chaoticgoodcomputing/quartz-tags"` to `quartz.dependencies`
// in quartz-v5/plugins/quartz-seo/package.json, then `node quartz-v5/utils/guards/plugin-dag.guard.mjs`
// says the note has drifted and exits 1. Undo with
// `git checkout -- quartz-v5/plugins/quartz-seo/package.json`.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { listed, runGuard } from "./guard-helpers.mjs"
import { NOTE, TAG, makeNotesRepo } from "./fixtures/notes-repo.mjs"

test("a note carrying the DAG the packages declare passes", () => {
  const { code, out } = runGuard("plugin-dag", ["--repo", makeNotesRepo()])
  assert.equal(code, 0, out)
  assert.match(out, /^PASS {2}plugin-dag/)
})

test("a note that has drifted from the manifests fails", () => {
  const repo = makeNotesRepo({
    "quartz-v5/plugins/quartz-engine/package.json": {
      name: "@chaoticgoodcomputing/quartz-engine",
      quartz: { name: "cgc-engine", dependencies: ["@chaoticgoodcomputing/quartz-reader"] },
    },
  })
  const { code, out } = runGuard("plugin-dag", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(out, `${NOTE}: its DAG has drifted from the packages' manifests: pnpm nx run site-v5:plugin-dag`)
})

test("a note with no generated block, or in both shapes at once, fails", () => {
  const repo = makeNotesRepo({ [NOTE]: "---\ntitle: Plugins\n---\nNo block.\n", [`content/public/tags/${TAG}.md`]: "# Renamed\n" })
  const { code, out } = runGuard("plugin-dag", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    `content/public/tags/${TAG}.md: has no generated block between the plugin-dag markers`,
    `the plugins' tag's description note is in both shapes, ${NOTE} and content/public/tags/${TAG}.md: keep one`,
  )
  assert.match(out, /2 violation\(s\)/)
})

// Quartz names a package source by its whole package name, so a dependency on a manifest name finds
// nothing at a site: the DAG cannot be drawn, and the guard says why.
test("a manifest dependency the DAG cannot draw fails, naming it", () => {
  const repo = makeNotesRepo({
    "quartz-v5/plugins/quartz-reader/package.json": {
      name: "@chaoticgoodcomputing/quartz-reader",
      quartz: { name: "cgc-reader", dependencies: ["cgc-engine"] },
    },
  })
  const { code, out } = runGuard("plugin-dag", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(out, "quartz-reader depends on cgc-engine, which no package")
})

test("a repo with no note cannot be checked: exit 2", () => {
  const repo = makeNotesRepo({ [NOTE]: null })
  assert.equal(fs.existsSync(path.join(repo, NOTE)), false)
  const { code, out } = runGuard("plugin-dag", ["--repo", repo])
  assert.equal(code, 2, out)
})

test("the real repo's note carries the DAG its packages declare", () => {
  const { code, out } = runGuard("plugin-dag")
  assert.equal(code, 0, out)
})
