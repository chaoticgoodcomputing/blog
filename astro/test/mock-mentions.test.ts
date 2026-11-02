import { expect, test } from "vitest"
import { mentionsOf, toMention, type Mention } from "../src/lib/mentions.ts"
import { mockMentions } from "../src/lib/mock-mentions.ts"

const SITE = "https://blog.example.com"
const now = new Date("2026-11-02T12:00:00Z")

/** The made-up webmentions as the loader keeps them, an alias redirecting to the third note. */
const kept = (alias?: string) =>
  mockMentions({ site: SITE, notes: ["/a", "/b", "/c"], alias }, now)
    .map((entry) => toMention(entry, alias ? { [alias]: "/c" } : {}))
    .filter((mention): mention is Mention => mention !== undefined)

test("each made-up webmention has an id of its own, and comes from an `.example` site", () => {
  const entries = mockMentions({ site: SITE, notes: ["/a", "/b", "/c"], alias: "/old" }, now)
  expect(new Set(entries.map((entry) => entry["wm-id"])).size).toBe(entries.length)
  for (const entry of entries) expect(new URL(entry.url!).host).toMatch(/\.example$/)
})

test("the first note's mentions are newest first, the like left out, and only the linking paragraph shown", () => {
  const first = mentionsOf("/a", kept(), [])
  expect(first.map((mention) => mention.url)).toEqual(["https://ada.example/2026/boundary-objects", "https://bo.example/notes/42"])
  expect(first[0]!.excerpt).toEqual(["As this note puts it, a shared model is only shared while both sides keep reading it."])
  expect(first[1]!.title).toBeUndefined()
})

test("the second note's long mention is cut short, and a target with a trailing slash still finds it", () => {
  const second = mentionsOf("/b", kept(), [])
  expect(second).toHaveLength(2)
  expect(second[0]!.excerpt[0]).toMatch(/…$/)
})

test("a mention by an alias finds the note it redirects to, and without one, the third note is mentioned", () => {
  expect(mentionsOf("/c", kept("/old"), [])[0]!.title).toBe("Linked by an old address")
  expect(mentionsOf("/c", kept(), [])[0]!.title).toBe("Linked once")
})

test("with no notes there are no made-up webmentions", () => {
  expect(mockMentions({ site: SITE, notes: [] }, now)).toEqual([])
})
