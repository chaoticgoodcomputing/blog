// The real site's annotation pages (#37, #68), proven on a scratch site built from the site config:
// an annotation page is full-width, its Viewer draws the mirror from the site's own mirror path and
// highlights the passages, and it has no source link, as in v4. The source document comes from a
// local host, and the build pins it into a cache of its own.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { test, expect, routeSite } from "../harness/test.mjs"
import { buildScratchSite, editConfig, siteConfig, testsRoot } from "../harness/site.mjs"
import { sourceHost } from "../harness/source-host.mjs"

const ORIGIN = "https://blog.chaoticgood.computer"
// The fixture's two-page source document, pinned there by hand; served here from the host.
const PAPER = fs.readFileSync(path.join(testsRoot, "fixture-cache/cgc-annotator/1090f1fc08a33a90"))

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
    { "index.md": "---\ntitle: Home\n---\nWelcome.\n", "content/annotations/paper.md": annotationPage(host.url("/paper.pdf")) },
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
  await expect(page.locator(".page")).toHaveAttribute("data-frame", "full-width")
  const viewer = page.locator(".cgc-annotator-viewer")
  await expect(viewer).toHaveAttribute("data-cgc-hydrated", "")
  await expect(viewer.locator(".cgc-annotator-viewer__page")).toHaveCount(2)
  await expect(viewer.locator('.cgc-annotator-viewer__highlight[data-annotation="note"]')).toHaveCount(1)
  expect(mirrors).toEqual([expect.stringMatching(/^\/assets\/annotated-documents\/[0-9a-f]{16}$/)])
  await expect(page.locator(".cgc-annotator__annotation .cgc-annotator__comment")).toHaveText("A note on the passage.")
  // As v4's annotation pages had none; a note's has one.
  await expect(page.locator(".cgc-page-source")).toHaveCount(0)
})
