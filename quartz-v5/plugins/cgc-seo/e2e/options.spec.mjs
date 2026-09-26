// What cgc-seo writes when a site turns its files off or gives it no baseUrl, and what stock
// content-index writes beside it, on scratch sites, since the content fixture keeps the defaults.
// content-index would write a sitemap and feed of its own to the same two files, at the same time as
// cgc-seo (#67), so both site configs turn its two off, and it still writes contentIndex.json, which
// lists private pages for search and the graph.
import fs from "node:fs"
import path from "node:path"
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { editConfig, fixtureConfig, siteConfig, withPlugins } from "../../../tests/harness/site.mjs"

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nHome.\n",
  "notes/plain.md": "---\ntitle: Plain\n---\nAn indexable article.\n",
  "notes/secret.md": "---\ntitle: Secret\ntags: [private]\n---\nA private stub.\n",
}

const FILES = ["sitemap.xml", "index.xml"]
const writtenBy = (site) => FILES.filter((file) => fs.existsSync(path.join(site.public, file)))
const contentIndex = (site) => JSON.parse(fs.readFileSync(path.join(site.public, "static/contentIndex.json"), "utf8"))

const head = (page) => ({
  robots: page.locator('head meta[name="robots"]'),
  canonical: page.locator('head link[rel="canonical"]'),
  feed: page.locator('head link[rel="alternate"][type="application/rss+xml"]'),
  author: page.locator('head meta[property="article:author"]'),
})

const seoWith = (config, options) =>
  editConfig(config, (_, entry) => {
    for (const [key, value] of Object.entries(options)) entry("../../plugins/cgc-seo").setIn(["options", key], value)
  })

test("with enableSiteMap and enableRSS off, it writes neither file and links no feed, and content-index writes neither", async ({ page, scratch }) => {
  test.setTimeout(180_000)
  const config = seoWith(fixtureConfig(), { enableSiteMap: false, enableRSS: false })
  const site = await scratch.site("seo-files-off", CONTENT, { config })
  expect(site.code, site.output).toBe(0)
  expect(writtenBy(site)).toEqual([])
  expect(Object.keys(contentIndex(site))).toContain("notes/secret")

  // The head is still the plugin's, less the feed link.
  const origin = "https://localhost"
  await routeSite(page, site.public, origin)
  await page.goto(`${origin}/notes/plain`)
  await expect(head(page).canonical).toHaveAttribute("href", `${origin}/notes/plain`)
  await expect(head(page).feed).toHaveCount(0)
  await page.goto(`${origin}/notes/secret`)
  await expect(head(page).robots).toHaveAttribute("content", "noindex")
})

test("on the real site, content-index writes no sitemap or feed, and still lists private pages", async ({ scratch }) => {
  test.setTimeout(180_000)
  // cgc-seo off, so whatever is written is content-index's.
  const config = withPlugins(siteConfig({ offline: true }), [{ source: "../../plugins/cgc-seo", enabled: false }])
  const site = await scratch.site("seo-site-content-index", CONTENT, { config })
  expect(site.code, site.output).toBe(0)
  expect(writtenBy(site)).toEqual([])
  expect(Object.keys(contentIndex(site))).toContain("notes/secret")
})

test("without a baseUrl, it writes neither file, and gives a private page its noindex alone", async ({ page, scratch }) => {
  test.setTimeout(180_000)
  const config = editConfig(fixtureConfig(), (doc) => doc.deleteIn(["configuration", "baseUrl"]))
  const site = await scratch.site("seo-no-base-url", CONTENT, { config })
  expect(site.code, site.output).toBe(0)
  expect(writtenBy(site)).toEqual([])

  // Absolute URLs need the site's address, so nothing else goes in the head.
  const origin = "https://cgc-seo.test"
  await routeSite(page, site.public, origin)
  await page.goto(`${origin}/notes/secret`)
  await expect(head(page).robots).toHaveAttribute("content", "noindex")
  for (const url of ["/notes/secret", "/notes/plain"]) {
    await page.goto(`${origin}${url}`)
    for (const [name, locator] of Object.entries(head(page))) {
      if (name !== "robots") await expect(locator, `${url} ${name}`).toHaveCount(0)
    }
    await expect(page.locator('head script[type="application/ld+json"]'), url).toHaveCount(0)
  }
  await expect(head(page).robots).toHaveCount(0)
})
