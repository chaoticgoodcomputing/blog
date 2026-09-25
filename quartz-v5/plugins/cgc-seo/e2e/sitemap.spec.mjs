// What a crawler reads from the fixture site's sitemap.xml: every indexable page once, at its
// canonical URL, the tag pages among them, and no private page, external page or listing of a tag
// only private pages carry. The fixture's baseUrl is `localhost`, and its content-index writes no
// sitemap of its own. v4 parity itself is v4-parity.spec.mjs.
import { test, expect } from "../../../tests/harness/test.mjs"
import { fileFor } from "../../../tests/harness/site.mjs"
import { readSitemap, parseXml } from "./feeds.mjs"

test.skip(({ colorScheme }) => colorScheme === "dark", "the sitemap has no colour scheme")

const ORIGIN = "https://localhost"
const sitemap = (emitted) => readSitemap(emitted.read("sitemap.xml"))
const paths = (emitted) => sitemap(emitted).map(({ loc }) => (loc.startsWith(`${ORIGIN}/`) ? loc.slice(ORIGIN.length) : loc))

test("is a well-formed sitemap", async ({ page, emitted }) => {
  expect(await page.evaluate(parseXml, emitted.read("sitemap.xml"))).toEqual({
    root: "urlset",
    namespace: "http://www.sitemaps.org/schemas/sitemap/0.9",
  })
})

test("lists the public pages and the pages of every tag they carry, each once, at its canonical URL", async ({ emitted }) => {
  const listed = paths(emitted)
  expect(listed).toEqual(
    expect.arrayContaining([
      "/",
      "/plain-note",
      "/nested/deep-note",
      "/seo/authored",
      "/seo/feed-article",
      // A tag's page, from its description note (`tags/fixture.md`).
      "/tags/fixture",
      // Tag pages Quartz generates, for a tag and its ancestor, and the index of all tags.
      "/tags/feeds/rss",
      "/tags/feeds",
      "/tags/writing/essays",
      "/tags/writing",
      "/tags/index",
      // Only starts with the private tag's name.
      "/tags/privateer",
    ]),
  )
  expect(listed.filter((url, i) => listed.indexOf(url) !== i)).toEqual([])
})

test("leaves out private pages, the pages of tags only private pages carry, and external pages", async ({ emitted }) => {
  const listed = paths(emitted)
  for (const url of [
    "/seo/private-note",
    "/seo/private-descendant",
    "/tags/private",
    "/tags/private/work",
    // Carried by a private page alone: its page lists nothing else.
    "/tags/backstage",
    // Stands in for a page on another site.
    "/seo/external-stub",
  ]) {
    expect(listed, url).not.toContain(url)
  }
})

test("lists only pages the site serves", ({ emitted }) => {
  const missing = paths(emitted).filter((url) => fileFor(emitted.root, url).status !== 200)
  expect(missing).toEqual([])
})

test("dates a page by its own date, and a page Quartz generates by none", ({ emitted }) => {
  const entry = (url) => sitemap(emitted).find(({ loc }) => loc === `${ORIGIN}${url}`)
  expect(entry("/seo/feed-article")).toEqual({ loc: `${ORIGIN}/seo/feed-article`, lastmod: "2999-01-01T00:00:00.000Z" })
  expect(entry("/tags/feeds")).toEqual({ loc: `${ORIGIN}/tags/feeds` })
})
