// A small repo shaped like ours for the `plugin-notes` guard's tests: two plugins with their READMEs,
// and the vault (`content/public/`) holding each plugin's note, linked to its README. As made, it keeps
// the guard's rule; each test breaks it in its own copy.
import fs from "node:fs"
import path from "node:path"
import { scratch, writeTree } from "../guard-helpers.mjs"

export const TAG = "projects/site/plugins"
const json = (value) => JSON.stringify(value, null, 2)
const readme = (dir) => `---\ntitle: ${dir}\ntags:\n  - ${TAG}\n---\n# ${dir}\n`

/** Make the repo, with `files` written over it (a value of `null` deletes that path). Returns its root. */
export function makeNotesRepo(files = {}) {
  const repo = scratch("notes-guards-")
  writeTree(repo, {
    "quartz/plugins/quartz-engine/package.json": json({ name: "@chaoticgoodcomputing/quartz-engine" }),
    "quartz/plugins/quartz-engine/README.md": readme("quartz-engine"),
    "quartz/plugins/quartz-reader/package.json": json({ name: "@chaoticgoodcomputing/quartz-reader" }),
    "quartz/plugins/quartz-reader/README.md": readme("quartz-reader"),
  })
  fs.mkdirSync(path.join(repo, "content/public/plugins"), { recursive: true })
  for (const dir of ["quartz-engine", "quartz-reader"]) {
    fs.symlinkSync(`../../../quartz/plugins/${dir}/README.md`, path.join(repo, "content/public/plugins", `${dir}.md`))
  }
  for (const [rel, contents] of Object.entries(files)) {
    if (contents === null) fs.rmSync(path.join(repo, rel), { recursive: true, force: true })
    else writeTree(repo, { [rel]: typeof contents === "string" ? contents : json(contents) })
  }
  return repo
}
