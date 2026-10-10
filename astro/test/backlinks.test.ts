import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { afterAll, beforeAll, expect, test } from "vitest"
import { backlinksOf } from "../src/lib/backlinks.ts"
import { indexNotes, type NoteIndex, type Unpublished } from "../src/lib/notes.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own, in no repository, so that when each note last changed is its file's
// time, which the test sets.
const FILES: Record<string, { source: string; changed: string }> = {
  "target.md": { source: "---\ntitle: Target\n---\n\nLinked to.\n", changed: "2026-01-01" },
  "lonely.md": { source: "---\ntitle: Lonely\n---\n\nNothing links here.\n", changed: "2026-01-01" },
  "old.md": { source: "---\ntitle: Old\n---\n\nSee [[target]].\n", changed: "2025-01-01" },
  "new.md": { source: "---\ntitle: New\n---\n\nSee [[target]] and [[target|again]].\n", changed: "2026-06-01" },
  "embeds.md": { source: "---\ntitle: Embeds\n---\n\n![[target]]\n", changed: "2025-01-01" },
  "secret.md": { source: "---\ntitle: Secret\ntags: [private]\n---\n\nSee [[target]].\n", changed: "2026-09-01" },
  "work.md": { source: "---\ntitle: Work\ntags: [private/work]\n---\n\nSee [[target]].\n", changed: "2025-06-01" },
  "drawing.md": { source: "---\nkind: drawing\n---\n\nSee [[target]].\n", changed: "2026-01-01" },
}
const RULES: Unpublished[] = [{ reason: "drawing", test: (_file, cache) => cache.frontmatter?.kind === "drawing" }]

let root: string
let vault: Vault
let index: NoteIndex

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-backlinks-"))
  for (const [file, { source, changed }] of Object.entries(FILES)) {
    fs.writeFileSync(path.join(root, file), source)
    fs.utimesSync(path.join(root, file), new Date(changed), new Date(changed))
  }
  vault = await openVault(root)
  index = indexNotes(vault, RULES)
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

const backlinks = (note: string, treatment: "omit" | "mark") =>
  backlinksOf(index.byId.get(note)!, { treatment, vault, index })

test("a note's backlinks are the pages that link to or embed it, once each, by title and address", () => {
  expect(backlinks("target", "omit")).toEqual([
    { title: "New", url: "/new", isPrivate: false },
    { title: "Embeds", url: "/embeds", isPrivate: false },
    { title: "Old", url: "/old", isPrivate: false },
  ])
})

test("marked, a private page, under a private tag or a tag under one, is listed after every public one", () => {
  expect(backlinks("target", "mark")).toEqual([
    { title: "New", url: "/new", isPrivate: false },
    { title: "Embeds", url: "/embeds", isPrivate: false },
    { title: "Old", url: "/old", isPrivate: false },
    { title: "Secret", url: "/secret", isPrivate: true },
    { title: "Work", url: "/work", isPrivate: true },
  ])
})

test("a note nothing links to has no backlinks", () => {
  expect(backlinks("lonely", "mark")).toEqual([])
})
