// cgc-graph's local graph (#74): the pages around the current one, drawn on a canvas in the right
// sidebar, as v4's graph drew them. Read through the text alternative the plugin writes inside the
// canvas (docs/adr/0002), which names every node and edge it draws.
import { test, expect } from "../../../tests/harness/test.mjs"
import { drawnGraph, hoveredLabel, localGraph, nodePosition, pixelsLike } from "./graph.mjs"

test("draws the pages around the current one, and its edges to .mdx pages", async ({ page }) => {
  // links/from-md links to four .mdx pages, and is tagged `fixture`. Nothing links to it.
  await page.goto("/links/from-md")
  const graph = await drawnGraph(localGraph(page))
  expect(Object.keys(graph).sort()).toEqual(
    [
      "lab/echo.mdx",
      "lab/life.mdx",
      "lab/life-again.mdx",
      "links/from-md",
      "mdx-article.mdx",
      "tags/fixture",
    ].sort(),
  )
  expect(graph["links/from-md"].current).toBe(true)
  expect(graph["links/from-md"].edges.sort()).toEqual(
    ["lab/echo.mdx", "lab/life.mdx", "lab/life-again.mdx", "mdx-article.mdx", "tags/fixture"].sort(),
  )
  // Edges between the neighbours are drawn too: from .mdx pages as from any other.
  expect(graph["lab/echo.mdx"].edges).toContain("lab/life.mdx")
  expect(graph["lab/life-again.mdx"].edges).toContain("lab/life.mdx")
  expect(graph["mdx-article.mdx"].edges).toContain("tags/fixture")
  // A tag is its own node, labelled as a tag, linking to its page.
  expect(graph["tags/fixture"].label).toBe("#fixture")
  expect(graph["tags/fixture"].href).toBe("/tags/fixture")
  expect(graph["mdx-article.mdx"].label).toBe("MDX Article")
})

test("strokes the edges on the canvas, not only in the text alternative", async ({
  page,
  colorScheme,
}) => {
  // Resting edges are drawn in the theme's `lightgray` (tests/quartz.config.yaml), each at its
  // opacity. A tag bubble's circle is `lightgray` too, but opaque, so only the edges paint it
  // partly: six nodes, and more edges between them, make a few hundred pixels.
  const LIGHTGRAY = { light: [229, 229, 229], dark: [57, 54, 57] }
  await page.goto("/links/from-md")
  const graph = localGraph(page)
  await drawnGraph(graph)
  await expect.poll(() => pixelsLike(graph, LIGHTGRAY[colorScheme], { translucent: true })).toBeGreaterThan(100)
})

test("marks the node under the pointer in the text alternative, with no browser tooltip", async ({
  page,
}) => {
  // The canvas draws the hovered node's label itself, as v4's did; a native tooltip would show it
  // twice.
  await page.goto("/links/from-md")
  const graph = localGraph(page)
  const mdx = await nodePosition(graph, "MDX Article")
  await page.mouse.move(mdx.x, mdx.y)
  await expect.poll(() => hoveredLabel(graph)).toBe("MDX Article")
  await expect(graph.locator(".cgc-graph__canvas")).not.toHaveAttribute("title", /.+/)
  await page.mouse.move(0, 0)
  await expect.poll(() => hoveredLabel(graph)).toBe(null)
})

test("draws an .mdx page's graph, with the pages that link to it", async ({ page }) => {
  await page.goto("/mdx-article.mdx")
  const graph = await drawnGraph(localGraph(page))
  expect(graph["mdx-article.mdx"].current).toBe(true)
  for (const source of ["plain-note", "nested/deep-note", "links/from-md", "links/from-mdx.mdx", "/"]) {
    expect(graph[source]?.edges, source).toContain("mdx-article.mdx")
  }
  // And the pages it links to: the index is `/`.
  expect(graph["mdx-article.mdx"].edges).toEqual(expect.arrayContaining(["plain-note", "/"]))
})

test("draws private pages, marked as private", async ({ page }) => {
  // seo/private-note is tagged `private` and links to plain-note.
  await page.goto("/plain-note")
  const graph = await drawnGraph(localGraph(page))
  expect(graph["seo/private-note"]).toMatchObject({ label: "Private Note", private: true })
  expect(graph["seo/private-note"].edges).toContain("plain-note")
  expect(graph["plain-note"].private).toBe(false)
})

// Tag pages have the graph on the real site, whose layout keeps the right sidebar there, where the
// fixture's clears it: site.spec.mjs draws theirs.
