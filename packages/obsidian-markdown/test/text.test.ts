import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { after, before, test } from "node:test"
import { Vault } from "../src/index.ts"

const FILES: Record<string, string> = {
  "words.md": [
    "---\ntitle: Words in the frontmatter\ndescription: More words in the frontmatter\n---",
    "# A heading",
    "A paragraph with a [link](https://example.com/a/long/address) and [[Other note|another note]]. %%A hidden remark.%%",
    "%%\nA hidden block, ```annotation-json``` and all.\n\n```json\n{\"hidden\": true}\n```\n%%",
    "- One item\n- Two items",
    "> [!note] A callout\n> Its body.",
    "| Cell | Other |\n|---|---|\n| Row | Last |",
    "```js\nconst code = 1\n```",
  ].join("\n\n"),
  "Other note.md": "Nothing much.\n",
  "picture.png": "not really a png",
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-text-"))
  for (const [file, contents] of Object.entries(FILES)) fs.writeFileSync(path.join(root, file), contents)
  vault = await Vault.open(root)
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

const words = (text: string | null) => text?.split(/\s+/).filter(Boolean)

test("a note's text is what a reader reads of it: no frontmatter, no comment, no link's address, and every block's words apart", () => {
  assert.deepEqual(words(vault.readText(vault.getFileByPath("words.md")!)), [
    "A", "heading",
    "A", "paragraph", "with", "a", "link", "and", "another", "note.",
    "One", "item", "Two", "items",
    "A", "callout", "Its", "body.",
    "Cell", "Other", "Row", "Last",
    "const", "code", "=", "1",
  ])
})

test("a file that is no note has no text", () => {
  assert.equal(vault.readText(vault.getFileByPath("picture.png")!), null)
})
