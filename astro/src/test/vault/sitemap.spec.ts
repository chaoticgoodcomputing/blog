import { crawlSitemap, SITE } from "../feed-and-sitemap.ts"
import { expect, test } from "../site.ts"

const SITEMAP = `${SITE}/sitemap.xml`
const DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

test("the real vault's sitemap is valid, and lists its public pages with their last-modified dates", async ({
  request,
}) => {
  const pages = await crawlSitemap(request, SITEMAP)
  expect(pages.get(`${SITE}/`)).toMatch(DATE)
  for (const [page, lastmod] of pages) expect(lastmod, page).toMatch(DATE)
})
