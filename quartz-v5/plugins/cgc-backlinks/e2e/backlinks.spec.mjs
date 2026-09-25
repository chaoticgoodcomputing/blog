// cgc-backlinks lists the pages that link to a page, and marks the private ones (#44, #78). The
// fixture config gives it `privateTags: [private]`, as the site does. `backlinks/target` is linked
// from three public pages under `backlinks/`, one of them `.mdx`, and from the two private pages
// under `seo/`, one tagged `private` and one `private/work`.
import fs from "node:fs"
import path from "node:path"
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"
import { testsRoot } from "../../../tests/harness/site.mjs"

// MDI's own drawing of an icon, read from the installed set: the source of truth for the lock.
const MDI = JSON.parse(
  fs.readFileSync(
    path.resolve(testsRoot, "../libs/icons/node_modules/@iconify-json/mdi/icons.json"),
    "utf8",
  ),
)
const mdiPath = (name) => MDI.icons[name].body.match(/ d="([^"]+)"/)[1]

const backlinks = (page) => page.locator(".cgc-backlinks")
const names = (page) => backlinks(page).locator(".cgc-backlinks__name").allTextContents()
const link = (page, name) => backlinks(page).locator(".cgc-backlinks__link", { hasText: name })
// The shapes a link's mark draws, as the reader sees them.
const glyphOf = (locator) =>
  locator.evaluate((link) =>
    [...link.querySelectorAll("svg path")].map((shape) => shape.getAttribute("d")),
  )
// What a link's mark shows when it holds no icon: its `::before`.
const bulletOf = (locator) =>
  locator
    .locator(".cgc-backlinks__mark")
    .evaluate((mark) => getComputedStyle(mark, "::before").content)

test("lists every page that links to a page, .mdx pages included, each linked to its page", async ({
  page,
}) => {
  await page.goto("/backlinks/target")
  expect((await names(page)).sort()).toEqual(
    [
      "Lookalike source",
      "Newer MDX source",
      "Plain source",
      "Private Descendant",
      "Private Note",
    ].sort(),
  )
  const hrefs = await backlinks(page)
    .locator(".cgc-backlinks__link")
    .evaluateAll((links) =>
      Object.fromEntries(links.map((a) => [a.textContent.trim(), new URL(a.href).pathname])),
    )
  expect(hrefs).toEqual({
    "Newer MDX source": "/backlinks/newer",
    "Plain source": "/backlinks/plain",
    "Lookalike source": "/backlinks/lookalike",
    "Private Note": "/seo/private-note",
    "Private Descendant": "/seo/private-descendant",
  })
  for (const path of Object.values(hrefs))
    expect((await page.request.get(path)).status(), path).toBe(200)
})

// v4's order: public pages before private ones, then the most recently modified first, then titles in
// reverse alphabetical order. The public sources' dates are in their frontmatter: newer 2024-06-01,
// plain and lookalike both 2024-03-01. The private pages' come from git, so only their place is fixed.
test("lists public pages first, newest first, and same-day pages in reverse order of title", async ({
  page,
}) => {
  await page.goto("/backlinks/target")
  const order = await names(page)
  expect(order.slice(0, 3)).toEqual(["Newer MDX source", "Plain source", "Lookalike source"])
  expect(order.slice(3).sort()).toEqual(["Private Descendant", "Private Note"])
})

// v4 marked a private backlink with MDI's lock, which a script fetched from a CDN after the page
// loaded, and a public one with a bullet. Here the lock is in the page as built.
test("marks a private backlink with a lock, drawn into the page as built, and a public one with a bullet", async ({
  page,
  emitted,
}) => {
  const requests = []
  page.on("request", (request) => requests.push(request.url()))
  await page.goto("/backlinks/target")
  const privateLink = link(page, "Private Note")
  await expect(privateLink).toHaveClass(/\bcgc-backlinks__link--private\b/)
  expect(await glyphOf(privateLink)).toEqual([mdiPath("lock")])
  expect(emitted.read("backlinks/target.html")).toContain(mdiPath("lock"))
  expect(requests.filter((url) => /\.svg\b|@mdi\/|iconify|\/icons\//i.test(url))).toEqual([])

  const publicLink = link(page, "Plain source")
  await expect(publicLink).not.toHaveClass(/--private/)
  await expect(publicLink.locator("svg")).toHaveCount(0)
  expect(await bulletOf(publicLink)).toBe('"•"')
})

test("marks a page tagged with a descendant of the private tag, and not one whose tag only starts with it", async ({
  page,
}) => {
  await page.goto("/backlinks/target")
  // `private/work`
  await expect(link(page, "Private Descendant")).toHaveClass(/\bcgc-backlinks__link--private\b/)
  expect(await glyphOf(link(page, "Private Descendant"))).toEqual([mdiPath("lock")])
  // `privateer`
  await expect(link(page, "Lookalike source")).not.toHaveClass(/--private/)
  await expect(link(page, "Lookalike source").locator("svg")).toHaveCount(0)
})

// The fixture palette's `secondary`, the colour Quartz gives links, in each scheme.
const SECONDARY = { light: "rgb(40, 75, 99)", dark: "rgb(123, 151, 170)" }

// The lock is `currentColor`, the link's colour, so a scheme switch on a loaded page repaints it
// through CSS alone, with no script of this plugin's involved.
test("draws the lock 12px square in the link's colour, and repaints it when the reader switches scheme", async ({
  page,
  colorScheme,
}) => {
  await page.goto("/backlinks/target")
  const privateLink = link(page, "Private Note")
  const paint = () =>
    privateLink.evaluate((link) =>
      [...link.querySelectorAll("svg path")].map((shape) => getComputedStyle(shape).fill),
    )
  await expect(privateLink).toHaveCSS("color", SECONDARY[colorScheme])
  expect(await paint()).toEqual([SECONDARY[colorScheme]])
  const box = await privateLink.locator("svg").boundingBox()
  expect([box.width, box.height]).toEqual([12, 12])

  const other = await toggleScheme(page)
  await expect(privateLink).toHaveCSS("color", SECONDARY[other])
  expect(await paint()).toEqual([SECONDARY[other]])
})

// v4's and stock's overflow list: in a sidebar too short for them all, the backlinks scroll in their
// own box, which fades out at the bottom until the reader scrolls to the end.
test("scrolls a long list in its own box, faded at the bottom until scrolled to the end", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 480 })
  // Linked from ten pages.
  await page.goto("/plain-note")
  const list = backlinks(page).locator(".cgc-backlinks__list")
  await expect(list).toHaveCSS("overflow-y", "auto")
  expect(await list.evaluate((ul) => ul.scrollHeight > ul.clientHeight)).toBe(true)
  const faded = () => list.evaluate((ul) => getComputedStyle(ul).maskImage)
  await expect.poll(faded).toMatch(/linear-gradient/)
  await list.evaluate((ul) => ul.scrollTo(0, ul.scrollHeight))
  await expect.poll(faded).toBe("none")
})

test("fades a long list reached through the site's own navigation too", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 480 })
  await page.goto("/seo/private-note")
  await page.locator("article").getByRole("link", { name: "plain-note" }).click()
  await expect(page).toHaveURL(/\/plain-note$/)
  const list = backlinks(page).locator(".cgc-backlinks__list")
  await expect
    .poll(() => list.evaluate((ul) => getComputedStyle(ul).maskImage))
    .toMatch(/linear-gradient/)
})

// v4's backlinks weren't `internal` links, so they had no preview on hover: core previews only
// `a.internal`. Following one is still the site's own navigation.
test("previews no page on hover, and follows a link within the site", async ({ page }) => {
  await page.goto("/backlinks/target")
  const plain = link(page, "Plain source")
  await expect(plain).not.toHaveClass(/\binternal\b/)
  await page.evaluate(() => (window.__sameDocument = true))
  await plain.click()
  await expect(page).toHaveURL(/\/backlinks\/plain$/)
  await expect(page.locator("article")).toContainText("on the same day as the lookalike")
  expect(await page.evaluate(() => window.__sameDocument)).toBe(true)
})

// As stock's and v4's: a page no page links to has no backlinks section at all.
test("leaves the section out of a page no page links to", async ({ page }) => {
  await page.goto("/backlinks/newer")
  await expect(page.locator("article")).toContainText("the newest of the public pages")
  await expect(backlinks(page)).toHaveCount(0)
})

test("an .mdx page's backlinks list the pages that link to it", async ({ page }) => {
  await page.goto("/mdx-article")
  expect(await names(page)).toEqual(expect.arrayContaining(["Plain Note", "Deep Note"]))
})
