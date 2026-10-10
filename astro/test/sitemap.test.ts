import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { indexNotes, type Unpublished } from "../src/lib/notes.ts"
import { sitemapEntry, type SitemapNotes } from "../src/lib/sitemap.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own, in no repository, so each note was last modified when its file was:
// the second column.
const FILES: Record<string, [contents: string, modified: string]> = {
  "index.md": ["---\ntitle: Home\n---\n\nHome.\n", "2026-07-07T07:07:07Z"],
  "content/essay.md": ["---\ntitle: Essay\ndate: 2025-01-02\n---\n\nAn essay.\n", "2026-04-04T04:04:04Z"],
  "content/Café Notes.md": ["---\ndate: 2025-01-03\n---\n\nA name an address has to encode.\n", "2026-04-05T00:00:00Z"],
  "content/diary.md": ["---\ndate: 2025-01-04\ntags: [private/work]\n---\n\nA private page.\n", "2026-04-06T00:00:00Z"],
  "garden/early.md": ["---\ntags: [garden/seasons]\n---\n\nUnder a tag under garden.\n", "2026-05-01T00:00:00Z"],
  "garden/late.md": ["---\ntags: [garden]\n---\n\nUnder garden.\n", "2026-05-02T00:00:00Z"],
  "garden/hidden.md": ["---\ntags: [garden/seasons, private]\n---\n\nUnder both, and private.\n", "2026-05-09T00:00:00Z"],
  "tags/garden.md": ["---\ntitle: '#garden'\n---\n\nAbout the garden.\n", "2026-05-05T00:00:00Z"],
  "content/afterword.md": ["---\ndate: 2025-01-05\n---\n\nA post with no tags.\n", "2026-06-01T00:00:00Z"],
  "orchard/pear.md": ["---\ntags: [orchard]\n---\n\nUnder orchard.\n", "2026-05-10T00:00:00Z"],
  "tags/orchard.mdx": ["---\ntitle: '#orchard'\n---\n\nAbout the orchard.\n", "2026-05-20T00:00:00Z"],
  "content/sealed.md": ["---\ntags: [sealed, private]\n---\n\nThe only page with its tag.\n", "2026-04-07T00:00:00Z"],
}
// Tag description notes taken out of publication, as the site's own come to be.
const RULES: Unpublished[] = [{ reason: "tag", test: (file) => file.path.startsWith("tags/") }]
const SITE = "https://example.com"

let root: string
let notes: SitemapNotes

// What the sitemap says of an address: when its page was last modified, or that it is not listed.
const lastModified = (address: string) => {
  const entry = sitemapEntry(address, notes)
  return entry ? (entry.lastModified?.toISOString() ?? "no date") : "not listed"
}

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-sitemap-"))
  for (const [file, [contents, modified]] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
    fs.utimesSync(path.join(root, file), new Date(modified), new Date(modified))
  }
  const index = indexNotes(await openVault(root), RULES)
  notes = { notes: index.notes, noteOf: (file) => index.byPath.get(file) }
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("a note's page is listed, last modified when the note was", () => {
  expect(lastModified(`${SITE}/content/essay`)).toBe("2026-04-04T04:04:04.000Z")
  expect(lastModified(`${SITE}/`)).toBe("2026-07-07T07:07:07.000Z")
  expect(lastModified(`${SITE}/content/Caf%C3%A9-Notes`)).toBe("2026-04-05T00:00:00.000Z")
})

test("a private page is not listed", () => {
  expect(lastModified(`${SITE}/content/diary`)).toBe("not listed")
  expect(lastModified(`${SITE}/garden/hidden`)).toBe("not listed")
})

test("a tag page is listed, last modified when the newest of its posts was, or its description note", () => {
  expect(lastModified(`${SITE}/tags/garden/seasons`)).toBe("2026-05-01T00:00:00.000Z")
  expect(lastModified(`${SITE}/tags/garden`)).toBe("2026-05-05T00:00:00.000Z")
  // A description note written in MDX is one too.
  expect(lastModified(`${SITE}/tags/orchard`)).toBe("2026-05-20T00:00:00.000Z")
})

test("the page of a tag only private pages carry, with no description note, is last modified when the newest of them was", () => {
  expect(lastModified(`${SITE}/tags/sealed`)).toBe("2026-04-07T00:00:00.000Z")
})

test("the tags index is last modified when the newest post it lists was, tagged or not, the home page's note not among them", () => {
  expect(lastModified(`${SITE}/tags`)).toBe("2026-06-01T00:00:00.000Z")
})

test("the tag page of a private tag, or of a tag under one, is not listed", () => {
  expect(lastModified(`${SITE}/tags/private`)).toBe("not listed")
  expect(lastModified(`${SITE}/tags/private/work`)).toBe("not listed")
  expect(lastModified(`${SITE}/tags/privateer`)).toBe("no date")
})

test("a page that is no note's and no tag's is listed, with no date", () => {
  expect(lastModified(`${SITE}/somewhere`)).toBe("no date")
})
