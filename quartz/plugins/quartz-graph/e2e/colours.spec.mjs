// Each node with a tag is drawn as a tag bubble (#83), the one the badges draw (tags-core's
// `./bubble`, #82): a rim in its tag's colour, a circle in the theme's `--lightgray`, and its icon in
// the theme's `--dark`. The owner's review notes of 2026-09-26 asked for one bubble "shared across
// both the list/badges as well as on graph nodes" (ADR-0003's tag bubble amendment), in place of the
// node filled with its tag colour (#77). The tag is a page's primary tag, or a tag node's own, its
// colour inherited from the nearest ancestor that has one, as the quartz-tags engine resolves it. The
// graph reads each tag's colour property from the engine's `static/cgcTags.json` and resolves it
// through tags-core's resolver, in the scheme the page is showing. The fixture's tag dictionary is in
// tests/quartz.config.yaml.
import { test, expect } from "../../../tests/harness/test.mjs"
import { bubblePaint, bubbleTheme, localGraph, marksNear, nodeFill } from "./graph.mjs"

// A sharper canvas, so a bubble's rim is whole pixels.
test.use({ deviceScaleFactor: 2 })

// `fixture: { color: "#0a7d32" }`: one colour in either scheme.
const FIXTURE = { light: [10, 125, 50], dark: [10, 125, 50] }
// `markdown: { color: "light-dark(#b35f00, #de8200)" }`
const MARKDOWN = { light: [179, 95, 0], dark: [222, 130, 0] }
// `writing: { color: "var(--secondary)" }`: the fixture palette's `secondary`.
const SECONDARY = { light: [40, 75, 99], dark: [123, 151, 170] }
// The fixture palette's `tertiary`, the same in either scheme.
const TERTIARY = { light: [132, 165, 157], dark: [132, 165, 157] }
// A tag with no colour in its lineage: the engine's default, the palette's `darkgray`.
const DARKGRAY = { light: [78, 78, 78], dark: [212, 212, 212] }

// The node labelled `label` is its tag's bubble: rimmed in `rim`, on the theme's gray.
const expectBubble = async (page, label, rim) => {
  const graph = localGraph(page)
  const { circle } = await bubbleTheme(page)
  await expect.poll(() => bubblePaint(graph, label), label).toEqual({ rim, circle })
}

test("draws each page as its primary tag's bubble: rimmed in the tag colour, on the theme's gray, with a dark icon", async ({
  page,
  colorScheme,
}) => {
  // `writing/essays` stands for most-specific, with an icon of its own, `mdi:feather`, and
  // `writing`'s colour, `var(--secondary)`.
  await page.goto("/tag-engine/most-specific")
  const theme = await bubbleTheme(page)
  // Three different colours, so a bubble that swapped two of them fails.
  expect(new Set([SECONDARY[colorScheme], theme.circle, theme.icon].map(String)).size).toBe(3)
  await expectBubble(page, "Most Specific", SECONDARY[colorScheme])
  await expect
    .poll(() => marksNear(localGraph(page), "Most Specific", theme.icon))
    .toBeGreaterThan(5)
})

test("rims each page in its primary tag's colour", async ({ page, colorScheme }) => {
  // plain-note is tagged `fixture` then `markdown`, equally specific: the first stands for it.
  // primary-override, which links to it, has the same tags, and `primaryTag: markdown`.
  await page.goto("/plain-note")
  await expectBubble(page, "Plain Note", FIXTURE[colorScheme])
  await expectBubble(page, "Primary Override", MARKDOWN[colorScheme])
  // seo/private-note is tagged `private`, which has no colour: private pages are drawn as any
  // other, where the site sets no `nodeColors.private`.
  await expectBubble(page, "Private Note", DARKGRAY[colorScheme])
})

test("rims each tag node in its tag's colour", async ({ page, colorScheme }) => {
  await page.goto("/plain-note")
  await expectBubble(page, "#fixture", FIXTURE[colorScheme])
  await expectBubble(page, "#markdown", MARKDOWN[colorScheme])
})

test("rims a page and a tag in the colour they inherit", async ({ page, colorScheme }) => {
  // `writing/essays` has an icon of its own and no colour: it takes `writing`'s.
  await page.goto("/tag-engine/most-specific")
  await expectBubble(page, "#essays", SECONDARY[colorScheme])
  // `reindex/deep`, and `reindex` above it, have none: down the chain to the default.
  await page.goto("/tag-engine/index-suffix")
  await expectBubble(page, "Index Suffix", DARKGRAY[colorScheme])
  await expectBubble(page, "#deep", DARKGRAY[colorScheme])
})

test("fills a page with no tags in v4's colours: the current page in secondary", async ({
  page,
  colorScheme,
}) => {
  // No tag, so no bubble: v4's disc.
  await page.goto("/linked-note")
  await expect.poll(() => nodeFill(localGraph(page), "Linked Note")).toEqual(SECONDARY[colorScheme])
})

test("rims a visited page's bubble in tertiary, as a visited link reads, and rings no node", async ({
  page,
  colorScheme,
}) => {
  // The owner's decision of 2026-09-26: a page the reader has visited is set apart as a visited
  // link is from an unvisited one, by its rim taking the theme's `tertiary` (v4's visited node
  // colour) in place of its tag colour. No ring outside the rim: the reader's own page is marked
  // by its swelling alone, and keeps its tag colour. It swells, so look in a disc past its widest.
  await page.goto("/plain-note")
  const graph = localGraph(page)
  await expectBubble(page, "Plain Note", FIXTURE[colorScheme])
  // A ring would be hundreds of pixels; a few anti-aliased edge pixels can land near `secondary`.
  await expect
    .poll(() => marksNear(graph, "Plain Note", SECONDARY[colorScheme], 26))
    .toBeLessThan(20)
  // Plain Note links to the .mdx article: there, it is a page the reader has visited.
  await page.goto("/mdx-article.mdx")
  await expectBubble(page, "Plain Note", TERTIARY[colorScheme])
})

test("keeps a visited tag's node in its tag's colour: only notes take the visited rim", async ({
  page,
  colorScheme,
}) => {
  // The owner's decision of 2026-09-26: a tag page always keeps its rim colour, visited or not.
  await page.goto("/tags/fixture")
  await page.goto("/plain-note")
  await expectBubble(page, "#fixture", FIXTURE[colorScheme])
})
