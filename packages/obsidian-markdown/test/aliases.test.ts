import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml } from "satteri"
import { Vault, obsidian, obsidianFeatures, parseFrontMatterAliases } from "../src/index.ts"

test("a note's aliases are its frontmatter's, written as a list or as one line", () => {
  assert.deepEqual(parseFrontMatterAliases({ aliases: ["Old Name", "archive/old-name"] }), [
    "Old Name",
    "archive/old-name",
  ])
  assert.deepEqual(parseFrontMatterAliases({ aliases: "Old Name, archive/old-name" }), ["Old Name", "archive/old-name"])
  assert.deepEqual(parseFrontMatterAliases({ alias: "Old Name" }), ["Old Name"])
  assert.deepEqual(parseFrontMatterAliases({ aliases: ["Old Name", " ", 2024, null, " Old Name "] }), [
    "Old Name",
    "2024",
  ])
})

test("a note that writes no alias has none", () => {
  assert.equal(parseFrontMatterAliases({ title: "A note" }), null)
  assert.equal(parseFrontMatterAliases({ aliases: [] }), null)
  assert.equal(parseFrontMatterAliases(undefined), null)
})

// A vault where one note has two old names, and another note's file has a name the first claims.
const FILES: Record<string, string> = {
  "index.md": "To [[Old Name]], to [[archive/old-name#Part|a part]], and to [[kept]].\n",
  "notes/new.md": "---\naliases: [Old Name, archive/old-name, kept]\n---\n\n# Part\n\nThe note.\n",
  "kept.md": "A note of that name.\n",
}

let root: string

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

test("a link written to an alias names no file, as in Obsidian", async () => {
  const vault = await Vault.open(root)
  assert.equal(vault.metadataCache.getFirstLinkpathDest("Old Name", "index.md"), null)
  assert.deepEqual(vault.metadataCache.unresolvedLinks["index.md"], { "Old Name": 1, "archive/old-name": 1 })
})

test("a vault asked to resolve aliases gives a link to an alias the note that has it", async () => {
  const { metadataCache } = await Vault.open(root, { resolveAliases: true })
  assert.equal(metadataCache.getFirstLinkpathDest("Old Name", "index.md")?.path, "notes/new.md")
  assert.equal(metadataCache.getFirstLinkpathDest("old name", "index.md")?.path, "notes/new.md")
  assert.equal(metadataCache.getFirstLinkpathDest("/archive/old-name", "kept.md")?.path, "notes/new.md")
  assert.equal(metadataCache.getFirstLinkpathDest("older name", "index.md"), null)
})

test("a file of that name comes before a note with that alias", async () => {
  const { metadataCache } = await Vault.open(root, { resolveAliases: true })
  assert.equal(metadataCache.getFirstLinkpathDest("kept", "index.md")?.path, "kept.md")
})

test("a link to an alias is a link to the note: counted, and among its backlinks", async () => {
  const { metadataCache } = await Vault.open(root, { resolveAliases: true })
  assert.deepEqual(metadataCache.resolvedLinks["index.md"], { "notes/new.md": 2, "kept.md": 1 })
  assert.equal(metadataCache.unresolvedLinks["index.md"], undefined)
  assert.deepEqual(
    metadataCache.getBacklinksForFile("notes/new.md").get("index.md")?.map((link) => link.link),
    ["Old Name", "archive/old-name#Part"],
  )
})

test("a wikilink to an alias is rendered as a link to the note's page", async () => {
  const vault = await Vault.open(root, { resolveAliases: true })
  const { html } = await markdownToHtml(FILES["index.md"]!, {
    features: obsidianFeatures,
    mdastPlugins: obsidian({ vault, urlFor: (file) => `/pages/${file.basename}` }),
    fileURL: pathToFileURL(path.join(vault.root, "index.md")),
  })
  assert.match(html, /<a class="internal-link" href="\/pages\/new" data-href="Old Name">Old Name<\/a>/)
  assert.match(html, /<a class="internal-link" href="\/pages\/new#part" data-href="archive\/old-name#Part">a part<\/a>/)
  assert.match(html, /<a class="internal-link" href="\/pages\/kept" data-href="kept">kept<\/a>/)
})

test("the links digest moves when a note gains an alias, where aliases are resolved", async () => {
  const note = path.join(root, "kept.md")
  const earlier = await Vault.open(root, { resolveAliases: true })
  const unasked = await Vault.open(root)
  fs.writeFileSync(note, "---\naliases: [Retained]\n---\n\nA note of that name.\n")
  try {
    assert.notEqual((await Vault.open(root, { resolveAliases: true })).linksDigest, earlier.linksDigest)
    assert.equal((await Vault.open(root)).linksDigest, unasked.linksDigest)
  } finally {
    fs.writeFileSync(note, FILES["kept.md"]!)
  }
})
