import { builtPages } from "../build.ts"
import { expect, test } from "../site.ts"

// The vault's annotation pages, each with its document drawn from the site's mirror, and its cards
// in the document's margin or a drawer (ADR 3701). The mirrors are git-ignored files of the vault, so
// a checkout has them only once they are saved: `pnpm nx run astro:mirrors` before this suite
// (docs/adr/2801). How the viewer behaves is the fixture's to show; this says that every real
// document's passages are found in it.

const MIRRORS = "run `pnpm nx run astro:mirrors`"

test("every passage annotated on each annotation page is highlighted in its document, and no two of its cards overlap", async ({
  page,
}) => {
  test.setTimeout(300_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  const pages = builtPages("vault").filter(({ html }) => html.includes("<annotation-viewer"))
  expect(pages.length, `the mirrors are saved: ${MIRRORS}`).toBeGreaterThan(0)
  for (const { address } of pages) {
    await page.goto(address)
    const viewer = page.locator("annotation-viewer")
    await expect(viewer, address).toHaveAttribute("data-state", "opened", { timeout: 30_000 })
    const passages = await page.locator(".annotation:has(> .annotation-highlight)").evaluateAll((all) => all.map((each) => each.id))
    const highlighted = await viewer.locator(".highlight").evaluateAll((all) => [
      ...new Set(all.map((each) => each.getAttribute("href")!.slice(1))),
    ])
    expect(highlighted.sort(), address).toEqual(passages.sort())
    // Nothing the document has no place for, so no heading for it.
    await expect(page.locator("section.annotations > .unplaced"), address).toHaveCount(0)

    if ((await viewer.getAttribute("data-layout")) !== "margin") continue
    const boxes = await page.locator("section.annotations > .annotation").evaluateAll((all) =>
      all.map((each) => each.getBoundingClientRect()).map(({ top, bottom }) => ({ top, bottom })),
    )
    for (const [i, box] of boxes.entries()) {
      if (i > 0) expect(box.top, `${address}: card ${i}`).toBeGreaterThanOrEqual(boxes[i - 1]!.bottom)
    }
  }
})
