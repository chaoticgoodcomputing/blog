// ADR-0002: every widget renders at build time and always hydrates, and the runtime owns the
// lifecycle across Quartz's SPA navigation.
import { test, expect } from "../../../tests/harness/test.mjs"

// Counts live intervals, so a spec can tell whether a widget's timer survived its unmount.
const trackIntervals = () => {
  const live = new Set()
  const set = window.setInterval.bind(window)
  const clear = window.clearInterval.bind(window)
  window.setInterval = (...args) => {
    const id = set(...args)
    live.add(id)
    return id
  }
  window.clearInterval = (id) => {
    live.delete(id)
    clear(id)
  }
  window.__liveIntervals = () => live.size
}

const canvasPixels = (page, selector = ".life__canvas") => page.locator(selector).first().evaluate((c) => c.toDataURL())

test("the widget is rendered into the page at build time", async ({ emitted }) => {
  const html = emitted.read("lab/life.mdx.html")
  expect(html).toMatch(/<div class="cgc-mdx-island"[^>]*data-cgc-hydrate="load"/)
  expect(html).toContain('class="life__canvas"')
  expect(html).not.toContain("import { GameOfLife }")
})

test("a load island hydrates and runs", async ({ page }) => {
  await page.goto("/lab/life.mdx")
  const island = page.locator(".cgc-mdx-island")
  await expect(island).toHaveAttribute("data-cgc-hydrated", "")
  const before = await canvasPixels(page)
  await expect.poll(() => canvasPixels(page)).not.toBe(before)
})

test("its skin follows the theme's custom properties", async ({ page }) => {
  await page.goto("/lab/life.mdx")
  const [live, dark] = await page.locator(".life__canvas").evaluate((c) => [
    getComputedStyle(c).getPropertyValue("--life-live").trim(),
    getComputedStyle(document.documentElement).getPropertyValue("--dark").trim(),
  ])
  expect(live).toBe(dark)
})

test("navigating away unmounts the island and stops its timer", async ({ page }) => {
  await page.addInitScript(trackIntervals)
  await page.goto("/plain-note")
  const idle = await page.evaluate(() => window.__liveIntervals())

  await page.goto("/lab/life.mdx")
  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  // Preact runs the widget's effect, which starts the timer, after paint, so it can trail the
  // hydration marker by a frame.
  await expect.poll(() => page.evaluate(() => window.__liveIntervals())).toBe(idle + 1)

  await page.locator("article a.internal", { hasText: "plain-note" }).click()
  await expect(page).toHaveURL(/\/plain-note$/)
  await expect.poll(() => page.evaluate(() => window.__liveIntervals())).toBe(idle)
})

test("navigating back rehydrates exactly once", async ({ page }) => {
  await page.addInitScript(trackIntervals)
  await page.goto("/lab/life.mdx")
  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  const idle = (await page.evaluate(() => window.__liveIntervals())) - 1

  await page.locator("article a.internal", { hasText: "plain-note" }).click()
  await expect(page).toHaveURL(/\/plain-note$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/lab\/life\.mdx$/)

  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  await expect.poll(() => page.evaluate(() => window.__liveIntervals())).toBe(idle + 1)
  const before = await canvasPixels(page)
  await expect.poll(() => canvasPixels(page)).not.toBe(before)
})

test("client:visible waits until the island scrolls into view", async ({ page }) => {
  await page.goto("/lab/life-again.mdx")
  const island = page.locator(".cgc-mdx-island")
  await expect(island).toHaveAttribute("data-cgc-hydrate", "visible")
  await page.waitForTimeout(300)
  await expect(island).not.toHaveAttribute("data-cgc-hydrated", "")

  await island.scrollIntoViewIfNeeded()
  await expect(island).toHaveAttribute("data-cgc-hydrated", "")
})

test("an island inside a popover stays static", async ({ page }) => {
  await page.goto("/lab/life-again.mdx")
  await page.locator("article a.internal", { hasText: "Life" }).first().hover()
  const popoverIsland = page.locator(".popover .cgc-mdx-island")
  await expect(popoverIsland).toBeAttached()
  await page.waitForTimeout(300)
  await expect(popoverIsland).not.toHaveAttribute("data-cgc-hydrated", "")
})

test("props are evaluated statically, as live pages write them", async ({ page }) => {
  await page.goto("/lab/echo.mdx")
  const props = JSON.parse(await page.locator(".echo__props").textContent())
  expect(props).toEqual({
    label: "plain string",
    count: -3,
    ratio: 0.5,
    on: true,
    off: false,
    nothing: null,
    bare: true,
    series: { name: "dice", "quoted key": "template", values: [1, 2, 3] },
  })
  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  await page.locator(".echo__button").click()
  await expect(page.locator(".echo__button")).toHaveText("clicked 1")
})
