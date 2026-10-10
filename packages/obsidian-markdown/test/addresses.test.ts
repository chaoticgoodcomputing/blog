import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml } from "satteri"
import { Vault, obsidian, obsidianFeatures } from "../src/index.ts"

const FILES: Record<string, string> = {
  "index.md": "To [[page]], to [[drawing]], to [[drawing#Part|a part]], and ![[drawing]].\n",
  "page.md": "A note with a page.\n",
  "drawing.md": "# Part\n\nA note the site publishes no page for.\n",
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-"))
  for (const [file, contents] of Object.entries(FILES)) fs.writeFileSync(path.join(root, file), contents)
  vault = await Vault.open(root)
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

test("a link to a file the site publishes nowhere is unresolved, and keeps the address it was written with; an embed of a note still shows it, with no link back", async () => {
  const { html } = await markdownToHtml(FILES["index.md"]!, {
    features: obsidianFeatures,
    mdastPlugins: obsidian({
      vault,
      urlFor: (file) => (file.basename === "drawing" ? undefined : `/${file.basename}`),
    }),
    fileURL: pathToFileURL(path.join(vault.root, "index.md")),
  })

  assert.match(html, /<a class="internal-link" href="\/page" data-href="page">page<\/a>/)
  assert.match(html, /<a class="internal-link is-unresolved" href="drawing" data-href="drawing">drawing<\/a>/)
  assert.match(html, /<a class="internal-link is-unresolved" href="drawing#part" data-href="drawing#Part">a part<\/a>/)
  assert.match(
    html,
    /<div class="internal-embed markdown-embed" data-src="drawing"><div class="markdown-embed-content"><h1 id="part">Part<\/h1>\s*<p>A note the site publishes no page for.<\/p><\/div><\/div>/,
  )
})
