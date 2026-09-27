// Which tag a tag page is for, as the plugins that inline tags-core read it (`tagOfPage()`):
// `tags/<t>`, or `tags/<t>/index` for a tag's description file in v4's layout. Only a whole `index`
// segment is dropped, so a tag whose name ends in "index" is still that tag. The fixture's
// tag-engine/index-suffix is tagged `reindex/deep`, which gives `/tags/reindex` a tag page.
import { test, expect } from "../../../tests/harness/test.mjs"

test("a tag page whose tag ends in \"index\" is that tag's page, in every consumer", async ({
  page,
}) => {
  await page.goto("/tags/reindex")
  // quartz-post-listing lists the tag's posts, its subtags' included.
  const listing = page.locator(".cgc-post-listing")
  await expect(listing.locator(".cgc-post-listing__link")).toHaveText(["Index Suffix"])
  // quartz-tag-list lists the tag's subtags.
  const subtags = page.locator(".cgc-tag-list .cgc-tag-list__item")
  await expect(subtags).toHaveCount(1)
  await expect(subtags).toHaveAttribute("data-tag", "reindex/deep")
})

test("the index of every tag is no tag's page", async ({ page }) => {
  await page.goto("/tags")
  await expect(page.locator(".cgc-post-listing")).toHaveCount(0)
  await expect(page.locator(".cgc-tag-list")).toHaveCount(0)
})
