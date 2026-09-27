// site-components (#44, #70): the site's own page title and footer, at v4 parity. The expected
// values are v4's, measured on the live v4 site. No fixture config loads the plugin, so it is proven
// on a scratch site built from the site config, as the real site is. Built offline: nothing here
// depends on the typeface, and site-config.spec proves the fonts.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { test, expect, resolvedColour, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig, siteConfigFile, core } from "../../../tests/harness/site.mjs"

const YAML = createRequire(path.join(core, "package.json"))("yaml")

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  "content/notes/a-note.md": "---\ntitle: A note\ntags: [topic]\n---\nA note, two folders down.\n",
}

// The site is served at its own `baseUrl`, where Quartz points its absolute URLs.
const ORIGIN = "https://blog.chaoticgood.computer"
// v4's footer links, in v4's order (FORK-LEDGER `layouts/shared.layout.ts`).
const LINKS = [
  ["Contact", "https://blog.chaoticgood.computer/contact"],
  ["GitHub", "https://github.com/spelkington"],
  ["LinkedIn", "https://www.linkedin.com/in/spelkington"],
  ["Privacy Policy", "https://chaoticgood.computer/privacy"],
  ["AI Policy", "https://chaoticgood.computer/ai-policy"],
]

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  site = await buildScratchSite("site-components", CONTENT, { config: siteConfig({ offline: true }), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

async function open(page, url) {
  await routeSite(page, site.public, ORIGIN)
  return page.goto(`${ORIGIN}${url}`)
}

async function expectStyles(locator, styles) {
  for (const [property, value] of Object.entries(styles)) await expect(locator, property).toHaveCSS(property, value)
}

test("puts v4's page title at the top of the left sidebar: the site's icon, its title, its author", async ({ page }) => {
  for (const url of ["/", "/content/notes/a-note", "/content/notes/no-such-page"]) {
    await open(page, url)
    // Ours alone: stock page-title is off.
    await expect(page.locator(".page-title"), url).toHaveCount(1)
    const title = page.locator(".left.sidebar > h2.page-title:first-child")
    // Absolute, as v4's: the 404 page is served from any depth, where a relative link would miss.
    const link = title.locator("> a")
    await expect(link, url).toHaveAttribute("href", "/")
    const icon = link.locator("> img.page-title-icon")
    await expect(icon).toHaveAttribute("src", "/static/icon.png")
    await expect(icon).toHaveAttribute("alt", "")
    const text = link.locator("> .page-title-text")
    await expect(text.locator("> .page-title-name")).toHaveText("Chaotic Good Computing")
    await expect(text.locator("> .page-title-author")).toHaveText("by Spencer Elkington")
  }
})

// The author is the site's, set once (#44): the page title's `author` is an alias of the anchor on
// quartz-seo's `defaultAuthor`, so the byline and the page's JSON-LD author can't disagree.
test("names the configured author, the one quartz-seo credits", async ({ page }) => {
  const config = YAML.parseDocument(fs.readFileSync(siteConfigFile, "utf8"))
  const plain = config.toJS().plugins
  const entry = (name) => config.get("plugins").items[plain.findIndex(({ source }) => JSON.stringify(source).includes(name))]
  const author = entry("site-page-title").getIn(["options", "author"], true)
  const seoAuthor = entry("quartz-seo").getIn(["options", "defaultAuthor", "name"], true)
  expect(YAML.isAlias(author), "the page title's author is a YAML alias").toBe(true)
  expect(seoAuthor.anchor, "quartz-seo's defaultAuthor.name carries the anchor").toBe(author.source)

  await open(page, "/content/notes/a-note")
  const jsonLd = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent())
  await expect(page.locator(".page-title-author")).toHaveText(`by ${jsonLd.author.name}`)
})

test("styles the page title as v4 did, in the scheme's colours", async ({ page }) => {
  await open(page, "/content/notes/a-note")
  const title = page.locator(".page-title")
  await expectStyles(title, { "font-size": "28px", "margin-top": "0px", "margin-bottom": "0px" })
  await expectStyles(title.locator("> a"), {
    display: "flex",
    "align-items": "center",
    gap: "8px",
    "text-decoration-line": "none",
    color: await resolvedColour(page, "var(--dark)"),
  })
  const icon = title.locator(".page-title-icon")
  await expectStyles(icon, { width: "64px", height: "64px", "border-radius": "4px", "object-fit": "cover", "flex-shrink": "0" })
  // Beside the text, not centred on a line of its own as the site's other images are.
  const [iconBox, textBox] = await Promise.all([icon.boundingBox(), title.locator(".page-title-text").boundingBox()])
  expect(textBox.x).toBeCloseTo(iconBox.x + 64 + 8, 0)
  await expectStyles(title.locator(".page-title-text"), { display: "flex", "flex-direction": "column", gap: "4px" })
  await expectStyles(title.locator(".page-title-name"), { "font-size": "28px", "line-height": "33.6px" })
  await expectStyles(title.locator(".page-title-author"), { "font-size": "14px", "font-weight": "400", opacity: "0.7" })
})

test("closes every page with v4's footer: its links, the copyright line, then the credit", async ({ page }) => {
  const year = new Date().getFullYear()
  for (const url of ["/", "/content/notes/a-note", "/content/notes/no-such-page"]) {
    await open(page, url)
    // Ours alone, in the frame's footer position: stock footer is off.
    await expect(page.locator("footer"), url).toHaveCount(1)
    const footer = page.locator(".page > #quartz-body > footer.site-footer")
    await expect(footer, url).toHaveCount(1)
    const links = footer.locator("> ul > li > a")
    await expect(links).toHaveText(LINKS.map(([text]) => text))
    for (const [i, [, href]] of LINKS.entries()) await expect(links.nth(i)).toHaveAttribute("href", href)

    const [copyright, credit] = [footer.locator("> p").nth(0), footer.locator("> p").nth(1)]
    await expect(footer.locator("> *")).toHaveCount(3)
    await expect(copyright).toHaveText(`Copyright Spencer Elkington & Chaotic Good Computing © ${year}`)
    await expect(copyright.getByRole("link", { name: "Spencer Elkington" })).toHaveAttribute("href", "https://chaoticgood.computer/contact")
    await expect(copyright.getByRole("link", { name: "Chaotic Good Computing" })).toHaveAttribute("href", "https://github.com/chaoticgoodcomputing")
    // v4 dropped the Quartz version stock prints.
    await expect(credit).toHaveText(`Created with Quartz © ${year}`)
    await expect(credit.getByRole("link", { name: "Quartz" })).toHaveAttribute("href", "https://quartz.jzhao.xyz/")
  }
})

test("styles the footer as v4 did: centred, dimmed, its links in one centred row", async ({ page }) => {
  await open(page, "/content/notes/a-note")
  const footer = page.locator("footer.site-footer")
  await expectStyles(footer, { "text-align": "center", "margin-top": "32px", "margin-bottom": "64px", opacity: "0.7" })
  await expectStyles(footer.locator("> ul"), {
    display: "flex",
    "flex-direction": "row",
    "justify-content": "center",
    gap: "16px",
    "margin-top": "-16px",
    "padding-left": "0px",
    "list-style-type": "none",
  })
  await expectStyles(footer.locator("> p").first(), { "margin-top": "16px", "margin-bottom": "16px" })
})
