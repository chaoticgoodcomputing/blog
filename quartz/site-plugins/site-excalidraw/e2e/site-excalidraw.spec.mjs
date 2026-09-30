// site-excalidraw: the vault's Excalidraw drawings, embedded as their exported SVGs, one per theme,
// and the drawings' own notes kept off the site. No fixture config loads the plugin, so it is proven
// on a scratch site built from the site config, as the real site is. Built offline: nothing here
// depends on the typeface.
import { test, expect, routeSite, schemeOf, toggleScheme } from "../../../tests/harness/test.mjs"
import { buildScratchSite, editConfig, siteConfig } from "../../../tests/harness/site.mjs"

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
    "A paragraph, whose width is the text's line length.",
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

const PLUGIN = "@chaoticgoodcomputing/site-excalidraw"
// The site config, with the plugin's options set to `options`.
const configWith = (options) =>
  editConfig(siteConfig({ offline: true }), (doc, entry) => entry(PLUGIN).set("options", doc.createNode(options)))

let site
test.beforeAll(async () => {
  site = await buildScratchSite("site-excalidraw", CONTENT, { config: siteConfig({ offline: true }), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

async function open(page, url, built = site) {
  await routeSite(page, built.public, ORIGIN)
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
  // Each export's copy without its background, the default.
  await expect(light).toHaveJSProperty("src", `${ORIGIN}/assets/doodles/pair.light.transparent.svg`)
  await expect(dark).toHaveJSProperty("src", `${ORIGIN}/assets/doodles/pair.dark.transparent.svg`)
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
  const img = page.locator('article img.excalidraw-svg[src$="/assets/doodles/single.transparent.svg"]')
  await expect(img).toHaveCount(1)
  await expect(img).toHaveAttribute("alt", "single")
  await expect(img.locator("xpath=..")).toHaveClass("excalidraw-svg-container")
  await expect(img.locator("xpath=..")).toHaveCSS("max-width", "300px")
  await expect.poll(() => img.evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(300, 0)
})

test("fills the text's line length by default, not its export's own width", async ({ page }) => {
  await open(page, "/content/notes/a-post")
  const lineLength = await page
    .locator("article p", { hasText: "A paragraph, whose width" })
    .evaluate((el) => el.getBoundingClientRect().width)
  const img = page.locator("article .excalidraw-svg-container img:visible").first()
  // The export is 40px wide: the drawing is scaled up to the text's width.
  expect(lineLength).toBeGreaterThan(40)
  await expect.poll(() => img.evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(lineLength, 0)
})

test("embeds upstream's spelling, markdown image syntax with the .excalidraw extension", async ({ page }) => {
  await open(page, "/content/notes/a-post")
  const img = page.locator('article img.excalidraw-svg[src$="/assets/doodles/spelled.excalidraw.transparent.svg"]')
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

test("drops each export's background in its copy, and keeps the export itself as it was", async ({ page }) => {
  for (const file of ["pair.light", "pair.dark", "single", "spelled.excalidraw"]) {
    const original = await (await open(page, `/assets/doodles/${file}.svg`)).text()
    expect(original, file).toContain("<rect")
    const copy = await open(page, `/assets/doodles/${file}.transparent.svg`)
    expect(copy.status(), file).toBe(200)
    const text = await copy.text()
    expect(text, file).toContain("<svg")
    expect(text, file).not.toContain("<rect")
  }
  // A plain note's SVG is not a drawing's export, so it has no copy.
  expect((await open(page, "/assets/plain.transparent.svg")).status()).toBe(404)
})

test.describe("with keepBackground", () => {
  let kept
  test.beforeAll(async () => {
    kept = await buildScratchSite("site-excalidraw-kept", CONTENT, { config: configWith({ keepBackground: true }), keep: true })
    expect(kept.code, kept.output).toBe(0)
  })
  test.afterAll(() => kept?.remove())

  test("shows the exports themselves, and writes no copies", async ({ page }) => {
    await open(page, "/content/notes/a-post", kept)
    await expect(page.locator("article img.excalidraw-svg-light")).toHaveJSProperty("src", `${ORIGIN}/assets/doodles/pair.light.svg`)
    await expect(page.locator("article img.excalidraw-svg-dark")).toHaveJSProperty("src", `${ORIGIN}/assets/doodles/pair.dark.svg`)
    await expect(page.locator('article img[src*=".transparent."]')).toHaveCount(0)
    expect((await open(page, "/assets/doodles/pair.light.transparent.svg", kept)).status()).toBe(404)
  })
})
