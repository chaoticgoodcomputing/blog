// quartz-graph in the page's layout (#74): the local graph's box is square, but never taller than the
// layout lets its block be. The block sets its own display to do that, which must not stop a layout's
// `display: desktop-only` from hiding it: Quartz wraps the block in an element of its own for that.
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, editConfig, fixtureConfig } from "../../../tests/harness/site.mjs"
import { drawnGraph, localGraph } from "./graph.mjs"

// Below core's desktop breakpoint its right sidebar is a row of components, each capped at 24rem.
// The square box shrinks to fit its block there instead of spilling out of it.
for (const width of [900, 1150]) {
  test(`keeps the graph's box inside its block at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/links/from-md")
    await drawnGraph(localGraph(page))
    const { box, block } = await page.locator(".cgc-graph").evaluate((graph) => ({
      box: graph.querySelector(".cgc-graph__outer").getBoundingClientRect().bottom,
      block: graph.getBoundingClientRect().bottom,
    }))
    expect(box).toBeLessThanOrEqual(block + 0.5)
  })
}

// The fixture's config, with the graph laid out `desktop-only`: core hides it below 800px.
const desktopOnly = () =>
  editConfig(fixtureConfig(), (_, entry) => entry("@chaoticgoodcomputing/quartz-graph").setIn(["layout", "display"], "desktop-only"))

test("hides the whole graph where a layout display class says to", async ({ page }) => {
  const site = await buildScratchSite(
    "graph-desktop-only",
    {
      "index.md": "---\ntitle: Home\n---\nSee [[other]].\n",
      "other.md": "---\ntitle: Other\n---\nBack [[index|home]].\n",
    },
    { config: desktopOnly(), keep: true },
  )
  try {
    expect(site.code, site.output).toBe(0)
    await routeSite(page, site.public, "https://localhost")
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto("https://localhost/")
    await expect(page.locator(".cgc-graph__outer")).toBeVisible()
    await page.setViewportSize({ width: 600, height: 900 })
    await expect(page.locator(".cgc-graph__outer")).toBeHidden()
    await expect(page.locator(".cgc-graph__title")).toBeHidden()
  } finally {
    site.remove()
  }
})
