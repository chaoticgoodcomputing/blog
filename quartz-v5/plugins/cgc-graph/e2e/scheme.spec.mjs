// The graph paints on a canvas, which can't follow the theme's custom properties by itself: it
// resolves each colour in script, so it must resolve them again when the reader switches scheme on
// a loaded page (ADR-0003's *the scheme changes under a loaded page* amendment). The current page's
// node is filled with the theme's `secondary`, which nothing else in the graph uses.
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"
import { localGraph } from "./graph.mjs"

// The fixture palette's `secondary`, in each scheme (tests/quartz.config.yaml).
const SECONDARY = { light: [40, 75, 99], dark: [123, 151, 170] }

// How many of the canvas's pixels are exactly `rgb`, and opaque.
const pixels = (canvas, rgb) =>
  canvas.evaluate((canvas, [r, g, b]) => {
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
    let count = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === r && data[i + 1] === g && data[i + 2] === b && data[i + 3] === 255) count++
    }
    return count
  }, rgb)

test("draws the current page in the scheme's secondary colour", async ({ page, colorScheme }) => {
  await page.goto("/plain-note")
  const canvas = localGraph(page).locator(".cgc-graph__canvas")
  await expect.poll(() => pixels(canvas, SECONDARY[colorScheme])).toBeGreaterThan(10)
})

test("repaints the graph when the reader switches scheme", async ({ page, colorScheme }) => {
  await page.goto("/plain-note")
  const canvas = localGraph(page).locator(".cgc-graph__canvas")
  await expect.poll(() => pixels(canvas, SECONDARY[colorScheme])).toBeGreaterThan(10)
  const other = await toggleScheme(page)
  await expect.poll(() => pixels(canvas, SECONDARY[other])).toBeGreaterThan(10)
  expect(await pixels(canvas, SECONDARY[colorScheme])).toBe(0)
})
