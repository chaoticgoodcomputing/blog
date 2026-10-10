import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml } from "satteri"
import { Vault, isExcalidraw, obsidian, obsidianExcalidraw, obsidianFeatures } from "../src/index.ts"

// A note that embeds a note that embeds a drawing. The embedded note is compiled on its own, and
// runs the host's plugins that go before the resolver, so the drawing is shown in it as it is on
// the embedded note's own page.
const FILES: Record<string, string> = {
  "post.md": "![[Shelf]]\n",
  "Shelf.md": "A drawing:\n\n![[loop]]\n",
  "doodles/loop.md": "---\nexcalidraw-plugin: parsed\n---\n\n# Excalidraw Data\n",
  "doodles/loop.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"></svg>',
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-drawings-in-embeds-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  vault = await Vault.open(root)
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

test("a drawing embedded in an embedded note is shown as its export, not as the drawing's note", async () => {
  const { html } = await markdownToHtml(FILES["post.md"]!, {
    features: obsidianFeatures,
    mdastPlugins: obsidian({
      vault,
      urlFor: (file) => (isExcalidraw(vault.metadataCache.getFileCache(file)) ? undefined : `/${file.path}`),
      beforeResolve: [obsidianExcalidraw({ vault, urlFor: (file) => `/drawings/${file.path}` })],
    }),
    fileURL: pathToFileURL(path.join(vault.root, "post.md")),
  })
  assert.equal(
    html.replace(/\n/g, ""),
    '<div class="internal-embed markdown-embed" data-src="Shelf">' +
      '<div class="markdown-embed-content"><p>A drawing:</p>' +
      '<p><span class="excalidraw-embed" data-src="loop">' +
      '<img class="excalidraw-svg" src="/drawings/doodles/loop.svg" alt="loop" width="100" height="50" loading="lazy">' +
      "</span></p></div>" +
      '<a class="internal-link markdown-embed-link" href="/Shelf.md" data-href="Shelf">Shelf</a>' +
      "</div>",
  )
})
