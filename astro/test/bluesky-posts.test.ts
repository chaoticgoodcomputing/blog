import { expect, test } from "vitest"
import { postUrl, postsOfNotes, profileUrl, type AuthorFeedItem } from "../src/lib/bluesky-posts.ts"

const SITE = new URL("https://blog.example.com")
const HANDLE = "example.com"

const item = (rkey: string, link: string | undefined, createdAt: string, extra: Partial<AuthorFeedItem> = {}): AuthorFeedItem => ({
  post: {
    uri: `at://did:plc:abc/app.bsky.feed.post/${rkey}`,
    record: {
      createdAt,
      ...(link ? { embed: { $type: "app.bsky.embed.external", external: { uri: link } } } : {}),
    },
  },
  ...extra,
})

const reply = (link: string): AuthorFeedItem => {
  const each = item("reply", link, "2026-11-01T00:00:00Z")
  return { post: { ...each.post, record: { ...each.post.record, reply: {} } } }
}

test("a post's page on bsky.app is the account's page and the post's record key", () => {
  expect(profileUrl(HANDLE)).toBe("https://bsky.app/profile/example.com")
  expect(postUrl("at://did:plc:abc/app.bsky.feed.post/3mz", HANDLE)).toBe("https://bsky.app/profile/example.com/post/3mz")
  expect(postUrl("at://did:plc:abc/app.bsky.feed.like/3mz", HANDLE)).toBeUndefined()
})

test("each note's post is the account's first post whose link card is the note's page", () => {
  const posts = postsOfNotes(
    [
      item("newer", "https://blog.example.com/content/a", "2026-11-03T00:00:00Z"),
      item("older", "https://blog.example.com/content/a/", "2026-11-01T00:00:00Z"),
      item("b", "https://blog.example.com/content/b", "2026-11-02T00:00:00Z"),
    ],
    { site: SITE, handle: HANDLE },
  )
  expect([...posts.keys()]).toEqual(["/content/a", "/content/b"])
  expect(posts.get("/content/a")).toEqual({
    note: "/content/a",
    url: "https://bsky.app/profile/example.com/post/older",
    published: new Date("2026-11-01T00:00:00Z"),
  })
})

test("a post that links to a note's former address or alias is that note's", () => {
  const posts = postsOfNotes([item("p", "https://blog.example.com/content/old-name", "2026-11-01T00:00:00Z")], {
    site: SITE,
    handle: HANDLE,
    redirects: { "/content/old-name": "/content/a" },
  })
  expect(posts.get("/content/a")?.url).toBe("https://bsky.app/profile/example.com/post/p")
})

test("a repost, a reply, a post with no link card and a link to another site are no note's post", () => {
  const posts = postsOfNotes(
    [
      item("repost", "https://blog.example.com/content/a", "2026-11-01T00:00:00Z", { reason: { $type: "repost" } }),
      reply("https://blog.example.com/content/b"),
      item("text", undefined, "2026-11-01T00:00:00Z"),
      item("other", "https://elsewhere.example.org/content/c", "2026-11-01T00:00:00Z"),
    ],
    { site: SITE, handle: HANDLE },
  )
  expect(posts.size).toBe(0)
})
