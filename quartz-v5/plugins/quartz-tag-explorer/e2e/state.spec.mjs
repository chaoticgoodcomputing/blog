// The explorer's state survives navigation as v4's did (#76): which tags a reader has opened, kept
// in localStorage under v4's key, and how far the tree is scrolled, kept for the tab. A navigation
// through Quartz's SPA router swaps the page under the explorer, and a reload starts it afresh.
import { test, expect } from "../../../tests/harness/test.mjs"

const tagItem = (page, tag) => page.locator(`.cgc-tag-explorer__tag[data-tag="${tag}"]`)
const fold = (page, tag) =>
  tagItem(page, tag).locator(":scope > .cgc-tag-explorer__row .cgc-tag-explorer__fold")
const list = (page, tag) =>
  tagItem(page, tag).locator(":scope > .cgc-tag-explorer__children > .cgc-tag-explorer__list")
const pageLink = (page, tag, title) =>
  list(page, tag)
    .locator(":scope > .cgc-tag-explorer__page .cgc-tag-explorer__page-link")
    .filter({ hasText: title })
const tree = (page) => page.locator(".cgc-tag-explorer__tree")
// A tag opens with a transition, and while one above the reader's place is still opening the browser
// keeps that place in view by scrolling the tree on (scroll anchoring): measure once it has settled.
const settled = (page) =>
  tree(page).evaluate((el) =>
    Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished)),
  )

// Marks the document, so a spec can tell an SPA navigation, which keeps it, from a page load.
const markDocument = (page) => page.evaluate(() => (window.cgcSameDocument = true))
const sameDocument = (page) => page.evaluate(() => window.cgcSameDocument === true)

test("keeps a tag open across an SPA navigation", async ({ page }) => {
  await page.goto("/plain-note")
  await fold(page, "explorer").click()
  await expect(fold(page, "explorer")).toHaveAttribute("aria-expanded", "true")
  await markDocument(page)
  await pageLink(page, "explorer", "Alpha").click()
  await expect(page).toHaveURL(/\/tag-explorer\/alpha$/)
  expect(await sameDocument(page)).toBe(true)
  await expect(list(page, "explorer")).toBeVisible()
  await expect(fold(page, "explorer")).toHaveAttribute("aria-expanded", "true")
  await expect(pageLink(page, "explorer", "Alpha")).toHaveAttribute("aria-current", "page")
  // A tag the reader never opened stays closed.
  await expect(list(page, "writing")).toBeHidden()
})

test("keeps a tag open, and one closed again closed, across a reload", async ({ page }) => {
  await page.goto("/plain-note")
  await fold(page, "explorer").click()
  await fold(page, "writing").click()
  await fold(page, "writing").click()
  await page.reload()
  await expect(list(page, "explorer")).toBeVisible()
  await expect(pageLink(page, "explorer", "Newest")).toBeVisible()
  await expect(list(page, "writing")).toBeHidden()
  await expect(fold(page, "writing")).toHaveAttribute("aria-expanded", "false")
})

test.describe("in a short window", () => {
  test.use({ viewport: { width: 1280, height: 520 } })

  test("keeps the tree's scroll position across an SPA navigation", async ({ page }) => {
    await page.goto("/plain-note")
    for (const tag of ["fixture", "explorer", "mdx"]) await fold(page, tag).click()
    await expect(pageLink(page, "explorer", "Oldest")).toBeVisible()
    await settled(page)
    // The tree scrolls inside the sidebar.
    const { scrollHeight, clientHeight } = await tree(page).evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }))
    expect(scrollHeight).toBeGreaterThan(clientHeight + 150)
    await pageLink(page, "explorer", "Oldest").scrollIntoViewIfNeeded()
    await settled(page)
    const before = await tree(page).evaluate((el) => el.scrollTop)
    expect(before).toBeGreaterThan(0)
    await markDocument(page)
    await pageLink(page, "explorer", "Oldest").click()
    await expect(page).toHaveURL(/\/tag-explorer\/oldest$/)
    expect(await sameDocument(page)).toBe(true)
    await expect(pageLink(page, "explorer", "Oldest")).toHaveAttribute("aria-current", "page")
    await expect.poll(() => tree(page).evaluate((el) => el.scrollTop)).toBe(before)
  })
})
