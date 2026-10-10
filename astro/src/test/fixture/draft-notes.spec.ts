import { crawlSitemap, SITE } from "../feed-and-sitemap.ts"
import { expect, test } from "../site.ts"

// test/fixtures/vault/draft-notes: `published`, which links to `unfinished`, a draft.

test("a draft has no page", async ({ page }) => {
  const response = await page.goto("/draft-notes/unfinished")
  expect(response!.status()).toBe(404)
})

test("a link to a draft goes nowhere, as a link to a note the vault doesn't have", async ({ page }) => {
  await page.goto("/draft-notes/published")
  const link = page.locator(".prose").getByText("unfinished")
  await expect(link).toHaveClass(/is-unresolved/)
})

test("a draft is in neither the graph's index nor the sitemap", async ({ request }) => {
  const index = await (await request.get("/graph.json")).json()
  const urls = (index.notes as { url: string }[]).map((note) => note.url)
  expect(urls).toContain("/draft-notes/published")
  expect(urls).not.toContain("/draft-notes/unfinished")
  const pages = await crawlSitemap(request, `${SITE}/sitemap.xml`)
  expect(pages.has(`${SITE}/draft-notes/published`)).toBe(true)
  expect(pages.has(`${SITE}/draft-notes/unfinished`)).toBe(false)
})
