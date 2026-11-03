import { expect, test } from "vitest"
import { commentMentions, commentParagraphs, hackerNewsThreads, threadsOfNotes, type Item } from "../src/lib/hacker-news.ts"

const SITE = new URL("https://blog.example.com")

test("each note's thread is its submission with the most comments, of those of the site's pages", () => {
  const threads = threadsOfNotes(
    [
      { objectID: "1", url: "https://blog.example.com/a", num_comments: 2, created_at: "2026-01-02" },
      { objectID: "2", url: "https://blog.example.com/a/", num_comments: 9, created_at: "2026-01-03" },
      { objectID: "3", url: "https://blog.example.com/old-b", num_comments: 1, created_at: "2026-01-01" },
      { objectID: "4", url: "https://blog.example.com/b", num_comments: 1, created_at: "2026-01-02" },
      { objectID: "5", url: "https://elsewhere.example/a", num_comments: 50 },
      { objectID: "6", url: null },
    ],
    { site: SITE, redirects: { "/old-b": "/b" } },
  )
  expect([...threads].map(([note, hit]) => [note, hit.objectID])).toEqual([
    ["/a", "2"],
    ["/b", "3"],
  ])
})

test("a comment's paragraphs are text, its markup and entities read", () => {
  expect(commentParagraphs("One &amp; <i>two</i>.<p>Three <a href=\"x\">link</a>.<p><p>")).toEqual(["One & two.", "Three link."])
})

const items: Record<string, Item> = {
  "10": { id: 10, type: "story", kids: [11, 12, 13, 14, 15] },
  "11": { id: 11, by: "ada", time: 1_800_000_000, text: "First." },
  "12": { id: 12, deleted: true },
  "13": { id: 13, by: "bo", time: 1_800_000_100, text: "Dead.", dead: true },
  "14": { id: 14, by: "cy", time: 1_800_000_200, text: "Second." },
  "15": { id: 15, by: "di", time: 1_800_000_300, text: "Third." },
}

test("a thread's top comments, in its own order, are mentions, the deleted and dead passed over", () => {
  const mentions = commentMentions(items["10"], items, { note: "/a", target: "https://blog.example.com/a", limit: 2 })
  expect(mentions).toEqual([
    {
      source: "hackerNews",
      target: "https://blog.example.com/a",
      note: "/a",
      url: "https://news.ycombinator.com/item?id=11",
      title: "Hacker News",
      author: { name: "ada", url: "https://news.ycombinator.com/user?id=ada" },
      published: new Date(1_800_000_000_000),
      excerpt: ["First."],
    },
    expect.objectContaining({ url: "https://news.ycombinator.com/item?id=14", excerpt: ["Second."] }),
  ])
})

test("each thread links to its page on Hacker News, with its points, comments and top comments", () => {
  const [thread] = hackerNewsThreads(
    [{ objectID: "10", url: "https://blog.example.com/a", points: 5, num_comments: 4, created_at: "2026-01-02T00:00:00Z" }],
    items,
    { site: SITE, comments: 1 },
  )
  expect(thread).toMatchObject({
    note: "/a",
    url: "https://news.ycombinator.com/item?id=10",
    points: 5,
    comments: 4,
    published: new Date("2026-01-02T00:00:00Z"),
  })
  expect(thread!.mentions.map((mention) => mention.author.name)).toEqual(["ada"])
})
