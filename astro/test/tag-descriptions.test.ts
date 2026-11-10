import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { indexNotes, type NoteIndex } from "../src/lib/notes.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own: a note under two tags, a Markdown and an MDX description note, and the
// description of a tag no note carries.
const FILES: Record<string, string> = {
  "a.md": "---\ntitle: A\ntags: [garden, fruit/apple]\n---\n\nA note.\n",
  "tags/garden.md": "---\ntitle: Garden\n---\n\nAbout the garden.\n",
  "tags/fruit.mdx": "---\ntitle: Fruit\n---\n\nAbout fruit.\n",
  "tags/nobody.md": "---\ntitle: Nobody\n---\n\nA tag no note carries.\n",
}

let root: string
let index: NoteIndex

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-tag-descriptions-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  index = indexNotes(await openVault(root))
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("a tag's description note is its note under tags/, Markdown or MDX, at its tag's page", () => {
  expect(index.tagDescription("garden")).toMatchObject({ title: "Garden", url: "/tags/garden" })
  expect(index.tagDescription("fruit")).toMatchObject({ title: "Fruit", url: "/tags/fruit" })
  expect(index.tagDescription("fruit/apple")).toBeUndefined()
})

test("the tags' description notes are every one of them, with no page for a tag no note carries", () => {
  const described = index.tagDescriptions().map((note) => [note.title, note.url])
  expect(described).toEqual([
    ["Fruit", "/tags/fruit"],
    ["Garden", "/tags/garden"],
    ["Nobody", undefined],
  ])
})
