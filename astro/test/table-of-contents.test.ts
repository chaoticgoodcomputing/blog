import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { indexNotes, type Note } from "../src/lib/notes.ts"
import { tableOfContents } from "../src/lib/table-of-contents.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own. Its notes' headings, and the list of a rendered page's headings that
// Astro gives for each, written out as Astro writes it.
const FILES: Record<string, string> = {
  "sections.md": [
    "---\ntitle: Sections\n---",
    "## First",
    "### Under the first",
    "#### Too deep to list",
    "## Second",
    "![[shelf]]",
    "## First",
  ].join("\n\n"),
  "shelf.md": "## On the shelf\n\nAn embedded note's heading.\n",
  "math.md": "---\ntitle: Math\n---\n\n## The $x$ value\n\nThe value of $x$.\n",
  "top.md": "# A title in the body\n\n## Under it\n",
  "plain.md": "---\ntitle: Plain\n---\n\nNo headings at all.\n",
}

let root: string
let notes: Map<string, Note>

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-table-of-contents-"))
  for (const [file, contents] of Object.entries(FILES)) fs.writeFileSync(path.join(root, file), contents)
  notes = new Map(indexNotes(await openVault(root), []).notes.map((note) => [note.id, note]))
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("each of the note's headings to the third level is an entry, in order, indented under the one above it", () => {
  const headings = [
    { depth: 2, slug: "first", text: "First" },
    { depth: 3, slug: "under-the-first", text: "Under the first" },
    { depth: 4, slug: "too-deep-to-list", text: "Too deep to list" },
    { depth: 2, slug: "second", text: "Second" },
    { depth: 2, slug: "on-the-shelf", text: "On the shelf" },
    { depth: 2, slug: "first-1", text: "First" },
  ]
  expect(tableOfContents(headings, notes.get("sections")!)).toEqual([
    { slug: "first", text: "First", indent: 0 },
    { slug: "under-the-first", text: "Under the first", indent: 1 },
    { slug: "second", text: "Second", indent: 0 },
    { slug: "first-1", text: "First", indent: 0 },
  ])
})

test("a heading with math reads as its math is written, not as it is typeset", () => {
  // Astro's text for the heading is the typeset formula's: its MathML, its TeX and its glyphs.
  const headings = [{ depth: 2, slug: "the-x-value", text: "The xxx value" }]
  expect(tableOfContents(headings, notes.get("math")!)).toEqual([{ slug: "the-x-value", text: "The x value", indent: 0 }])
})

test("the shallowest heading listed is not indented, whatever its level", () => {
  const headings = [
    { depth: 1, slug: "a-title-in-the-body", text: "A title in the body" },
    { depth: 2, slug: "under-it", text: "Under it" },
  ]
  expect(tableOfContents(headings, notes.get("top")!)).toEqual([
    { slug: "a-title-in-the-body", text: "A title in the body", indent: 0 },
    { slug: "under-it", text: "Under it", indent: 1 },
  ])
})

test("a note with no headings has no entries", () => {
  expect(tableOfContents([], notes.get("plain")!)).toEqual([])
})
