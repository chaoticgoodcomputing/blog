import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { afterAll, beforeAll, expect, test } from "vitest"
import { feedItems } from "../src/lib/feed.ts"
import { indexNotes, type Note } from "../src/lib/notes.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own: five articles of 2026, and forty-two older ones, a day apart.
const FILES: Record<string, string> = {
  "index.md": "---\ntitle: Home\ndate: 2026-06-01\n---\n\nNot under the article folder.\n",
  "content/essay.md":
    "---\ntitle: Essay\ndate: 2026-02-01T08:30:00Z\ndescription: An essay.\ntags: [writing/essays, garden]\n---\n\nAn essay.\n",
  "content/plain.md": "---\ntitle: Plain\ndate: 2026-01-31\n---\n\nNo description and no tags.\n",
  "content/diary.md": "---\ntitle: Diary\ndate: 2026-05-01\ntags: [private/work]\n---\n\nA private page.\n",
  "content/Widget Note.mdx": "---\ntitle: Widget\ndate: 2026-01-30\n---\n\nAn MDX note.\n",
  "content/weekly/2026-W06.md": "---\ntitle: Week six\ndate: 2026-01-29\n---\n\nA name with a capital.\n",
}
for (let day = 1; day <= 42; day++) {
  const dd = String(day).padStart(2, "0")
  const date = new Date(Date.UTC(2020, 0, day)).toISOString().slice(0, 10)
  FILES[`content/old/day-${dd}.md`] = `---\ntitle: Day ${dd}\ndate: ${date}\n---\n\nAn old article.\n`
}
const SITE = new URL("https://example.com")

let root: string
let vault: Vault
let notes: Note[]

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-feed-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  vault = await openVault(root)
  notes = indexNotes(vault, []).notes
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("an article is an item with its title, its page's address, its date, its description and its tags", () => {
  expect(feedItems(notes, SITE, { vault })[0]).toEqual({
    title: "Essay",
    link: "/content/essay",
    pubDate: new Date("2026-02-01T08:30:00Z"),
    description: "An essay.",
    categories: ["writing/essays", "garden"],
  })
})

test("the feed holds the forty newest articles that are posts, newest first", () => {
  const titles = feedItems(notes, SITE, { vault }).map((item) => item.title)
  expect(titles).toHaveLength(40)
  expect(titles.slice(0, 6)).toEqual(["Essay", "Plain", "Widget", "Week six", "Day 42", "Day 41"])
  expect(titles.at(-1)).toBe("Day 07")
  expect(titles).not.toContain("Diary")
  expect(titles).not.toContain("Home")
})

test("an item with no description of its own is described by how long it takes to read, as the site's feed has always described one", () => {
  const plain = feedItems(notes, SITE, { vault }).find((item) => item.title === "Plain")!
  expect(plain.description).toBe("(1 min read)")
  expect(plain.categories).toEqual([])
})

test("an item keeps the identifier the site's feed has always given its note: lower case, and an MDX note's with its extension", () => {
  const byTitle = new Map(feedItems(notes, SITE, { vault }).map((item) => [item.title, item]))
  expect(byTitle.get("Widget")).toMatchObject({
    link: "/content/Widget-Note",
    customData: '<guid isPermaLink="false">https://example.com/content/widget-note.mdx</guid>',
  })
  expect(byTitle.get("Week six")).toMatchObject({
    link: "/content/weekly/2026-W06",
    customData: '<guid isPermaLink="false">https://example.com/content/weekly/2026-w06</guid>',
  })
  // Where that identifier is the page's own address, the item's link is its identifier.
  expect(byTitle.get("Essay")!.customData).toBeUndefined()
})
