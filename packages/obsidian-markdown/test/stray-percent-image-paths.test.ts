import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml } from "satteri"
import { Vault, obsidian, obsidianFeatures } from "../src/index.ts"

// A Markdown image's path is decoded as a link's is: a `%` that starts no escape is a character of
// the file's name, and the compile goes on, from the vault's root, from the note's folder, or in an
// embedded note, whose image paths are rewritten for the page that shows it.
const FILES: Record<string, string> = {
  "notes/deep/stray.md": "![](/assets/50%.svg)\n\n![](50%.svg)\n",
  "notes/stray-embedder.md": "![[stray]]\n",
  "assets/50%.svg": "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>",
  "notes/deep/50%.svg": "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>",
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-stray-percent-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  vault = await Vault.open(root)
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

const urlFor = (file: { path: string }) => `/${file.path.replace(/\.md$/, "")}`

const render = async (note: string) =>
  (
    await markdownToHtml(FILES[note]!, {
      features: obsidianFeatures,
      mdastPlugins: obsidian({ vault, urlFor }),
      fileURL: pathToFileURL(path.join(vault.root, note)),
    })
  ).html

test("a path from the vault's root with a % that starts no escape names the file with the % in its name", async () => {
  assert.match(await render("notes/deep/stray.md"), /<img src="\.\.\/\.\.\/assets\/50%25\.svg" alt="">/)
})

test("in an embedded note, a path from the root or from its folder with such a % names that file too", async () => {
  const embedded = await render("notes/stray-embedder.md")
  assert.match(embedded, /<img src="\.\.\/assets\/50%25\.svg" alt="">/)
  assert.match(embedded, /<img src="\.\/deep\/50%25\.svg" alt="">/)
})
