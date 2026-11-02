import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { afterAll, beforeAll, expect, test } from "vitest"
import { indexNotes, type Note } from "../src/lib/notes.ts"
import { centralPosts, postBacklinkCounts } from "../src/lib/post-listing.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own. `Hub` is linked to by three posts, one of them twice and one by an
// embed; `Spoke` by two; `Edge` by one, and by itself; `Lone` by none. `Secret`, a private page, the
// home note and `Spoke` (by itself) link to `Lone` and `Edge`, and none of those links count.
const FILES: Record<string, string> = {
  "index.md": "---\ntitle: Home\n---\n\n[[lone]] [[edge]]\n",
  "hub.md": "---\ntitle: Hub\ndate: 2026-01-01\ntags: [garden]\n---\n\nThe hub.\n",
  "spoke.md": "---\ntitle: Spoke\ndate: 2026-02-01\ntags: [garden]\n---\n\n[[hub]] and [[hub]] again.\n",
  "edge.md": "---\ntitle: Edge\ndate: 2026-03-01\n---\n\n[[hub]] [[spoke]] [[edge]]\n",
  "rim.md": "---\ntitle: Rim\ndate: 2026-04-01\n---\n\n![[hub]] [[spoke]] [[edge]]\n",
  "lone.md": "---\ntitle: Lone\ndate: 2026-05-01\n---\n\nNothing links here but the home note and a private page.\n",
  "secret.md": "---\ntitle: Secret\ndate: 2026-06-01\ntags: [private/work]\n---\n\n[[lone]] [[edge]] [[edge]]\n",
}

let root: string
let vault: Vault
let notes: Note[]

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-central-"))
  for (const [file, contents] of Object.entries(FILES)) fs.writeFileSync(path.join(root, file), contents)
  vault = await openVault(root)
  notes = indexNotes(vault, []).notes
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

const titles = (posts: Note[]) => posts.map((note) => note.title)

test("a post's count is how many other posts link to or embed it, each once", () => {
  const counts = postBacklinkCounts(notes, vault)
  expect(counts.get("/hub")).toBe(3)
  expect(counts.get("/spoke")).toBe(2)
  // Rim's link counts; its own, Secret's and the home note's don't.
  expect(counts.get("/edge")).toBe(1)
  expect(counts.get("/lone")).toBeUndefined()
})

test("the central posts are those other posts link to, the most linked to first", () => {
  expect(titles(centralPosts(undefined, { notes, vault }))).toEqual(["Hub", "Spoke", "Edge"])
})

test("on a tag page, the central posts under the tag, by backlinks from every post", () => {
  expect(titles(centralPosts("garden", { notes, vault }))).toEqual(["Hub", "Spoke"])
})

test("a private page is never a central post", () => {
  expect(titles(centralPosts(undefined, { notes, vault }))).not.toContain("Secret")
})

test("a mention counts as `mentionWeight` backlinks", () => {
  // Lone has no backlinks from posts; two mentions at three apiece put it past Hub's three.
  const mentions = new Map([["/lone", 2]])
  expect(titles(centralPosts(undefined, { notes, vault, mentions, mentionWeight: 3 }))).toEqual(["Lone", "Hub", "Spoke", "Edge"])
  // At one apiece, it ties Spoke, and the newer of the two comes first.
  expect(titles(centralPosts(undefined, { notes, vault, mentions, mentionWeight: 1 }))).toEqual(["Hub", "Lone", "Spoke", "Edge"])
})

test("a private page's mentions don't make it a central post", () => {
  const mentions = new Map([["/secret", 10]])
  expect(titles(centralPosts(undefined, { notes, vault, mentions }))).not.toContain("Secret")
})
