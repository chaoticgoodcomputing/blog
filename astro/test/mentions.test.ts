import { expect, test } from "vitest"
import { excerptOf, isBlocked, isBlockedAuthor, mentionCounts, mentionsOf, noteAddressOf, pageKey, reactionsOf, toMention, type Mention } from "../src/lib/mentions.ts"

const SITE = "https://blog.example.com/"

const mention = (url: string, note: string, published?: string): Mention => ({
  source: "webmentions",
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
  const resolve = (address: string) => (address === "/old-name" ? "/content/a" : address)
  expect(noteAddressOf("https://blog.example.com/content/a/", resolve)).toBe("/content/a")
  expect(noteAddressOf("https://blog.example.com/old-name", resolve)).toBe("/content/a")
  expect(noteAddressOf("https://blog.example.com/", resolve)).toBe("/")
  expect(noteAddressOf("nowhere", resolve)).toBeUndefined()
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

test("a like or a repost is a reaction, by who made it; a private webmention is nothing", () => {
  const base = { "wm-id": 1, "wm-target": `${SITE}a`, url: "https://bsky.app/profile/site.example/post/3mz#liked_by_did:plc:you" }
  const author = { name: "You", url: "https://bsky.app/profile/you.example", photo: "https://cdn.bsky.app/img/avatar/you" }
  expect(toMention({ ...base, "wm-property": "like-of", author, published: null, "wm-received": "2026-11-04T04:36:40Z" })).toEqual({
    source: "bluesky",
    reaction: "like",
    target: `${SITE}a`,
    note: "/a",
    url: base.url,
    author,
    published: new Date("2026-11-04T04:36:40Z"),
    excerpt: [],
  })
  expect(toMention({ ...base, "wm-property": "repost-of", author })?.reaction).toBe("repost")
  expect(toMention({ ...base, "wm-property": "mention-of", "wm-private": true })).toBeUndefined()
  expect(toMention({ ...base, url: "https://other.example/p", "wm-property": "in-reply-to", name: " A reply ", author: { name: "Them" }, published: "2026-01-02T00:00:00Z" }, (address) => (address === "/a" ? "/content/a" : address))).toEqual({
    source: "webmentions",
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
    { blockedDomains: ["spam.example"] },
  )
  expect(found.map((each) => [each.url, each.published?.toISOString().slice(0, 10)])).toEqual([
    ["https://one.example/p/", "2026-03-01"],
    ["https://two.example/p", "2026-02-01"],
  ])
})

test("a note's mention count is one for each page, none from a blocked domain, as its mentions are", () => {
  const counts = mentionCounts(
    [
      mention("https://one.example/p", "/content/a"),
      mention("https://one.example/p/", "/content/a"),
      mention("https://two.example/p", "/content/a"),
      mention("https://spam.example/p", "/content/a"),
      mention("https://three.example/p", "/content/b"),
    ],
    { blockedDomains: ["spam.example"] },
  )
  expect(counts).toEqual(new Map([["/content/a", 2], ["/content/b", 1]]))
})

const OWN = { blockedDomains: [], blockedAuthors: ["https://bsky.app/profile/me.example", "did:plc:me"] }
const by = (base: Mention, author: string, url = base.url): Mention => ({ ...base, url, author: { url: author } })

test("a blocked author is their address, or a Bluesky account by its handle or its DID", () => {
  const reply = by(mention("", "/content/a"), "https://bsky.app/profile/me.example", "https://bsky.app/profile/me.example/post/3abc")
  expect(isBlockedAuthor(reply, OWN.blockedAuthors)).toBe(true)
  // Bridgy names an author by their DID when it has no handle for them.
  expect(isBlockedAuthor(by(reply, "https://bsky.app/profile/did:plc:me"), OWN.blockedAuthors)).toBe(true)
  // A post of theirs by a handle they no longer have, under their DID.
  expect(isBlockedAuthor(by(reply, "", "https://bsky.app/profile/did:plc:me/post/3abc"), OWN.blockedAuthors)).toBe(true)
  const other = "https://bsky.app/profile/me.example.other"
  expect(isBlockedAuthor(by(reply, other, `${other}/post/3abc`), OWN.blockedAuthors)).toBe(false)
  expect(isBlockedAuthor(by(reply, "https://bsky.app/profile/did:plc:meme", `${other}/post/3abc`), OWN.blockedAuthors)).toBe(false)
})

test("a note's mentions, and its count, leave out a blocked author's", () => {
  const mentions = [
    by(mention("https://bsky.app/profile/me.example/post/1", "/content/a", "2026-01-01"), "https://bsky.app/profile/me.example"),
    by(mention("https://bsky.app/profile/you.example/post/2", "/content/a", "2026-02-01"), "https://bsky.app/profile/you.example"),
  ]
  expect(mentionsOf("/content/a", mentions, OWN).map((each) => each.url)).toEqual(["https://bsky.app/profile/you.example/post/2"])
  expect(mentionCounts(mentions, OWN)).toEqual(new Map([["/content/a", 1]]))
})

test("a note's mentions and its count leave out its reactions", () => {
  const reacted: Mention = { ...mention("https://bsky.app/profile/x/post/1#liked_by_y", "/content/a"), reaction: "like" }
  const said = mention("https://one.example/p", "/content/a")
  expect(mentionsOf("/content/a", [reacted, said], { blockedDomains: [] })).toEqual([said])
  expect(mentionCounts([reacted, said], { blockedDomains: [] })).toEqual(new Map([["/content/a", 1]]))
})

test("a note's reactions are its likes and reposts, one of each for each person, newest first, none by a blocked author", () => {
  const react = (reaction: "like" | "repost", who: string, note: string, published: string): Mention => ({
    ...by(mention(`https://bsky.app/profile/site.example/post/1#${reaction}d_by_${who}`, note, published), `https://bsky.app/profile/${who}`),
    reaction,
  })
  const found = reactionsOf(
    "/content/a",
    [
      react("like", "ada.example", "/content/a", "2026-01-01"),
      // One person's like of the note's two posts, which Bridgy sends twice.
      react("like", "ada.example", "/content/a", "2026-03-01"),
      react("like", "bo.example", "/content/a", "2026-02-01"),
      react("repost", "ada.example", "/content/a", "2026-01-02"),
      react("like", "me.example", "/content/a", "2026-04-01"),
      react("like", "cy.example", "/content/b", "2026-05-01"),
      mention("https://one.example/p", "/content/a"),
    ],
    OWN,
  )
  expect({ likes: found.likes.map((each) => each.author.url), reposts: found.reposts.map((each) => each.author.url) }).toEqual({
    likes: ["https://bsky.app/profile/ada.example", "https://bsky.app/profile/bo.example"],
    reposts: ["https://bsky.app/profile/ada.example"],
  })
})
