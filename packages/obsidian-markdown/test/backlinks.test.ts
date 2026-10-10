import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { after, before, test } from "node:test"
import { Vault } from "../src/index.ts"

// A note's backlinks are every note that links to it, as Obsidian's backlinks pane lists them: a
// note that only embeds it is one of them.
const FILES: Record<string, string> = {
  "target.md": "# Target\n\nLinked and embedded.\n",
  "linking.md": "Links to [[target]].\n",
  "embedding.md": "Embeds it:\n\n![[target]]\n",
  "section.md": "Embeds a part of it: ![[target#Target]]\n",
  "unrelated.md": "Links to [[linking]] only.\n",
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-backlinks-"))
  for (const [file, contents] of Object.entries(FILES)) fs.writeFileSync(path.join(root, file), contents)
  vault = await Vault.open(root)
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

test("a note that embeds another, whole or a part of it, is among its backlinks, as one that links to it is", () => {
  const backlinks = vault.metadataCache.getBacklinksForFile("target.md")
  assert.deepEqual([...backlinks.keys()].sort(), ["embedding.md", "linking.md", "section.md"])
  assert.deepEqual(backlinks.get("embedding.md")!.map((link) => link.original), ["![[target]]"])
  assert.deepEqual(backlinks.get("section.md")!.map((link) => link.original), ["![[target#Target]]"])
})
