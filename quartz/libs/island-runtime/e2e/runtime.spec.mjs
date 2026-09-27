// The island runtime, as quartz-mdx ships it on the fixture site. quartz-mdx's own specs prove the
// lifecycle (hydrate on `nav` and `render`, unmount on `prenav`, drop an overtaken hydration).
// This proves what lets a second plugin ship a runtime of its own beside it: each runtime
// hydrates only the markers of the plugin that shipped it.
import { test, expect } from "../../../tests/harness/test.mjs"

test("a runtime leaves another plugin's markers alone", async ({ page }) => {
  const requested = []
  page.on("request", (request) => requested.push(new URL(request.url()).pathname))
  await page.goto("/lab/life.mdx")
  const own = page.locator(".cgc-mdx-island")
  await expect(own).toHaveAttribute("data-cgc-hydrated", "")

  // Another plugin's island, added in place and announced the way Quartz announces in-place
  // updates, which makes every runtime rescan.
  await page.evaluate(() => {
    const marker = document.createElement("div")
    marker.className = "cgc-other-island"
    Object.assign(marker.dataset, {
      cgcEntry: "static/cgc-other/Other.js",
      cgcHydrate: "load",
      cgcProps: "{}",
    })
    document.querySelector("article").append(marker)
    document.dispatchEvent(new CustomEvent("render"))
  })
  await page.waitForTimeout(300)

  const other = page.locator(".cgc-other-island")
  await expect(other).not.toHaveAttribute("data-cgc-mounting")
  await expect(other).not.toHaveAttribute("data-cgc-hydrated")
  expect(requested).not.toContain("/static/cgc-other/Other.js")
  // The rescan left the runtime's own island mounted, once.
  await expect(own).toHaveAttribute("data-cgc-hydrated", "")
})
