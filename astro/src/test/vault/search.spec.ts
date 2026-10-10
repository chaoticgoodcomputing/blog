import { crawlSitemap, SITE } from "../feed-and-sitemap.ts"
import { expect, test } from "../site.ts"

test("the index holds as many pages as the sitemap lists: the indexable pages", async ({ request }) => {
  const sitemap = await crawlSitemap(request, `${SITE}/sitemap.xml`)
  // Pagefind's entry file says how many pages its index holds.
  const entry = (await (await request.get("/pagefind/pagefind-entry.json")).json()) as {
    languages: Record<string, { page_count: number }>
  }
  const indexed = Object.values(entry.languages).reduce((total, language) => total + language.page_count, 0)
  expect(indexed).toBe(sitemap.size)
})
