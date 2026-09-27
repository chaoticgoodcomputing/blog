// v4 parity: the site config's quartz-seo gives the same canonical URL, feed link, `article:*` meta and
// JSON-LD as the v4 `Head` fork did for the same pages, and the same sitemap and RSS feed as v4's
// `ContentIndex` fork. `v4-parity/v4-head.json` and `v4-parity/v4-feeds.json` are v4's output for the
// pages in `v4-parity/content.mjs`; here they are built again under v5 from the site config and read
// back.
import fs from "node:fs"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig, testsRoot } from "../../../tests/harness/site.mjs"
import { CONTENT, URLS, extractHead } from "./v4-parity/content.mjs"
import { readFeed, readSitemap } from "./feeds.mjs"

const golden = (file) => JSON.parse(fs.readFileSync(new URL(`./v4-parity/${file}`, import.meta.url), "utf8"))
const v4 = golden("v4-head.json").heads
const v4Feeds = golden("v4-feeds.json")
const ORIGIN = "https://blog.chaoticgood.computer"

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  test.setTimeout(180_000)
  site = await buildScratchSite("seo-parity", CONTENT, { config: siteConfig(), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

for (const url of URLS) {
  test(`${url} has v4's canonical URL, feed link, article metadata and JSON-LD`, async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}${url}`)
    const { canonical, feeds, article, jsonLd } = await page.evaluate(extractHead)
    const { robots, ...expected } = v4[url]
    expect({ canonical, feeds, article, jsonLd }).toEqual(expected)
  })
}

test("private pages drop v4's nofollow, and nothing else changes about indexing", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  for (const url of URLS) {
    await page.goto(`${ORIGIN}${url}`)
    const { robots } = await page.evaluate(extractHead)
    expect(robots, url).toEqual(v4[url].robots.map((value) => value.replace(", nofollow", "")))
  }
  expect(v4["/content/notes/parity-private"].robots).toEqual(["noindex, nofollow"])
})

test("the sitemap lists v4's pages with v4's dates, each tag's page once at /tags/<t>", () => {
  // v4 listed a tag with a description note twice: the note at /tags/<t>/ and the tag's generated
  // page at /tags/<t>. The canonical tag URL is /tags/<t> (#43), dated by the note.
  const expected = new Map()
  for (const { loc, lastmod } of v4Feeds.sitemap) {
    const url = loc.replace(/^(.*\/tags\/.+)\/$/, "$1")
    if (!expected.has(url) || lastmod) expected.set(url, lastmod)
  }
  const listed = readSitemap(fs.readFileSync(path.join(site.public, "sitemap.xml"), "utf8"))
  expect(listed.map(({ loc }) => loc).sort()).toEqual([...expected.keys()].sort())
  for (const { loc, lastmod } of listed) expect(lastmod, loc).toBe(expected.get(loc))
})

test("the feed is v4's, item for item", () => {
  expect(readFeed(fs.readFileSync(path.join(site.public, "index.xml"), "utf8"))).toEqual(v4Feeds.rss)
})

test("the site's IndexNow submission is the sitemap, so no private page", async () => {
  // The site's own script (utils/indexnow), as CI runs it after a deploy, without sending anything.
  const script = path.resolve(testsRoot, "../../utils/indexnow/submit-urls.mjs")
  const { stdout } = await promisify(execFile)("node", [script, path.join(site.public, "sitemap.xml")], {
    env: { ...process.env, INDEXNOW_DRY_RUN: "true" },
  })
  const { urlList } = JSON.parse(/Would submit: (\{[\s\S]*?\n\})/.exec(stdout)[1])
  const sitemap = readSitemap(fs.readFileSync(path.join(site.public, "sitemap.xml"), "utf8")).map(({ loc }) => loc)
  expect(urlList).toEqual(sitemap)
  expect(urlList).not.toContain(`${ORIGIN}/content/notes/parity-private`)
})
