import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml } from "satteri"
import { Vault, obsidian, obsidianFeatures } from "../src/index.ts"

// Where a Markdown link goes when the note it is written in is embedded in another: from the note
// it is written in, as a wikilink there does. Two notes named Pot: from the vault's root `Pot` is
// the cellar's, from the kitchen the kitchen's, so the answer shows which note the link was read
// from.
const FILES: Record<string, string> = {
  "host.md": "![[Shelf]]\n",
  "kitchen/Shelf.md": "The [pot](Pot.md), the [list](./list.pdf), and the [[Pot|other pot]].\n",
  "kitchen/Pot.md": "The kitchen's pot.\n",
  "kitchen/list.pdf": "not really a pdf",
  "cellar/Pot.md": "The cellar's pot.\n",
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-embedded-links-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  vault = await Vault.open(root)
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

const urlFor = (file: { path: string }) => `/${file.path.replace(/\.md$/, "")}`

test("a Markdown link in an embedded note goes where it goes from the note it is written in", async () => {
  const { html } = await markdownToHtml(FILES["host.md"]!, {
    features: obsidianFeatures,
    mdastPlugins: obsidian({ vault, urlFor }),
    fileURL: pathToFileURL(path.join(vault.root, "host.md")),
  })
  assert.equal(
    html.replace(/\n/g, ""),
    '<div class="internal-embed markdown-embed" data-src="Shelf">' +
      '<div class="markdown-embed-content"><p>The ' +
      '<a href="/kitchen/Pot" class="internal-link" data-href="Pot.md">pot</a>, the ' +
      '<a href="/kitchen/list.pdf" class="internal-link" data-href="./list.pdf">list</a>, and the ' +
      '<a class="internal-link" href="/kitchen/Pot" data-href="Pot">other pot</a>.</p></div>' +
      '<a class="internal-link markdown-embed-link" href="/kitchen/Shelf" data-href="Shelf">Shelf</a>' +
      "</div>",
  )
})
