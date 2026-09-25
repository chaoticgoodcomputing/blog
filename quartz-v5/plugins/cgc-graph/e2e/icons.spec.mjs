// Each node carries its tag's icon (#29, #77): a page its primary tag's, a tag node its own, inherited
// from the nearest ancestor that has one, as the cgc-tags engine names it. The icons were drawn when
// the site built, into the graph's own index, so a page fetches none of them, where v4 fetched each
// from a CDN. An icon is cut out of its node in the page's background colour, the theme's `light`,
// which a tag colour always stands out from. The fixture's tag dictionary is in
// tests/quartz.config.yaml.
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"
import { localGraph, marksNear } from "./graph.mjs"

// A sharper canvas, so an icon's marks are whole pixels.
test.use({ deviceScaleFactor: 2 })

// The fixture palette's `light`, the page's background, in each scheme.
const LIGHT = { light: [250, 248, 248], dark: [22, 22, 24] }

test("draws each node's icon on it: its own tag's, or the one it inherits", async ({
  page,
  colorScheme,
}) => {
  // `writing/essays: { icon: "mdi:feather" }`, which stands for most-specific.
  await page.goto("/tag-engine/most-specific")
  const graph = localGraph(page)
  await expect.poll(() => marksNear(graph, "#essays", LIGHT[colorScheme])).toBeGreaterThan(5)
  await expect.poll(() => marksNear(graph, "Most Specific", LIGHT[colorScheme])).toBeGreaterThan(5)
  // `fixture` has no icon, and no ancestor to inherit one from.
  expect(await marksNear(graph, "#fixture", LIGHT[colorScheme])).toBe(0)
  // `writing/annotations` has none of its own, and takes `writing: { icon: "mdi:pencil" }`'s.
  await page.goto("/tag-engine/annotated")
  await expect.poll(() => marksNear(graph, "#annotations", LIGHT[colorScheme])).toBeGreaterThan(5)
  await expect.poll(() => marksNear(graph, "Annotated", LIGHT[colorScheme])).toBeGreaterThan(5)
})

test("draws an icon from the site's own collection", async ({ page, colorScheme }) => {
  // `mdtwin: { icon: "custom:diamond" }`, from tests/fixture-icons/. md-twin itself is tagged
  // `fixture` first, which stands for it, so the page has no icon.
  await page.goto("/md-twin")
  const graph = localGraph(page)
  await expect.poll(() => marksNear(graph, "#mdtwin", LIGHT[colorScheme])).toBeGreaterThan(5)
  expect(await marksNear(graph, "MD Twin", LIGHT[colorScheme])).toBe(0)
})

test("fetches no icon: they come with the graph's index", async ({ page, colorScheme }) => {
  const requests = []
  page.on("request", (request) => requests.push(request.url()))
  await page.goto("/tag-engine/most-specific")
  await expect
    .poll(() => marksNear(localGraph(page), "#essays", LIGHT[colorScheme]))
    .toBeGreaterThan(5)
  // v4 fetched each icon from jsDelivr (`@mdi/svg`), or `/static/icons/` for its own.
  expect(requests.filter((url) => /\.svg\b|@mdi\/|iconify|\/icons\//i.test(url))).toEqual([])
  // What the graph fetches: its own index, and the tag engine's, once each.
  const indexes = requests.filter((url) => /\/static\/cgc\w+\.json$/.test(url))
  expect(indexes.map((url) => new URL(url).pathname).sort()).toEqual([
    "/static/cgcGraph.json",
    "/static/cgcTags.json",
  ])
})

test("repaints each icon when the reader switches scheme", async ({ page, colorScheme }) => {
  await page.goto("/tag-engine/most-specific")
  const graph = localGraph(page)
  await expect.poll(() => marksNear(graph, "#essays", LIGHT[colorScheme])).toBeGreaterThan(5)
  const other = await toggleScheme(page)
  await expect.poll(() => marksNear(graph, "#essays", LIGHT[other])).toBeGreaterThan(5)
  expect(await marksNear(graph, "#essays", LIGHT[colorScheme])).toBe(0)
})
