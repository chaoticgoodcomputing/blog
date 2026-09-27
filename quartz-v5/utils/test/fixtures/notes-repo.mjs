// A small repo shaped like ours for the plugin-note guards' tests (`plugin-dag`, `plugin-notes`):
// two plugins with their READMEs, a library, and the vault (`content/public/`) holding each plugin's
// note, linked to its README, and the plugins' tag's description note with the generated DAG. As made,
// it keeps both guards' rules; each test breaks one or more of them in its own copy.
import fs from "node:fs"
import path from "node:path"
import { generatedBlock, readPackages } from "../../plugin-dag.mjs"
import { scratch, writeTree } from "../guard-helpers.mjs"

export const TAG = "projects/site/plugins"
export const NOTE = `content/public/tags/${TAG}/index.md`
const json = (value) => JSON.stringify(value, null, 2)
const readme = (dir) => `---\ntitle: ${dir}\ntags:\n  - ${TAG}\n---\n# ${dir}\n`

/** Make the repo, with `files` written over it (a value of `null` deletes that path). Returns its root. */
export function makeNotesRepo(files = {}) {
  const repo = scratch("notes-guards-")
  writeTree(repo, {
    "quartz-v5/plugins/quartz-engine/package.json": json({
      name: "@chaoticgoodcomputing/quartz-engine",
      quartz: { name: "cgc-engine", dependencies: [] },
    }),
    "quartz-v5/plugins/quartz-engine/README.md": readme("quartz-engine"),
    "quartz-v5/plugins/quartz-reader/package.json": json({
      name: "@chaoticgoodcomputing/quartz-reader",
      quartz: { name: "cgc-reader", dependencies: ["@chaoticgoodcomputing/quartz-engine"] },
      devDependencies: { "@chaoticgoodcomputing/lib": "workspace:*" },
    }),
    "quartz-v5/plugins/quartz-reader/README.md": readme("quartz-reader"),
    "quartz-v5/libs/lib/package.json": json({ name: "@chaoticgoodcomputing/lib" }),
  })
  const block = generatedBlock(readPackages(path.join(repo, "quartz-v5")))
  writeTree(repo, { [NOTE]: `---\ntitle: Plugins\n---\nThe plugins this site is built with.\n\n${block}\n` })
  fs.mkdirSync(path.join(repo, "content/public/plugins"), { recursive: true })
  for (const dir of ["quartz-engine", "quartz-reader"]) {
    fs.symlinkSync(`../../../quartz-v5/plugins/${dir}/README.md`, path.join(repo, "content/public/plugins", `${dir}.md`))
  }
  for (const [rel, contents] of Object.entries(files)) {
    if (contents === null) fs.rmSync(path.join(repo, rel), { recursive: true, force: true })
    else writeTree(repo, { [rel]: typeof contents === "string" ? contents : json(contents) })
  }
  return repo
}
