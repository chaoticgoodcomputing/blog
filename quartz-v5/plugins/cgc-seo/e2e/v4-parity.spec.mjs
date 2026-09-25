// v4 parity: the site config's cgc-seo gives the same canonical URL, `article:*` meta and JSON-LD as
// the v4 `Head` fork did for the same pages. `v4-parity/v4-head.json` is v4's output for the pages in
// `v4-parity/content.mjs`; here they are built again under v5 from the site config and read back.
import fs from "node:fs"
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig } from "../../../tests/harness/site.mjs"
import { CONTENT, URLS, extractHead } from "./v4-parity/content.mjs"

const v4 = JSON.parse(fs.readFileSync(new URL("./v4-parity/v4-head.json", import.meta.url), "utf8")).heads
const ORIGIN = "https://blog.chaoticgood.computer"

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  site = await buildScratchSite("seo-parity", CONTENT, { config: siteConfig(), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site && fs.rmSync(site.root, { recursive: true, force: true }))

for (const url of URLS) {
  test(`${url} has v4's canonical URL, article metadata and JSON-LD`, async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}${url}`)
    const { canonical, article, jsonLd } = await page.evaluate(extractHead)
    expect({ canonical, article, jsonLd }).toEqual({ canonical: v4[url].canonical, article: v4[url].article, jsonLd: v4[url].jsonLd })
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
