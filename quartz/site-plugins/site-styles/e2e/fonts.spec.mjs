// The site's own fonts (#84, from the owner's review notes of 2026-09-26): site-styles fetches Inter
// and IBM Plex Mono from Google Fonts at its own build, ships them under `static/site-styles/fonts/`
// and declares them with root-relative URLs. Core wrote its self-hosted fonts at absolute production
// URLs, so every one 404ed on any other host and the pages fell back to system fonts. So each site
// here is served at an origin that is not its `baseUrl`, as a local serve, a preview or staging is.
// Built from the site config, which is where the fonts are chosen and site-styles is loaded.
import fs from "node:fs"
import path from "node:path"
import { test, expect } from "../../../tests/harness/test.mjs"
import { buildScratchSite, editConfig, fileFor, siteConfig } from "../../../tests/harness/site.mjs"

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  "a-note.md":
    "---\ntitle: A note\n---\nA paragraph with *emphasis*, **strong** text and `code`.\n\n## A heading\n\n```js\nconst answer = 42\n```\n",
}

// Anywhere but the site's `baseUrl`, blog.chaoticgood.computer.
const ORIGIN = "https://preview.invalid"
const FONTS = "/static/site-styles/fonts/"
const FAMILIES = ["IBM Plex Mono", "Inter"]

// Every `@font-face` the page's readable stylesheets declare, with the URL each one's `src` resolves
// to. Walks into layer blocks, where site-styles keeps them.
const declaredFaces = (page) =>
  page.evaluate(() => {
    const faces = []
    const walk = (rules, base) => {
      for (const rule of rules) {
        if (rule instanceof CSSFontFaceRule) {
          const family = rule.style.getPropertyValue("font-family").replace(/^["']|["']$/g, "")
          const src = rule.style.getPropertyValue("src").match(/url\(["']?([^"')]+)["']?\)/)?.[1]
          faces.push({ family, url: src && new URL(src, base).href })
        } else if (rule.cssRules) walk(rule.cssRules, base)
      }
    }
    for (const sheet of document.styleSheets) {
      try {
        walk(sheet.cssRules, sheet.href ?? document.baseURI)
      } catch {
        // A cross-origin sheet: its rules are closed to the page.
      }
    }
    return faces
  })

// Loads every face of the site's families that the page knows, and reports how each one ended.
const loadSiteFaces = (page, families) =>
  page.evaluate(async (families) => {
    const faces = [...document.fonts].filter((face) => families.includes(face.family.replace(/^["']|["']$/g, "")))
    await Promise.allSettled(faces.map((face) => face.load()))
    return faces.map((face) => ({ family: face.family.replace(/^["']|["']$/g, ""), status: face.status }))
  }, families)

// The faces Chromium actually drew the first `selector`'s text in, its descendants' included, most
// glyphs first, from the DevTools protocol: a declared family that failed to load computes the
// same, but renders in a fallback.
async function renderedFonts(page, selector) {
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send("DOM.enable")
    await cdp.send("CSS.enable")
    const { root } = await cdp.send("DOM.getDocument")
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector })
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId })
    return fonts.sort((a, b) => b.glyphCount - a.glyphCount)
  } finally {
    await cdp.detach()
  }
}

// What the page asked for that is a font, or from a font host: font files by resource type, and
// Google Fonts' hosts by name, whatever they were asked for.
function fontRequests(page) {
  const requests = []
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (request.resourceType() === "font" || /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) requests.push(url)
  })
  return requests
}

// Serves `root` at `ORIGIN` + `base`, as a host serves a site built for a base path.
async function serve(page, root, base) {
  await page.route(`${ORIGIN}${base}/**`, (route) => {
    const { file, status } = fileFor(root, decodeURIComponent(new URL(route.request().url()).pathname).slice(base.length))
    return route.fulfill({ status, path: file })
  })
}

async function expectSelfHosted(page, prefix) {
  const faces = await declaredFaces(page)
  // Both families, and nothing but them: every face the site declares is its own.
  expect([...new Set(faces.map((face) => face.family))].sort()).toEqual(FAMILIES)
  for (const face of faces) expect(face.url, `${face.family}'s src`).toMatch(new RegExp(`^${prefix}${FONTS}[\\w.-]+\\.woff2$`))
  // Every one of them loads from there.
  const loaded = await loadSiteFaces(page, FAMILIES)
  expect(loaded).toHaveLength(faces.length)
  expect(loaded.filter((face) => face.status !== "loaded"), "faces that didn't load").toEqual([])
}

test.describe("at the site's root", () => {
  // One build per colour-scheme project, shared by that project's tests.
  test.describe.configure({ mode: "serial" })

  let site
  test.beforeAll(async () => {
    test.setTimeout(180_000)
    site = await buildScratchSite("site-styles-fonts", CONTENT, { config: siteConfig(), keep: true })
    expect(site.code, site.output).toBe(0)
  })
  test.afterAll(() => site?.remove())

  test("ships every face at a path of its own, and every one loads off the production host", async ({ page }) => {
    await serve(page, site.public, "")
    await page.goto(`${ORIGIN}/a-note`)
    await expectSelfHosted(page, ORIGIN)
    // Core fetched none of its own: the site config's `fontOrigin` is `local`.
    expect(fs.existsSync(path.join(site.public, "static/fonts")), "core's static/fonts/").toBe(false)
  })

  test("draws text and headings in Inter, and code in IBM Plex Mono", async ({ page }) => {
    await serve(page, site.public, "")
    await page.goto(`${ORIGIN}/a-note`)
    await page.evaluate(() => document.fonts.ready)
    for (const [selector, family] of [
      ["article p", "Inter"],
      [".article-title", "Inter"],
      ["article h2", "Inter"],
      ["article p code", "IBM Plex Mono"],
      ["article pre code [data-line] > span", "IBM Plex Mono"],
    ]) {
      await expect(page.locator(selector).first(), selector).toHaveCSS("font-family", new RegExp(`^"?${family}"?(,|$)`))
      const fonts = await renderedFonts(page, selector)
      expect(fonts[0], `the face most of ${selector} is drawn in`).toMatchObject({ familyName: family, isCustomFont: true })
      // Not a glyph in a fallback: inline code in a paragraph is the site's other family.
      expect(fonts.filter((font) => !font.isCustomFont || !FAMILIES.includes(font.familyName)), `fallback faces in ${selector}`).toEqual([])
    }
  })

  test("asks nothing of any other origin for its fonts", async ({ page }) => {
    const requests = fontRequests(page)
    await serve(page, site.public, "")
    await page.goto(`${ORIGIN}/a-note`)
    await loadSiteFaces(page, FAMILIES)
    expect(requests.length, "font requests").toBeGreaterThan(0)
    expect(requests.filter((url) => url.origin !== ORIGIN).map(String)).toEqual([])
  })
})

test.describe("under a base path", () => {
  test.describe.configure({ mode: "serial" })

  // The site config with its `baseUrl` moved under a path, served at that path on another origin.
  const BASE = "/base-path"
  let site
  test.beforeAll(async () => {
    test.setTimeout(180_000)
    const config = editConfig(siteConfig(), (doc) => doc.setIn(["configuration", "baseUrl"], `blog.chaoticgood.computer${BASE}`))
    site = await buildScratchSite("site-styles-fonts-base", CONTENT, { config, keep: true })
    expect(site.code, site.output).toBe(0)
  })
  test.afterAll(() => site?.remove())

  test("points every face under the base path, and every one loads", async ({ page }) => {
    const requests = fontRequests(page)
    await serve(page, site.public, BASE)
    await page.goto(`${ORIGIN}${BASE}/a-note`)
    await expectSelfHosted(page, `${ORIGIN}${BASE}`)
    expect(requests.filter((url) => url.origin !== ORIGIN).map(String)).toEqual([])
  })
})
