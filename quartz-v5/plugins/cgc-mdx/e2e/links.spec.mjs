// An .mdx page lives at its own slug, `lab/life.mdx`, as stock page types keep a file's extension
// (ADR-0005, the owner's 2026-09-26 decision), and the rest of the site has to find it there: links
// in each form a vault writes them, backlinks, popovers and the graph's edges. A link written with
// the extension reaches it through Quartz alone. One written without it, `[[life]]`, names the old
// clean URL, which is now only a redirect, so cgc-mdx points it at the page itself.
import { test, expect } from "../../../tests/harness/test.mjs"

// The same links, written once in a .md page and once in an .mdx page.
const SOURCES = { "/links/from-md": "Links from Markdown", "/links/from-mdx.mdx": "Links from MDX" }
// Each link's text, and where it has to land.
const LINKS = [
  { text: "life", path: "/lab/life.mdx" },
  { text: "Echo, by its file name", path: "/lab/echo.mdx" },
  { text: "the MDX footnotes", path: "/mdx-article.mdx", hash: "#footnote-check" },
  { text: "Life, again", path: "/lab/life-again.mdx" },
]

for (const [source, title] of Object.entries(SOURCES)) {
  test(`each link on "${title}" reaches its .mdx page at its own URL, not a redirect`, async ({ page }) => {
    await page.goto(source)
    for (const { text, path, hash = "" } of LINKS) {
      const href = await page.locator("article").getByRole("link", { name: text, exact: true }).evaluate((a) => a.href)
      const url = new URL(href)
      expect(url.pathname + url.hash, text).toBe(path + hash)
      const response = await page.request.get(url.pathname)
      expect(response.status(), text).toBe(200)
      expect(await response.text(), text).not.toContain('http-equiv="refresh"')
    }
  })

  test(`hovering a link on "${title}" previews the .mdx page`, async ({ page }) => {
    await page.goto(source)
    await page.locator("article").getByRole("link", { name: "life", exact: true }).hover()
    await expect(page.locator(".popover .popover-inner")).toContainText("A widget imported by a relative path")
  })
}

test("each .mdx page's old clean URL redirects to the page", async ({ page }) => {
  for (const { path } of LINKS) {
    await page.goto(path.slice(0, -".mdx".length))
    await expect(page, path).toHaveURL(new RegExp(`${path.replaceAll(".", "\\.")}$`))
    await expect(page.locator("article"), path).toBeAttached()
  }
})

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
