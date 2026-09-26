// cgc-graph's own content index, `static/cgcGraph.json` (#21, #74, docs/adr/0001): what the graph is
// drawn from. Stock content-index drops each page's date, which the global graph's time filter reads,
// so the plugin publishes its own. It carries the icons the graph draws, too, so a page fetches none
// (#77, docs/adr/0004). Its shape is the plugin's published contract.
import fs from "node:fs"
import path from "node:path"
import { test, expect } from "../../../tests/harness/test.mjs"
import { testsRoot } from "../../../tests/harness/site.mjs"

const indexOf = (emitted) => JSON.parse(emitted.read("static/cgcGraph.json"))
const pagesOf = (emitted) => indexOf(emitted).pages

// MDI's own drawing of an icon, read from the installed set: the source of truth for what the graph
// draws.
const MDI = JSON.parse(
  fs.readFileSync(
    path.resolve(testsRoot, "../libs/icons/node_modules/@iconify-json/mdi/icons.json"),
    "utf8",
  ),
)
const mdiPath = (name) => MDI.icons[name].body.match(/ d="([^"]+)"/)[1]

test("holds the pages and the icons, and nothing else", ({ emitted }) => {
  expect(Object.keys(indexOf(emitted)).sort()).toEqual(["icons", "pages"])
})

test("carries each page's date", async ({ emitted }) => {
  const pages = pagesOf(emitted)
  // graph/old-note's frontmatter says `modified: 2020-01-15`, and the fixture dates pages by modified.
  // Quartz reads a date with no time as midnight where the site is built, so it is that day's
  // midnight in some time zone: within fourteen hours of it in UTC.
  const hours =
    (Date.parse(pages["graph/old-note"].date) - Date.parse("2020-01-15T00:00:00Z")) / 3_600_000
  expect(Math.abs(hours)).toBeLessThanOrEqual(14)
  for (const [slug, entry] of Object.entries(pages)) {
    expect(entry.date, slug).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
  }
})

test("lists every page by its slug, with its title, links and tags", async ({ emitted }) => {
  const pages = pagesOf(emitted)
  expect(Object.keys(pages.index).sort()).toEqual(["date", "links", "primary", "tags", "title"])
  expect(pages["plain-note"]).toMatchObject({
    title: "Plain Note",
    links: ["mdx-article.mdx"],
    tags: ["fixture", "markdown"],
  })
  // Tags as the cgc-tags engine publishes them, in frontmatter order.
  expect(pages["tag-engine/most-specific"].tags).toEqual(["fixture", "writing/essays"])
})

test("carries each page's primary tag, as cgc-tags resolves it", async ({ emitted }) => {
  const pages = pagesOf(emitted)
  // The most specific tag; the first of equally specific ones; the one `primaryTag` names.
  expect(pages["tag-engine/most-specific"].primary).toBe("writing/essays")
  expect(pages["plain-note"].primary).toBe("fixture")
  expect(pages["tag-engine/primary-override"].primary).toBe("markdown")
  // A page with no tags has none.
  expect(pages["linked-note"]).not.toHaveProperty("primary")
})

test("lists .mdx pages and private pages like any other", async ({ emitted }) => {
  const pages = pagesOf(emitted)
  expect(pages["links/from-mdx.mdx"].links).toEqual(
    expect.arrayContaining(["lab/life.mdx", "lab/echo.mdx", "mdx-article.mdx", "lab/life-again.mdx"]),
  )
  expect(pages["mdx-article.mdx"].tags).toEqual(["fixture", "mdx"])
  expect(pages["seo/private-note"].tags).toEqual(["private"])
  // Its second tag, `backstage`, is one only a private page carries (cgc-seo's sitemap, #67).
  expect(pages["seo/private-descendant"].tags).toEqual(["private/work", "backstage"])
})

test("lists authored pages only, not the listings Quartz generates", async ({ emitted }) => {
  const pages = pagesOf(emitted)
  // A tag's description file is authored; the tag pages and folder pages Quartz generates are not.
  expect(pages).toHaveProperty("tags/fixture")
  for (const listing of ["tags/writing", "tags/index", "lab/index", "graph/index"]) {
    expect(pages, listing).not.toHaveProperty([listing])
  }
})

// The fixture's tag dictionary names three icons: `writing: mdi:pencil`, `writing/essays:
// mdi:feather`, and `mdtwin: custom:diamond`, from the fixture's own collection (tests/quartz.config.yaml).
test("carries every icon its tags are drawn with, drawn when the site built", ({ emitted }) => {
  const { icons } = indexOf(emitted)
  expect(Object.keys(icons).sort()).toEqual(["custom:diamond", "mdi:feather", "mdi:pencil"])
  // MDI's own drawing, in currentColor, so the graph can paint it any colour.
  expect(icons["mdi:feather"]).toMatch(/^<svg [^>]*viewBox="0 0 24 24"/)
  expect(icons["mdi:feather"]).toContain(`d="${mdiPath("feather")}"`)
  expect(icons["mdi:pencil"]).toContain(`d="${mdiPath("pencil")}"`)
  // The fixture's diamond, whose file paints it in hard-coded magenta and cyan, turned to currentColor.
  expect(icons["custom:diamond"]).toContain("currentColor")
  expect(icons["custom:diamond"]).not.toMatch(/#ff00ff|#0ff|#00ffff|#123456|magenta|cyan/i)
})
