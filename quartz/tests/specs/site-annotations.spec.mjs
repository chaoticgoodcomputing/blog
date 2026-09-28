// The real site's annotation pages (#37, #68), proven on a scratch site built from the site config:
// an annotation page is in quartz-annotator's own frame, `cgc-annotation` (its docs/adr/0004), its
// Viewer draws the mirror from the site's own mirror path and highlights the passages, and it has no
// page-source link, as in v4. The site's title, search and scheme toggle are in the ☰ drawer, the
// page's own header heads the top section, and the graph and backlinks come after the annotations.
// The source document comes from a local host, and the build pins it into a cache of its own.
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

test("an annotation page shows its document from the site's mirror path, highlighted", async ({ page }) => {
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
})

test("an annotation page is in the annotator's frame: the header on top, the graph and backlinks after", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/annotations/paper`)
  await expect(page.locator(".page")).toHaveAttribute("data-frame", "cgc-annotation")
  await expect(page.locator(".cgc-annotator__annotation .cgc-annotator__note")).toHaveText("A note on the passage.")
  // As v4's annotation pages had none; a note's has one.
  await expect(page.locator(".cgc-page-source")).toHaveCount(0)

  // The page's header heads the top section, once, with where the document comes from.
  const top = page.locator(".cgc-annotator-frame__top")
  await expect(page.locator(".article-title")).toHaveCount(1)
  await expect(top.locator(".article-title")).toHaveText("A paper")
  await expect(top.locator(".content-meta")).toHaveCount(1)
  await expect(top.locator('.cgc-tag-list__item[data-tag="writing/annotations"]')).toBeVisible()
  await expect(top.locator(".cgc-annotator-frame__source-link")).toHaveAttribute("href", host.url("/paper.pdf"))

  // After the annotations: the graph, the backlinks with the page that links here, and the
  // subscribe box under a note.
  const cards = await page.locator(".cgc-annotator__annotations").boundingBox()
  const bottom = page.locator(".cgc-annotator-frame__bottom")
  const graph = bottom.locator(".cgc-graph")
  const backlinks = bottom.locator(".cgc-backlinks")
  await expect(graph).toBeVisible()
  await expect(backlinks.getByRole("link", { name: "A reader" })).toBeVisible()
  await expect(bottom.locator(".cgc-email-subscribe__title", { hasText: "Subscribe for more!" })).toBeVisible()
  for (const after of [graph, backlinks]) expect((await after.boundingBox()).y).toBeGreaterThanOrEqual(cards.y + cards.height)

  // Nothing v4's annotation pages didn't have: no tag explorer, contents or social cards, no post
  // listing, and no sidebar "Newsletter" box, which the bottom section's subscribe box stands for.
  await expect(page.locator(".cgc-tag-explorer")).toHaveCount(0)
  await expect(page.locator(".toc")).toHaveCount(0)
  await expect(page.locator(".cgc-social")).toHaveCount(0)
  await expect(page.locator(".cgc-post-listing")).toHaveCount(0)
  await expect(page.locator(".cgc-email-subscribe__title", { hasText: "Newsletter" })).toHaveCount(0)
})

for (const width of [390, 1000, 1440]) {
  test(`at ${width}px, the ☰ drawer holds the site's title, search and scheme toggle, and nothing overflows`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/content/annotations/paper`)
    const menu = page.locator(".cgc-annotator-frame__menu")
    await expect(menu).not.toBeInViewport()
    await page.locator(".cgc-annotator-frame__menu-button").click()
    await expect(menu).toBeInViewport()
    const title = menu.locator(".page-title")
    await expect(title).toBeVisible()
    await expect(title.getByRole("link").first()).toHaveAttribute("href", /^(\/|https:\/\/blog\.chaoticgood\.computer\/?|\.\.\/\.\.)$/)
    await expect(menu.locator(".search")).toBeVisible()
    await expect(menu.locator(".darkmode")).toBeVisible()
    // Together at the top: the site's mobile spacer between them has nothing to grow into here.
    const [titleBox, searchBox] = [await title.boundingBox(), await menu.locator(".search").boundingBox()]
    expect(searchBox.y - (titleBox.y + titleBox.height)).toBeLessThan(80)
    await page.keyboard.press("Escape")
    await expect(menu).not.toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}
