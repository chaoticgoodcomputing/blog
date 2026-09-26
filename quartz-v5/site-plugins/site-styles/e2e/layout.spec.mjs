// v4's layout, carried by the site's tiers: a 40em (~70-character) measure between 320px sidebars,
// and the site's 1000px/1300px breakpoints where core has 800px/1200px (#22, user story 18). The
// expected numbers are v4's, measured on the live v4 site with the same viewports. Built from the
// site config, as the real site is, so the real layout's components are all on the page. Built
// offline, since no width here depends on the typeface: `fonts.spec.mjs` proves the fonts.
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig } from "../../../tests/harness/site.mjs"

const TALL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="1000" viewBox="0 0 200 1000"><rect width="200" height="1000" fill="gray"/></svg>`
const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome. Read [[content/notes/a-note]].\n",
  "content/notes/a-note.md": [
    "---\ntitle: A note\ntags: [topic]\n---",
    "A paragraph long enough to wrap: " + "words to fill the measure ".repeat(20),
    "## First heading\n\nMore text, with **strong** words.",
    "## Second heading\n\n![A tall image](content/notes/tall.svg)",
    "## Third heading\n\nThe end.",
  ].join("\n\n"),
  "content/notes/tall.svg": TALL_SVG,
  "content/notes/other.md": "---\ntitle: Other\n---\nThis links to [[content/notes/a-note]], so it has backlinks.\n",
}

const ORIGIN = "https://blog.chaoticgood.computer"

test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  site = await buildScratchSite("site-styles-layout", CONTENT, { config: siteConfig({ offline: true }), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

async function openAt(page, width, url = "/content/notes/a-note") {
  await page.setViewportSize({ width, height: 900 })
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}${url}`)
}
const box = async (locator) => {
  const b = await locator.boundingBox()
  return { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), bottom: Math.round(b.y + b.height) }
}

test("at desktop widths, centres three columns: 320px sidebars around a 40em measure", async ({ page }) => {
  await openAt(page, 1440)
  const body = page.locator("#quartz-body")
  await expect(body).toHaveCSS("grid-template-columns", "320px 640px 320px")
  expect(await box(page.locator(".left.sidebar"))).toMatchObject({ x: 80, width: 320 })
  expect(await box(page.locator(".center"))).toMatchObject({ x: 400, width: 640 })
  expect(await box(page.locator(".right.sidebar"))).toMatchObject({ x: 1040, width: 320 })
  // v4's 2.5rem top spacing, where core has 6rem.
  await expect(page.locator(".left.sidebar")).toHaveCSS("padding", "40px 24px 32px")
  await expect(page.locator(".page-header")).toHaveCSS("margin-top", "16px")
})

test("centres two columns on a page with nothing on the right, like the 404 page", async ({ page }) => {
  await openAt(page, 1440, "/no-such-page")
  expect(await box(page.locator(".left.sidebar"))).toMatchObject({ x: 240, width: 320 })
  expect(await box(page.locator(".center"))).toMatchObject({ x: 560, width: 640 })
})

test("between 1000px and 1300px, puts the right sidebar under the article, in its column", async ({ page }) => {
  await openAt(page, 1100)
  await expect(page.locator("#quartz-body")).toHaveCSS("grid-template-columns", "320px 640px")
  await expect(page.locator("#quartz-body")).toHaveCSS("padding", "0px 32px")
  const center = await box(page.locator(".center"))
  const right = await box(page.locator(".right.sidebar"))
  expect(right).toMatchObject({ x: center.x, width: 640 })
  expect(right.y).toBeGreaterThanOrEqual(center.bottom)
  await expect(page.locator(".right.sidebar")).toHaveCSS("flex-direction", "column")
})

test("below 1000px, stacks one centred column, where core would still show two", async ({ page }) => {
  await openAt(page, 900)
  await expect(page.locator("#quartz-body")).toHaveCSS("grid-template-columns", "640px")
  const left = await box(page.locator(".left.sidebar"))
  const center = await box(page.locator(".center"))
  const right = await box(page.locator(".right.sidebar"))
  expect(center).toMatchObject({ x: 130, width: 640 })
  expect(center.y).toBeGreaterThanOrEqual(left.bottom)
  expect(right).toMatchObject({ x: center.x })
  expect(right.y).toBeGreaterThanOrEqual(center.bottom)
  // v4 centres the date and reading time on narrow screens.
  await expect(page.locator(".content-meta")).toHaveCSS("text-align", "center")
  await expect(page.locator(".article-title")).toHaveCSS("text-align", "start")
})

test("below 800px, centres the article title too", async ({ page }) => {
  await openAt(page, 390)
  await expect(page.locator(".article-title")).toHaveCSS("text-align", "center")
})

test("keeps every block of the centre column to the 40em measure", async ({ page }) => {
  await openAt(page, 1440)
  for (const block of await page.locator(".center > *").all()) {
    expect((await box(block)).width).toBeLessThanOrEqual(640)
  }
})

test("centres a content image, capped at 500px tall", async ({ page }) => {
  await openAt(page, 1440)
  const image = page.locator("article img")
  await expect(image).toHaveCSS("height", "500px")
  const article = await box(page.locator("article"))
  const { x, width } = await box(image)
  expect(Math.abs(x - article.x - (article.width - width) / 2)).toBeLessThanOrEqual(1)
})

test("gives the sidebars' section headings one size and spacing", async ({ page }) => {
  await openAt(page, 1440)
  for (const heading of await page.locator(".sidebar > * > h3").all()) {
    await expect(heading).toHaveCSS("font-size", "16px")
    await expect(heading).toHaveCSS("margin", "12px 0px 4px")
  }
  expect(await page.locator(".sidebar > * > h3").count()).toBeGreaterThan(0)
})

test("centres the footer under the article", async ({ page }) => {
  await openAt(page, 1440)
  const footer = page.locator(".page > #quartz-body > footer")
  await expect(footer).toHaveCSS("text-align", "center")
  await expect(footer).toHaveCSS("margin-top", "32px")
  const center = await box(page.locator(".center"))
  const { x, width } = await box(footer)
  expect(Math.abs(x + width / 2 - (center.x + center.width / 2))).toBeLessThanOrEqual(1)
})

test("sizes the sidebars to the page, so a short page's footer shows on the first screen", async ({ page }) => {
  // Core makes each sidebar a full viewport tall, which pushes the footer of a short page, like the
  // index, a screen down. v4's sidebars were only ever as tall as the page, up to a screenful.
  await openAt(page, 1440, "/")
  await expect(page.locator(".page > #quartz-body > footer")).toBeInViewport()
})

test("shows desktop-only components, the table of contents among them, only at desktop widths", async ({ page }) => {
  const toc = page.locator(".right.sidebar .toc")
  await openAt(page, 1440)
  await expect(toc).toBeVisible()
  // Where the right sidebar stacks under the article, v4 had no table of contents.
  for (const width of [1100, 900]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(toc).toBeHidden()
  }
})

test("switches mobile-only and desktop-only components at 1000px, not core's 800px", async ({ page }) => {
  await openAt(page, 900)
  await expect(page.locator(".desktop-only").first()).toHaveCSS("display", "none")
  await expect(page.locator(".mobile-only").first()).toHaveCSS("display", "contents")
  await page.setViewportSize({ width: 1100, height: 900 })
  await expect(page.locator(".mobile-only").first()).toHaveCSS("display", "none")
})
