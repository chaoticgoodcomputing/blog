import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { indexNotes } from "../src/lib/notes.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own, in no repository: one note embeds another, and a third embeds none.
const FILES: Record<string, string> = {
  "embedding.md": "---\ntitle: Embedding\n---\n\n![[embedded]]\n",
  "embedded.md": "---\ntitle: Embedded\n---\n\nShown on the embedding note's page.\n",
  "alone.md": "---\ntitle: Alone\n---\n\nEmbedded nowhere.\n",
}

let root: string

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-note-embeds-"))
  for (const [file, contents] of Object.entries(FILES)) fs.writeFileSync(path.join(root, file), contents)
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

const digest = async () => indexNotes(await openVault(root), []).linksDigest

// The notes' loader renders every note again when the links digest moves (src/content.config.ts).
test("an edit to an embedded note moves the links digest, so the note that embeds it is rendered again", async () => {
  const before = await digest()
  fs.appendFileSync(path.join(root, "embedded.md"), "\nAnd a line more.\n")
  expect(await digest()).not.toBe(before)
})

test("an edit to a note no note embeds leaves it, so only that note is rendered again", async () => {
  const before = await digest()
  fs.appendFileSync(path.join(root, "alone.md"), "\nAnd a line more.\n")
  expect(await digest()).toBe(before)
})
