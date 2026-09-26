// The real site's annotation pages (#37, #68), proven on a scratch site built from the site config:
// an annotation page is full-width, in site-components' frame, its Viewer draws the mirror from the
// site's own mirror path and highlights the passages, and it has no source link, as in v4. The page
// title and toolbar sit above it and the graph and backlinks after it. The source document comes
// from a local host, and the build pins it into a cache of its own.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { test, expect, routeSite } from "../harness/test.mjs"
import { buildScratchSite, editConfig, siteConfig } from "../harness/site.mjs"
import { fixturePaper, sourceHost } from "../harness/source-host.mjs"

const ORIGIN = "https://blog.chaoticgood.computer"
// The fixture's two-page source document, served here from the host.
const PAPER = fixturePaper()

// An annotation page as Annotator writes one, quoting one passage of the paper.
const annotationPage = (target) => {
  const json = JSON.stringify({
    text: "A note on the passage.",
    target: [{ source: target, selector: [{ type: "TextQuoteSelector", exact: "draws highlights over quoted passages", prefix: "The annotator ", suffix: "." }] }],
    created: "2024-03-14T00:00:00.000Z",
  })
  return `---\ntitle: A paper\ntags: [writing/annotations]\nannotation-target: ${target}\n---\n\n>%%\n>\`\`\`annotation-json\n>${json}\n>\`\`\`\n>%%\n>*%%HIGHLIGHT%% ==draws highlights over quoted passages==*\n>%%COMMENT%%\n>A note on the passage.\n>%%TAGS%%\n>\n^note\n`
}

test.describe.configure({ mode: "serial" })

let site, host, cache
test.beforeAll(async () => {
  host = await sourceHost({ "/paper.pdf": () => ({ body: PAPER }) })
  cache = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-site-annotations-cache-"))
  // The site config as it is, except that the build pins into a cache of its own. Offline: this
  // spec doesn't look at type.
  const config = editConfig(siteConfig({ offline: true }), (_, entry) =>
    entry("../../plugins/cgc-annotator").setIn(["options", "cacheDir"], cache),
  )
  site = await buildScratchSite(
    "site-annotations",
    {
      "index.md": "---\ntitle: Home\n---\nWelcome.\n",
      "content/annotations/paper.md": annotationPage(host.url("/paper.pdf")),
      // Something for the annotation page's backlinks to list.
      "content/notes/reader.md": "---\ntitle: A reader\n---\nNotes on [[content/annotations/paper|the paper]].\n",
    },
    { config, keep: true },
  )
  expect(site.code, site.output).toBe(0)
})
test.afterAll(async () => {
  await host?.close()
  if (cache) fs.rmSync(cache, { recursive: true, force: true })
  site?.remove()
})

test("an annotation page shows its document from the site's mirror path, highlighted, full-width", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  const mirrors = []
  page.on("request", (req) => {
    if (req.url().includes("/assets/annotated-documents/")) mirrors.push(new URL(req.url()).pathname)
  })
  await page.goto(`${ORIGIN}/content/annotations/paper`)
  const viewer = page.locator(".cgc-annotator-viewer")
  await expect(viewer).toHaveAttribute("data-cgc-hydrated", "")
  await expect(viewer.locator(".cgc-annotator-viewer__page")).toHaveCount(2)
  await expect(viewer.locator('.cgc-annotator-viewer__highlight[data-annotation="note"]')).toHaveCount(1)
  expect(mirrors).toEqual([expect.stringMatching(/^\/assets\/annotated-documents\/[0-9a-f]{16}$/)])
  await expect(page.locator(".cgc-annotator__annotation .cgc-annotator__note")).toHaveText("A note on the passage.")
  // As v4's annotation pages had none; a note's has one.
  await expect(page.locator(".cgc-page-source")).toHaveCount(0)
})

// #37: full-width, and the site composes the rest. v4 had the page title above, and the graph,
// the subscribe box and the backlinks after; the scheme toggle and search are #53's (story 3).
test("an annotation page keeps the site's page title, toggle and search, and the graph and backlinks after it", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/annotations/paper`)
  await expect(page.locator(".page")).toHaveAttribute("data-frame", "site-full-width")
  const split = page.locator(".cgc-annotator__split")
  await expect(split).toBeVisible()
  // Full width, less a gutter either side.
  const width = page.viewportSize().width
  const box = await split.boundingBox()
  expect(box.width).toBeGreaterThan(width * 0.85)
  expect(box.x).toBeGreaterThanOrEqual(8)
  expect(width - (box.x + box.width)).toBeGreaterThanOrEqual(8)

  // Above the document: the site's page title, linking home, and the toolbar.
  const title = page.locator(".page-title")
  await expect(title).toHaveCount(1)
  await expect(title).toBeVisible()
  await expect(title.getByRole("link")).toHaveAttribute("href", /^(\/|https:\/\/blog\.chaoticgood\.computer\/?)$/)
  await expect(page.locator(".darkmode")).toBeVisible()
  await expect(page.locator(".search")).toBeVisible()
  const titleBox = await title.boundingBox()
  expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(box.y)

  // After it: the graph and the backlinks, with the page that links here.
  const graph = page.locator(".cgc-graph")
  const backlinks = page.locator(".cgc-backlinks")
  await expect(graph).toBeVisible()
  await expect(backlinks).toBeVisible()
  await expect(backlinks.getByRole("link", { name: "A reader" })).toBeVisible()
  for (const after of [graph, backlinks]) expect((await after.boundingBox()).y).toBeGreaterThanOrEqual(box.y + box.height)

  // Nothing v4's annotation pages didn't have: no tag explorer, contents or social cards.
  await expect(page.locator(".cgc-tag-explorer")).toHaveCount(0)
  await expect(page.locator(".toc")).toHaveCount(0)
  await expect(page.locator(".cgc-social")).toHaveCount(0)
})
