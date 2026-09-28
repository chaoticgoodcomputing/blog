// Selecting annotations (the reader, src/viewer/reader.ts): a link to one annotation, and stepping
// through them from the keyboard, on the page as it reads without a document. The mirror is held
// back, so the page keeps its static layout at any width.
import { test, expect } from "../../../tests/harness/test.mjs"

const PAPER = "/annotations/fixture-paper"
const WITHDRAWN = "/annotations/withdrawn"
const IN_ORDER = ["highlights", "quoteonly", "orphan", "spanning", "lastpage"]

const card = (page, id) => page.locator(`.cgc-annotator__annotation[data-annotation="${id}"]`)
const selected = (page) => page.locator(".cgc-annotator__annotation--active").evaluateAll((els) => els.map((el) => el.dataset.annotation))
const hash = (page) => page.evaluate(() => location.hash)

// The paper, hydrated, with its document held back.
async function open(page, url = PAPER) {
  await page.route("**/mirrors/**", () => {})
  await page.goto(url)
  await expect(page.locator(".cgc-annotator-viewer")).toHaveAttribute("data-cgc-hydrated", "")
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 })
})

test("a link to one annotation selects it on load, and scrolls to it", async ({ page }) => {
  await open(page, `${PAPER}#spanning`)
  await expect.poll(() => selected(page)).toEqual(["spanning"])
  await expect(card(page, "spanning")).toBeInViewport()
  await expect(card(page, "spanning")).toHaveAttribute("aria-current", "true")
})

test("selecting another changes the URL's hash without adding to the history", async ({ page }) => {
  await open(page, `${PAPER}#highlights`)
  await expect.poll(() => selected(page)).toEqual(["highlights"])
  const length = await page.evaluate(() => history.length)
  await card(page, "orphan").locator(".cgc-annotator__quote").click()
  await expect.poll(() => selected(page)).toEqual(["orphan"])
  expect(await hash(page)).toBe("#orphan")
  await card(page, "quoteonly").click()
  expect(await hash(page)).toBe("#quoteonly")
  expect(await page.evaluate(() => history.length)).toBe(length)
})

test("j and k step through the annotations in order, and Esc clears the selection", async ({ page }) => {
  await open(page)
  await page.keyboard.press("j")
  await expect.poll(() => selected(page)).toEqual([IN_ORDER[0]])
  await page.keyboard.press("j")
  await page.keyboard.press("j")
  await expect.poll(() => selected(page)).toEqual([IN_ORDER[2]])
  expect(await hash(page)).toBe(`#${IN_ORDER[2]}`)
  await expect(card(page, IN_ORDER[2])).toBeInViewport()
  await page.keyboard.press("k")
  await expect.poll(() => selected(page)).toEqual([IN_ORDER[1]])
  // The last is as far as j goes.
  for (let i = 0; i < 6; i++) await page.keyboard.press("j")
  await expect.poll(() => selected(page)).toEqual([IN_ORDER.at(-1)])
  await expect(card(page, IN_ORDER.at(-1))).toBeInViewport()
  await page.keyboard.press("Escape")
  await expect.poll(() => selected(page)).toEqual([])
  expect(await hash(page)).toBe("")
})

test("the keys do nothing while the reader types in search", async ({ page }) => {
  await open(page)
  await page.locator(".cgc-annotator-frame__menu-button").click()
  await page.locator(".cgc-annotator-frame__menu .search-button").click()
  const input = page.locator(".search-bar")
  await expect(input).toBeFocused()
  await page.keyboard.type("jkj")
  await expect(input).toHaveValue("jkj")
  expect(await selected(page)).toEqual([])
  expect(await hash(page)).toBe("")
})

test("after SPA navigation to another annotation page, the keys act on that page alone", async ({ page }) => {
  await open(page, `${PAPER}#orphan`)
  await expect.poll(() => selected(page)).toEqual(["orphan"])
  await page.evaluate(() => (window.cgcSpaMark = true))
  await card(page, "orphan").getByRole("link", { name: "withdrawn" }).click()
  await expect(page).toHaveURL(new RegExp(`${WITHDRAWN}$`))
  await expect(page.locator(".cgc-annotator-viewer")).toHaveAttribute("data-cgc-hydrated", "")
  expect(await page.evaluate(() => window.cgcSpaMark)).toBe(true)
  expect(await selected(page)).toEqual([])
  await page.keyboard.press("j")
  await expect.poll(() => selected(page)).toEqual(["gone"])
  expect(await hash(page)).toBe("#gone")
  await page.keyboard.press("j")
  await expect.poll(() => selected(page)).toEqual(["alsogone"])
  // Away from annotation pages altogether, the keys are the page's own again.
  await page.locator(".cgc-annotator__annotation").getByRole("link", { name: "fixture-paper" }).click()
  await expect(page).toHaveURL(new RegExp(`${PAPER}$`))
  await expect(page.locator(".cgc-annotator-viewer")).toHaveAttribute("data-cgc-hydrated", "")
  expect(await selected(page)).toEqual([])
  await page.keyboard.press("j")
  await expect.poll(() => selected(page)).toEqual([IN_ORDER[0]])
})
