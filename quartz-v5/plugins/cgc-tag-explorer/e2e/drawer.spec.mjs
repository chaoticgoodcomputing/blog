// On a narrow screen the explorer is a drawer of its own (#42, #76): v5 has no mobile frame, and stock
// explorer's drawer is its own, so the tag explorer carries one the same way. v4's MobileSidebarMenu,
// which slid out the whole left sidebar, is gone; its caret, at the window's left edge, opens the
// explorer's drawer. The fixture leaves the drawer at the plugin's default width, core's 800px; the
// site's 1000px, and the phone header the caret leaves alone, are proven in site.spec.mjs.
import { test, expect } from "../../../tests/harness/test.mjs"

const toggle = (page) => page.locator(".cgc-tag-explorer__toggle")
const panel = (page) => page.locator(".cgc-tag-explorer__panel")
const backdrop = (page) => page.locator(".cgc-tag-explorer__backdrop")
const tagItem = (page, tag) => page.locator(`.cgc-tag-explorer__tag[data-tag="${tag}"]`)
const fold = (page, tag) =>
  tagItem(page, tag).locator(":scope > .cgc-tag-explorer__row .cgc-tag-explorer__fold")

const NARROW = { width: 600, height: 900 }

test.describe("on a wide screen", () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test("sits in the left sidebar, open, with no drawer", async ({ page }) => {
    await page.goto("/plain-note")
    await expect(toggle(page)).toBeHidden()
    await expect(backdrop(page)).toBeHidden()
    await expect(panel(page)).toBeVisible()
    await expect(page.locator(".left.sidebar .cgc-tag-explorer__panel")).toHaveCount(1)
    await expect(page.locator(".cgc-tag-explorer__title")).toHaveText("Tag Explorer")
    await expect(page.locator(".cgc-tag-explorer__close")).toBeHidden()
  })
})

test.describe("on a narrow screen", () => {
  test.use({ viewport: NARROW })

  test("is a drawer, closed until its toggle opens it", async ({ page }) => {
    await page.goto("/plain-note")
    await expect(toggle(page)).toBeVisible()
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false")
    await expect(toggle(page)).toHaveAccessibleName("Tag Explorer")
    // v4's caret: at the window's left edge, half way down, and out of the sidebar's row.
    const caret = await toggle(page).boundingBox()
    expect(caret.x).toBe(0)
    expect(caret.y + caret.height / 2).toBeCloseTo(NARROW.height / 2, 0)
    await expect(panel(page)).toBeHidden()
    await toggle(page).click()
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "true")
    await expect(panel(page)).toBeVisible()
    await expect(backdrop(page)).toBeVisible()
    // It comes in over the page, from the left edge, the window's full height.
    await expect(panel(page)).toBeInViewport({ ratio: 1 })
    await expect
      .poll(() => panel(page).boundingBox())
      .toMatchObject({ x: 0, y: 0, height: NARROW.height })
    // Its tags work as they do in the sidebar.
    await fold(page, "explorer").click()
    await expect(
      tagItem(page, "explorer").locator(".cgc-tag-explorer__page-link").first(),
    ).toBeVisible()
  })

  test("closes from its close button, the backdrop, or Escape", async ({ page }) => {
    await page.goto("/plain-note")
    const close = page.locator(".cgc-tag-explorer__close")
    const ways = [
      () => close.click(),
      () => backdrop(page).click({ position: { x: NARROW.width - 40, y: NARROW.height / 2 } }),
      () => page.keyboard.press("Escape"),
    ]
    for (const closeIt of ways) {
      await toggle(page).click()
      await expect(panel(page)).toBeVisible()
      await closeIt()
      await expect(panel(page)).toBeHidden()
      await expect(backdrop(page)).toBeHidden()
      await expect(toggle(page)).toHaveAttribute("aria-expanded", "false")
    }
  })

  // v4's drawer took the focus to itself and held the page still behind it (MobileSidebarMenu set
  // the body's overflow, TagExplorer `mobile-no-scroll`); closing gives both back.
  test("takes the focus, and holds the page behind it still, while it is open", async ({
    page,
  }) => {
    await page.goto("/plain-note")
    // Long enough to scroll, whatever the note's length.
    await page.evaluate(() => (document.body.style.minHeight = "4000px"))
    const scrolled = () => page.evaluate(() => window.scrollY)
    await toggle(page).click()
    await expect(page.locator(".cgc-tag-explorer__close")).toBeFocused()
    await page.mouse.move(NARROW.width - 40, NARROW.height / 2)
    await page.mouse.wheel(0, 600)
    // A wheel that did scroll would have by now.
    await page.waitForTimeout(300)
    expect(await scrolled()).toBe(0)
    await page.keyboard.press("Escape")
    await expect(toggle(page)).toBeFocused()
    await page.mouse.wheel(0, 600)
    await expect.poll(scrolled).toBeGreaterThan(0)
  })

  test("gives the page its scrolling back when a link in it is followed", async ({ page }) => {
    await page.goto("/plain-note")
    await toggle(page).click()
    await fold(page, "explorer").click()
    await tagItem(page, "explorer")
      .locator(".cgc-tag-explorer__page-link")
      .filter({ hasText: "Alpha" })
      .click()
    await expect(page).toHaveURL(/\/tag-explorer\/alpha$/)
    await expect(panel(page)).toBeHidden()
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).not.toBe(
      "hidden",
    )
  })

  test("closes when a link in it is followed", async ({ page }) => {
    await page.goto("/plain-note")
    await toggle(page).click()
    await fold(page, "explorer").click()
    await tagItem(page, "explorer")
      .locator(".cgc-tag-explorer__page-link")
      .filter({ hasText: "Alpha" })
      .click()
    await expect(page).toHaveURL(/\/tag-explorer\/alpha$/)
    await expect(panel(page)).toBeHidden()
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false")
    // It reopens as the reader left it.
    await toggle(page).click()
    await expect(
      tagItem(page, "explorer")
        .locator(".cgc-tag-explorer__page-link")
        .filter({ hasText: "Alpha" }),
    ).toBeVisible()
  })

  test("gives back the page when the window widens past the drawer", async ({ page }) => {
    await page.goto("/plain-note")
    await toggle(page).click()
    await expect(backdrop(page)).toBeVisible()
    await page.setViewportSize({ width: 1280, height: 900 })
    await expect(backdrop(page)).toBeHidden()
    await expect(toggle(page)).toBeHidden()
    await expect(page.locator(".left.sidebar .cgc-tag-explorer__panel")).toBeVisible()
    // And the page scrolls again.
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflowY))
      .not.toBe("hidden")
  })
})
