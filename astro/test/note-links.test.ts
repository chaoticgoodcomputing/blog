import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { indexNotes, unpublished, type NoteIndex, type Unpublished } from "../src/lib/notes.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own: a note that links, embeds, links itself, a drawing, a tag's
// description note, a tag's page by path, and nothing at all.
const FILES: Record<string, string> = {
  "a.md": "---\ntitle: A\ntags: [garden]\n---\n\nSee [[b]], ![[c]], [[a|itself]], [[drawing]], [[tags/garden]], [[tags/fruit]] and [[nowhere]].\n",
  "b.md": "---\ntitle: B\n---\n\nSee [[a]].\n",
  "c.md": "---\ntitle: C\ntags: [fruit]\n---\n\nEmbedded.\n",
  "drawing.md": "---\nkind: drawing\n---\n\nSee [[a]].\n",
  "tags/garden.md": "---\ntitle: Garden\n---\n\nAbout the garden.\n",
}
const RULES: Unpublished[] = [
  { reason: "drawing", test: (_file, cache) => cache.frontmatter?.kind === "drawing" },
  unpublished.find((rule) => rule.reason === "tag description")!,
]

let root: string
let index: NoteIndex
const note = (file: string) => index.byPath.get(file)!
const urls = (notes: { url?: string | undefined }[]) => notes.map((each) => each.url).sort()

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-note-links-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  index = indexNotes(await openVault(root), RULES)
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("a note's outlinks are the notes with a page it links to or embeds, each once: not itself, a drawing, or nothing", () => {
  // The garden's description note leads to the garden's page.
  expect(urls(index.outlinks(note("a.md")))).toEqual(["/b", "/c", "/tags/garden"])
})

test("a note's backlinks are the notes with a page that link to or embed it, each once: not a drawing", () => {
  expect(urls(index.backlinks(note("a.md")))).toEqual(["/b"])
  expect(urls(index.backlinks(note("c.md")))).toEqual(["/a"])
})

test("a link to a path no file has leads to a tag's page when the tag has one, and otherwise nowhere", () => {
  expect(index.tagLinks(note("a.md"))).toEqual(["/tags/fruit"])
})
