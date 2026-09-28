// The desktop margin (src/viewer/reader.ts, ./layout): on a wide screen, once the document opens,
// the page is the document with the annotations anchored in its right margin, each card level with
// its passage or just below the card above, and all but the selected one shortened.
import { test, expect } from "../../../tests/harness/test.mjs"

const PAPER = "/annotations/fixture-paper"
const WITHDRAWN = "/annotations/withdrawn"
// The cards the margin places, in the order their passages come, and the one it can't.
const PLACED = ["highlights", "quoteonly", "spanning", "lastpage"]

const frame = (page) => page.locator(".cgc-annotator-frame")
const card = (page, id) => page.locator(`.cgc-annotator__annotation[data-annotation="${id}"]`)
const highlight = (page, id) => page.locator(`.cgc-annotator-viewer__highlight[data-annotation="${id}"]`).first()
const selected = (page) => page.locator(".cgc-annotator__annotation--active").evaluateAll((els) => els.map((el) => el.dataset.annotation))

// The paper in the margin layout, every passage drawn.
async function open(page, url = PAPER) {
  await page.goto(url)
  await expect(frame(page)).toHaveAttribute("data-layout", "margin")
  for (const id of PLACED) await expect(highlight(page, id)).toBeAttached()
}

// Every placed card's top, and its passage's, in page pixels; and each card's bottom.
const geometry = (page) =>
  page.evaluate((ids) => {
    const top = (el) => el.getBoundingClientRect().top + window.scrollY
    return ids.map((id) => {
      const card = document.querySelector(`.cgc-annotator__annotation[data-annotation="${id}"]`)
      const passage = document.querySelector(`.cgc-annotator-viewer__highlight[data-annotation="${id}"]`)
      return { id, card: top(card), bottom: top(card) + card.offsetHeight, passage: top(passage) }
    })
  }, PLACED)

// Each card level with its passage, or just below the card above it; none overlapping.
async function expectAnchored(page) {
  await expect
    .poll(async () => {
      const cards = await geometry(page)
      return cards.every((c, i) => {
        const above = cards[i - 1]
        const level = Math.abs(c.card - c.passage) <= 8
        const pushed = above && c.card > c.passage && c.card - above.bottom >= 0 && c.card - above.bottom <= 24
        return (level || pushed) && (!above || c.card >= above.bottom)
      })
    }, JSON.stringify(await geometry(page)))
    .toBe(true)
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
})

test("at 1440px, every card is beside its passage, or just below the card above, and none overlap, after a resize too", async ({ page }) => {
  await open(page)
  // The document, then the margin, side by side.
  const [doc, list] = [await page.locator(".cgc-annotator__viewer").boundingBox(), await page.locator(".cgc-annotator__annotations").boundingBox()]
  expect(doc.x + doc.width).toBeLessThan(list.x)
  expect(list.width).toBeCloseTo(320, 0)
  await expectAnchored(page)
  await page.setViewportSize({ width: 1150, height: 900 })
  await expect.poll(async () => (await page.locator(".cgc-annotator__viewer").boundingBox()).width).toBeLessThan(doc.width - 100)
  await expectAnchored(page)
  // One page scroll: nothing scrolls on its own, and nothing sideways.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1150)
  expect(await page.locator(".cgc-annotator-viewer__document").evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1)
})

test("what the document has no place for goes last, under its heading, after the last page", async ({ page }) => {
  await open(page)
  const heading = page.locator(".cgc-annotator__unplaced")
  await expect(heading).toBeVisible()
  await expect(heading).toHaveText("Not found in the document")
  expect(await page.locator(".cgc-annotator__annotations > *:not(h2)").evaluateAll((els) => els.map((el) => el.dataset.annotation ?? "heading"))).toEqual([...PLACED, "heading", "orphan"])
  const last = page.locator('.cgc-annotator-viewer__page[data-page="2"]')
  await expect.poll(async () => {
    const [l, h, orphan] = [await last.boundingBox(), await heading.boundingBox(), await card(page, "orphan").boundingBox()]
    return h.y >= l.y + l.height - 1 && orphan.y > h.y
  }).toBe(true)
})

test("every card but the selected one is shortened, and the selected one is laid beside its passage", async ({ page }) => {
  await open(page)
  // Shortened: its passage clamped to two lines, and its note to a few.
  const cut = (id) =>
    card(page, id).evaluate((el) => {
      const quote = getComputedStyle(el.querySelector(".cgc-annotator__quote")).webkitLineClamp
      const note = getComputedStyle(el.querySelector(".cgc-annotator__note")).maxHeight
      return quote === "2" && note !== "none"
    })
  for (const id of ["highlights", "spanning", "lastpage"]) expect(await cut(id), id).toBe(true)
  await card(page, "spanning").locator(".cgc-annotator__quote").click()
  await expect.poll(() => selected(page)).toEqual(["spanning"])
  await expect.poll(() => cut("spanning")).toBe(false)
  await expect.poll(async () => {
    const c = (await geometry(page)).find((g) => g.id === "spanning")
    return Math.abs(c.card - c.passage)
  }).toBeLessThanOrEqual(8)
  await expectAnchored(page)
})

test("a card, a highlight, j, k and Esc each select or clear, with the selected card beside its passage", async ({ page }) => {
  await open(page)
  await card(page, "lastpage").locator(".cgc-annotator__quote").click()
  await expect.poll(() => selected(page)).toEqual(["lastpage"])
  await expect(highlight(page, "lastpage")).toBeInViewport()
  await expect(highlight(page, "lastpage")).toHaveClass(/--active/)
  await expect(card(page, "lastpage")).toBeInViewport()

  await page.evaluate(() => window.scrollTo(0, 0))
  await highlight(page, "highlights").click()
  await expect.poll(() => selected(page)).toEqual(["highlights"])
  expect(await page.evaluate(() => location.hash)).toBe("#highlights")

  await page.keyboard.press("j")
  await expect.poll(() => selected(page)).toEqual(["quoteonly"])
  await page.keyboard.press("j")
  await expect.poll(() => selected(page)).toEqual(["spanning"])
  await expect(highlight(page, "spanning")).toBeInViewport()
  await expect(card(page, "spanning")).toBeInViewport()
  await page.keyboard.press("k")
  await expect.poll(() => selected(page)).toEqual(["quoteonly"])
  await page.keyboard.press("Escape")
  await expect.poll(() => selected(page)).toEqual([])
  expect(await page.evaluate(() => location.hash)).toBe("")
})

test("a link to an annotation opens at its passage, with its card beside it", async ({ page }) => {
  await open(page, `${PAPER}#lastpage`)
  await expect.poll(() => selected(page)).toEqual(["lastpage"])
  await expect(highlight(page, "lastpage")).toBeInViewport()
  await expect(card(page, "lastpage")).toBeInViewport()
  await expect.poll(async () => {
    const [h, c] = [await highlight(page, "lastpage").boundingBox(), await card(page, "lastpage").boundingBox()]
    return Math.abs(h.y - c.y)
  }).toBeLessThanOrEqual(8)
})

test("hovering a card tints its highlights", async ({ page }) => {
  await open(page)
  await card(page, "highlights").hover()
  await expect(highlight(page, "highlights")).toHaveClass(/--hover/)
  await expect(highlight(page, "quoteonly")).not.toHaveClass(/--hover/)
  await page.mouse.move(10, 10)
  await expect(highlight(page, "highlights")).not.toHaveClass(/--hover/)
})

test("the bar's toggle hides the margin, giving the document the width, and a reload remembers it", async ({ page }) => {
  await open(page)
  const width = async () => (await page.locator(".cgc-annotator__viewer").boundingBox()).width
  const before = await width()
  const toggle = page.locator(".cgc-annotator-frame__toggle")
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  await toggle.click()
  await expect(page.locator(".cgc-annotator__annotations")).toBeHidden()
  await expect(toggle).toHaveAttribute("aria-expanded", "false")
  await expect.poll(width).toBeGreaterThan(before + 200)
  await page.reload()
  await expect(frame(page)).toHaveAttribute("data-layout", "margin")
  await expect(page.locator(".cgc-annotator__annotations")).toBeHidden()
  await toggle.click()
  await expect(page.locator(".cgc-annotator__annotations")).toBeVisible()
  await page.reload()
  await expect(frame(page)).toHaveAttribute("data-layout", "margin")
  await expect(page.locator(".cgc-annotator__annotations")).toBeVisible()
})

test("a page whose mirror is missing stays static", async ({ page }) => {
  await page.goto(WITHDRAWN)
  await expect(page.locator(".cgc-annotator-viewer__notice")).toBeVisible()
  await page.waitForTimeout(300)
  await expect(frame(page)).toHaveAttribute("data-layout", "static")
})
