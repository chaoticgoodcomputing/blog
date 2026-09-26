// cgc-mdx on the real site (#65), proven on a scratch site built from the site config, with pages in
// the vault's shapes. The site resolves links absolutely, as v4 did, where the fixture uses Quartz's
// default, `shortest`, so links take other paths here. The plugin note is the vault's own file.
import fs from "node:fs"
import path from "node:path"
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig, testsRoot } from "../../../tests/harness/site.mjs"

// The site is served at its own `baseUrl`, where Quartz points its absolute URLs.
const ORIGIN = "https://blog.chaoticgood.computer"
const VAULT = path.resolve(testsRoot, "../../content/public")

const content = () => ({
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  // .mdx pages at the root and in a folder, where the vault has `resume.mdx` and its notes.
  "cv.mdx": "---\ntitle: CV\n---\nThe CV page.\n",
  "content/notes/dice.mdx": "---\ntitle: Dice\n---\nThe dice page, back to [[/cv|the CV]].\n",
  // Links to them in each form the vault writes them.
  "content/notes/links.md": [
    "---\ntitle: Links\n---",
    "- [[/cv|my cv]]",
    "- [[/content/notes/dice.mdx|dice, by file name]]",
    "- [the cv, by file name](/cv.mdx)",
    "- [the cv, relatively](cv.mdx)",
    "- [[/widgets/README|the old widget guide]]",
  ].join("\n"),
  // The plugin note, as the vault has it (#48).
  "plugins/cgc-mdx.md": fs.readFileSync(path.join(VAULT, "plugins/cgc-mdx.md"), "utf8"),
  // A stand-in for v4's widget guide, which the vault keeps until cutover (#81) as a link into v4's
  // widget directory, never read here. The site config ignores it, and the plugin note's alias
  // takes its URL.
  "widgets/README.md": "---\ntitle: Widgets\n---\nv4's widget guide.\n",
})

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  test.setTimeout(180_000)
  site = await buildScratchSite("mdx-site", content(), { config: siteConfig({ offline: true }), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

const emitted = (url) => fs.existsSync(path.join(site.public, `${url}.html`))

test("every .mdx page is emitted at its extensionless slug", () => {
  for (const slug of ["cv", "content/notes/dice"]) {
    expect(emitted(slug), slug).toBe(true)
    expect(emitted(`${slug}.mdx`), `${slug}.mdx`).toBe(false)
  }
})

test("links in the vault's forms reach .mdx pages at their clean URLs", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/links`)
  const article = page.locator("article")
  for (const [text, url] of [
    ["my cv", "/cv"],
    ["dice, by file name", "/content/notes/dice"],
    ["the cv, by file name", "/cv"],
    ["the cv, relatively", "/cv"],
  ]) {
    const href = await article.getByRole("link", { name: text, exact: true }).evaluate((a) => a.href)
    expect(new URL(href).pathname, text).toBe(url)
    expect(emitted(url), url).toBe(true)
  }
})

test("an .mdx page's backlinks list the pages that link to it", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/cv`)
  for (const title of ["Links", "Dice"]) await expect(page.locator(".cgc-backlinks").getByRole("link", { name: title })).toBeVisible()
  await page.goto(`${ORIGIN}/content/notes/dice`)
  await expect(page.locator(".cgc-backlinks").getByRole("link", { name: "Links" })).toBeVisible()
})

test("the plugin note renders at /plugins/cgc-mdx, with absolute links only", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/plugins/cgc-mdx`)
  await expect(page).toHaveTitle("cgc-mdx | Spencer Elkington")
  // Every link the README writes; a heading's own anchor is Quartz's.
  const hrefs = await page.locator("article a:not([role=anchor])").evaluateAll((links) => links.map((a) => a.getAttribute("href")))
  expect(hrefs.length).toBeGreaterThan(0)
  expect(hrefs.filter((href) => !/^https:\/\//.test(href))).toEqual([])
})

test("an old link to v4's widget guide lands on the plugin note", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/links`)
  // Followed as a fresh load: the redirect is a page of its own, which SPA navigation would render
  // under the old URL.
  await page.goto(await page.locator("article").getByRole("link", { name: "the old widget guide" }).evaluate((a) => a.href))
  await expect(page).toHaveURL(`${ORIGIN}/plugins/cgc-mdx`)
  await expect(page).toHaveTitle("cgc-mdx | Spencer Elkington")
  // The guide itself is no longer a page of its own, in search or the graph.
  const index = JSON.parse(fs.readFileSync(path.join(site.public, "static/contentIndex.json"), "utf8"))
  expect(Object.keys(index)).toContain("plugins/cgc-mdx")
  expect(Object.keys(index)).not.toContain("widgets/readme")
})
