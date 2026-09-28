// Zoom (src/viewer/reader.ts, ./layout): the Viewer's, from the bar and the keys. 100% is the fitted
// width; zooming in far enough on a desktop turns the margin into the drawer, and zooming out
// brings it back. Pages drawn after a zoom are drawn at the new width, the reading position holds,
// a document wider than its column pans sideways in it, and the page remembers the zoom.
import { test, expect } from "../../../tests/harness/test.mjs"

const PAPER = "/annotations/fixture-paper"

const frame = (page) => page.locator(".cgc-annotator-frame")
const level = (page) => page.locator(".cgc-annotator-frame__zoom-level")
const zoomIn = (page) => page.locator(".cgc-annotator-frame__zoom-in")
const zoomOut = (page) => page.locator(".cgc-annotator-frame__zoom-out")
const firstPage = (page) => page.locator('.cgc-annotator-viewer__page[data-page="1"]')

async function open(page, width, layout) {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(PAPER)
  await expect(frame(page)).toHaveAttribute("data-layout", layout)
  await expect(firstPage(page).locator("canvas")).toBeAttached()
}

test("the zoom control shows only with a document, at 100% to begin with", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route("**/mirrors/**", () => {})
  await page.goto(PAPER)
  await expect(page.locator(".cgc-annotator-frame__zoom")).toBeHidden()
  await page.unroute("**/mirrors/**")
  await page.reload()
  await expect(page.locator(".cgc-annotator-frame__zoom")).toBeVisible()
  await expect(level(page)).toHaveText("100%")
})

test("at 1440px, zooming in past the margin's fit switches to the drawer, and zooming out switches back", async ({ page }) => {
  await open(page, 1440, "margin")
  const before = (await firstPage(page).boundingBox()).width
  await zoomIn(page).click()
  await expect(level(page)).toHaveText("110%")
  await expect(frame(page)).toHaveAttribute("data-layout", "drawer")
  // In the drawer the document takes the page's width, less its gutters, or more.
  await expect.poll(async () => (await firstPage(page).boundingBox()).width).toBeGreaterThan(1440 - 40)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440)
  await zoomOut(page).click()
  await expect(level(page)).toHaveText("100%")
  await expect(frame(page)).toHaveAttribute("data-layout", "margin")
  await zoomOut(page).click()
  await expect(level(page)).toHaveText("90%")
  await expect(frame(page)).toHaveAttribute("data-layout", "margin")
  await expect.poll(async () => (await firstPage(page).boundingBox()).width).toBeCloseTo(before * 0.9, 0)
  // The level resets it.
  await level(page).click()
  await expect(level(page)).toHaveText("100%")
})

test("+, - and 0 zoom from the keyboard, but not while the reader types", async ({ page }) => {
  await open(page, 1440, "margin")
  await page.keyboard.press("-")
  await expect(level(page)).toHaveText("90%")
  await page.keyboard.press("+")
  await page.keyboard.press("+")
  await expect(level(page)).toHaveText("110%")
  await page.keyboard.press("0")
  await expect(level(page)).toHaveText("100%")
  await page.locator(".cgc-annotator-frame__menu-button").click()
  await page.locator(".cgc-annotator-frame__menu .search-button").click()
  await page.keyboard.type("+-")
  await page.keyboard.press("Escape")
  await expect(level(page)).toHaveText("100%")
})

test("pages drawn after a zoom are drawn at the new width, not scaled up", async ({ page }) => {
  await open(page, 1000, "drawer")
  await zoomIn(page).click()
  await zoomIn(page).click()
  await expect(level(page)).toHaveText("125%")
  const canvas = firstPage(page).locator("canvas")
  await expect.poll(async () => {
    const [box, width] = [await firstPage(page).boundingBox(), await canvas.evaluate((c) => c.width / devicePixelRatio)]
    return Math.abs(width - box.width)
  }).toBeLessThan(2)
})

test("a document wider than the screen pans sideways in its column, and the page never does", async ({ page }) => {
  await open(page, 390, "drawer")
  for (let i = 0; i < 3; i++) await zoomIn(page).click()
  await expect(level(page)).toHaveText("150%")
  const column = page.locator(".cgc-annotator-viewer__document")
  await expect.poll(() => column.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeGreaterThan(100)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await column.evaluate((el) => (el.scrollLeft = 150))
  expect(await column.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100)
  expect(await page.evaluate(() => window.scrollX)).toBe(0)
})

test("the reading position holds through a zoom", async ({ page }) => {
  await open(page, 390, "drawer")
  const passage = page.locator('.cgc-annotator-viewer__page[data-page="2"]').getByText("A line quoted whole")
  await passage.evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 400, behavior: "instant" }))
  const before = (await passage.boundingBox()).y
  // By key: a click would have the browser scroll the sticky bar into view first.
  await page.keyboard.press("+")
  await page.keyboard.press("+")
  await expect(level(page)).toHaveText("125%")
  await expect.poll(async () => Math.abs((await passage.boundingBox()).y - before), { timeout: 3000 }).toBeLessThan(40)
})

test("the zoom is remembered across a reload, and never put in the URL", async ({ page }) => {
  await open(page, 1440, "margin")
  await zoomOut(page).click()
  await zoomOut(page).click()
  await expect(level(page)).toHaveText("80%")
  expect(page.url()).not.toMatch(/zoom|80/)
  await page.reload()
  await expect(frame(page)).toHaveAttribute("data-layout", "margin")
  await expect(level(page)).toHaveText("80%")
  await level(page).click()
  await page.reload()
  await expect(frame(page)).toHaveAttribute("data-layout", "margin")
  await expect(level(page)).toHaveText("100%")
})
