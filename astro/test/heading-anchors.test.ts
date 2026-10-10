import { satteriHeadingIdsPlugin } from "@astrojs/markdown-satteri"
import { defineMdastPlugin, markdownToHtml } from "satteri"
import { expect, test } from "vitest"
import { headingAnchors } from "../src/lib/heading-anchors.ts"

interface Heading {
  depth: number
  slug: string
  text: string
}

// The resolver gives a heading of an embedded note an id of its own, apart from the page's: here, a
// heading whose text ends `^embedded` is given `embedded-notes`.
const embeddedHeading = defineMdastPlugin({
  name: "embedded-heading",
  heading(node, ctx) {
    if (ctx.textContent(node).endsWith("^embedded")) ctx.setProperty(node, "data", { hProperties: { id: "embedded-notes" } })
  },
})

/** A note as Astro renders it: the site's plugins, then Astro's own, which give headings their ids. */
async function render(source: string) {
  const astro = {
    frontmatter: {},
    headings: [] as Heading[],
    localImagePaths: new Set<string>(),
    remoteImagePaths: new Set<string>(),
  }
  const { html } = await markdownToHtml(source, {
    mdastPlugins: [embeddedHeading],
    hastPlugins: [headingAnchors(), satteriHeadingIdsPlugin()],
    data: { astro },
  })
  return { html: html.trim(), headings: astro.headings }
}

/** Each anchor link in the HTML, by the id of the heading it is in. */
function anchors(html: string): Record<string, string> {
  return Object.fromEntries(
    [...html.matchAll(/<h\d id="([^"]*)">.*?(<a [^>]*>)<svg/g)].map(([, id, anchor]) => [id, anchor!]),
  )
}

test("a heading ends with a link to itself, which only a pointer uses", async () => {
  const { html } = await render("## How to opt out")
  expect(anchors(html)).toEqual({
    "how-to-opt-out": '<a class="heading-anchor" href="#how-to-opt-out" aria-hidden="true" tabindex="-1">',
  })
  expect(html).toMatch(/^<h2 id="how-to-opt-out">How to opt out<a [^>]*><svg [^>]*>.*<\/svg><\/a><\/h2>$/)
})

test("every heading of every level has its anchor, numbered as Astro numbers its id", async () => {
  const { html } = await render("# Notes\n\n### Notes\n\n###### Last")
  expect(Object.keys(anchors(html))).toEqual(["notes", "notes-1", "last"])
  expect(anchors(html)["notes-1"]).toContain('href="#notes-1"')
})

test("a heading that already has an id, as an embedded note's has, links to that id", async () => {
  const { html } = await render("## Notes ^embedded\n\n## Notes")
  expect(anchors(html)["embedded-notes"]).toContain('href="#embedded-notes"')
  expect(anchors(html)["notes"]).toContain('href="#notes"')
})

test("the headings Astro lists for the page read as written, without the anchor", async () => {
  const { headings } = await render("## How to opt out\n\n## How to opt out")
  expect(headings).toEqual([
    { depth: 2, slug: "how-to-opt-out", text: "How to opt out" },
    { depth: 2, slug: "how-to-opt-out-1", text: "How to opt out" },
  ])
})
