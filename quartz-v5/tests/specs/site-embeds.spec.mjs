// The vault's embedded images, as the site build serves them (#70). #70's light-scheme review is of
// the content on the real v5 build, and it named messy-graph.svg, which a wikilink embed turned into
// an `<object>` whose page-relative path 404s. v4 drew it as an image. Proven on a scratch site built
// from the site config, from the vault's own note and the files it embeds.
import fs from "node:fs"
import path from "node:path"
import { test, expect, routeSite } from "../harness/test.mjs"
import { buildScratchSite, siteConfig, testsRoot } from "../harness/site.mjs"

const ORIGIN = "https://blog.chaoticgood.computer"
const VAULT = path.resolve(testsRoot, "../../content/public")
const NOTE = "content/notes/supply-chain.md"
const EMBEDS = ["assets/messy-graph.svg", "assets/circle-graph.png"]

test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  const files = Object.fromEntries([NOTE, ...EMBEDS].map((rel) => [rel, fs.readFileSync(path.join(VAULT, rel))]))
  site = await buildScratchSite("site-embeds", files, { config: siteConfig({ offline: true }), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

test("draws every image a vault note embeds, as v4 did", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/supply-chain`)
  const article = page.locator("article")
  // Nothing embedded through a page-relative `<object>`, which resolves under the note's folder.
  await expect(article.locator("object")).toHaveCount(0)
  for (const embed of EMBEDS) {
    const image = article.locator(`img[src$="${embed}"]`)
    await expect(image, embed).toHaveCount(1)
    await expect(image, embed).toHaveJSProperty("complete", true)
    expect(await image.evaluate((img) => img.naturalWidth), `${embed} loads`).toBeGreaterThan(0)
  }
})
