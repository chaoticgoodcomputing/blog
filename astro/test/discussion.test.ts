import { expect, test } from "vitest"
import { discussionPanels, mentionSourceOf, mentionsOn } from "../src/lib/discussion.ts"
import type { HackerNewsThread } from "../src/lib/hacker-news.ts"
import type { Mention } from "../src/lib/mentions.ts"

const ALL = { webmentions: true, bluesky: true, hackerNews: true }
const post = { note: "/a", url: "https://bsky.app/profile/example.com/post/3mz", published: new Date() }
const thread: HackerNewsThread = {
  note: "/a",
  url: "https://news.ycombinator.com/item?id=1",
  points: 10,
  comments: 1,
  published: new Date(),
  mentions: [],
}

test("a webmention from Bluesky, or Bridgy's copy of one, is Bluesky's; from Hacker News, Hacker News's", () => {
  expect(mentionSourceOf("https://bsky.app/profile/someone/post/3mz")).toBe("bluesky")
  expect(mentionSourceOf("https://elsewhere.example/x", "https://brid.gy/comment/bluesky/did:plc:a/at%3A")).toBe("bluesky")
  expect(mentionSourceOf("https://elsewhere.example/x", "https://brid.gy/comment/mastodon/@a/1")).toBe("webmentions")
  expect(mentionSourceOf("https://news.ycombinator.com/item?id=1")).toBe("hackerNews")
  expect(mentionSourceOf("https://ada.example/post")).toBe("webmentions")
})

test("a source that is off gives no mentions", () => {
  const all = [mention("webmentions"), mention("bluesky"), mention("hackerNews")]
  expect(mentionsOn(all, { ...ALL, bluesky: false }).map((each) => each.source)).toEqual(["webmentions", "hackerNews"])
})

const PAGE = { title: "A note & more", address: "https://blog.example.com/a" }
const mention = (source: Mention["source"], url = source): Mention => ({ source, target: "", note: "/a", url, author: {}, excerpt: [] })
const mentions = [mention("bluesky"), mention("webmentions"), mention("hackerNews")]

test("a note's panels are other sites', then Bluesky's, then Hacker News's, each with its own mentions", () => {
  const panels = discussionPanels({ sources: ALL, page: PAGE, handle: "example.com", post, thread, mentions })
  expect(panels.map((panel) => [panel.title, panel.mentions.map((each) => each.source)])).toEqual([
    ["Around the Web", ["webmentions"]],
    ["On Bluesky", ["bluesky"]],
    ["On Hacker News", ["hackerNews"]],
  ])
})

test("a reader answers at the Bluesky post, which is the note's copy, and at the thread, with its count of comments", () => {
  const [web, bluesky, hackerNews] = discussionPanels({ sources: ALL, page: PAGE, handle: "example.com", post, thread, mentions })
  expect(bluesky!.action).toEqual({ href: post.url, label: "Discuss on Bluesky", syndication: true })
  expect(hackerNews!.action).toEqual({ href: thread.url, label: "Discuss on Hacker News", syndication: false })
  expect(hackerNews!.detail).toBe("1 comment")
  // Other sites' mentions are answered from the reader's own, which webmention.io shows them how to make send one.
  expect(web!.action).toEqual({ href: "https://webmention.io/", label: "Reply from your own site", syndication: false })
})

test("with nothing, each panel is still there: Bluesky's answers at the account, Hacker News's by submitting the note", () => {
  const panels = discussionPanels({ sources: ALL, page: PAGE, handle: "example.com", mentions: [] })
  expect(panels.map((panel) => [panel.source, panel.action.href, panel.action.syndication, panel.mentions])).toEqual([
    ["webmentions", "https://webmention.io/", false, []],
    ["bluesky", "https://bsky.app/profile/example.com", false, []],
    ["hackerNews", "https://news.ycombinator.com/submitlink?u=https%3A%2F%2Fblog.example.com%2Fa&t=A%20note%20%26%20more", false, []],
  ])
  expect(panels[2]!.detail).toBeUndefined()
})

test("a source that is off has no panel", () => {
  const off = { webmentions: false, bluesky: false, hackerNews: false }
  const panels = discussionPanels({ sources: { ...ALL, bluesky: false }, page: PAGE, handle: "example.com", post, thread, mentions })
  expect(panels.map((panel) => panel.source)).toEqual(["webmentions", "hackerNews"])
  expect(discussionPanels({ sources: off, page: PAGE, handle: "example.com", post, thread, mentions })).toEqual([])
})
