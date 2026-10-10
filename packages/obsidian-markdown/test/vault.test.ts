import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml } from "satteri"
import { Vault, getAllTags, obsidian, obsidianFeatures, parseMetadata } from "../src/index.ts"

const FILES: Record<string, string> = {
  "index.md": "---\ntitle: Home\ntags: [meta]\nrelated: '[[notes/alpha]]'\n---\n\nTo [[alpha]] and [[Beta Note#Second part|beta]] and [[missing]].\n",
  "notes/alpha.md":
    "---\ntitle: Alpha\ntags:\n  - engineering/ai\n---\n\n# Alpha\n\nA block. ^blk\n\n![[diagram.png|300]] and ![[Beta Note]] and [md link](../index.md) and [out](https://example.com).\n\nSelf: [[#^blk|here]]. %%[[hidden]]%% Inline #garden/seasons tag.\n",
  "notes/Beta Note.md": "# First part\n\n## Second part\n\n## Second part\n\nBack to [[/index]] and [[sub/alpha]].\n",
  "notes/sub/alpha.md": "---\ntags: engineering/ai, writing\n---\n\nThe other alpha links to [[alpha]].\n",
  "assets/diagram.png": "not really a png",
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  fs.mkdirSync(path.join(root, ".obsidian"))
  fs.writeFileSync(path.join(root, ".obsidian/app.json"), "{}")
  vault = await Vault.open(root)
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

test("a note's metadata holds its frontmatter, headings, links, embeds, tags and blocks", async () => {
  const source = FILES["notes/alpha.md"]!
  const cache = await parseMetadata(source)
  assert.deepEqual(cache.frontmatter, { title: "Alpha", tags: ["engineering/ai"] })
  assert.deepEqual(cache.headings?.map(({ heading, level }) => [heading, level]), [["Alpha", 1]])
  assert.deepEqual(cache.links?.map((link) => link.link), ["../index.md", "#^blk"])
  assert.deepEqual(cache.embeds?.map((embed) => embed.link), ["diagram.png", "Beta Note"])
  assert.deepEqual(cache.tags?.map((tag) => tag.tag), ["#garden/seasons"])
  assert.deepEqual(Object.keys(cache.blocks ?? {}), ["blk"])
  assert.deepEqual(getAllTags(cache), ["#engineering/ai", "#garden/seasons"])
})

test("a link's position is where it sits in the source", async () => {
  const source = "Café — [[naïve note|alias]] end.\n"
  const [link] = (await parseMetadata(source)).links!
  assert.equal(link!.original, "[[naïve note|alias]]")
  assert.equal(source.slice(link!.position.start.offset, link!.position.end.offset), link!.original)
  assert.equal(link!.displayText, "alias")
})

test("a wikilink in frontmatter is a frontmatter link", async () => {
  const cache = vault.metadataCache.getFileCache("index.md")!
  assert.deepEqual(cache.frontmatterLinks, [
    { key: "related", link: "notes/alpha", original: "[[notes/alpha]]", displayText: "notes/alpha" },
  ])
})

test("the vault lists every file but dotfiles, and knows which are notes", () => {
  assert.deepEqual(
    vault.getFiles().map((file) => file.path),
    ["assets/diagram.png", "index.md", "notes/Beta Note.md", "notes/alpha.md", "notes/sub/alpha.md"],
  )
  assert.equal(vault.getMarkdownFiles().length, 4)
  assert.deepEqual(vault.getFileByPath("notes/Beta Note.md"), {
    path: "notes/Beta Note.md",
    name: "Beta Note.md",
    basename: "Beta Note",
    extension: "md",
  })
})

test("a linkpath resolves by path, then beside its source, then by the shortest path", () => {
  const cache = vault.metadataCache
  const dest = (linkpath: string, from: string) => cache.getFirstLinkpathDest(linkpath, from)?.path ?? null
  assert.equal(dest("notes/alpha", "index.md"), "notes/alpha.md")
  assert.equal(dest("alpha", "index.md"), "notes/alpha.md", "the shorter path wins a tie")
  assert.equal(dest("alpha", "notes/sub/alpha.md"), "notes/sub/alpha.md", "a note beside the source wins")
  assert.equal(dest("sub/alpha", "index.md"), "notes/sub/alpha.md")
  assert.equal(dest("beta note", "index.md"), "notes/Beta Note.md", "case doesn't matter")
  assert.equal(dest("diagram.png", "notes/alpha.md"), "assets/diagram.png")
  assert.equal(dest("diagram", "notes/alpha.md"), null, "only a note goes without its extension")
  assert.equal(dest("/index", "notes/Beta Note.md"), "index.md")
  assert.equal(dest("/alpha", "index.md"), null, "a leading slash holds the path to the root")
  assert.equal(dest("../index.md", "notes/alpha.md"), "index.md")
  assert.equal(dest("missing", "index.md"), null)
})

test("resolved and unresolved links are counted per source, a comment's link not at all", () => {
  const cache = vault.metadataCache
  assert.deepEqual(cache.resolvedLinks["index.md"], { "notes/alpha.md": 2, "notes/Beta Note.md": 1 })
  assert.deepEqual(cache.unresolvedLinks, { "index.md": { missing: 1 } })
  assert.deepEqual(cache.resolvedLinks["notes/alpha.md"], {
    "assets/diagram.png": 1,
    "notes/Beta Note.md": 1,
    "index.md": 1,
  })
})

test("a file's backlinks are the notes that link to it, each with its links", () => {
  const backlinks = vault.metadataCache.getBacklinksForFile("notes/alpha.md")
  assert.deepEqual([...backlinks.keys()], ["index.md"])
  assert.deepEqual(backlinks.get("index.md")!.map((link) => link.link), ["alpha", "notes/alpha"])
  assert.deepEqual([...vault.metadataCache.getBacklinksForFile("index.md").keys()].sort(), [
    "notes/Beta Note.md",
    "notes/alpha.md",
  ])
})

test("tags are counted across the vault, frontmatter's and the body's", () => {
  const cache = vault.metadataCache
  assert.deepEqual(cache.getTags(), { "#meta": 1, "#engineering/ai": 2, "#garden/seasons": 1, "#writing": 1 })
  assert.deepEqual(cache.getFilesWithTag("engineering", { nested: true }).map((file) => file.path), [
    "notes/alpha.md",
    "notes/sub/alpha.md",
  ])
  assert.deepEqual(cache.getFilesWithTag("engineering"), [])
})

test("a subpath resolves to a heading's anchor, numbered like the page's, or to a block's", () => {
  const cache = vault.metadataCache
  const beta = cache.getFileCache("notes/Beta Note.md")!
  assert.equal(cache.resolveSubpath(beta, "#Second part")?.anchor, "second-part")
  assert.equal(cache.resolveSubpath(beta, "#second PART")?.anchor, "second-part")
  assert.equal(cache.resolveSubpath(beta, "#Nope"), null)
  assert.equal(cache.resolveSubpath(cache.getFileCache("notes/alpha.md")!, "#^blk")?.anchor, "^blk")
})

test("the digest changes when a note does, the links digest only when a link could", async () => {
  const again = await Vault.open(root)
  assert.equal(again.digest, vault.digest)
  assert.equal(again.linksDigest, vault.linksDigest)

  fs.appendFileSync(path.join(root, "index.md"), "\nMore.\n")
  const edited = await Vault.open(root)
  assert.notEqual(edited.digest, vault.digest)
  assert.equal(edited.linksDigest, vault.linksDigest, "a note's prose is nothing another note links to")

  fs.appendFileSync(path.join(root, "index.md"), "\n## A new heading\n")
  assert.notEqual((await Vault.open(root)).linksDigest, vault.linksDigest, "a heading is")

  fs.writeFileSync(path.join(root, "notes/gamma.md"), "New.\n")
  const added = await Vault.open(root)
  fs.rmSync(path.join(root, "notes/gamma.md"))
  assert.notEqual(added.linksDigest, edited.linksDigest, "and so is a new note")
})

test("the resolver asks a vault given as a function for each note", async () => {
  let asked = 0
  const plugins = obsidian({
    vault: () => (asked++, vault),
    urlFor: (file) => `/${file.path}`,
  })
  const render = () => markdownToHtml("[[alpha]]", { features: obsidianFeatures, mdastPlugins: plugins })
  await render()
  await render()
  assert.equal(asked, 2)
})

test("the resolver gives each link its page, and each embedded image a path from the note", async () => {
  const urlFor = (file: { path: string }) => `/${file.path.replace(/\.md$/, "").replace(/ /g, "-")}`
  const html = async (file: string) =>
    (
      await markdownToHtml(FILES[file]!, {
        features: obsidianFeatures,
        mdastPlugins: obsidian({ vault, urlFor, tagUrl: (tag) => `/tags/${tag}` }),
        fileURL: pathToFileURL(path.join(vault.root, file)),
      })
    ).html

  const index = await html("index.md")
  assert.match(index, /<a class="internal-link" href="\/notes\/alpha" data-href="alpha">alpha<\/a>/)
  assert.match(index, /href="\/notes\/Beta-Note#second-part" data-href="Beta Note#Second part">beta<\/a>/)
  assert.match(index, /<a class="internal-link is-unresolved" href="missing" data-href="missing">missing<\/a>/)

  const alpha = await html("notes/alpha.md")
  assert.match(alpha, /<img src="..\/assets\/diagram.png" alt="diagram" width="300">/)
  assert.match(alpha, /<div class="internal-embed markdown-embed" data-src="Beta Note">/)
  assert.match(alpha, /<a class="internal-link" href="#\^blk" data-href="#\^blk">here<\/a>/)
  assert.match(alpha, /<a class="tag" href="\/tags\/garden\/seasons">#garden\/seasons<\/a>/)
  assert.match(alpha, /<a href="\/index" class="internal-link" data-href="..\/index.md">md link<\/a>/)
  assert.doesNotMatch(alpha, /hidden/)
})
