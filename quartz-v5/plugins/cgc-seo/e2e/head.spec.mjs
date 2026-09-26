// What a crawler reads from the head of each fixture page: whether it may index the page, the page's
// canonical URL, who wrote it, and where the site's feed is. The fixture config gives cgc-seo `noindexTags: [private]` and a
// default author; its baseUrl is `localhost`. v4 parity itself is v4-parity.spec.mjs.
import { test, expect } from "../../../tests/harness/test.mjs"

const robots = (page) => page.locator('head meta[name="robots"]')
const canonical = (page) => page.locator('head link[rel="canonical"]')
const jsonLd = async (page) => JSON.parse(await page.locator('head script[type="application/ld+json"]').textContent())

test("a private page asks not to be indexed, and lets its links be followed", async ({ page }) => {
  await page.goto("/seo/private-note")
  await expect(robots(page)).toHaveCount(1)
  // The stubs' links to public pages should pass value, so no `nofollow` (#28).
  await expect(robots(page)).toHaveAttribute("content", "noindex")
})

test("a page tagged with a descendant of the private tag is private too", async ({ page }) => {
  await page.goto("/seo/private-descendant")
  await expect(robots(page)).toHaveAttribute("content", "noindex")
})

test("a private tag page asks not to be indexed: the private tag's, and its descendants'", async ({ page }) => {
  for (const url of ["/tags/private", "/tags/private/work"]) {
    await page.goto(url)
    await expect(robots(page), url).toHaveAttribute("content", "noindex")
  }
})

test("private pages stay listed on the site, for search, the graph and the explorer", async ({ emitted }) => {
  const index = JSON.parse(emitted.read("static/contentIndex.json"))
  expect(Object.keys(index)).toEqual(expect.arrayContaining(["seo/private-note", "seo/private-descendant"]))
})

test("a public page says nothing about indexing", async ({ page }) => {
  // A tag that only starts with the private tag's name is not a descendant of it.
  for (const url of ["/", "/plain-note", "/seo/authored", "/tags/fixture", "/tags/privateer"]) {
    await page.goto(url)
    await expect(robots(page), url).toHaveCount(0)
  }
})

test("every page names one canonical URL, without a trailing index", async ({ page }) => {
  const expected = {
    "/": "https://localhost/",
    "/plain-note": "https://localhost/plain-note",
    "/nested/deep-note": "https://localhost/nested/deep-note",
    // A folder page, whose slug is `nested/index`.
    "/nested/": "https://localhost/nested/",
    "/seo/private-note": "https://localhost/seo/private-note",
    "/tags/fixture": "https://localhost/tags/fixture",
  }
  for (const [url, href] of Object.entries(expected)) {
    await page.goto(url)
    await expect(canonical(page), url).toHaveCount(1)
    await expect(canonical(page), url).toHaveAttribute("href", href)
  }
})

test("every page links the RSS feed, for feed readers to find", async ({ page }) => {
  for (const url of ["/", "/plain-note", "/tags/fixture", "/seo/private-note"]) {
    await page.goto(url)
    const feeds = page.locator('head link[rel="alternate"][type="application/rss+xml"]')
    await expect(feeds, url).toHaveCount(1)
    await expect(feeds, url).toHaveAttribute("href", "https://localhost/index.xml")
    await expect(feeds, url).toHaveAttribute("title", "RSS Feed")
  }
})

test("a page is credited to the default author", async ({ page }) => {
  await page.goto("/plain-note")
  await expect(page.locator('head meta[property="article:author"]')).toHaveAttribute("content", "https://localhost/about")
  expect((await jsonLd(page)).author).toEqual({ "@type": "Person", name: "Fixture Author", url: "https://localhost/about" })
})

test("frontmatter `author:` overrides the default author", async ({ page }) => {
  await page.goto("/seo/authored")
  await expect(page.locator('head meta[property="article:author"]')).toHaveAttribute("content", "Ada Lovelace")
  expect((await jsonLd(page)).author).toEqual({ "@type": "Person", name: "Ada Lovelace" })
})

test("navigating within the site swaps in the next page's head metadata", async ({ page }) => {
  await page.goto("/seo/private-note")
  await expect(robots(page)).toHaveCount(1)
  await page.locator("article").getByRole("link", { name: "plain-note" }).click()
  await expect(page).toHaveURL(/\/plain-note$/)
  await expect(robots(page)).toHaveCount(0)
  await expect(canonical(page)).toHaveCount(1)
  await expect(canonical(page)).toHaveAttribute("href", "https://localhost/plain-note")
})
