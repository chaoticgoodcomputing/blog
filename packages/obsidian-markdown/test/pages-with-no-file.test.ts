import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml } from "satteri"
import { Vault, obsidian, obsidianFeatures } from "../src/index.ts"

// A site may publish a page that is no file of the vault, such as a tag's page. A wikilink to its
// path, which Obsidian leaves unresolved, goes there when the site says so.
const FILES: Record<string, string> = {
  "index.md":
    "To [[topics/birds|birds]], to [[/topics/birds#Owls|owls]], to [[topics/fish|fish]], to [[page]], and ![[topics/birds]].\n",
  "page.md": "A note with a page.\n",
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-"))
  for (const [file, contents] of Object.entries(FILES)) fs.writeFileSync(path.join(root, file), contents)
  vault = await Vault.open(root)
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

const render = (urlForPath?: (linkpath: string) => string | undefined) =>
  markdownToHtml(FILES["index.md"]!, {
    features: obsidianFeatures,
    mdastPlugins: obsidian({
      vault,
      urlFor: (file) => `/${file.basename}`,
      ...(urlForPath && { urlForPath }),
    }),
    fileURL: pathToFileURL(path.join(vault.root, "index.md")),
  })

test("a wikilink to a path no file has goes to the page the site publishes there, and is resolved", async () => {
  const seen: string[] = []
  const { html } = await render((linkpath) => {
    seen.push(linkpath)
    return linkpath.replace(/^\//, "") === "topics/birds" ? "/topics/birds" : undefined
  })

  assert.match(html, /<a class="internal-link" href="\/topics\/birds" data-href="topics\/birds">birds<\/a>/)
  assert.match(html, /<a class="internal-link" href="\/topics\/birds#owls" data-href="\/topics\/birds#Owls">owls<\/a>/)
  // A path the site publishes nothing at stays unresolved.
  assert.match(html, /<a class="internal-link is-unresolved" href="topics\/fish" data-href="topics\/fish">fish<\/a>/)
  // An embed of it is a link to the page: there is no note to show in place.
  assert.match(html, /<a class="internal-embed" data-src="topics\/birds" href="\/topics\/birds" data-href="topics\/birds">/)
  // A link to a file of the vault never asks.
  assert.match(html, /<a class="internal-link" href="\/page" data-href="page">page<\/a>/)
  assert.ok(!seen.includes("page"))
})

test("with no such pages, a wikilink to a path no file has is unresolved", async () => {
  const { html } = await render()
  assert.match(html, /<a class="internal-link is-unresolved" href="topics\/birds" data-href="topics\/birds">birds<\/a>/)
})
