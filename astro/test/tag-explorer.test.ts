import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { indexNotes, type Note } from "../src/lib/notes.ts"
import { postCounts } from "../src/lib/post-listing.ts"
import { openAt, tagTree, type ExplorerTag } from "../src/lib/tag-explorer.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own, so that every tag and count in it is the test's.
const FILES: Record<string, string> = {
  "roses.md": "---\ntitle: Roses in spring\ndate: 2026-01-01\ntags: [garden/roses]\n---\n",
  "plan.md": "---\ntitle: Garden plan\ndate: 2026-03-01\ntags: [garden]\n---\n",
  "jam.md": "---\ntitle: Rose hip jam\ndate: 2026-02-01\ntags: [garden/roses, kitchen]\n---\n",
  "bread.md": "---\ntitle: Bread\ndate: 2026-02-01\ntags: [kitchen]\n---\n",
  "apples.md": "---\ntitle: Apples\ndate: 2026-02-01\ntags: [kitchen]\n---\n",
  "oven.md": "---\ntitle: The oven\ndate: 2026-01-15\ntags: [kitchen/oven]\n---\n",
  "secret.md": "---\ntitle: Secret garden\ndate: 2026-04-01\ntags: [garden, private]\n---\n",
  "work.md": "---\ntitle: Work\ndate: 2026-01-01\ntags: [private/work]\n---\n",
  "untagged.md": "---\ntitle: Untagged\n---\n",
}

let root: string
let notes: Note[]

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-tag-explorer-"))
  for (const [file, source] of Object.entries(FILES)) fs.writeFileSync(path.join(root, file), source)
  notes = indexNotes(await openVault(root), []).notes
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

/** The tree as tag slugs and counts, nested, in order. */
type Outline = [tag: string, count: number, children: Outline[]]
const outline = (tree: ExplorerTag[]): Outline[] => tree.map((node) => [node.tag, node.count, outline(node.children)])

/** One tag of a tree, by its tag slug. */
function find(tree: ExplorerTag[], tag: string): ExplorerTag | undefined {
  for (const node of tree) {
    const found = node.tag === tag ? node : find(node.children, tag)
    if (found) return found
  }
  return undefined
}

/** The titles of the notes listed under a tag, in order. */
const titlesUnder = (tree: ExplorerTag[], tag: string) => find(tree, tag)!.notes.map((note) => note.title)

test("the tree is every tag, nested, each counting the notes under it, the most first and then by name", () => {
  expect(outline(tagTree(notes, "omit"))).toEqual([
    ["kitchen", 4, [["kitchen/oven", 1, []]]],
    ["garden", 3, [["garden/roses", 2, []]]],
  ])
})

test("under a tag are the notes that carry it, newest first, and a day's notes by title", () => {
  const tree = tagTree(notes, "omit")
  expect(titlesUnder(tree, "kitchen")).toEqual(["Apples", "Bread", "Rose hip jam"])
  expect(titlesUnder(tree, "garden/roses")).toEqual(["Rose hip jam", "Roses in spring"])
  // A note under a subtag is listed under the subtag only.
  expect(titlesUnder(tree, "garden")).toEqual(["Garden plan"])
})

test("a note is listed by its title and address", () => {
  expect(find(tagTree(notes, "omit"), "kitchen/oven")!.notes).toEqual([
    { title: "The oven", url: "/oven", isPrivate: false },
  ])
})

test("on a note's page, the branches open are those that lead to the note, wherever it is listed", () => {
  const tree = tagTree(notes, "omit")
  expect(openAt(tree, { url: "/jam" })).toEqual(["garden", "garden/roses", "kitchen"])
  expect(openAt(tree, { url: "/untagged" })).toEqual([])
  // Left out of the explorer, a private page is nowhere in it.
  expect(openAt(tree, { url: "/secret" })).toEqual([])
})

test("on a tag's page, the branches open are the tag's own and those above it", () => {
  const tree = tagTree(notes, "omit")
  expect(openAt(tree, { url: "/tags/garden/roses", tag: "garden/roses" })).toEqual(["garden", "garden/roses"])
  expect(openAt(tree, { url: "/tags/private", tag: "private" })).toEqual([])
})

test("left out, a private page is in no count and no list, and the private tags are not in the tree", () => {
  const tree = tagTree(notes, "omit")
  expect(find(tree, "private")).toBeUndefined()
  expect(find(tree, "garden")!.count).toBe(3)
  expect(titlesUnder(tree, "garden")).not.toContain("Secret garden")
})

test("marked, a private page counts, and is listed after every public page under its tag", () => {
  const tree = tagTree(notes, "mark")
  expect(outline(tree)).toEqual([
    ["garden", 4, [["garden/roses", 2, []]]],
    ["kitchen", 4, [["kitchen/oven", 1, []]]],
    ["private", 2, [["private/work", 1, []]]],
  ])
  // Newer than the garden plan, and after it.
  expect(find(tree, "garden")!.notes).toEqual([
    { title: "Garden plan", url: "/plan", isPrivate: false },
    { title: "Secret garden", url: "/secret", isPrivate: true },
  ])
})

test("the home page is in no branch, so each tag counts the posts its tag page lists (tickets 12 and 13)", async () => {
  // A vault of its own, with an index note that carries tags, as the real vault's does.
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "astro-tag-explorer-home-"))
  try {
    const files: Record<string, string> = {
      "index.md": "---\ntitle: Home\ntags: [garden, kitchen]\n---\n",
      "roses.md": "---\ntitle: Roses\ndate: 2026-01-01\ntags: [garden/roses]\n---\n",
      "bread.md": "---\ntitle: Bread\ndate: 2026-02-01\ntags: [kitchen]\n---\n",
    }
    for (const [file, source] of Object.entries(files)) fs.writeFileSync(path.join(home, file), source)
    const withHome = indexNotes(await openVault(home), []).notes
    const tree = tagTree(withHome, "omit")
    expect(outline(tree)).toEqual([
      ["garden", 1, [["garden/roses", 1, []]]],
      ["kitchen", 1, []],
    ])
    expect(openAt(tree, { url: "/" })).toEqual([])
    // What a tag page's badge says of each tag.
    expect(Object.fromEntries(postCounts(withHome))).toEqual({ garden: 1, "garden/roses": 1, kitchen: 1 })
  } finally {
    fs.rmSync(home, { recursive: true, force: true })
  }
})
