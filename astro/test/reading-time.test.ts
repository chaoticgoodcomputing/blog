import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { afterAll, beforeAll, expect, test } from "vitest"
import { indexNotes, type Note } from "../src/lib/notes.ts"
import { readingMinutes } from "../src/lib/reading-time.ts"
import { openVault } from "../src/lib/vault.ts"

const words = (count: number) => Array.from({ length: count }, () => "word").join(" ")

// A vault of this file's own, each note with a body of a known number of words.
const FILES: Record<string, string> = {
  "short.md": `---\ntitle: Short\n---\n\n${words(150)}\n`,
  "long.md": `---\ntitle: Long\n---\n\n${words(450)}\n`,
  "exact.md": `---\ntitle: Exact\n---\n\n${words(400)}\n`,
  // Two hundred words of frontmatter, and one of body.
  "wordy-frontmatter.md": `---\ntitle: Wordy\ndescription: ${words(200)}\n---\n\nHello.\n`,
  // Four hundred words in a comment, as an annotation note keeps its annotations' data, and one
  // shown.
  "commented.md": `---\ntitle: Commented\n---\n\n%%\n${words(400)}\n%%\n\nHello.\n`,
  "empty.md": "---\ntitle: Empty\n---\n",
}

let root: string
let vault: Vault
let notes: Map<string, Note>

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-reading-time-"))
  for (const [file, contents] of Object.entries(FILES)) fs.writeFileSync(path.join(root, file), contents)
  vault = await openVault(root)
  notes = new Map(indexNotes(vault, []).notes.map((note) => [note.title, note]))
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("a note is read at two hundred words a minute, and a minute begun is a minute", () => {
  expect(readingMinutes(notes.get("Short")!, vault)).toBe(1)
  expect(readingMinutes(notes.get("Exact")!, vault)).toBe(2)
  expect(readingMinutes(notes.get("Long")!, vault)).toBe(3)
})

test("frontmatter is not read, nor is a comment", () => {
  expect(readingMinutes(notes.get("Wordy")!, vault)).toBe(1)
  expect(readingMinutes(notes.get("Commented")!, vault)).toBe(1)
})

test("a note with no body takes no time to read", () => {
  expect(readingMinutes(notes.get("Empty")!, vault)).toBe(0)
})
