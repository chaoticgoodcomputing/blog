// An .mdx page lives at its clean URL, `lab/life` rather than `lab/life.mdx` (#65), and the rest of
// the site has to find it there: links in each form a vault writes them, backlinks, popovers and
// the graph's edges. Quartz files the page under `lab/life.mdx` in its list of slugs, and keeps
// the extension in a link written with it, so all of this fails without cgc-mdx's say.
import { test, expect } from "../../../tests/harness/test.mjs"

// The same links, written once in a .md page and once in an .mdx page.
const SOURCES = { "/links/from-md": "Links from Markdown", "/links/from-mdx": "Links from MDX" }
// Each link's text, and where it has to land.
const LINKS = [
  { text: "life", path: "/lab/life" },
  { text: "Echo, by its file name", path: "/lab/echo" },
  { text: "the MDX footnotes", path: "/mdx-article", hash: "#footnote-check" },
  { text: "Life, again", path: "/lab/life-again" },
]

for (const [source, title] of Object.entries(SOURCES)) {
  test(`each link on "${title}" reaches its .mdx page at the clean URL`, async ({ page }) => {
    await page.goto(source)
    for (const { text, path, hash = "" } of LINKS) {
      const href = await page.locator("article").getByRole("link", { name: text, exact: true }).evaluate((a) => a.href)
      const url = new URL(href)
      expect(url.pathname + url.hash, text).toBe(path + hash)
      expect((await page.request.get(url.pathname)).status(), text).toBe(200)
    }
  })

  test(`hovering a link on "${title}" previews the .mdx page`, async ({ page }) => {
    await page.goto(source)
    await page.locator("article").getByRole("link", { name: "life", exact: true }).hover()
    await expect(page.locator(".popover .popover-inner")).toContainText("A widget imported by a relative path")
  })
}

test("an .mdx page's backlinks list the pages that link to it", async ({ page }) => {
  for (const { path } of LINKS) {
    await page.goto(path)
    for (const title of Object.values(SOURCES)) {
      await expect(page.locator(".cgc-backlinks").getByRole("link", { name: title }), `${title} on ${path}`).toBeVisible()
    }
  }
})

test("the graph has an edge from each page to the .mdx pages it links to", async ({ emitted }) => {
  // What the stock graph draws from: an edge wherever a page's link names another page in the index.
  const simplify = (slug) => slug.replace(/(^|\/)index$/, "") || "/"
  const index = JSON.parse(emitted.read("static/contentIndex.json"))
  const nodes = new Set(Object.keys(index).map(simplify))
  for (const source of Object.keys(SOURCES)) {
    const links = index[source.slice(1)].links.map(simplify)
    for (const { path } of LINKS) {
      const target = path.slice(1)
      expect(links, `${source} → ${target}`).toContain(target)
      expect(nodes.has(target), `${target} is a node`).toBe(true)
    }
  }
})
