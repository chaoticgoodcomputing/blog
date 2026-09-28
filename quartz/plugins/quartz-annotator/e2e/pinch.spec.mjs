// Pinch zoom (src/viewer/reader.ts): on a touch screen, two fingers zoom the document, not the page,
// so the bar and the drawer's tab keep their size. The point under the fingers stays under them,
// the pages are drawn again at the new width, one finger still scrolls and pans, and the zoom is the
// bar's, remembered as the bar's is.
import { test, expect } from "../../../tests/harness/test.mjs"
import { touch } from "./touch.mjs"

const PAPER = "/annotations/fixture-paper"

test.use({ hasTouch: true, isMobile: true })

const frame = (page) => page.locator(".cgc-annotator-frame")
const level = (page) => page.locator(".cgc-annotator-frame__zoom-level")
const firstPage = (page) => page.locator('.cgc-annotator-viewer__page[data-page="1"]')

async function open(page) {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAPER)
  await expect(frame(page)).toHaveAttribute("data-layout", "drawer")
  await expect(firstPage(page).locator("canvas")).toBeAttached()
}

// The middle of the first page as it's shown: on the document.
const onDocument = async (page) => {
  const box = await firstPage(page).boundingBox()
  return { x: box.x + box.width / 2, y: Math.min(box.y + box.height / 2, 700) }
}

// Two fingers, `from` apart and then `to` apart, either side of `mid`.
const pinch = (page, mid, from, to) =>
  touch(page, [
    [{ x: mid.x - from / 2, y: mid.y }, { x: mid.x - to / 2, y: mid.y }],
    [{ x: mid.x + from / 2, y: mid.y }, { x: mid.x + to / 2, y: mid.y }],
  ])

test("at 390px, a pinch zooms the document, and the bar and the tab keep their size", async ({ page }) => {
  await open(page)
  const [bar, tab, doc] = await Promise.all([".cgc-annotator-frame__bar", ".cgc-annotator__tab", '.cgc-annotator-viewer__page[data-page="1"]'].map((s) => page.locator(s).boundingBox()))
  const heading = await page.locator(".cgc-annotator-viewer__page").getByText("Fixture paper, page one").boundingBox()
  const mid = { x: 195, y: heading.y + heading.height / 2 }
  await pinch(page, mid, 80, 160)
  await expect(level(page)).toHaveText("200%")
  await expect.poll(async () => (await firstPage(page).boundingBox()).width).toBeCloseTo(doc.width * 2, 0)
  const [barAfter, tabAfter] = await Promise.all([".cgc-annotator-frame__bar", ".cgc-annotator__tab"].map((s) => page.locator(s).boundingBox()))
  expect(barAfter.height).toBeCloseTo(bar.height, 0)
  expect(tabAfter.width).toBeCloseTo(tab.width, 0)
  expect(await page.evaluate(() => visualViewport.scale)).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test("after a pinch, the point under the fingers is still under them, and the pages are sharp", async ({ page }) => {
  await open(page)
  const text = page.locator(".cgc-annotator-viewer__page").getByText("The annotator draws highlights")
  const before = await text.boundingBox()
  // The fingers either side of the line's start.
  const mid = { x: before.x + 10, y: before.y + before.height / 2 }
  await pinch(page, mid, 60, 90)
  await expect(level(page)).toHaveText("150%")
  await expect.poll(async () => {
    const after = await text.boundingBox()
    return Math.max(Math.abs(after.x + 10 * 1.5 - mid.x), Math.abs(after.y + after.height / 2 - mid.y))
  }).toBeLessThan(12)
  const canvas = firstPage(page).locator("canvas")
  await expect.poll(async () => {
    const [box, width] = [await firstPage(page).boundingBox(), await canvas.evaluate((c) => c.width / Math.min(2, devicePixelRatio))]
    return Math.abs(width - box.width)
  }).toBeLessThan(2)
})

test("one finger still scrolls the page, and pans a zoomed document sideways", async ({ page }) => {
  await open(page)
  await pinch(page, await onDocument(page), 80, 160)
  await expect(level(page)).toHaveText("200%")
  const column = page.locator(".cgc-annotator-viewer__document")
  await expect.poll(() => column.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeGreaterThan(200)
  const [y, x] = [await page.evaluate(() => scrollY), await column.evaluate((el) => el.scrollLeft)]
  await touch(page, [[{ x: 200, y: 700 }, { x: 200, y: 300 }]])
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y + 100)
  await touch(page, [[{ x: 300, y: 500 }, { x: 60, y: 500 }]])
  await expect.poll(() => column.evaluate((el) => el.scrollLeft)).toBeGreaterThan(x + 100)
  expect(await page.evaluate(() => scrollX)).toBe(0)
})

test("the zoom after a pinch is the one the bar shows, and survives a reload", async ({ page }) => {
  await open(page)
  await pinch(page, await onDocument(page), 100, 130)
  await expect(level(page)).toHaveText("130%")
  await page.reload()
  await expect(frame(page)).toHaveAttribute("data-layout", "drawer")
  await expect(level(page)).toHaveText("130%")
  await page.keyboard.press("0")
  await expect(level(page)).toHaveText("100%")
})
