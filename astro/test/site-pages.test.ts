import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { indexNotes, type NoteIndex } from "../src/lib/notes.ts"
import { sitePageAt, sitePages } from "../src/lib/site-pages.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own: the home note, a described note, an undescribed one, an empty
// description, a private note that writes a description, an annotation page, and a tag with a
// description note.
const FILES: Record<string, string> = {
  "index.md": "---\ntitle: Home\n---\n\nWelcome home.\n",
  "content/described.md": "---\ntitle: Described\ndescription: About this note.\ntags: [garden]\n---\n\nIts first paragraph.\n",
  "content/undescribed.md": "---\ntitle: Undescribed\n---\n\nIts first paragraph says it.\n",
  "content/empty.md": "---\ntitle: Empty\ndescription: ''\n---\n\nThe paragraph instead.\n",
  "content/secret.md": "---\ntitle: Secret\ndescription: Words that stay home.\ntags: [private]\n---\n\nPrivate text.\n",
  "content/annotated.md": "---\ntitle: Annotated\nannotation-target: https://example.com/a.pdf\n---\n\nA preface.\n",
  "tags/garden.md": "---\ntitle: '#garden'\n---\n\nAbout the garden.\n",
}

let root: string
let index: NoteIndex

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-site-pages-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  index = indexNotes(await openVault(root))
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("the site's pages are its notes', its tags', the tags index, the 404 page and the graph page, each once at its address", () => {
  const pages = sitePages(index).map((page) => [page.url, page.kind])
  expect(pages.sort()).toEqual([
    ["/", "home"],
    ["/404", "404"],
    ["/content/annotated", "annotation"],
    ["/content/described", "note"],
    ["/content/empty", "note"],
    ["/content/secret", "note"],
    ["/content/undescribed", "note"],
    ["/graph", "graph"],
    ["/tags", "tag"],
    ["/tags/garden", "tag"],
    ["/tags/private", "tag"],
  ])
})

test("a page's description is its note's description property, else its first paragraph, and a private page's is the site's private description", () => {
  const descriptions = Object.fromEntries(sitePages(index).map((page) => [page.url, page.description]))
  expect(descriptions).toMatchObject({
    "/": "Welcome home.",
    "/content/described": "About this note.",
    "/content/undescribed": "Its first paragraph says it.",
    "/content/empty": "The paragraph instead.",
    // Whatever the note writes, nothing of a private page is shown.
    "/content/secret": "This is a private note.",
    "/tags/garden": "About the garden.",
    "/graph": "Every page of the site, and how they connect.",
  })
  expect(descriptions["/tags"]).toBeUndefined()
  expect(descriptions["/404"]).toBeUndefined()
})

test("every page is discoverable but a private page, a private tag's page, the 404 page and the graph page", () => {
  const hidden = sitePages(index).filter((page) => !page.discoverable).map((page) => page.url)
  expect(hidden.sort()).toEqual(["/404", "/content/secret", "/graph", "/tags/private"])
})

test("every discoverable page is indexable but a tag page", () => {
  const unindexed = sitePages(index).filter((page) => page.discoverable && !page.indexable)
  expect(unindexed.length).toBeGreaterThan(0)
  expect(unindexed.every((page) => page.kind === "tag")).toBe(true)
  expect(sitePages(index).filter((page) => page.kind === "tag").some((page) => page.indexable)).toBe(false)
})

test("a page is found by its address, and an address no page has finds none", () => {
  expect(sitePageAt(index, "/content/described")).toMatchObject({ kind: "note", title: "Described" })
  expect(sitePageAt(index, "/tags/garden")).toMatchObject({ kind: "tag", tag: "garden", title: "#garden" })
  expect(sitePageAt(index, "/nowhere")).toBeUndefined()
})
