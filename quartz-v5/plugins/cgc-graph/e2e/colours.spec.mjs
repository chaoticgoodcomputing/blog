// Each node is filled with its tag's colour (#31, #77): a page with its primary tag's, a tag node with
// its own, inherited from the nearest ancestor that has one, as the cgc-tags engine resolves it. The
// graph reads each tag's colour property from the engine's `static/cgcTags.json` and resolves it
// through tags-core's resolver, in the scheme the page is showing. The fixture's tag dictionary is in
// tests/quartz.config.yaml.
import { test, expect } from "../../../tests/harness/test.mjs"
import { localGraph, marksNear, nodeFill } from "./graph.mjs"

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

test("fills each page with its primary tag's colour", async ({ page, colorScheme }) => {
  // plain-note is tagged `fixture` then `markdown`, equally specific: the first stands for it.
  // primary-override, which links to it, has the same tags, and `primaryTag: markdown`.
  await page.goto("/plain-note")
  const graph = localGraph(page)
  await expect.poll(() => nodeFill(graph, "Plain Note")).toEqual(FIXTURE[colorScheme])
  await expect.poll(() => nodeFill(graph, "Primary Override")).toEqual(MARKDOWN[colorScheme])
  // seo/private-note is tagged `private`, which has no colour: private pages are painted as any
  // other, where the site sets no `nodeColors.private`.
  await expect.poll(() => nodeFill(graph, "Private Note")).toEqual(DARKGRAY[colorScheme])
})

test("fills each tag node with its tag's colour", async ({ page, colorScheme }) => {
  await page.goto("/plain-note")
  const graph = localGraph(page)
  await expect.poll(() => nodeFill(graph, "#fixture")).toEqual(FIXTURE[colorScheme])
  await expect.poll(() => nodeFill(graph, "#markdown")).toEqual(MARKDOWN[colorScheme])
})

test("fills a page and a tag with the colour they inherit", async ({ page, colorScheme }) => {
  // `writing/essays` has an icon of its own and no colour: it takes `writing`'s.
  await page.goto("/tag-engine/most-specific")
  const graph = localGraph(page)
  await expect.poll(() => nodeFill(graph, "Most Specific")).toEqual(SECONDARY[colorScheme])
  await expect.poll(() => nodeFill(graph, "#essays")).toEqual(SECONDARY[colorScheme])
  // `reindex/deep`, and `reindex` above it, have none: down the chain to the default.
  await page.goto("/tag-engine/index-suffix")
  await expect.poll(() => nodeFill(graph, "Index Suffix")).toEqual(DARKGRAY[colorScheme])
  await expect.poll(() => nodeFill(graph, "#deep")).toEqual(DARKGRAY[colorScheme])
})

test("fills a page with no tags in v4's colours: the current page in secondary", async ({
  page,
  colorScheme,
}) => {
  await page.goto("/linked-note")
  await expect.poll(() => nodeFill(localGraph(page), "Linked Note")).toEqual(SECONDARY[colorScheme])
})

test("rings a tagged page in v4's colours: the current page in secondary, a visited one in tertiary", async ({
  page,
  colorScheme,
}) => {
  // v4 marked the reader's own page and the pages they had been to; a tag's fill keeps both as a
  // ring. The current page swells, so look in a disc past its widest.
  await page.goto("/plain-note")
  const graph = localGraph(page)
  await expect.poll(() => nodeFill(graph, "Plain Note")).toEqual(FIXTURE[colorScheme])
  await expect
    .poll(() => marksNear(graph, "Plain Note", SECONDARY[colorScheme], 24))
    .toBeGreaterThan(20)
  // Plain Note links to the .mdx article: there, it is a page the reader has visited.
  await page.goto("/mdx-article.mdx")
  await expect.poll(() => nodeFill(graph, "Plain Note")).toEqual(FIXTURE[colorScheme])
  await expect
    .poll(() => marksNear(graph, "Plain Note", TERTIARY[colorScheme], 20))
    .toBeGreaterThan(20)
})
