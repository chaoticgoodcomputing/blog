// The drawer (src/viewer/reader.ts, ./layout): where the margin doesn't fit, the document takes the
// width and the annotations come in from the right. On a phone the drawer is modal, on a tablet it
// isn't. It opens from its tab, the bar's toggle or a tapped highlight, and always starts closed.
import { test, expect } from "../../../tests/harness/test.mjs"
import { touch } from "./touch.mjs"

const PAPER = "/annotations/fixture-paper"

const frame = (page) => page.locator(".cgc-annotator-frame")
const drawer = (page) => page.locator(".cgc-annotator__annotations")
const tab = (page) => page.locator(".cgc-annotator__tab")
const card = (page, id) => page.locator(`.cgc-annotator__annotation[data-annotation="${id}"]`)
const highlight = (page, id) => page.locator(`.cgc-annotator-viewer__highlight[data-annotation="${id}"]`).first()
const selected = (page) => page.locator(".cgc-annotator__annotation--active").evaluateAll((els) => els.map((el) => el.dataset.annotation))

// The paper in the drawer layout, its first page's passages drawn.
async function open(page, width, url = PAPER) {
  await page.setViewportSize({ width, height: 844 })
  await page.goto(url)
  await expect(frame(page)).toHaveAttribute("data-layout", "drawer")
  await expect(highlight(page, "highlights")).toBeAttached()
}

const isOpen = (page) => frame(page).getAttribute("data-drawer-open")

test.describe("on a phone, at 390px", () => {
  test("the tab is on the right edge, the document takes the width, and the drawer starts closed", async ({ page }) => {
    await open(page, 390)
    await expect(frame(page)).toHaveAttribute("data-drawer", "mobile")
    await expect(tab(page)).toBeInViewport()
    const box = await tab(page).boundingBox()
    expect(box.x + box.width).toBeCloseTo(390, 0)
    await expect(drawer(page)).toBeHidden()
    const doc = await page.locator(".cgc-annotator-viewer__page").first().boundingBox()
    expect(doc.width).toBeGreaterThan(350)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })

  test("tapping a highlight opens the drawer at its card", async ({ page }) => {
    await open(page, 390)
    await highlight(page, "quoteonly").click()
    await expect(drawer(page)).toBeInViewport()
    await expect.poll(() => selected(page)).toEqual(["quoteonly"])
    await expect(card(page, "quoteonly")).toBeInViewport()
    const box = await drawer(page).boundingBox()
    expect(box.width).toBeCloseTo(390 * 0.85, 0)
  })

  test("tapping a card closes the drawer, with the document at its highlight", async ({ page }) => {
    await open(page, 390)
    await tab(page).click()
    await expect(drawer(page)).toBeInViewport()
    await card(page, "lastpage").locator(".cgc-annotator__quote").click()
    await expect(drawer(page)).toBeHidden()
    await expect.poll(() => selected(page)).toEqual(["lastpage"])
    await expect(highlight(page, "lastpage")).toBeInViewport()
  })

  test("tapping the dimmed document closes the drawer", async ({ page }) => {
    await open(page, 390)
    await tab(page).click()
    await expect(page.locator(".cgc-annotator__scrim")).toHaveCSS("opacity", "0.4")
    await page.mouse.click(20, 400)
    await expect(drawer(page)).toBeHidden()
    expect(await isOpen(page)).toBe("false")
  })

  test("focus stays in the drawer while it's open, and Esc closes it", async ({ page }) => {
    await open(page, 390)
    await tab(page).click()
    await expect(drawer(page)).toBeInViewport()
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(i % 3 === 2 ? "Shift+Tab" : "Tab")
      expect(await page.evaluate(() => !!document.activeElement?.closest(".cgc-annotator__annotations")), `after ${i + 1} presses`).toBe(true)
    }
    await page.keyboard.press("Escape")
    await expect(drawer(page)).toBeHidden()
  })
})

test("at 1000px, the drawer is a card's width, nothing is dimmed, and cards move the document while it stays open", async ({ page }) => {
  await open(page, 1000)
  await expect(frame(page)).toHaveAttribute("data-drawer", "tablet")
  await page.locator(".cgc-annotator-frame__toggle").click()
  await expect(drawer(page)).toBeInViewport()
  expect((await drawer(page).boundingBox()).width).toBeCloseTo(320, 0)
  await expect(page.locator(".cgc-annotator__scrim")).toBeHidden()
  await card(page, "lastpage").locator(".cgc-annotator__quote").click()
  await expect(highlight(page, "lastpage")).toBeInViewport()
  await expect(drawer(page)).toBeInViewport()
  await card(page, "highlights").locator(".cgc-annotator__quote").click()
  await expect(highlight(page, "highlights")).toBeInViewport()
  await expect(drawer(page)).toBeInViewport()
  // The document stays usable beside it: a highlight still selects.
  await highlight(page, "quoteonly").click()
  await expect.poll(() => selected(page)).toEqual(["quoteonly"])
  // Its tab, and the bar's toggle, close it.
  await tab(page).click()
  await expect(drawer(page)).toBeHidden()
  await page.locator(".cgc-annotator-frame__toggle").click()
  await expect(drawer(page)).toBeInViewport()
  await page.locator(".cgc-annotator-frame__toggle").click()
  await expect(drawer(page)).toBeHidden()
})

test("dragging the tab opens the drawer, and a sideways swipe on the document doesn't", async ({ page }) => {
  await open(page, 1000)
  const doc = await page.locator(".cgc-annotator-viewer__page").first().boundingBox()
  await page.mouse.move(doc.x + doc.width - 20, doc.y + 200)
  await page.mouse.down()
  await page.mouse.move(doc.x + 100, doc.y + 210, { steps: 10 })
  await page.mouse.up()
  expect(await isOpen(page)).not.toBe("true")
  await expect(drawer(page)).toBeHidden()

  const grip = await tab(page).boundingBox()
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
  await page.mouse.down()
  await page.mouse.move(grip.x - 200, grip.y + grip.height / 2, { steps: 10 })
  await page.mouse.up()
  await expect(drawer(page)).toBeInViewport()
  expect(await isOpen(page)).toBe("true")
})

test("the hash, j and k take the document to the selection without opening the drawer", async ({ page }) => {
  await open(page, 390, `${PAPER}#lastpage`)
  await expect.poll(() => selected(page)).toEqual(["lastpage"])
  await expect(highlight(page, "lastpage")).toBeInViewport()
  await expect(drawer(page)).toBeHidden()
  await page.keyboard.press("k")
  await expect.poll(() => selected(page)).toEqual(["spanning"])
  await page.keyboard.press("k")
  await page.keyboard.press("k")
  await expect.poll(() => selected(page)).toEqual(["highlights"])
  await expect(highlight(page, "highlights")).toBeInViewport()
  await expect(drawer(page)).toBeHidden()
})

test("narrowing a wide window past the breakpoint turns the margin into the drawer, and widening turns it back", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(PAPER)
  await expect(frame(page)).toHaveAttribute("data-layout", "margin")
  await page.setViewportSize({ width: 900, height: 900 })
  await expect(frame(page)).toHaveAttribute("data-layout", "drawer")
  await expect(drawer(page)).toBeHidden()
  await expect(tab(page)).toBeInViewport()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(frame(page)).toHaveAttribute("data-layout", "margin")
  await expect(drawer(page)).toBeVisible()
  await expect(tab(page)).toBeHidden()
})

test("a reload starts with the drawer closed", async ({ page }) => {
  await open(page, 390)
  await tab(page).click()
  await expect(drawer(page)).toBeInViewport()
  await page.reload()
  await expect(frame(page)).toHaveAttribute("data-layout", "drawer")
  await expect(drawer(page)).toBeHidden()
})

test.describe("by touch", () => {
  test.use({ hasTouch: true, isMobile: true })

  test("on a phone, a swipe right on the open drawer closes it, and one on the document never opens it", async ({ page }) => {
    await open(page, 390)
    // Sideways across the document, from near the right edge: the document keeps it.
    await touch(page, [[{ x: 300, y: 500 }, { x: 60, y: 505 }]])
    await page.waitForTimeout(300)
    await expect(drawer(page)).toBeHidden()
    // Out from the tab.
    const grip = await tab(page).boundingBox()
    await touch(page, [[{ x: grip.x + grip.width / 2, y: grip.y + 20 }, { x: 150, y: grip.y + 25 }]])
    await expect(drawer(page)).toBeInViewport()
    // Settled at the drawer's width before the swipe starts on it.
    await expect.poll(async () => Math.round((await drawer(page).boundingBox()).x)).toBe(Math.round(390 * 0.15))
    // Back to the right across the drawer.
    await touch(page, [[{ x: 150, y: 400 }, { x: 370, y: 405 }]])
    await expect(drawer(page)).toBeHidden()
    expect(await selected(page)).toEqual([])
  })
})
