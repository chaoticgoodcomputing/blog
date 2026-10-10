import { crawlSitemap, readSitemap, SITE } from "../feed-and-sitemap.ts"
import { expect, test } from "../site.ts"

// test/fixtures/vault/sitemap: two indexable pages, `listed` and `Also Listed`, and a private one
// under drafts/. The feed's articles are under content/feed.

// The address the live site has always given it, which search consoles have on file (docs/adr/1501).
const SITEMAP = `${SITE}/sitemap.xml`
const LASTMOD = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

test("robots.txt names the sitemap, and the sitemap is valid by the sitemap protocol's schemas", async ({ request }) => {
  expect((await crawlSitemap(request, SITEMAP)).size).toBeGreaterThan(0)
})

test("the sitemap at /sitemap.xml lists the pages @astrojs/sitemap lists at its own address, each address whole", async ({
  request,
}) => {
  const pages = await crawlSitemap(request, SITEMAP)
  expect(pages).toEqual(await readSitemap(request, `${SITE}/sitemap-index.xml`))
  for (const address of pages.keys()) expect(address.startsWith(`${SITE}/`), address).toBe(true)
})

test("the sitemap lists every indexable page with its last-modified date", async ({ request }) => {
  const pages = await crawlSitemap(request, SITEMAP)
  // Every one of this feature's pages that is indexable, and none other of them.
  const own = [...pages.keys()].filter((address) => address.startsWith(`${SITE}/sitemap/`)).sort()
  expect(own).toEqual([`${SITE}/sitemap/Also-Listed`, `${SITE}/sitemap/listed`])
  for (const address of own) expect(pages.get(address), address).toMatch(LASTMOD)

  for (const article of ["/content/feed/first-article", "/content/feed/Weekly-W06"]) {
    expect(pages.get(`${SITE}${article}`), article).toMatch(LASTMOD)
  }
  // A note is never last modified before its date.
  expect(Date.parse(pages.get(`${SITE}/sitemap/listed`)!)).toBeGreaterThanOrEqual(Date.parse("2026-07-10"))
  expect(Date.parse(pages.get(`${SITE}/content/feed/first-article`)!)).toBeGreaterThanOrEqual(Date.parse("2026-07-03"))
})

test("a page under a private tag is not in the sitemap", async ({ request }) => {
  const pages = await crawlSitemap(request, SITEMAP)
  expect(pages.has(`${SITE}/sitemap/drafts/hidden`)).toBe(false)
  expect(pages.has(`${SITE}/content/feed/private-article`)).toBe(false)
  // Each is still a page of the site.
  expect((await request.get("/sitemap/drafts/hidden")).status()).toBe(200)
  expect((await request.get("/content/feed/private-article")).status()).toBe(200)
})
