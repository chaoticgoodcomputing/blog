// The real site's annotation pages (#37, #68), proven on a scratch site built from the site config:
// an annotation page is full-width, in site-components' frame, its Viewer draws the mirror from the
// site's own mirror path and highlights the passages, and it has no source link, as in v4. The page
// title and toolbar sit above it and the graph and backlinks after it, and the page's own header is
// at the top of the annotations panel (#87). The source document comes
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
  // A build of the real site config, which queues on the build lock behind every other build.
  test.setTimeout(180_000)
  host = await sourceHost({ "/paper.pdf": () => ({ body: PAPER }) })
  cache = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-site-annotations-cache-"))
  // The site config as it is, except that the build pins into a cache of its own. Offline: this
  // spec doesn't look at type.
  const config = editConfig(siteConfig({ offline: true }), (_, entry) =>
    entry("@chaoticgoodcomputing/quartz-annotator").setIn(["options", "cacheDir"], cache),
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

  // Nothing v4's annotation pages didn't have: no tag explorer, contents or social cards, and none
  // of the home page's other components, which quartz.ts keeps to their pages (#70): no post
  // listing, and no "Newsletter" box among the right-hand components after the Viewer.
  await expect(page.locator(".cgc-tag-explorer")).toHaveCount(0)
  await expect(page.locator(".toc")).toHaveCount(0)
  await expect(page.locator(".cgc-social")).toHaveCount(0)
  await expect(page.locator(".cgc-post-listing")).toHaveCount(0)
  await expect(page.locator(".cgc-email-subscribe__title", { hasText: "Newsletter" })).toHaveCount(0)
})

// The owner's review (#87): an annotation page's header (its title, date and reading time, and its
// tags) is at the top of the annotations panel, beside the document, not above the page. The frame
// hands it to the page body, which places it (cgc-annotator's docs/adr/0003).
test("an annotation page's header is at the top of the annotations panel", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/annotations/paper`)
  const panel = page.locator(".cgc-annotator__annotations")
  const header = panel.locator(".cgc-annotator__header")
  // Once on the page, and in the panel.
  await expect(page.locator(".article-title")).toHaveCount(1)
  await expect(header.locator(".article-title")).toHaveText("A paper")
  await expect(header.locator(".content-meta")).toHaveCount(1)
  await expect(header.locator(".cgc-tag-list")).toHaveCount(1)
  await expect(header.locator('.cgc-tag-list__item[data-tag="writing/annotations"]')).toBeVisible()
  await expect(page.locator(".page-header .article-title, .page-header .cgc-tag-list")).toHaveCount(0)
  // With where the document comes from.
  await expect(header.locator(".cgc-annotator__source-link")).toHaveAttribute("href", host.url("/paper.pdf"))

  // Beside the document, at the top of the panel, before its annotations.
  const [viewerBox, panelBox, titleBox, headingBox] = await Promise.all(
    [page.locator(".cgc-annotator-viewer"), panel, header.locator(".article-title"), panel.locator(".cgc-annotator__heading")].map((l) => l.boundingBox()),
  )
  expect(titleBox.x).toBeGreaterThanOrEqual(viewerBox.x + viewerBox.width)
  expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(panelBox.x + panelBox.width)
  expect(titleBox.y).toBeGreaterThanOrEqual(panelBox.y)
  expect(titleBox.y - panelBox.y).toBeLessThan(80)
  expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(headingBox.y)
  // The site's bar still sits above the document.
  expect((await page.locator(".page-title").boundingBox()).y + 1).toBeLessThan(viewerBox.y)
})

test("on a narrow screen the header heads the annotations, which take the page", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 })
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/annotations/paper`)
  await expect(page.locator(".cgc-annotator-viewer")).toBeHidden()
  const header = page.locator(".cgc-annotator__annotations .cgc-annotator__header")
  await expect(header.locator(".article-title")).toBeVisible()
  await expect(header.locator(".cgc-tag-list")).toBeVisible()
  await expect(header.locator(".cgc-annotator__read-along:visible")).toHaveCount(1)
  const [titleBox, first] = await Promise.all([header.locator(".article-title").boundingBox(), page.locator(".cgc-annotator__annotation").first().boundingBox()])
  expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(first.y)
  // Nothing overflows the narrow page.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(800)
})
