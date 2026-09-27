// cgc-mdx on the real site (#65, and the owner's 2026-09-26 decision), proven on a scratch site
// built from the site config, with pages in the vault's shapes. The site resolves links absolutely,
// as v4 did, where the fixture uses Quartz's default, `shortest`, so links take other paths here.
// The plugin note is the vault's own file.
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
  // An .mdx page beside a .md page of the same name, whose URL its clean URL would take.
  "content/notes/twin.md": "---\ntitle: Twin, in Markdown\n---\nThe Markdown twin.\n",
  "content/notes/twin.mdx": "---\ntitle: Twin, in MDX\n---\nThe MDX twin.\n",
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
  "plugins/quartz-mdx.md": fs.readFileSync(path.join(VAULT, "plugins/quartz-mdx.md"), "utf8"),
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

// A redirect stub, as stock alias-redirects writes one.
const isRedirect = (url) => fs.readFileSync(path.join(site.public, `${url}.html`), "utf8").includes('http-equiv="refresh"')

test("every .mdx page is emitted at its .mdx URL, and its old clean URL redirects there", async ({ page }) => {
  // The owner's 2026-09-26 decision (ADR-0005), overruling #23 and #65's clean URLs.
  for (const slug of ["cv", "content/notes/dice"]) {
    expect(emitted(`${slug}.mdx`), `${slug}.mdx`).toBe(true)
    expect(isRedirect(`${slug}.mdx`), `${slug}.mdx is the page`).toBe(false)
    expect(isRedirect(slug), `${slug} redirects`).toBe(true)
  }
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/dice`)
  await expect(page).toHaveURL(`${ORIGIN}/content/notes/dice.mdx`)
  await expect(page.locator("article")).toContainText("The dice page")
})

test("an .mdx page's clean URL is no alias when a .md page lives there", () => {
  expect(isRedirect("content/notes/twin"), "the .md page").toBe(false)
  expect(fs.readFileSync(path.join(site.public, "content/notes/twin.html"), "utf8")).toContain("The Markdown twin.")
  expect(fs.readFileSync(path.join(site.public, "content/notes/twin.mdx.html"), "utf8")).toContain("The MDX twin.")
})

test("links in the vault's forms reach .mdx pages at their own URLs, not through the redirect", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/links`)
  const article = page.locator("article")
  for (const [text, url] of [
    ["my cv", "/cv.mdx"],
    ["dice, by file name", "/content/notes/dice.mdx"],
    ["the cv, by file name", "/cv.mdx"],
    ["the cv, relatively", "/cv.mdx"],
  ]) {
    const href = await article.getByRole("link", { name: text, exact: true }).evaluate((a) => a.href)
    expect(new URL(href).pathname, text).toBe(url)
    expect(emitted(url), url).toBe(true)
    expect(isRedirect(url), url).toBe(false)
  }
  // The graph's edges and the backlinks come from the links a page records, which each link above
  // resolved into: the pages themselves, and never their redirects.
  const index = JSON.parse(fs.readFileSync(path.join(site.public, "static/contentIndex.json"), "utf8"))
  const { links } = index["content/notes/links"]
  expect(links).toEqual(expect.arrayContaining(["cv.mdx", "content/notes/dice.mdx"]))
  for (const redirect of ["cv", "content/notes/dice"]) expect(links).not.toContain(redirect)
})

test("an .mdx page's backlinks list the pages that link to it", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/cv.mdx`)
  for (const title of ["Links", "Dice"]) await expect(page.locator(".cgc-backlinks").getByRole("link", { name: title })).toBeVisible()
  await page.goto(`${ORIGIN}/content/notes/dice.mdx`)
  await expect(page.locator(".cgc-backlinks").getByRole("link", { name: "Links" })).toBeVisible()
})

test("no case-redirect stub collides with or duplicates an .mdx page", () => {
  // The site config turns alias-redirects' case redirects on (#23). They are written only on a
  // case-sensitive filesystem, which this check needs to mean anything.
  const probe = path.join(site.public, ".Case-Probe")
  fs.writeFileSync(probe, "")
  const caseSensitive = !fs.existsSync(path.join(site.public, ".case-probe"))
  fs.rmSync(probe)
  test.skip(!caseSensitive, "case redirects are only emitted on a case-sensitive filesystem")
  const pages = fs.readdirSync(site.public, { recursive: true }).filter((file) => file.endsWith(".mdx.html"))
  expect(pages.sort()).toEqual(["content/notes/dice.mdx.html", "content/notes/twin.mdx.html", "cv.mdx.html"])
  expect(pages.filter((file) => isRedirect(file.slice(0, -".html".length)))).toEqual([])
})

test("the plugin note renders at /plugins/quartz-mdx, with absolute links only", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/plugins/quartz-mdx`)
  await expect(page).toHaveTitle("quartz-mdx | Spencer Elkington")
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
  await expect(page).toHaveURL(`${ORIGIN}/plugins/quartz-mdx`)
  await expect(page).toHaveTitle("quartz-mdx | Spencer Elkington")
  // The guide itself is no longer a page of its own, in search or the graph.
  const index = JSON.parse(fs.readFileSync(path.join(site.public, "static/contentIndex.json"), "utf8"))
  expect(Object.keys(index)).toContain("plugins/quartz-mdx")
  expect(Object.keys(index)).not.toContain("widgets/readme")
})
