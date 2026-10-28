import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { afterAll, beforeAll, expect, test } from "vitest"
import { backlinksOf, outlinksOf } from "../src/lib/backlinks.ts"
import { indexNotes, type NoteIndex, type Unpublished } from "../src/lib/notes.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own, in no repository, so that when each note last changed is its file's
// time, which the test sets.
const FILES: Record<string, { source: string; changed: string }> = {
  "target.md": { source: "---\ntitle: Target\n---\n\nLinked to.\n", changed: "2026-01-01" },
  "lonely.md": { source: "---\ntitle: Lonely\n---\n\nNothing links here.\n", changed: "2026-01-01" },
  "old.md": { source: "---\ntitle: Old\ndate: 2025-01-01\n---\n\nSee [[target]].\n", changed: "2025-01-01" },
  // Changed after Old, but dated before it: the date is what orders it.
  "new.md": { source: "---\ntitle: New\ndate: 2024-06-01\ndescription: The newer one.\n---\n\nSee [[target]] and [[target|again]].\n", changed: "2026-06-01" },
  // Undated, as a tag's description note is, and changed last of all: after every dated page still.
  "embeds.md": { source: "---\ntitle: Embeds\n---\n\n![[target]]\n", changed: "2026-12-01" },
  "secret.md": { source: "---\ntitle: Secret\ndate: 2026-09-01\ntags: [private]\n---\n\nSee [[target]].\n", changed: "2026-09-01" },
  "work.md": { source: "---\ntitle: Work\ntags: [private/work]\n---\n\nSee [[target]].\n", changed: "2025-06-01" },
  "drawing.md": { source: "---\nkind: drawing\n---\n\nSee [[target]].\n", changed: "2026-01-01" },
  "out.md": {
    source: "---\ntitle: Out\n---\n\n[[secret]], ![[embeds]], [[new]], [[old]], [[old|again]], [[out|itself]], [[drawing]] and [[nowhere]].\n",
    changed: "2024-01-01",
  },
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

test("a note's backlinks are the pages that link to or embed it, once each, newest first by date, then the undated", () => {
  // A page's summary is its description, else its first paragraph: none for one that only embeds.
  expect(backlinks("target", "omit")).toEqual([
    { title: "Old", url: "/old", date: new Date("2025-01-01"), description: "See target.", isPrivate: false },
    { title: "New", url: "/new", date: new Date("2024-06-01"), description: "The newer one.", isPrivate: false },
    { title: "Embeds", url: "/embeds", isPrivate: false },
  ])
})

test("marked, a private page, under a private tag or a tag under one, is listed after every public one", () => {
  expect(backlinks("target", "mark")).toEqual([
    { title: "Old", url: "/old", date: new Date("2025-01-01"), description: "See target.", isPrivate: false },
    { title: "New", url: "/new", date: new Date("2024-06-01"), description: "The newer one.", isPrivate: false },
    { title: "Embeds", url: "/embeds", isPrivate: false },
    { title: "Secret", url: "/secret", date: new Date("2026-09-01"), isPrivate: true },
    { title: "Work", url: "/work", isPrivate: true },
  ])
})

test("a note nothing links to has no backlinks", () => {
  expect(backlinks("lonely", "mark")).toEqual([])
})

const outlinks = (note: string, treatment: "omit" | "mark") =>
  outlinksOf(index.byId.get(note)!, { treatment, vault, index })

test("a note's outlinks are the pages it links to or embeds, once each, newest first by date, then the undated", () => {
  // Not itself, a drawing, which has no page, or a link to no note. Not in the order the note links
  // to them: Embeds, New, then Old.
  expect(outlinks("out", "omit")).toEqual([
    { title: "Old", url: "/old", date: new Date("2025-01-01"), description: "See target.", isPrivate: false },
    { title: "New", url: "/new", date: new Date("2024-06-01"), description: "The newer one.", isPrivate: false },
    { title: "Embeds", url: "/embeds", isPrivate: false },
  ])
})

test("marked, a private page a note links to is listed after every public one", () => {
  expect(outlinks("out", "mark")).toEqual([
    { title: "Old", url: "/old", date: new Date("2025-01-01"), description: "See target.", isPrivate: false },
    { title: "New", url: "/new", date: new Date("2024-06-01"), description: "The newer one.", isPrivate: false },
    { title: "Embeds", url: "/embeds", isPrivate: false },
    { title: "Secret", url: "/secret", date: new Date("2026-09-01"), isPrivate: true },
  ])
})

test("a note that links nowhere has no outlinks", () => {
  expect(outlinks("target", "mark")).toEqual([])
})
