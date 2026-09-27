// Repo guard `plugin-notes` (#86): every shareable plugin's README is its plugin note. It carries the
// plugins' tag, `projects/site/plugins`, so the tag's page lists it, and the vault links it in as
// `content/public/plugins/<dir>.md`.
//
// To reproduce a failure by hand: remove `projects/site/plugins` from the tags in
// quartz-v5/plugins/quartz-seo/README.md, then `node quartz-v5/utils/guards/plugin-notes.guard.mjs`
// lists it and exits 1. Undo with `git checkout -- quartz-v5/plugins/quartz-seo/README.md`.
import { test } from "node:test"
import assert from "node:assert/strict"
import { listed, runGuard } from "./guard-helpers.mjs"
import { makeNotesRepo } from "./fixtures/notes-repo.mjs"

test("plugin notes that carry the tag and are linked into the vault pass", () => {
  const { code, out } = runGuard("plugin-notes", ["--repo", makeNotesRepo()])
  assert.equal(code, 0, out)
  assert.match(out, /^PASS {2}plugin-notes/)
})

test("a README without the tag, or not linked into the vault, or linked to another file, fails", () => {
  const repo = makeNotesRepo({
    "quartz-v5/plugins/quartz-engine/README.md": "---\ntitle: engine\ntags: [projects/site]\n---\n# engine\n",
    "content/public/plugins/quartz-reader.md": null,
    "quartz-v5/plugins/quartz-other/package.json": { name: "@chaoticgoodcomputing/quartz-other" },
    "quartz-v5/plugins/quartz-other/README.md": "---\ntags: [projects/site/plugins]\n---\n",
    "content/public/plugins/quartz-other.md": "# A copy, not the README\n",
  })
  const { code, out } = runGuard("plugin-notes", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    "quartz-v5/plugins/quartz-engine/README.md: its tags leave out projects/site/plugins",
    "quartz-v5/plugins/quartz-reader: no plugin note content/public/plugins/quartz-reader.md links to its README",
    "quartz-v5/plugins/quartz-other: no plugin note content/public/plugins/quartz-other.md links to its README",
  )
  assert.match(out, /3 violation\(s\)/)
})

test("the real repo's plugin notes carry the tag and are in the vault", () => {
  const { code, out } = runGuard("plugin-notes")
  assert.equal(code, 0, out)
})
