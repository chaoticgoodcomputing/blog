import { readFeed, SITE } from "../feed-and-sitemap.ts"
import { expect, test } from "../site.ts"

const FEED = `${SITE}/index.xml`

test("the feed is RSS 2.0, at the address the site's feed has always had", async ({ page, request }) => {
  expect((await readFeed(page, request, FEED)).length).toBeGreaterThan(0)
})

test("an article is an item with its title, link, date and description, newest first", async ({ page, request }) => {
  const items = await readFeed(page, request, FEED)
  const first = items.findIndex((item) => item.title === "The Feed's First Article")
  expect(items[first]).toEqual({
    title: "The Feed's First Article",
    link: `${SITE}/content/feed/first-article`,
    guid: `${SITE}/content/feed/first-article`,
    isPermaLink: "true",
    pubDate: "Fri, 03 Jul 2026 00:00:00 GMT",
    description: "An article the feed holds, with a description & an ampersand.",
    categories: ["writing/essays"],
  })
  const titles = items.map((item) => item.title)
  expect(titles.slice(first, first + 3)).toEqual(["The Feed's First Article", "Weekly W06", "Widget Article"])
})

test("an item keeps the identifier the site's feed has always given its note", async ({ page, request }) => {
  const items = await readFeed(page, request, FEED)
  expect(items.find((item) => item.title === "Weekly W06")).toMatchObject({
    link: `${SITE}/content/feed/Weekly-W06`,
    guid: `${SITE}/content/feed/weekly-w06`,
    isPermaLink: "false",
  })
  expect(items.find((item) => item.title === "Widget Article")).toMatchObject({
    link: `${SITE}/content/feed/widget-article`,
    guid: `${SITE}/content/feed/widget-article.mdx`,
    isPermaLink: "false",
  })
})

test("an article under a private tag is not in the feed, nor is a note that is no article", async ({ page, request }) => {
  const titles = (await readFeed(page, request, FEED)).map((item) => item.title)
  expect(titles).toContain("Alpha")
  expect(titles).not.toContain("Private Article")
  expect(titles).not.toContain("Secret")
  expect(titles).not.toContain("Fixture Home")
})

test("every page names the feed in its head", async ({ page, request }) => {
  for (const address of ["/", "/content/notes/alpha", "/content/notes/secret"]) {
    await page.goto(address)
    const link = page.locator('head link[rel="alternate"][type="application/rss+xml"]')
    await expect(link).toHaveAttribute("href", FEED)
    await expect(link).toHaveAttribute("title", "Chaotic Good Computing")
  }
  expect((await readFeed(page, request, FEED)).length).toBeGreaterThan(0)
})
