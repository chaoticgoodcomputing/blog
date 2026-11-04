import type { Page } from "@playwright/test"
import { expect, test } from "../site.ts"

// The fixture's Bluesky account has posted one note, Alpha (test/fixtures/bluesky/author-feed.json),
// and Hacker News has one thread, of "A note with backlinks" (test/fixtures/hacker-news/threads.json),
// already the most central post, so that its comments, mentions, move no post in the listings.
const posted = "/content/notes/alpha"
const unposted = "/site-shell/body"
const threaded = "/backlinks/linked"

const panel = (page: Page, source: string) => page.locator(`.connection.discussion[data-source="${source}"]`)

test("what is related to a note is one carousel: its outgoing, then incoming links, then a discussion panel for each source", async ({ page }) => {
  await page.goto(threaded)
  await expect(page.locator(".connections .connection > h2")).toHaveText([
    "Outgoing Links",
    "Incoming Links",
    "Around the Web",
    "On Bluesky",
    "On Hacker News",
  ])
  await expect(page.locator(".connections .controls")).toHaveCount(1)
})

test("a posted note's Bluesky panel answers at its Bluesky post, which its h-entry names as its copy", async ({ page }) => {
  await page.goto(posted)
  const bluesky = panel(page, "bluesky").getByRole("link", { name: "Discuss on Bluesky" })
  await expect(bluesky).toHaveAttribute("href", "https://bsky.app/profile/chaoticgood.computer/post/3fixturealpha")
  await expect(bluesky).toHaveClass(/\bu-syndication\b/)
  await expect(bluesky).toHaveAttribute("target", "_blank")
  // The `+` beside the heading, which names it for a screen reader.
  await expect(panel(page, "bluesky").getByRole("heading", { level: 2 })).toContainText("On Bluesky")
  await expect(panel(page, "bluesky").getByRole("heading", { level: 2 }).getByRole("link")).toHaveCount(1)
})

test("a note the account hasn't posted answers at the account, and names no copy", async ({ page }) => {
  await page.goto(unposted)
  const bluesky = panel(page, "bluesky").getByRole("link", { name: "Discuss on Bluesky" })
  await expect(bluesky).toHaveAttribute("href", "https://bsky.app/profile/chaoticgood.computer")
  await expect(bluesky).not.toHaveClass(/\bu-syndication\b/)
})

test("a note with a Hacker News thread has its panel, answering there, with its count of comments and its top comments", async ({ page }) => {
  await page.goto(threaded)
  const hackerNews = panel(page, "hackerNews")
  const thread = hackerNews.getByRole("link", { name: "Discuss on Hacker News" })
  await expect(thread).toHaveAttribute("href", "https://news.ycombinator.com/item?id=9000001")
  await expect(thread).not.toHaveClass(/\bu-syndication\b/)
  await expect(hackerNews.locator(".detail")).toHaveText("3 comments")
  const comments = hackerNews.locator(".mentions li")
  await expect(comments.first().getByRole("link", { name: "Oct 30, 2026" })).toHaveAttribute("href", "https://news.ycombinator.com/item?id=9000004")
  await expect(comments).toHaveCount(2)
  await expect(comments.first().getByRole("link", { name: "second_reader" })).toHaveAttribute(
    "href",
    "https://news.ycombinator.com/user?id=second_reader",
  )
  await expect(comments.nth(1).locator(".excerpt")).toHaveText([
    "The first paragraph of a comment.",
    'And a second, with an "entity" and markup.',
  ])
})

test("an empty discussion panel says so, and links to where the reader could be the first to reply, as its + does", async ({ page }) => {
  await page.goto(unposted)
  const answers = {
    webmentions: ["Reply from your own site", "https://webmention.io/"],
    bluesky: ["Discuss on Bluesky", "https://bsky.app/profile/chaoticgood.computer"],
    // No thread yet: the note is submitted, its address and title filled in.
    hackerNews: ["Submit to Hacker News", "https://news.ycombinator.com/submitlink?u="],
  }
  for (const [source, [label, href]] of Object.entries(answers)) {
    const empty = panel(page, source).locator(".empty")
    await expect(empty, source).toHaveText("No discussion yet. Be the first to reply.")
    const plus = await panel(page, source).getByRole("link", { name: label! }).getAttribute("href")
    expect(plus, source).toContain(href!)
    await expect(empty.getByRole("link", { name: "Be the first to reply" }), source).toHaveAttribute("href", plus!)
  }
  await expect(page.locator("form.send-webmention")).toHaveCount(0)
})

test("another site's mention is listed as a post, with who wrote it and where under its title", async ({ page }) => {
  await page.goto(threaded)
  const web = panel(page, "webmentions")
  await expect(web.getByRole("heading", { level: 2 })).toHaveText("Around the Web")
  const post = web.locator("li.post").first()
  await expect(post.getByRole("heading", { level: 3 })).toHaveText("A reply from elsewhere")
  // Its site without its `www.`.
  await expect(post.locator(".byline")).toHaveText("Ada at ada.example")
})

test("a note's page is an h-entry: its name, date, author, address and content", async ({ page }) => {
  await page.goto(posted)
  const entry = page.locator("main.h-entry")
  await expect(entry).toHaveCount(1)
  await expect(entry.locator("h1.p-name")).toHaveText("Alpha")
  await expect(entry.locator(".u-url")).toHaveAttribute("href", `https://blog.chaoticgood.computer${posted}`)
  await expect(entry.locator(".p-author.h-card")).toHaveText("Spencer Elkington")
  await expect(entry.locator("article.prose.e-content")).toHaveCount(1)
  // None of it is shown.
  await expect(entry.locator(".entry-meta")).toBeHidden()
})

test("a private page's stub is no h-entry, and has no discussion", async ({ page }) => {
  await page.goto("/content/notes/secret")
  await expect(page.locator(".h-entry")).toHaveCount(0)
  await expect(page.locator(".connection.discussion")).toHaveCount(0)
})
