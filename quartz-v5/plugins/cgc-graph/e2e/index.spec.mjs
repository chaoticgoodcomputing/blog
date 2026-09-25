// cgc-graph's own content index, `static/cgcGraph.json` (#21, #74, docs/adr/0001): what the graph is
// drawn from. Stock content-index drops each page's date, which the global graph's time filter reads,
// so the plugin publishes its own. Its shape is the plugin's published contract.
import { test, expect } from "../../../tests/harness/test.mjs"

const indexOf = (emitted) => JSON.parse(emitted.read("static/cgcGraph.json"))

test("carries each page's date", async ({ emitted }) => {
  const index = indexOf(emitted)
  // graph/old-note's frontmatter says `modified: 2020-01-15`, and the fixture dates pages by modified.
  // Quartz reads a date with no time as midnight where the site is built, so it is that day's
  // midnight in some time zone: within fourteen hours of it in UTC.
  const hours =
    (Date.parse(index["graph/old-note"].date) - Date.parse("2020-01-15T00:00:00Z")) / 3_600_000
  expect(Math.abs(hours)).toBeLessThanOrEqual(14)
  for (const [slug, entry] of Object.entries(index)) {
    expect(entry.date, slug).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
  }
})

test("lists every page by its slug, with its title, links and tags", async ({ emitted }) => {
  const index = indexOf(emitted)
  expect(Object.keys(index.index).sort()).toEqual(["date", "links", "tags", "title"])
  expect(index["plain-note"]).toMatchObject({
    title: "Plain Note",
    links: ["mdx-article"],
    tags: ["fixture", "markdown"],
  })
  // Tags as the cgc-tags engine publishes them, in frontmatter order.
  expect(index["tag-engine/most-specific"].tags).toEqual(["fixture", "writing/essays"])
})

test("lists .mdx pages and private pages like any other", async ({ emitted }) => {
  const index = indexOf(emitted)
  expect(index["links/from-mdx"].links).toEqual(
    expect.arrayContaining(["lab/life", "lab/echo", "mdx-article", "lab/life-again"]),
  )
  expect(index["mdx-article"].tags).toEqual(["fixture", "mdx"])
  expect(index["seo/private-note"].tags).toEqual(["private"])
  expect(index["seo/private-descendant"].tags).toEqual(["private/work"])
})

test("lists authored pages only, not the listings Quartz generates", async ({ emitted }) => {
  const index = indexOf(emitted)
  // A tag's description file is authored; the tag pages and folder pages Quartz generates are not.
  expect(index).toHaveProperty("tags/fixture")
  for (const listing of ["tags/writing", "tags/index", "lab/index", "graph/index"]) {
    expect(index, listing).not.toHaveProperty([listing])
  }
})
