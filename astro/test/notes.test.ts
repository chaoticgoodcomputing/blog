import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { afterAll, beforeAll, expect, test } from "vitest"
import {
  getLinksDigest,
  getNote,
  getNotes,
  getPublicNotes,
  getUnpublished,
  indexNotes,
  isPrivate,
  isPublished,
  newestFirst,
  noteOf,
  tagsOf,
  urlOf,
  type Unpublished,
} from "../src/lib/notes.ts"
import { getVault, openVault } from "../src/lib/vault.ts"

// The site's own notes are the fixture vault's (vitest.config.ts). Other features add notes to
// it, so what is asked of it here is asked note by note, never as a total.

test("a published note knows its address, title, description, tags and date", () => {
  const alpha = getNote("content/notes/alpha")!
  expect(alpha).toMatchObject({
    id: "content/notes/alpha",
    url: "/content/notes/alpha",
    title: "Alpha",
    description: "The first note.",
    tags: ["engineering/ai", "writing/articles"],
    tagsWithAncestors: ["engineering", "engineering/ai", "writing", "writing/articles"],
    isPrivate: false,
  })
  expect(alpha.file.path).toBe("content/notes/alpha.md")
  expect(alpha.date.toISOString()).toBe("2026-01-04T00:00:00.000Z")
  expect(getNote("content/notes/beta")!.date.toISOString()).toBe("2026-03-01T12:00:00.000Z")
})

test("the index note is the page at the site's root", () => {
  expect(getNote("index")!.url).toBe("/")
})

test("a note under a private tag is a private page: published, and not public", () => {
  expect(getNote("content/notes/secret")!.isPrivate).toBe(true)
  expect(getNotes().map((note) => note.id)).toContain("content/notes/secret")
  expect(getPublicNotes().map((note) => note.id)).not.toContain("content/notes/secret")
  expect(getPublicNotes().map((note) => note.id)).toContain("content/notes/alpha")
})

test("a note with no title is named for its file, one with no description has none, and one with no date still has one", () => {
  const undated = getNote("content/notes/undated")!
  expect(undated.title).toBe("undated")
  expect(undated.description).toBeUndefined()
  expect(Number.isNaN(undated.date.getTime())).toBe(false)
  expect(undated.modified.getTime()).toBeGreaterThanOrEqual(undated.date.getTime())
})

test("a file of the vault is looked up as the note it is, and a link to it goes to its page", () => {
  const file = getVault().getFileByPath("content/notes/alpha.md")!
  expect(noteOf(file)).toBe(getNote("content/notes/alpha"))
  expect(noteOf("content/notes/alpha.md")).toBe(getNote("content/notes/alpha"))
  expect(isPublished(file)).toBe(true)
  expect(urlOf(file)).toBe("/content/notes/alpha")
  expect(noteOf("content/notes/nothing.md")).toBeUndefined()
  expect(isPublished("content/notes/nothing.md")).toBe(false)
  expect(getUnpublished("no such reason")).toEqual([])
})

test("a note under one of the site's article folders is an article, private or not", () => {
  expect(getNote("content/notes/alpha")!.isArticle).toBe(true)
  expect(getNote("content/notes/secret")!.isArticle).toBe(true)
  expect(getNote("index")!.isArticle).toBe(false)
  expect(getPublicNotes().filter((note) => note.isArticle).map((note) => note.id)).not.toContain("content/notes/secret")
})

test("tags make a page private when one of them is a private tag or under one", () => {
  expect(isPrivate(["engineering", "private"])).toBe(true)
  expect(isPrivate(["private/work"])).toBe(true)
  expect(isPrivate(["privateer", "engineering/private"])).toBe(false)
})

// A vault of this file's own, in no repository, for what is asked of a whole vault.
const FILES: Record<string, string> = {
  "index.md": "---\ntitle: Home\n---\n\nHome.\n",
  "notes/index.md": "---\ntitle: Notes\ndate: 2026-02-01\n---\n\nA folder's own note.\n",
  "notes/My Note & Co.md": "---\ndate: 2026-02-01\ntags: [garden/seasons, '#garden']\n---\n\nSee [[drawing]].\n",
  "notes/older.md": "---\ntitle: Older\ndate: 2025-12-31\ntags: garden/seasons/rhythm, private/work\n---\n\nOlder.\n",
  "notes/widget.mdx": "---\ntitle: Aardvark\ndate: 2026-02-01\ndescription: '  An MDX note.  '\n---\n\nAn MDX note.\n",
  "art/drawing.md": "---\nkind: drawing\n---\n\nNot a page.\n",
  "art/drawing.svg": "<svg xmlns='http://www.w3.org/2000/svg'/>",
  "tags/garden.md": "---\ntitle: '#garden'\nkind: tag\n---\n\nAbout the garden.\n",
  "content/essay.md": "---\ntitle: Essay\ndate: 2025-01-02\n---\n\nUnder the article folder.\n",
  "contents.md": "---\ntitle: Contents\ndate: 2025-01-01\n---\n\nBeside the article folder, not under it.\n",
}
const RULES: Unpublished[] = [
  { reason: "drawing", test: (_file, cache) => cache.frontmatter?.kind === "drawing" },
  { reason: "tag", test: (_file, cache) => cache.frontmatter?.kind === "tag", url: (file) => `/tags/${file.basename}` },
]
const TOUCHED = new Date("2026-08-09T10:11:12Z")

let root: string
let vault: Vault

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-notes-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
    fs.utimesSync(path.join(root, file), TOUCHED, TOUCHED)
  }
  vault = await openVault(root)
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("the published notes are every note of the vault, Markdown and MDX, each at its slug", () => {
  const index = indexNotes(vault, [])
  expect(index.notes.map((note) => [note.id, note.url])).toEqual([
    ["art/drawing", "/art/drawing"],
    ["content/essay", "/content/essay"],
    ["contents", "/contents"],
    ["index", "/"],
    ["notes/My-Note--and--Co", "/notes/My-Note--and--Co"],
    ["notes/index", "/notes"],
    ["notes/older", "/notes/older"],
    ["notes/widget", "/notes/widget"],
    ["tags/garden", "/tags/garden"],
  ])
  expect(index.byId.get("notes/widget")).toMatchObject({ title: "Aardvark", description: "An MDX note." })
  expect(index.byId.get("notes/My-Note--and--Co")!.frontmatter).toEqual({
    date: "2026-02-01",
    tags: ["garden/seasons", "#garden"],
  })
})

test("a note's tags are tag slugs, in the order written", () => {
  const index = indexNotes(vault, [])
  expect(index.byId.get("notes/My-Note--and--Co")).toMatchObject({
    tags: ["garden/seasons", "garden"],
    tagsWithAncestors: ["garden", "garden/seasons"],
    isPrivate: false,
  })
  expect(index.byId.get("notes/older")).toMatchObject({
    tags: ["garden/seasons/rhythm", "private/work"],
    isPrivate: true,
  })
})

test("a note git doesn't know, with no date of its own, takes its file's time", () => {
  const index = indexNotes(vault, [])
  expect(index.byId.get("index")!.date.toISOString()).toBe("2026-08-09T10:11:12.000Z")
  expect(index.byId.get("index")!.modified.toISOString()).toBe("2026-08-09T10:11:12.000Z")
  expect(index.byId.get("notes/older")!.date.toISOString()).toBe("2025-12-31T00:00:00.000Z")
  expect(index.byId.get("notes/older")!.modified.toISOString()).toBe("2026-08-09T10:11:12.000Z")
})

test("a kind of note taken out of publication has no page, and is still a note", () => {
  const index = indexNotes(vault, RULES)
  expect(index.notes.map((note) => note.id)).toEqual([
    "content/essay",
    "contents",
    "index",
    "notes/My-Note--and--Co",
    "notes/index",
    "notes/older",
    "notes/widget",
  ])
  expect(index.byId.has("art/drawing")).toBe(false)
  expect(index.unpublished.get("drawing")!.map((note) => [note.title, note.reason, note.url])).toEqual([
    ["drawing", "drawing", undefined],
  ])
  expect(index.unpublished.get("tag")!.map((note) => [note.title, note.reason, note.url])).toEqual([
    ["#garden", "tag", "/tags/garden"],
  ])
  expect(index.byPath.get("art/drawing.md")).toBe(index.unpublished.get("drawing")![0])
})

test("a link goes to a note's page, to where its kind says when it has none, and to an attachment's own path", () => {
  const index = indexNotes(vault, RULES)
  const address = (file: string) => index.urlOf(vault.getFileByPath(file)!)
  expect(address("notes/older.md")).toBe("/notes/older")
  expect(address("tags/garden.md")).toBe("/tags/garden")
  expect(address("art/drawing.md")).toBeUndefined()
  expect(address("art/drawing.svg")).toBe("/art/drawing.svg")
})

test("an article is a note under an article folder, and a note beside one is none", () => {
  const index = indexNotes(vault, RULES)
  expect(index.byId.get("content/essay")!.isArticle).toBe(true)
  expect(index.byId.get("contents")!.isArticle).toBe(false)
  expect(index.byId.get("notes/older")!.isArticle).toBe(false)
})

test("the links digest moves when a rule takes a note out of publication, or sends links to it elsewhere", () => {
  const all = indexNotes(vault, []).linksDigest
  expect(all).toMatch(/^[0-9a-f]{64}$/)
  expect(indexNotes(vault, []).linksDigest).toBe(all)

  const ruled = indexNotes(vault, RULES).linksDigest
  expect(ruled).not.toBe(all)
  expect(indexNotes(vault, RULES).linksDigest).toBe(ruled)

  const elsewhere: Unpublished[] = [RULES[0]!, { ...RULES[1]!, url: (file) => `/topics/${file.basename}` }]
  expect(indexNotes(vault, elsewhere).linksDigest).not.toBe(ruled)
  const nowhere: Unpublished[] = [RULES[0]!, { reason: "tag", test: RULES[1]!.test }]
  expect(indexNotes(vault, nowhere).linksDigest).not.toBe(ruled)
})

test("the links digest moves with the vault's own, when a note is added", async () => {
  const before = indexNotes(vault, RULES).linksDigest
  const added = path.join(root, "notes/added.md")
  fs.writeFileSync(added, "Added.\n")
  try {
    expect(indexNotes(await openVault(root), RULES).linksDigest).not.toBe(before)
  } finally {
    fs.rmSync(added)
  }
  expect(indexNotes(await openVault(root), RULES).linksDigest).toBe(before)
})

test("the site's own links digest is its vault's index's", () => {
  expect(getLinksDigest()).toBe(indexNotes(getVault()).linksDigest)
})

test("the tags in use are every tag a note carries and every ancestor of one, each with its notes", () => {
  const tags = tagsOf(indexNotes(vault, RULES).notes)
  expect([...tags.keys()]).toEqual(["garden", "garden/seasons", "garden/seasons/rhythm", "private", "private/work"])
  const titles = (notes: Array<{ title: string }>) => notes.map((note) => note.title)
  expect(titles(tags.get("garden")!.own)).toEqual(["My Note & Co"])
  expect(titles(tags.get("garden")!.under)).toEqual(["My Note & Co", "Older"])
  expect(titles(tags.get("garden/seasons")!.own)).toEqual(["My Note & Co"])
  expect(titles(tags.get("garden/seasons")!.under)).toEqual(["My Note & Co", "Older"])
  expect(titles(tags.get("garden/seasons/rhythm")!.own)).toEqual(["Older"])
  expect(titles(tags.get("private")!.own)).toEqual([])
})

test("notes are listed newest first, and by title on the same day", () => {
  const titles = [...indexNotes(vault, RULES).notes].sort(newestFirst).map((note) => note.title)
  expect(titles).toEqual(["Home", "Aardvark", "My Note & Co", "Notes", "Older", "Essay", "Contents"])
})
