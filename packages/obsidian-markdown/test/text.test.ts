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

test("a note's text is also its blocks, each with its type, where it is, and the blocks it is inside", () => {
  const file = vault.getFileByPath("words.md")!
  const blocks = vault.readTextBlocks(file)!
  assert.deepEqual(
    blocks.map(({ type, text, within }) => ({ type, text, within })),
    [
      { type: "heading", text: "A heading", within: [] },
      { type: "paragraph", text: "A paragraph with a link and another note. ", within: [] },
      { type: "paragraph", text: "One item", within: ["list", "listItem"] },
      { type: "paragraph", text: "Two items", within: ["list", "listItem"] },
      { type: "calloutTitle", text: "A callout", within: ["callout"] },
      { type: "paragraph", text: "Its body.", within: ["callout", "calloutContent"] },
      { type: "tableCell", text: "Cell", within: ["table", "tableRow"] },
      { type: "tableCell", text: "Other", within: ["table", "tableRow"] },
      { type: "tableCell", text: "Row", within: ["table", "tableRow"] },
      { type: "tableCell", text: "Last", within: ["table", "tableRow"] },
      { type: "code", text: "const code = 1", within: [] },
    ],
  )
  // Where each is in the note's source.
  const source = vault.read(file)!
  const paragraph = blocks[1]!
  assert.equal(
    source.slice(paragraph.position!.start.offset, paragraph.position!.end.offset),
    "A paragraph with a [link](https://example.com/a/long/address) and [[Other note|another note]]. %%A hidden remark.%%",
  )
  // The text is the blocks', a block to a line.
  assert.equal(vault.readText(file), blocks.map((block) => block.text).join("\n"))
})
