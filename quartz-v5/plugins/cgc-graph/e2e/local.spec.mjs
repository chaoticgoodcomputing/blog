// cgc-graph's local graph (#74): the pages around the current one, drawn on a canvas in the right
// sidebar, as v4's graph drew them. Read through the text alternative the plugin writes inside the
// canvas (docs/adr/0002), which names every node and edge it draws.
import { test, expect } from "../../../tests/harness/test.mjs"
import { drawnGraph, localGraph } from "./graph.mjs"

test("draws the pages around the current one, and its edges to .mdx pages", async ({ page }) => {
  // links/from-md links to four .mdx pages, and is tagged `fixture`. Nothing links to it.
  await page.goto("/links/from-md")
  const graph = await drawnGraph(localGraph(page))
  expect(Object.keys(graph).sort()).toEqual(
    [
      "lab/echo",
      "lab/life",
      "lab/life-again",
      "links/from-md",
      "mdx-article",
      "tags/fixture",
    ].sort(),
  )
  expect(graph["links/from-md"].current).toBe(true)
  expect(graph["links/from-md"].edges.sort()).toEqual(
    ["lab/echo", "lab/life", "lab/life-again", "mdx-article", "tags/fixture"].sort(),
  )
  // Edges between the neighbours are drawn too: from .mdx pages as from any other.
  expect(graph["lab/echo"].edges).toContain("lab/life")
  expect(graph["lab/life-again"].edges).toContain("lab/life")
  expect(graph["mdx-article"].edges).toContain("tags/fixture")
  // A tag is its own node, labelled as a tag, linking to its page.
  expect(graph["tags/fixture"].label).toBe("#fixture")
  expect(graph["tags/fixture"].href).toBe("/tags/fixture")
  expect(graph["mdx-article"].label).toBe("MDX Article")
})

test("draws an .mdx page's graph, with the pages that link to it", async ({ page }) => {
  await page.goto("/mdx-article")
  const graph = await drawnGraph(localGraph(page))
  expect(graph["mdx-article"].current).toBe(true)
  for (const source of ["plain-note", "nested/deep-note", "links/from-md", "links/from-mdx", "/"]) {
    expect(graph[source]?.edges, source).toContain("mdx-article")
  }
  // And the pages it links to: the index is `/`.
  expect(graph["mdx-article"].edges).toEqual(expect.arrayContaining(["plain-note", "/"]))
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
