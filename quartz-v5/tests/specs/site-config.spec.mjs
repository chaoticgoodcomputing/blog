// The real site's configuration, `quartz-v5/quartz.config.yaml`, proven on a scratch site built
// from it. The content is a few pages in the real vault's shapes, not the vault itself, so this runs
// in the standing suite. Building `content/public` is the `site-v5:build` target's job.
import fs from "node:fs"
import path from "node:path"
import { test, expect, layerOrder, routeSite, schemeOf, toggleScheme } from "../harness/test.mjs"
import { buildScratchSite, siteConfig } from "../harness/site.mjs"
import { postHogStandIn } from "../harness/analytics.mjs"
// layers.mjs reads the layers keyed by parent (site-styles' guard); test.mjs's `layerOrder` is the flat,
// dotted ranking the family-layer check uses.
import { layerOrder as layersByParent, stackDeclaration } from "../harness/layers.mjs"

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome, with `code`.\n",
  // A folder with no index of its own, as `content/notes/` is in the vault.
  "content/notes/a-note.md": "---\ntitle: A note\ntags: [topic]\n---\nA note in a folder with no index.\n",
  // v4 kept capitals in URLs; v5 lowercases them (#23). 89 vault pages are like this.
  "Mixed Case.md": "---\ntitle: Mixed case\n---\nA page whose file name has capitals and a space.\n",
  // A tag's description file, in the shape the vault's files take at cutover (#43).
  "tags/topic.md": "---\ntitle: Topic\n---\nWhat the topic tag is about.\n",
}

// The site is served at its own `baseUrl`, where Quartz points its absolute URLs.
const ORIGIN = "https://blog.chaoticgood.computer"
// Each scheme's page background: the `light` colour of the stock `lightMode` and `darkMode` palettes.
const BACKGROUND = { light: "rgb(250, 248, 248)", dark: "rgb(22, 22, 24)" }

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  site = await buildScratchSite("site-config", CONTENT, { config: siteConfig(), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site && fs.rmSync(site.root, { recursive: true, force: true }))

test("emits no folder pages", () => {
  for (const folder of ["content", "content/notes"]) {
    expect(fs.existsSync(path.join(site.public, folder, "index.html")), `${folder}/index.html`).toBe(false)
  }
  expect(fs.existsSync(path.join(site.public, "content/notes/a-note.html"))).toBe(true)
})

test("lays pages out with v4's components, as far as stock plugins go", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/a-note`)
  await expect(page).toHaveTitle("A note | Spencer Elkington")
  await expect(page.locator(".page-header").getByRole("link", { name: "topic" })).toBeVisible()
  // In no v4 layout: breadcrumbs, reader mode, a file explorer (#42), the frontmatter table.
  for (const selector of [".breadcrumb-container", ".readermode", ".explorer", ".note-properties"]) {
    await expect(page.locator(selector), selector).toHaveCount(0)
  }
  // v4's index shows no date or reading time.
  await page.goto(`${ORIGIN}/`)
  await expect(page.locator(".article-title")).toHaveText("Home")
  await expect(page.locator(".content-meta")).toHaveCount(0)
})

// v4's EmailSubscribe and ShowPageSource (#42, #44), from cgc-email-subscribe and cgc-page-source.
test("closes a note with v4's subscribe box and a link to its source", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/a-note`)
  const footer = page.locator(".page-footer")
  const box = footer.locator(".cgc-email-subscribe")
  await expect(box.locator(".cgc-email-subscribe__title")).toHaveText("Subscribe for more!")
  await expect(box.locator(".cgc-email-subscribe__description")).toHaveText("Be notified weekly about any fresh notes or articles!")
  await expect(box.locator("form")).toHaveAttribute("action", "https://buttondown.com/api/emails/embed-subscribe/chaoticgoodcomputing")
  const source = "https://github.com/chaoticgoodcomputing/blog/blob/main/content/public"
  await expect(footer.locator(".cgc-page-source__link")).toHaveAttribute("href", `${source}/content/notes/a-note.md`)
  // In v4's order: the box, then the link.
  await expect(footer.locator(".cgc-email-subscribe + .cgc-page-source")).toHaveCount(1)
  await page.goto(`${ORIGIN}/mixed-case`)
  await expect(page.locator(".cgc-page-source__link")).toHaveAttribute("href", `${source}/Mixed%20Case.md`)
  // The index and tag pages keep the box but have no source link, as in v4.
  for (const url of ["/", "/tags/topic"]) {
    await page.goto(`${ORIGIN}${url}`)
    await expect(page.locator(".cgc-email-subscribe"), url).toHaveCount(1)
    await expect(page.locator(".cgc-page-source"), url).toHaveCount(0)
  }
  await expect(page.locator("article")).toContainText("What the topic tag is about")
})

// cgc-styles (#63): every cgc-* plugin's own CSS lands in the family layer, which has to outrank core.
test("ranks the family layer above core's styles", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  const top = (await layerOrder(page)).filter((name) => !name.includes("."))
  expect(top).toContain("quartz-base")
  expect(top.indexOf("cgc")).toBeGreaterThan(top.indexOf("quartz-base"))
})

test("keeps the left navigation on the 404 page, as v4 did", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  const response = await page.goto(`${ORIGIN}/no-such-page`)
  expect(response.status()).toBe(404)
  await expect(page.locator(".left.sidebar .page-title")).toBeVisible()
  await expect(page.locator(".left.sidebar .darkmode")).toBeVisible()
  // v4's 404 had no subscribe box or source link.
  await expect(page.locator(".cgc-email-subscribe, .cgc-page-source")).toHaveCount(0)
})

test("follows the OS colour scheme on first load, and renders in it", async ({ page, colorScheme }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  expect(await schemeOf(page)).toBe(colorScheme)
  await expect(page.locator("body")).toHaveCSS("background-color", BACKGROUND[colorScheme])
})

test("switches scheme through the stock toggle in the left sidebar", async ({ page, colorScheme }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  await expect(page.locator(".left.sidebar .darkmode")).toBeVisible()
  const other = colorScheme === "dark" ? "light" : "dark"
  expect(await toggleScheme(page)).toBe(other)
  await expect(page.locator("body")).toHaveCSS("background-color", BACKGROUND[other])
})

// Chromium always reports a scheme (its `no-preference` emulation matches `light`), so a browser
// that reports none is simulated: every `prefers-color-scheme` query matches nothing.
test("falls back to the dark scheme when the browser reports no preference", async ({ page }) => {
  await page.addInitScript(() => {
    const matchMedia = window.matchMedia.bind(window)
    window.matchMedia = (query) => matchMedia(query.includes("prefers-color-scheme") ? "not all" : query)
  })
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  expect(await schemeOf(page)).toBe("dark")
  await expect(page.locator("body")).toHaveCSS("background-color", BACKGROUND.dark)
})

// site-styles' guard (#39, #64), against the plugins the site config actually loads: its stack
// declaration names every layer on the page, in rank order, with the site last. A theme or plugin
// that brings a layer the stack doesn't list fails here until the stack names it.
test("ranks every cascade layer as the site's stack declares, with the site last", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/a-note`)
  const declared = await stackDeclaration(page)
  expect(declared?.at(-1)).toBe("site")
  expect((await layersByParent(page))[""]).toEqual(declared)
})

test("self-hosts its fonts, requesting nothing from Google Fonts", async ({ page }) => {
  const requests = []
  page.on("request", (request) => requests.push(new URL(request.url())))
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  // v4's typography: Inter for text and headings, IBM Plex Mono for code.
  await expect(page.locator("article p").first()).toHaveCSS("font-family", /Inter/)
  await expect(page.locator("article h1, .article-title").first()).toHaveCSS("font-family", /Inter/)
  await expect(page.locator("article code").first()).toHaveCSS("font-family", /IBM Plex Mono/)
  for (const font of ['16px "Inter"', '16px "IBM Plex Mono"']) {
    const faces = await page.evaluate(async (font) => (await document.fonts.load(font)).length, font)
    expect(faces, `faces loaded for ${font}`).toBeGreaterThan(0)
  }
  expect(requests.filter((url) => /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)).map(String)).toEqual([])
  expect(requests.some((url) => url.origin === ORIGIN && url.pathname.startsWith("/static/fonts/"))).toBe(true)
})

// cgc-og-image in place of stock og-image (#58): one card per page, with the site's icon, which a
// scratch root reaches through `siteConfig()`'s rebased `icon`. What the card shows is its own spec's.
test("points each page's og:image at its own card", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/a-note`)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${ORIGIN}/content/notes/a-note-og-image.webp`)
  expect(fs.existsSync(path.join(site.public, "content/notes/a-note-og-image.webp"))).toBe(true)
})

// cgc-posthog in place of core analytics (#61): v4's PostHog project and host, v4's privacy options,
// and v4's `navigation` labels, as far as the site has their places yet. PostHog is a stand-in.
test("sends v4's analytics to PostHog, labelling navigations as v4 did", async ({ page }) => {
  const posthog = await postHogStandIn(page, "https://app.posthog.com")
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/a-note`)
  await expect.poll(() => posthog.inits.length).toBe(1)
  expect(posthog.inits[0].token).toBe("phc_BviHJVml66FIB1RFmgeAzZpKRWA0nntGdIOo47hTA3X")
  expect(posthog.inits[0].config).toMatchObject({ api_host: "https://app.posthog.com", ip: false, disable_session_recording: true })
  expect(posthog.requests).toEqual(["https://app.posthog.com/static/array.js"])
  // A tag badge, then a page in the tag's listing.
  await page.locator(".page-header").getByRole("link", { name: "topic" }).click()
  await expect(page).toHaveURL(`${ORIGIN}/tags/topic`)
  await page.locator(".center").getByRole("link", { name: "A note", exact: true }).click()
  await expect(page).toHaveURL(`${ORIGIN}/content/notes/a-note`)
  const navigations = () => posthog.captures.filter(({ event }) => event === "navigation").map(({ properties }) => properties)
  await expect.poll(navigations).toEqual([
    { source: "tag-badge", from_page: "/content/notes/a-note", to_page: "/tags/topic", url: `${ORIGIN}/tags/topic` },
    { source: "inline-link", from_page: "/tags/topic", to_page: "/content/notes/a-note", url: `${ORIGIN}/content/notes/a-note` },
  ])
})

// `alias-redirects` emits case redirects only when the output directory's filesystem is
// case-sensitive, as CI's is. On a case-insensitive one (macOS by default) `/Mixed-Case` would reach
// `mixed-case.html` directly, and this would pass without a redirect existing.
const caseSensitive = (dir) => {
  const probe = path.join(dir, ".Case-Probe")
  fs.writeFileSync(probe, "")
  try {
    return !fs.existsSync(path.join(dir, ".case-probe"))
  } finally {
    fs.rmSync(probe)
  }
}

test("redirects a v4 mixed-case URL to its lowercase page", async ({ page }) => {
  test.skip(!caseSensitive(site.public), "case redirects are only emitted on a case-sensitive filesystem")
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/Mixed-Case`)
  await expect(page).toHaveURL(`${ORIGIN}/mixed-case`)
  await expect(page.locator("article")).toContainText("capitals and a space")
})
