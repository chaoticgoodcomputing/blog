import fs from "node:fs"
import sharp from "sharp"
import { expect, test } from "../site.ts"

// The files at the site's root that GitHub Pages, browsers and search engines ask for by name, as
// the Quartz site's end-to-end suite checked them (quartz/tests/specs/site-root-files.spec.mjs and
// site-icon.spec.mjs), ported to this site's build. Each is a file of `public/`, which Astro copies
// into the build untouched, and the deploy publishes the build as it is (docs/cutover/deploy.md).

// The key the site submits its addresses to IndexNow with (utils/indexnow/submit-urls.mjs). IndexNow
// takes a submission only when the site serves that key at `/<key>.txt`.
const INDEXNOW_KEY = "a6e41ab6-6753-4d94-9b54-b4405d806883"
// The Bing Webmaster account the site is verified with.
const BING_USER = "3BD0278B33733CAE424EB3E98B8A58A9"
// The site's icon, 184 pixels square.
const ICON = new URL("../../assets/icon.png", import.meta.url)

/** An image's size and pixels, to compare what a browser draws rather than a file's bytes. */
async function pixels(input: Buffer) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { width: info.width, height: info.height, data }
}

test("CNAME is at the site's root, keeping GitHub Pages serving the site at its own domain", async ({ request }) => {
  const response = await request.get("/CNAME")
  expect(response.status()).toBe(200)
  expect((await response.text()).trim()).toBe("blog.chaoticgood.computer")
})

test("robots.txt is at the site's root, naming the sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt")
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain("Sitemap: https://blog.chaoticgood.computer/sitemap.xml")
})

test("the IndexNow key file is at the site's root, holding the key the site submits with", async ({ request }) => {
  const response = await request.get(`/${INDEXNOW_KEY}.txt`)
  expect(response.status()).toBe(200)
  expect((await response.text()).trim()).toBe(INDEXNOW_KEY)
})

test("Bing Webmaster's verification file is at the site's root", async ({ request }) => {
  const response = await request.get("/BingSiteAuth.xml")
  expect(response.status()).toBe(200)
  expect(await response.text()).toMatch(new RegExp(`<users>\\s*<user>${BING_USER}</user>\\s*</users>`))
})

test("every page's head links the favicon at the site's root, which is the site's icon at 48 pixels", async ({
  page,
  request,
}) => {
  await page.goto("/")
  const href = await page.locator('head link[rel="icon"]').getAttribute("href")
  // Where a browser asks for it when a page names none.
  expect(new URL(href!, page.url()).pathname).toBe("/favicon.ico")
  const response = await request.get("/favicon.ico")
  expect(response.status()).toBe(200)

  const served = await pixels(await response.body())
  expect(served).toMatchObject({ width: 48, height: 48 })
  const drawn = await pixels(await sharp(fs.readFileSync(ICON)).resize(48, 48).png().toBuffer())
  expect(served.data.equals(drawn.data)).toBe(true)
})
