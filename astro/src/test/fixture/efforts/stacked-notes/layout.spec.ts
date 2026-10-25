// Ephemeral (docs/adr/0006): where the stacked-notes layout puts things, pinned while that effort
// (.scratch/stacked-notes) works on it. Deleted when the effort closes, with whatever here is meant
// to outlive it rewritten as a durable test first.
import type { Page } from "@playwright/test"
import { expect, test } from "../../../site.ts"

// A long note, so the window scrolls, reached from the home page.
const note = "/site-shell/body?trail=/"

const box = async (page: Page, selector: string) => (await page.locator(selector).boundingBox())!

test("on a desktop the graph column is left of the note, as tall as the window, and stays in view as the note scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(note)
  const column = await box(page, "aside.graph-column")
  const spines = await box(page, "trail-spines")
  const main = await box(page, "main")

  expect(column.x).toBe(0)
  expect(column.height).toBe(900)
  // The spines sit between the graph column and the note.
  expect(spines.x).toBeGreaterThanOrEqual(column.x + column.width)
  expect(main.x).toBeGreaterThanOrEqual(spines.x + spines.width)

  await page.mouse.wheel(0, 1500)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1000)
  expect((await box(page, "aside.graph-column")).y).toBe(0)
  expect((await box(page, "trail-spines")).y).toBe(0)
})

test("on a desktop the graph fills the room between the graph column's header and footer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(note)
  const header = await box(page, "aside.graph-column > header")
  const graph = await box(page, "aside.graph-column .local-graph")
  const footer = await box(page, "aside.graph-column > footer")
  expect(graph.y).toBeCloseTo(header.y + header.height, 0)
  expect(graph.y + graph.height).toBeCloseTo(footer.y, 0)
})

test("on a phone a bar is over the spines, and they over the note; the menu brings the graph column in from the left, as tall as the screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(note)
  const bar = await box(page, ".menu-bar")
  const spines = await box(page, "trail-spines")
  const main = await box(page, "main")
  expect(bar.y).toBe(0)
  expect(bar.y + bar.height).toBeLessThanOrEqual(spines.y)
  expect(spines.y + spines.height).toBeLessThanOrEqual(main.y)
  await expect(page.locator("aside.graph-column")).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)

  await page.locator(".menu-bar button").click()
  await expect.poll(async () => (await box(page, "aside.graph-column")).x).toBe(0)
  const column = await box(page, "aside.graph-column")
  expect(column.height).toBe(844)
  expect(column.width).toBeLessThan(390)
})
