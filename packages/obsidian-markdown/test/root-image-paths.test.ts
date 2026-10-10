import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml } from "satteri"
import { Vault, obsidian, obsidianFeatures } from "../src/index.ts"

// A Markdown image whose path starts with `/` names a file from the vault's root, as Obsidian reads
// it. The host is handed the path from the page's note to that file, which is how it finds a local
// image to optimize; a root path that names no file of the vault is left as written, for the host.
const FILES: Record<string, string> = {
  "notes/deep/host.md": "![](/assets/graph.svg)\n\n![](/elsewhere/logo.svg)\n",
  "notes/embedder.md": "![[host]]\n",
  "assets/graph.svg": "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>",
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-root-images-"))
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

test("a Markdown image with a path from the vault's root is the file there, from the note's own folder", async () => {
  const html = await render("notes/deep/host.md")
  assert.match(html, /<img src="\.\.\/\.\.\/assets\/graph\.svg" alt="">/)
  assert.match(html, /<img src="\/elsewhere\/logo\.svg" alt="">/)
})

test("in an embedded note, it is the file there, from the note whose page shows it", async () => {
  const html = await render("notes/embedder.md")
  assert.match(html, /<img src="\.\.\/assets\/graph\.svg" alt="">/)
  assert.match(html, /<img src="\/elsewhere\/logo\.svg" alt="">/)
})
