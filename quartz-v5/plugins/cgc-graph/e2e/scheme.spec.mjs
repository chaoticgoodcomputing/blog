// The graph paints on a canvas, which can't follow the theme's custom properties by itself: it
// resolves each colour in script, the theme's and each tag's, so it must resolve them again when the
// reader switches scheme on a loaded page (ADR-0003's *the scheme changes under a loaded page*
// amendment). Each spec loads the page in one scheme, switches, and looks for the other's colours.
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"
import { localGraph, nodeFill } from "./graph.mjs"

// The fixture palette's `secondary`, in each scheme (tests/quartz.config.yaml).
const SECONDARY = { light: [40, 75, 99], dark: [123, 151, 170] }
// `markdown: { color: "light-dark(#b35f00, #de8200)" }`
const MARKDOWN = { light: [179, 95, 0], dark: [222, 130, 0] }

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

test("repaints the theme's colours when the reader switches scheme", async ({
  page,
  colorScheme,
}) => {
  // A page with no tags: the current page is the theme's `secondary`, which nothing else there is.
  await page.goto("/linked-note")
  const canvas = localGraph(page).locator(".cgc-graph__canvas")
  await expect.poll(() => pixels(canvas, SECONDARY[colorScheme])).toBeGreaterThan(10)
  const other = await toggleScheme(page)
  await expect.poll(() => pixels(canvas, SECONDARY[other])).toBeGreaterThan(10)
  expect(await pixels(canvas, SECONDARY[colorScheme])).toBe(0)
})

test("repaints each tag's colour when the reader switches scheme", async ({
  page,
  colorScheme,
}) => {
  // The page, and its tag node, in `markdown`'s colour, which is a pair: one for each scheme.
  await page.goto("/tag-engine/primary-override")
  const graph = localGraph(page)
  const canvas = graph.locator(".cgc-graph__canvas")
  await expect.poll(() => nodeFill(graph, "Primary Override")).toEqual(MARKDOWN[colorScheme])
  await expect.poll(() => nodeFill(graph, "#markdown")).toEqual(MARKDOWN[colorScheme])
  const other = await toggleScheme(page)
  await expect.poll(() => nodeFill(graph, "Primary Override")).toEqual(MARKDOWN[other])
  await expect.poll(() => nodeFill(graph, "#markdown")).toEqual(MARKDOWN[other])
  expect(await pixels(canvas, MARKDOWN[colorScheme])).toBe(0)
})

test("repaints a tag colour that refers to the theme's", async ({ page, colorScheme }) => {
  // `writing/essays` inherits `writing: { color: "var(--secondary)" }`.
  await page.goto("/tag-engine/most-specific")
  const graph = localGraph(page)
  await expect.poll(() => nodeFill(graph, "#essays")).toEqual(SECONDARY[colorScheme])
  const other = await toggleScheme(page)
  await expect.poll(() => nodeFill(graph, "#essays")).toEqual(SECONDARY[other])
  await expect.poll(() => nodeFill(graph, "Most Specific")).toEqual(SECONDARY[other])
})
