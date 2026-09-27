// Each node carries its tag's icon (#29, #77): a page its primary tag's, a tag node its own, inherited
// from the nearest ancestor that has one, as the quartz-tags engine names it. The icons were drawn when
// the site built, into the graph's own index, so a page fetches none of them, where v4 fetched each
// from a CDN. A node with a tag is its tag's bubble (#83, tags-core's `./bubble`), and its icon is
// drawn in the bubble's `--dark`, black in the light scheme and white in the dark, on the bubble's
// `--lightgray` circle, as a badge's is. The fixture's tag dictionary is in tests/quartz.config.yaml.
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"
import { bubblePaint, bubbleTheme, localGraph, marksNear } from "./graph.mjs"

// A sharper canvas, so an icon's marks are whole pixels.
test.use({ deviceScaleFactor: 2 })

// The fixture palette's `dark`, the bubble's icon colour, in each scheme.
const DARK = { light: [43, 43, 43], dark: [235, 235, 236] }
// Whether the node labelled `label`, on the page at `path`, has no icon. Labels are drawn in
// `--dark` too, and in one layout another node's label can lie across this node's centre. The layout
// differs from load to load, so a node shows no icon when some load leaves its centre bare, where a
// drawn icon would mark it on every load.
async function showsNoIcon(page, path, label, colorScheme) {
  for (let load = 0; load < 4; load++) {
    await page.goto(path)
    if ((await marksNear(localGraph(page), label, DARK[colorScheme])) === 0) return true
  }
  return false
}

test("draws each node's icon on it: its own tag's, or the one it inherits", async ({
  page,
  colorScheme,
}) => {
  // `writing/essays: { icon: "mdi:feather" }`, which stands for most-specific.
  await page.goto("/tag-engine/most-specific")
  const graph = localGraph(page)
  await expect.poll(() => marksNear(graph, "#essays", DARK[colorScheme])).toBeGreaterThan(5)
  await expect.poll(() => marksNear(graph, "Most Specific", DARK[colorScheme])).toBeGreaterThan(5)
  // `fixture` has no icon, and no ancestor to inherit one from.
  expect(await showsNoIcon(page, "/tag-engine/most-specific", "#fixture", colorScheme)).toBe(true)
  // `writing/annotations` has none of its own, and takes `writing: { icon: "mdi:pencil" }`'s.
  await page.goto("/tag-engine/annotated")
  await expect.poll(() => marksNear(graph, "#annotations", DARK[colorScheme])).toBeGreaterThan(5)
  await expect.poll(() => marksNear(graph, "Annotated", DARK[colorScheme])).toBeGreaterThan(5)
})

test("draws an icon from the site's own collection", async ({ page, colorScheme }) => {
  // `mdtwin: { icon: "custom:diamond" }`, from tests/fixture-icons/. md-twin itself is tagged
  // `fixture` first, which stands for it, so the page has no icon.
  await page.goto("/md-twin")
  const graph = localGraph(page)
  await expect.poll(() => marksNear(graph, "#mdtwin", DARK[colorScheme])).toBeGreaterThan(5)
  expect(await showsNoIcon(page, "/md-twin", "MD Twin", colorScheme)).toBe(true)
})

test("fetches no icon: they come with the graph's index", async ({ page, colorScheme }) => {
  const requests = []
  page.on("request", (request) => requests.push(request.url()))
  await page.goto("/tag-engine/most-specific")
  await expect
    .poll(() => marksNear(localGraph(page), "#essays", DARK[colorScheme]))
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

test("repaints each icon, and the circle under it, when the reader switches scheme", async ({
  page,
  colorScheme,
}) => {
  await page.goto("/tag-engine/most-specific")
  const graph = localGraph(page)
  await expect.poll(() => marksNear(graph, "#essays", DARK[colorScheme])).toBeGreaterThan(5)
  const other = await toggleScheme(page)
  await expect.poll(() => marksNear(graph, "#essays", DARK[other])).toBeGreaterThan(5)
  // One scheme's `--dark` is within a few levels of the other's `--lightgray`, so the old icon is
  // told from the new circle by the circle itself: the other scheme's gray.
  const { circle } = await bubbleTheme(page)
  await expect.poll(async () => (await bubblePaint(graph, "#essays")).circle).toEqual(circle)
})
