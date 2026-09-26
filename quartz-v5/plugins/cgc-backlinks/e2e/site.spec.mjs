// cgc-backlinks on the real site (#78), proven on a scratch site built from the site config, with pages
// in the vault's shapes: its private stubs, tagged `private` or a descendant of it, link to public
// notes as the vault's do. The site resolves links absolutely, as v4 did. The plugin note is the
// vault's own file.
import fs from "node:fs"
import path from "node:path"
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig, testsRoot } from "../../../tests/harness/site.mjs"

// The site is served at its own `baseUrl`, where Quartz points its absolute URLs.
const ORIGIN = "https://blog.chaoticgood.computer"
const VAULT = path.resolve(testsRoot, "../../content/public")
const MDI = JSON.parse(
  fs.readFileSync(
    path.resolve(testsRoot, "../libs/icons/node_modules/@iconify-json/mdi/icons.json"),
    "utf8",
  ),
)
const LOCK = MDI.icons.lock.body.match(/ d="([^"]+)"/)[1]

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome. Start at [[content/notes/garden|the garden]].\n",
  "content/notes/garden.md":
    "---\ntitle: Garden\ntags: [horticulture]\n---\nThe note the others link to.\n",
  "content/notes/walk.md":
    "---\ntitle: A walk\ntags: [horticulture]\n---\nThrough the [[content/notes/garden|garden]], and [[index|home]].\n",
  "content/notes/daily.md":
    "---\ntitle: A daily note\ntags: [private]\n---\nWatered the [[content/notes/garden|garden]].\n",
  "content/notes/standup.md":
    "---\ntitle: A standup\ntags: [private/work]\n---\nMentioned the [[content/notes/garden|garden]].\n",
  // The plugin note, as the vault has it (#48).
  "plugins/cgc-backlinks.md": fs.readFileSync(path.join(VAULT, "plugins/cgc-backlinks.md"), "utf8"),
}

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  test.setTimeout(180_000)
  site = await buildScratchSite("backlinks-site", CONTENT, {
    config: siteConfig({ offline: true }),
    keep: true,
  })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

const link = (page, name) => page.locator(".cgc-backlinks .cgc-backlinks__link", { hasText: name })
const glyphOf = (locator) =>
  locator.evaluate((link) =>
    [...link.querySelectorAll("svg path")].map((shape) => shape.getAttribute("d")),
  )

test("lists a note's backlinks public first, each private one marked with MDI's lock", async ({
  page,
}) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/garden`)
  const names = await page.locator(".cgc-backlinks .cgc-backlinks__name").allTextContents()
  expect(names.slice(0, 2).sort()).toEqual(["A walk", "Home"])
  expect(names.slice(2).sort()).toEqual(["A daily note", "A standup"])
  for (const name of ["A daily note", "A standup"])
    expect(await glyphOf(link(page, name)), name).toEqual([LOCK])
  for (const name of ["A walk", "Home"])
    await expect(link(page, name).locator("svg"), name).toHaveCount(0)
})

test("leaves backlinks off the index, as v4 did", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  await expect(page.locator("article")).toContainText("Welcome.")
  await expect(page.locator(".cgc-backlinks")).toHaveCount(0)
})

test("the plugin note renders at /plugins/cgc-backlinks, with absolute links only", async ({
  page,
}) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/plugins/cgc-backlinks`)
  await expect(page).toHaveTitle("cgc-backlinks | Spencer Elkington")
  // Every link the README writes; a heading's own anchor is Quartz's.
  const hrefs = await page
    .locator("article a:not([role=anchor])")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")))
  expect(hrefs.length).toBeGreaterThan(0)
  expect(hrefs.filter((href) => !/^https:\/\//.test(href))).toEqual([])
})
