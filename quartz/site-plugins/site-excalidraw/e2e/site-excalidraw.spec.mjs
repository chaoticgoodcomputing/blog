// site-excalidraw: the vault's Excalidraw drawings, embedded as their exported SVGs, one per theme,
// and the drawings' own notes kept off the site. No fixture config loads the plugin, so it is proven
// on a scratch site built from the site config, as the real site is. Built offline: nothing here
// depends on the typeface.
import { test, expect, routeSite, schemeOf, toggleScheme } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig } from "../../../tests/harness/site.mjs"

// A drawing's note, as Obsidian's Excalidraw plugin writes one: the frontmatter key, then scene data.
const drawingNote = "---\nexcalidraw-plugin: parsed\ntags: [excalidraw]\n---\n# Excalidraw Data\n\n## Text Elements\nSecret scene text ^abc\n"
const svg = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20" width="40" height="20"><rect width="40" height="20" fill="${fill}"/></svg>`

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  // Embedded as the vault writes it: from the vault root, one folder above the content folder, and
  // with no extension; then by name alone, sized; then a plain note that shares an SVG's name; then
  // upstream's spelling, markdown image syntax with the `.excalidraw` extension.
  "content/notes/a-post.md": [
    "---\ntitle: A post\n---",
    "![[public/assets/doodles/pair]]",
    "![[single|300]]",
    "![[assets/plain]]",
    "![A spelled drawing](assets/doodles/spelled.excalidraw)",
    "",
  ].join("\n\n"),
  "assets/doodles/pair.md": drawingNote,
  "assets/doodles/pair.light.svg": svg("#ffffff"),
  "assets/doodles/pair.dark.svg": svg("#000000"),
  "assets/doodles/single.md": drawingNote,
  "assets/doodles/single.svg": svg("#ff0000"),
  "assets/doodles/spelled.excalidraw.md": drawingNote,
  "assets/doodles/spelled.excalidraw.svg": svg("#00ff00"),
  "assets/plain.md": "---\ntitle: Plain\n---\nA plain note, transcluded.\n",
  "assets/plain.svg": svg("#0000ff"),
}

const ORIGIN = "https://blog.chaoticgood.computer"

test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  site = await buildScratchSite("site-excalidraw", CONTENT, { config: siteConfig({ offline: true }), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

async function open(page, url) {
  await routeSite(page, site.public, ORIGIN)
  return page.goto(`${ORIGIN}${url}`)
}

const loaded = (img) => img.evaluate((el) => el.complete && el.naturalWidth > 0)

test("embeds a drawing by its vault path as its light and dark exports, one shown per theme", async ({ page }) => {
  await open(page, "/content/notes/a-post")
  const container = page.locator("article .excalidraw-svg-container").filter({ has: page.locator(".excalidraw-svg-light") })
  await expect(container).toHaveCount(1)
  const light = container.locator("img.excalidraw-svg-light")
  const dark = container.locator("img.excalidraw-svg-dark")
  // Written from the content root, and made relative to the page by crawl-links.
  await expect(light).toHaveJSProperty("src", `${ORIGIN}/assets/doodles/pair.light.svg`)
  await expect(dark).toHaveJSProperty("src", `${ORIGIN}/assets/doodles/pair.dark.svg`)
  await expect(light).toHaveAttribute("alt", "pair")

  for (let i = 0; i < 2; i++) {
    const [shown, hidden] = (await schemeOf(page)) === "dark" ? [dark, light] : [light, dark]
    await expect(shown).toBeVisible()
    await expect(hidden).toBeHidden()
    await shown.scrollIntoViewIfNeeded()
    await expect.poll(() => loaded(shown)).toBe(true)
    await toggleScheme(page)
  }
})

test("embeds a drawing by its name alone, sized by a numeric alias", async ({ page }) => {
  await open(page, "/content/notes/a-post")
  const img = page.locator('article img.excalidraw-svg[src$="/assets/doodles/single.svg"]')
  await expect(img).toHaveCount(1)
  await expect(img).toHaveAttribute("alt", "single")
  await expect(img.locator("xpath=..")).toHaveClass("excalidraw-svg-container")
  await expect(img.locator("xpath=..")).toHaveCSS("max-width", "300px")
})

test("embeds upstream's spelling, markdown image syntax with the .excalidraw extension", async ({ page }) => {
  await open(page, "/content/notes/a-post")
  const img = page.locator('article img.excalidraw-svg[src$="/assets/doodles/spelled.excalidraw.svg"]')
  await expect(img).toHaveCount(1)
  await expect(img).toHaveAttribute("alt", "A spelled drawing")
})

test("leaves an embed of a plain note alone, though an SVG shares its name", async ({ page }) => {
  await open(page, "/content/notes/a-post")
  await expect(page.locator('article img[src$="plain.svg"]')).toHaveCount(0)
  await expect(page.locator("article")).toContainText("A plain note, transcluded.")
})

test("keeps the drawings' own notes off the site, but not their exports", async ({ page }) => {
  for (const url of ["/assets/doodles/pair", "/assets/doodles/single", "/assets/doodles/spelled.excalidraw"]) {
    const response = await open(page, url)
    expect(response.status(), url).toBe(404)
  }
  await open(page, "/content/notes/a-post")
  await expect(page.locator("article")).not.toContainText("Secret scene text")
  const svgResponse = await open(page, "/assets/doodles/pair.light.svg")
  expect(svgResponse.status()).toBe(200)
})
