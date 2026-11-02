import { expect, test } from "vitest"
import { excerptOf, isBlocked, mentionsOf, noteAddressOf, pageKey, toMention, type Mention } from "../src/lib/mentions.ts"

const SITE = "https://blog.example.com/"

const mention = (url: string, note: string, published?: string): Mention => ({
  url,
  target: `${SITE}${note.slice(1)}`,
  note,
  author: {},
  excerpt: [],
  ...(published ? { published: new Date(published) } : {}),
})

test("two addresses of one page have one key: a trailing slash, `.html` and a fragment aside", () => {
  expect(pageKey("https://blog.example.com/content/a/")).toBe("blog.example.com/content/a")
  expect(pageKey("https://blog.example.com/content/a.html#x")).toBe("blog.example.com/content/a")
  expect(pageKey("https://blog.example.com/index.html")).toBe("blog.example.com/")
  expect(pageKey("https://blog.example.com/content/a%20b")).toBe("blog.example.com/content/a b")
  expect(pageKey("not an address")).toBeUndefined()
})

test("a target is the note at its page, or the note an alias or former address redirects to", () => {
  const redirects = { "/old-name": "/content/a" }
  expect(noteAddressOf("https://blog.example.com/content/a/", redirects)).toBe("/content/a")
  expect(noteAddressOf("https://blog.example.com/old-name", redirects)).toBe("/content/a")
  expect(noteAddressOf("https://blog.example.com/", redirects)).toBe("/")
  expect(noteAddressOf("nowhere", redirects)).toBeUndefined()
})

test("the excerpt is the blocks of the page's content that link to the note, as text", () => {
  const html = `<p>Intro.</p><p>As <a href="https://blog.example.com/content/a">Spencer</a> wrote,
    <b>this</b>.</p><ul><li>And <a href="/content/a.html">again</a></li></ul><p><a href="https://blog.example.com/content/b">other</a></p>`
  expect(excerptOf({ html }, "https://blog.example.com/content/a", "https://blog.example.com/x")).toEqual([
    "As Spencer wrote, this.",
    "And again",
  ])
})

test("without a block that links to the note, the excerpt is the start of the text", () => {
  expect(excerptOf({ html: "<p>No link</p>", text: "No link here" }, "https://blog.example.com/a", undefined)).toEqual(["No link here"])
  expect(excerptOf({ text: "x".repeat(500) }, "https://blog.example.com/a", undefined)[0]).toHaveLength(400)
  expect(excerptOf(undefined, "https://blog.example.com/a", undefined)).toEqual([])
})

test("a like, a repost and a private webmention are no mention", () => {
  const base = { "wm-id": 1, "wm-target": `${SITE}a`, url: "https://other.example/p" }
  expect(toMention({ ...base, "wm-property": "like-of" })).toBeUndefined()
  expect(toMention({ ...base, "wm-property": "repost-of" })).toBeUndefined()
  expect(toMention({ ...base, "wm-property": "mention-of", "wm-private": true })).toBeUndefined()
  expect(toMention({ ...base, "wm-property": "in-reply-to", name: " A reply ", author: { name: "Them" }, published: "2026-01-02T00:00:00Z" }, { "/a": "/content/a" })).toEqual({
    target: `${SITE}a`,
    note: "/content/a",
    url: "https://other.example/p",
    title: "A reply",
    author: { name: "Them" },
    published: new Date("2026-01-02T00:00:00Z"),
    excerpt: [],
  })
})

test("a blocked domain is that host and every host under it", () => {
  expect(isBlocked("https://spam.example/p", ["spam.example"])).toBe(true)
  expect(isBlocked("https://www.spam.example/p", ["spam.example"])).toBe(true)
  expect(isBlocked("https://notspam.example/p", ["spam.example"])).toBe(false)
})

test("a note's mentions are newest first, one for each page, none from a blocked domain", () => {
  const found = mentionsOf(
    "/content/a",
    [
      mention("https://one.example/p", "/content/a", "2026-01-01"),
      mention("https://two.example/p", "/content/a", "2026-02-01"),
      mention("https://one.example/p/", "/content/a", "2026-03-01"),
      mention("https://spam.example/p", "/content/a", "2026-04-01"),
      mention("https://three.example/p", "/content/b", "2026-05-01"),
    ],
    ["spam.example"],
  )
  expect(found.map((each) => [each.url, each.published?.toISOString().slice(0, 10)])).toEqual([
    ["https://one.example/p/", "2026-03-01"],
    ["https://two.example/p", "2026-02-01"],
  ])
})
