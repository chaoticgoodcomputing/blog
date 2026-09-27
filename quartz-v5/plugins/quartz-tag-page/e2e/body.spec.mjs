// quartz-tag-page (#72): a tag's page is stock tag-page's, with its body replaced by the tag's
// description article and nothing else. The tag's posts are listed from the tag layout (#73).
import { test, expect } from "../../../tests/harness/test.mjs"

const body = (page) => page.locator(".cgc-tag-page")

test("renders a tag's description file as its page's body", async ({ page }) => {
  // tags/articles.md, in the renamed shape the vault's description files take (#43).
  await page.goto("/tags/articles")
  await expect(page.locator("h1.article-title")).toHaveText("Articles")
  await expect(body(page)).toContainText("longer pieces, written to be read from start to finish")
  await expect(body(page).getByRole("heading", { name: "How they are made" })).toBeVisible()
  // Nothing else: stock's count and list of the tag's pages are gone.
  await expect(page.locator(".page-listing")).toHaveCount(0)
  await expect(page.locator(".center")).not.toContainText("with this tag")
  // The article went through the site's pipeline like any page: its wikilink resolves.
  await body(page).getByRole("link", { name: "deep note" }).click()
  await expect(page).toHaveURL(/\/nested\/deep-note$/)
})

// Stock makes up a page for every tag a page carries, and for each of its ancestors. This plugin
// keeps them, with its own body: an empty article, since a made-up page has no description.
for (const { url, title, why } of [
  { url: "/tags/markdown", title: "markdown", why: "carried by pages" },
  { url: "/tags/writing", title: "writing", why: "only an ancestor of tags pages carry" },
  // Only .mdx pages carry `mdx`, and quartz-mdx generates those pages rather than Quartz parsing them.
  { url: "/tags/mdx", title: "mdx", why: "carried only by pages another page type makes" },
]) {
  test(`gives a tag with no description file a page with an empty body: ${why}`, async ({
    page,
  }) => {
    const response = await page.goto(url)
    expect(response.status()).toBe(200)
    await expect(page.locator("h1.article-title")).toHaveText(title)
    await expect(body(page)).toHaveCount(1)
    await expect(body(page)).toHaveText("")
    await expect(page.locator(".page-listing")).toHaveCount(0)
  })
}

// Core's page preview shows the `popover-hint` parts of the page a link points at, so a tag's badge
// previews the tag's description, as v4's did.
test("previews a tag's description when a reader hovers a link to its page", async ({ page }) => {
  // og/tag-flat carries `articles`, so its tag list links to /tags/articles.
  await page.goto("/og/tag-flat")
  await page.locator('.cgc-tag-list__item[data-tag="articles"] .cgc-tag-list__link').hover()
  await expect(page.locator(".popover .popover-inner")).toContainText(
    "longer pieces, written to be read from start to finish",
  )
})
