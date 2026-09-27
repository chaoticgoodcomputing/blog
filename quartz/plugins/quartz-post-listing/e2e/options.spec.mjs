// quartz-post-listing's `showOn: false`: for a site that places the listing itself, through the TS
// layout override in its `quartz.ts`, the component renders on every page its layout puts it on,
// with no page filter of its own (docs/adr/0001's addendum). The real site does this (#70).
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, fixtureConfig, withPlugins } from "../../../tests/harness/site.mjs"

const SOURCE = "@chaoticgoodcomputing/quartz-post-listing"
const ORIGIN = "https://listing.example"
const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nHome.\n",
  "a-note.md": "---\ntitle: A note\ndate: 2024-02-01\n---\nA note.\n",
}

test("renders on every page its layout puts it on when showOn is false", async ({ page }) => {
  const site = await buildScratchSite("post-listing-show-on-false", CONTENT, {
    config: withPlugins(fixtureConfig(), [
      { source: SOURCE, enabled: true, options: { showOn: false }, layout: { position: "afterBody", priority: 10 } },
    ]),
    keep: true,
  })
  try {
    expect(site.code, site.output).toBe(0)
    await routeSite(page, site.public, ORIGIN)
    for (const url of ["/", "/a-note"]) {
      await page.goto(`${ORIGIN}${url}`)
      await expect(page.locator(".cgc-post-listing"), url).toHaveCount(1)
    }
  } finally {
    site.remove()
  }
})
