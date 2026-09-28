// The annotation page's frame, `cgc-annotation` (docs/adr/0004), and the page as it reads before
// any script runs, and for good where there's no document to show: the bar, the top section, the
// annotations in one column, the bottom section, the footer. The ☰ drawer holds `header` and `left`.
import { test, expect } from "../../../tests/harness/test.mjs"

const PAPER = "/annotations/fixture-paper"
const WITHDRAWN = "/annotations/withdrawn"
const IN_ORDER = ["highlights", "quoteonly", "orphan", "spanning", "lastpage"]
const WIDTHS = [390, 1000, 1440]

const frame = (page) => page.locator(".cgc-annotator-frame")
const bar = (page) => page.locator(".cgc-annotator-frame__bar")
const menu = (page) => page.locator(".cgc-annotator-frame__menu")
const menuButton = (page) => page.locator(".cgc-annotator-frame__menu-button")

// The page's parts, top to bottom, each where it should be: none overlapping the one before it.
async function expectStaticLayout(page, width) {
  await expect(page.locator(".page")).toHaveAttribute("data-frame", "cgc-annotation")
  const parts = [
    bar(page),
    page.locator(".cgc-annotator-frame__top"),
    page.locator(".cgc-annotator__annotations"),
    page.locator(".cgc-annotator-frame__bottom"),
    page.locator("footer").last(),
  ]
  const boxes = []
  for (const part of parts) {
    await expect(part).toBeVisible()
    boxes.push(await part.boundingBox())
  }
  for (let i = 1; i < boxes.length; i++) expect(boxes[i].y, `part ${i} below part ${i - 1}`).toBeGreaterThanOrEqual(boxes[i - 1].y + boxes[i - 1].height - 1)
  // The top section: the page header, where the document comes from, the preface.
  const top = parts[1]
  await expect(top.locator(".article-title")).toHaveText("Fixture paper")
  await expect(top.locator(".cgc-annotator-frame__source-link")).toHaveAttribute("href", "https://cgc-fixture.invalid/paper.pdf")
  await expect(top.locator(".cgc-annotator-frame__preface")).toContainText("An annotation page whose source document")
  // The cards, in document order, in one column.
  const cards = page.locator(".cgc-annotator__annotation")
  expect(await cards.evaluateAll((els) => els.map((el) => el.dataset.annotation))).toEqual(IN_ORDER)
  const xs = await cards.evaluateAll((els) => [...new Set(els.map((el) => Math.round(el.getBoundingClientRect().x)))])
  expect(xs).toHaveLength(1)
  // At the text's width, or the screen's less a gutter.
  const card = await cards.first().boundingBox()
  expect(card.width).toBeLessThanOrEqual(800 + 1)
  expect(card.width).toBeGreaterThan(Math.min(800, width - 32) - 40)
  // The document is out of sight, and nothing is wider than the screen.
  await expect(page.locator(".cgc-annotator__viewer")).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
}

for (const width of WIDTHS) {
  test(`at ${width}px, the page is the bar, the top section, the annotations, the bottom section and the footer`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    // As the page reads before the Viewer has a document: the mirror never answers.
    await page.route("**/mirrors/**", () => {})
    await page.goto(PAPER)
    await expectStaticLayout(page, width)
    // The bar: the site's name, and the annotations' toggle with their count.
    await expect(bar(page).locator(".cgc-annotator-frame__site-name")).toBeVisible()
    await expect(bar(page).locator(".cgc-annotator-frame__count")).toHaveText(String(IN_ORDER.length))
  })

  test(`at ${width}px, the ☰ drawer opens and closes, and holds the site's own components`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(PAPER)
    // Never open to begin with.
    await expect(menu(page)).not.toBeInViewport()
    // Nor anything of it on the page: no tag explorer's caret at the window's edge.
    await expect(page.locator(".cgc-tag-explorer__toggle")).toBeHidden()
    await expect(menuButton(page)).toHaveAttribute("aria-expanded", "false")
    // `left`: search and the scheme toggle.
    await expect(menu(page).locator(".search")).toHaveCount(1)
    await expect(menu(page).locator(".darkmode")).toHaveCount(1)

    await menuButton(page).click()
    await expect(menu(page)).toBeInViewport()
    await expect(menuButton(page)).toHaveAttribute("aria-expanded", "true")
    // The tag explorer keeps its tree in here at every width, with no drawer or caret of its own.
    const explorer = menu(page).locator(".cgc-tag-explorer")
    await expect(explorer.locator(".cgc-tag-explorer__title")).toBeVisible()
    await expect(explorer.locator(".cgc-tag-explorer__tree")).toBeVisible()
    await expect(explorer.locator(".cgc-tag-explorer__toggle")).toBeHidden()
    await page.keyboard.press("Escape")
    await expect(menu(page)).not.toBeInViewport()

    await menuButton(page).click()
    await expect(menu(page)).toBeInViewport()
    // A tap outside it.
    await page.mouse.click(width - 10, 600)
    await expect(menu(page)).not.toBeInViewport()

    await menuButton(page).click()
    await menu(page).locator(".cgc-annotator-frame__menu-close").click()
    await expect(menu(page)).not.toBeInViewport()
  })
}

test("a reader without JavaScript gets the same page, every note, and a link to the source document", async ({ browser, colorScheme }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme })
  const page = await context.newPage()
  try {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(PAPER)
      await expectStaticLayout(page, width)
      for (const id of ["highlights", "orphan", "spanning", "lastpage"]) {
        await expect(page.locator(`.cgc-annotator__annotation[data-annotation="${id}"] .cgc-annotator__note`)).toBeVisible()
      }
      // The Viewer never loads, so the page says where to read along instead.
      const readAlong = page.locator(".cgc-annotator-frame__read-along")
      await expect(readAlong).toBeVisible()
      await expect(readAlong.getByRole("link")).toHaveAttribute("href", "https://cgc-fixture.invalid/paper.pdf")
    }
  } finally {
    await context.close()
  }
})

test("scrolling past the page's title puts it in the bar in place of the site's name, and back", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 })
  await page.goto(PAPER)
  const site = bar(page).locator(".cgc-annotator-frame__site-name")
  const title = bar(page).locator(".cgc-annotator-frame__page-title")
  await expect(site).toBeVisible()
  await expect(title).toBeHidden()
  await page.evaluate(() => window.scrollTo({ top: 1500, behavior: "instant" }))
  await expect(title).toBeVisible()
  await expect(title).toHaveText("Fixture paper")
  await expect(site).toBeHidden()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }))
  await expect(site).toBeVisible()
  await expect(title).toBeHidden()
})

test("a popover of an annotation page shows its title, tags, preface and cards, and no Viewer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(WITHDRAWN)
  await page.locator(".cgc-annotator__annotation").getByRole("link", { name: "fixture-paper" }).hover()
  const popover = page.locator(".popover .popover-inner")
  await expect(popover).toBeVisible()
  await expect(popover.locator(".article-title")).toHaveText("Fixture paper")
  await expect(popover.locator(".cgc-annotator-frame__top")).toContainText("fixture")
  await expect(popover.locator(".cgc-annotator-frame__preface")).toContainText("An annotation page whose source document")
  await expect(popover.locator(".cgc-annotator__annotation").first()).toContainText("draws highlights over quoted passages")
  await expect(popover.locator(".cgc-annotator-viewer, canvas")).toHaveCount(0)
})

test("the frame's own CSS is in the family layer: core's frame stylesheet is empty", async ({ page }) => {
  await page.goto(PAPER)
  // Core writes a frame's `css` into a <style> in the body, unlayered.
  await expect(page.locator("body > style")).toHaveCount(0)
})
