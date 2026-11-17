import { crawlSitemap, SITE } from "../feed-and-sitemap.ts"
import { expect, test } from "../site.ts"

test("the index holds more pages than the sitemap lists: the indexable pages, and the tag pages besides", async ({
  request,
}) => {
  const sitemap = await crawlSitemap(request, `${SITE}/sitemap.xml`)
  // Pagefind's entry file says how many pages its index holds.
  const entry = (await (await request.get("/pagefind/pagefind-entry.json")).json()) as {
    languages: Record<string, { page_count: number }>
  }
  const indexed = Object.values(entry.languages).reduce((total, language) => total + language.page_count, 0)
  // A tag page is discoverable, and searched, but asks search engines not to index it, and is not
  // in the sitemap (src/lib/page.ts). The vault has a tags index, so at least one more page.
  expect(indexed).toBeGreaterThan(sitemap.size)
})
