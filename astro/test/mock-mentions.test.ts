import { expect, test } from "vitest"
import { mentionsOf, toMention, type Mention } from "../src/lib/mentions.ts"
import { postsOfNotes } from "../src/lib/bluesky-posts.ts"
import { mentionSourceOf } from "../src/lib/discussion.ts"
import { hackerNewsThreads } from "../src/lib/hacker-news.ts"
import { mockBlueskyFeed, mockHackerNews, mockMentions } from "../src/lib/mock-mentions.ts"

const SITE = "https://blog.example.com"
const now = new Date("2026-11-02T12:00:00Z")

/** The made-up webmentions as the loader keeps them, an alias redirecting to the third note. */
const kept = (alias?: string) =>
  mockMentions({ site: SITE, notes: ["/a", "/b", "/c"], alias }, now)
    .map((entry) => toMention(entry, alias ? { [alias]: "/c" } : {}))
    .filter((mention): mention is Mention => mention !== undefined)

test("each made-up webmention has an id of its own, and comes from an `.example` site or account", () => {
  const entries = mockMentions({ site: SITE, notes: ["/a", "/b", "/c"], alias: "/old" }, now)
  expect(new Set(entries.map((entry) => entry["wm-id"])).size).toBe(entries.length)
  for (const entry of entries) expect(entry.author?.url ?? entry.url!).toMatch(/\.example(\/|$)/)
})

test("one made-up webmention is a reply on Bluesky, as Bridgy sends one", () => {
  const sources = kept().map((mention) => mention.source)
  expect(sources.filter((source) => source === "bluesky")).toHaveLength(1)
  expect(mentionSourceOf("https://bsky.app/profile/eve.example/post/3mockreply")).toBe("bluesky")
})

test("the made-up Bluesky post is of the first note, and the others have none", () => {
  const posts = postsOfNotes(mockBlueskyFeed({ site: SITE, notes: ["/a", "/b"] }, now).feed, {
    site: new URL(SITE),
    handle: "example.com",
  })
  expect([...posts.keys()]).toEqual(["/a"])
})

test("the made-up Hacker News thread is of the first note, its deleted comment passed over", () => {
  const { hits, items } = mockHackerNews({ site: SITE, notes: ["/a", "/b"] }, now)
  const threads = hackerNewsThreads(hits, items, { site: new URL(SITE), comments: 5 })
  expect(threads.map((thread) => thread.note)).toEqual(["/a"])
  expect(threads[0]!.mentions.map((mention) => mention.author.name)).toEqual(["fran_example", "gus_example"])
})

test("the first note's mentions are newest first, the like left out, and only the linking paragraph shown", () => {
  const first = mentionsOf("/a", kept(), [])
  expect(first.map((mention) => mention.url)).toEqual([
    "https://ada.example/2026/boundary-objects",
    "https://bsky.app/profile/eve.example/post/3mockreply",
    "https://bo.example/notes/42",
  ])
  expect(first[0]!.excerpt).toEqual(["As this note puts it, a shared model is only shared while both sides keep reading it."])
  expect(first[2]!.title).toBeUndefined()
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

test("with no notes there is no made-up discussion", () => {
  expect(mockMentions({ site: SITE, notes: [] }, now)).toEqual([])
  expect(mockBlueskyFeed({ site: SITE, notes: [] }, now).feed).toEqual([])
  expect(mockHackerNews({ site: SITE, notes: [] }, now).hits).toEqual([])
})
