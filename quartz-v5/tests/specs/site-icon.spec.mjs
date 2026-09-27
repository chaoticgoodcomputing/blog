// The site's own icon (#44, #70), `quartz-v5/icon.png`. Quartz reads the icon from inside
// Quartz Core (`quartz/static/icon.png`): Core source's Head links it, the Static emitter copies it and the
// favicon plugin draws `favicon.ico` from it. So the site's build target finishes with a post-build
// step that puts the site's icon in their place, after every emitter has run (a site emitter would
// race the Static one). Proven on a scratch site built from the site config and finished the way
// `site-v5:build` finishes the real one.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { test, expect, routeSite } from "../harness/test.mjs"
import { buildScratchSite, fileFor, siteConfig, testsRoot, core } from "../harness/site.mjs"
import { postbuild } from "../../utils/postbuild.mjs"

const sharp = createRequire(path.join(core, "package.json"))("sharp")
const ORIGIN = "https://blog.chaoticgood.computer"
const SITE_ICON = path.resolve(testsRoot, "../icon.png")
const STOCK_ICON = path.join(core, "quartz/static/icon.png")

// An image's size and RGBA pixels, to compare what a browser would draw rather than file bytes.
async function pixels(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { width: info.width, height: info.height, data }
}
// The favicon as v4 and stock `favicon` draw it: the icon at 48px, as PNG, named `favicon.ico`.
const favicon = (icon) => sharp(icon).resize(48, 48).png().toBuffer()
// A file as the page fetches it, through the site's routing (a request context would bypass it).
const fetched = (page, url) =>
  page.evaluate(async (url) => {
    const response = await fetch(url)
    return { status: response.status, body: [...new Uint8Array(await response.arrayBuffer())] }
  }, url).then(({ status, body }) => ({ status, body: Buffer.from(body) }))

test.describe.configure({ mode: "serial" })

let site, built
test.beforeAll(async () => {
  site = await buildScratchSite("site-icon", { "index.md": "---\ntitle: Home\n---\nWelcome.\n" }, { config: siteConfig({ offline: true }), keep: true })
  expect(site.code, site.output).toBe(0)
  // What the build alone emits, before the post-build step. (`static/icon.png` is not among it here:
  // the Static emitter's glob honours .gitignore, which covers every scratch root, so a scratch build
  // copies nothing from `quartz/static/`. The real site's root is not ignored.)
  built = { favicon: fs.readFileSync(path.join(site.public, "favicon.ico")) }
  await postbuild(site.public)
})
test.afterAll(() => site?.remove())

test("the build alone draws the favicon from stock's icon, which is what the post-build step is for", async () => {
  expect((await pixels(built.favicon)).data.equals((await pixels(await favicon(STOCK_ICON))).data)).toBe(true)
})

test("links the site's own icon from every page's head and from the page title", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  const href = await page.locator('head link[rel="icon"]').getAttribute("href")
  const served = await fetched(page, new URL(href, page.url()).href)
  expect(served.status).toBe(200)
  expect(served.body.equals(fs.readFileSync(SITE_ICON)), `${href} is quartz-v5/icon.png`).toBe(true)
  // The page title's icon: the site's icon is 184px square, stock's 200px.
  const icon = page.locator(".page-title-icon")
  await expect(icon).toHaveJSProperty("complete", true)
  expect(await icon.evaluate((img) => img.naturalWidth)).toBe(184)
})

// Read from disk rather than fetched: Chromium keeps `/favicon.ico` requests from the page's routing.
test("serves the site's own favicon: its icon at 48px, as v4's was", async () => {
  const { file, status } = fileFor(site.public, "/favicon.ico")
  expect(status).toBe(200)
  const served = await pixels(fs.readFileSync(file))
  expect(served).toMatchObject({ width: 48, height: 48 })
  expect(served.data.equals((await pixels(await favicon(SITE_ICON))).data)).toBe(true)
})
