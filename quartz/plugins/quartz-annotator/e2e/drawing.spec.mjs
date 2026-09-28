// Lazy page drawing: the Viewer lays out every page's box as soon as the document opens, draws a
// page only as it comes near the screen, and lets go of its canvas once it's well away, so a long
// document can be shown on a phone without running out of canvas memory. The fixture paper's mirror
// is routed to the harness's long document (`fixtureBook`): a portrait cover, then landscape spreads,
// with the paper's passages on the cover and the last page.
import { createHash } from "node:crypto"
import { test, expect } from "../../../tests/harness/test.mjs"
import { fixtureBook } from "../../../tests/harness/source-host.mjs"

const PAPER = "/annotations/fixture-paper"
const MIRROR = `/mirrors/${createHash("sha256").update(new URL("https://cgc-fixture.invalid/paper.pdf").href).digest("hex").slice(0, 16)}`
const PAGES = 40
const BOOK = fixtureBook(PAGES - 1)

const viewerOf = (page) => page.locator(".cgc-annotator-viewer")
const highlights = (page, id) => page.locator(`.cgc-annotator-viewer__highlight[data-annotation="${id}"]`)

// The paper, showing the book: every page's box laid out.
async function openBook(page) {
  await page.route(`**${MIRROR}`, (route) => route.fulfill({ status: 200, contentType: "application/pdf", body: BOOK }))
  await page.goto(PAPER)
  const viewer = viewerOf(page)
  await expect(viewer).toHaveAttribute("data-cgc-hydrated", "")
  await expect(viewer.locator(".cgc-annotator-viewer__page")).toHaveCount(PAGES)
  return viewer
}

// The canvases alive now, and which pages hold them.
const live = (page) =>
  page.evaluate(() => [...document.querySelectorAll(".cgc-annotator-viewer canvas")].filter((c) => c.width > 0).map((c) => Number(c.closest("[data-page]").dataset.page)))

// Scrolls whatever the document scrolls in, the page or a box of its own, so that the top of page
// `n` is at the top of the screen.
const scrollToPage = (page, n) =>
  page.evaluate((n) => {
    const el = document.querySelector(`.cgc-annotator-viewer__page[data-page="${n}"]`)
    let box = el.parentElement
    while (box && !(box.scrollHeight > box.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(box).overflowY))) box = box.parentElement
    const scroller = box ?? document.scrollingElement
    const top = el.getBoundingClientRect().top - (box ? box.getBoundingClientRect().top : 0)
    scroller.scrollBy(0, top)
  }, n)

test("only the pages near the screen are drawn: a handful of canvases alive, wherever the reader is", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openBook(page)
  // The first page, and not the whole document.
  await expect.poll(() => live(page)).toContain(1)
  let most = 0
  for (let n = 1; n <= PAGES; n += 3) {
    await scrollToPage(page, n)
    // The page in view is drawn as it arrives.
    await expect.poll(() => live(page), `page ${n}`).toContain(n)
    const alive = await live(page)
    most = Math.max(most, alive.length)
    // Every live canvas is on a page near the one in view.
    for (const p of alive) expect(Math.abs(p - n), `page ${p} drawn while ${n} is in view`).toBeLessThanOrEqual(8)
  }
  expect(most).toBeLessThanOrEqual(10)
  // At the end, the last page is drawn with its passage highlighted, and the first has let go.
  await scrollToPage(page, PAGES)
  await expect.poll(() => live(page)).toContain(PAGES)
  await expect(highlights(page, "lastpage")).toHaveCount(1)
  expect(await live(page)).not.toContain(1)
  await expect(highlights(page, "highlights")).toHaveCount(0)
})

test("every page's box is laid out at once: the column is as wide as the widest page, narrower ones centred", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const viewer = await openBook(page)
  const boxes = await viewer.locator(".cgc-annotator-viewer__page").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))
  // Each box has its page's size and shape before it is drawn: a portrait cover, landscape spreads.
  expect(boxes[0].height / boxes[0].width).toBeCloseTo(792 / 612, 2)
  for (const box of boxes.slice(1)) expect(box.width / box.height).toBeCloseTo(1224 / 792, 2)
  // The spreads fill the column; the cover is half as wide, in the middle of it.
  expect(boxes[0].width).toBeCloseTo(boxes[1].width / 2, 0)
  expect(boxes[0].x + boxes[0].width / 2).toBeCloseTo(boxes[1].x + boxes[1].width / 2, 0)
})

test("a passage on a page not yet drawn can be chosen: the document goes to it, and it's highlighted once drawn", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openBook(page)
  await expect.poll(() => live(page)).toContain(1)
  await expect(highlights(page, "lastpage")).toHaveCount(0)
  await page.locator('.cgc-annotator__annotation[data-annotation="lastpage"] .cgc-annotator__quote').click()
  const passage = highlights(page, "lastpage")
  await expect(passage).toHaveCount(1)
  await expect(passage).toBeInViewport()
  await expect(passage).toHaveClass(/cgc-annotator-viewer__highlight--active/)
})

test("a resize resizes every page's box, and draws again only the pages in view", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const viewer = await openBook(page)
  await scrollToPage(page, 10)
  await expect.poll(() => live(page)).toContain(10)
  const width = () => viewer.locator('.cgc-annotator-viewer__page[data-page="20"]').evaluate((el) => el.getBoundingClientRect().width)
  const before = await width()
  const drawnWidth = () => viewer.locator('.cgc-annotator-viewer__page[data-page="10"] canvas').evaluate((c) => c.getBoundingClientRect().width)

  await page.setViewportSize({ width: 1200, height: 900 })
  // A page far away is resized, not drawn.
  await expect.poll(width).toBeLessThan(before - 50)
  expect(await live(page)).not.toContain(20)
  // The page in view is drawn again, at its new width.
  await expect.poll(async () => Math.abs((await drawnWidth()) - (await width()))).toBeLessThan(1)
  expect(await live(page)).toContain(10)
})

test("a page's canvas is never drawn at more than twice its size, however dense the screen", async ({ browser, colorScheme }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL, colorScheme, deviceScaleFactor: 3, viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  try {
    await openBook(page)
    await expect.poll(() => live(page)).toContain(1)
    const ratios = await page.evaluate(() =>
      [...document.querySelectorAll(".cgc-annotator-viewer canvas")].filter((c) => c.width > 0).map((c) => c.width / c.getBoundingClientRect().width),
    )
    expect(ratios.length).toBeGreaterThan(0)
    for (const ratio of ratios) expect(ratio).toBeLessThanOrEqual(2.01)
    expect(Math.max(...ratios)).toBeGreaterThan(1.9)
  } finally {
    await context.close()
  }
})
