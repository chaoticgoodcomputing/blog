// cgc-post-listing draws each badge's tag icon in its ring, as v4's PostListing did (#53 story 8,
// #73): the icon id the cgc-tags engine publishes, drawn when the site builds by
// @chaoticgoodcomputing/icons, as inline SVG painted in the tag's colour. v4 drew them with a script
// after the page loaded. The fixture's tag dictionary and icon collection are in
// tests/quartz.config.yaml, and cgc-tag-list's e2e/icons.spec.mjs proves the drawing itself.
import fs from "node:fs"
import path from "node:path"
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"
import {
  buildPluginCopy,
  buildScratchSite,
  fixtureConfig,
  othersOff,
  testsRoot,
  withPlugins,
} from "../../../tests/harness/site.mjs"

// MDI's own drawing of an icon, read from the installed set: the source of truth for what a ring shows.
const MDI = JSON.parse(
  fs.readFileSync(
    path.resolve(testsRoot, "../libs/icons/node_modules/@iconify-json/mdi/icons.json"),
    "utf8",
  ),
)
const mdiPath = (name) => MDI.icons[name].body.match(/ d="([^"]+)"/)[1]

// The first listed badge for `tag`'s ring. Three fixture pages share the title "OG card", so badges
// are found by their tag.
const ring = (page, tag) =>
  page
    .locator(`.cgc-post-listing .cgc-post-listing__tag[data-tag="${tag}"] .cgc-post-listing__ring`)
    .first()

// The ring's glyph as the reader sees it: each painted shape's geometry and computed fill.
const glyphOf = (locator) =>
  locator.evaluate((ring) =>
    [...ring.querySelectorAll("svg path, svg circle, svg rect, svg polygon, svg ellipse")].map(
      (shape) => ({ d: shape.getAttribute("d"), fill: getComputedStyle(shape).fill }),
    ),
  )

test("draws a tag's icon in its badge's ring, in the page the site built, with no request", async ({
  page,
  emitted,
}) => {
  const requests = []
  page.on("request", (request) => requests.push(request.url()))
  // `writing/essays: { icon: "mdi:feather" }`, on og/tag-sibling
  await page.goto("/tags/writing")
  const glyph = await glyphOf(ring(page, "writing/essays"))
  expect(glyph.map(({ d }) => d)).toEqual([mdiPath("feather")])
  // In the HTML as built, not added by a script.
  const html = emitted.read("tags/writing.html")
  expect(html).toMatch(/class="cgc-post-listing__ring"[^>]*><svg [^>]*class="cgc-post-listing__icon"/)
  expect(html).toContain(mdiPath("feather"))
  // v4 fetched each icon from jsDelivr (`@mdi/svg`), or `/static/icons/` for its own.
  expect(requests.filter((url) => /\.svg\b|@mdi\/|iconify|\/icons\//i.test(url))).toEqual([])
})

// The fixture palette's `secondary`, in each scheme (tests/quartz.config.yaml).
const SECONDARY = { light: "rgb(40, 75, 99)", dark: "rgb(123, 151, 170)" }

test("draws a child tag with no icon of its own with its parent's, in the tag's colour", async ({
  page,
  colorScheme,
}) => {
  // `writing: { color: "var(--secondary)", icon: "mdi:pencil" }`, and nothing for `writing/articles`
  await page.goto("/tags/writing")
  const articles = ring(page, "writing/articles")
  const glyph = async () => glyphOf(articles)
  expect((await glyph()).map(({ d }) => d)).toEqual([mdiPath("pencil")])
  await expect(articles).toHaveCSS("border-top-color", SECONDARY[colorScheme])
  expect((await glyph()).map(({ fill }) => fill)).toEqual([SECONDARY[colorScheme]])
  // The glyph is `currentColor`, so a scheme switch repaints it through CSS alone.
  const other = await toggleScheme(page)
  await expect(articles).toHaveCSS("border-top-color", SECONDARY[other])
  expect((await glyph()).map(({ fill }) => fill)).toEqual([SECONDARY[other]])
})

test("draws a custom: icon from the site's own SVG files, in currentColor, at the ring's size", async ({
  page,
}) => {
  // `mdtwin: { icon: "custom:diamond" }`, from tests/fixture-icons/, drawn in magenta and cyan
  await page.goto("/tags/mdtwin")
  const svg = ring(page, "mdtwin").locator("svg.cgc-post-listing__icon")
  await expect(svg).toHaveCount(1)
  // v4's 18px icon, as cgc-tag-list draws it.
  await expect(svg).toHaveCSS("width", "18px")
  await expect(svg).toHaveCSS("height", "18px")
  const colour = await ring(page, "mdtwin").evaluate((ring) => getComputedStyle(ring).color)
  const paints = await svg.evaluate((svg) =>
    [...svg.querySelectorAll("*")].flatMap((mark) => {
      const style = getComputedStyle(mark)
      return [style.fill, style.stroke].filter((paint) => paint !== "none")
    }),
  )
  expect(paints.length).toBeGreaterThan(0)
  expect(new Set(paints)).toEqual(new Set([colour]))
})

test("leaves the ring empty for a tag with no icon in its lineage", async ({ page }) => {
  // `markdown: { color: "light-dark(#b35f00, #de8200)" }`
  await page.goto("/tags/listing")
  const markdown = ring(page, "markdown")
  await expect(markdown).toBeVisible()
  await expect(markdown.locator("*")).toHaveCount(0)
})

// A misspelt icon id fails the build, where v4 logged a warning in the reader's console (#29, #53
// story 34), and says which tag it was. Every other plugin of ours is off, so no other plugin that
// draws icons fails the build first, in its own words.
test("fails the build on an icon its collection doesn't have", async () => {
  const entries = [
    {
      source: "../../plugins/cgc-tags",
      enabled: true,
      options: { tags: { fixture: { icon: "mdi:no-such-icon" } } },
    },
    ...othersOff(fixtureConfig(), ["cgc-styles", "cgc-tags", "cgc-post-listing"]),
  ]
  const { code, output } = await buildScratchSite(
    "post-listing-icon",
    { "index.md": "---\ntitle: Home\ntags: [fixture]\n---\nHome.\n" },
    { config: withPlugins(fixtureConfig(), entries) },
  )
  expect(code).not.toBe(0)
  expect(output).toContain(
    'cgc-post-listing: tag "fixture": unknown icon "mdi:no-such-icon": the "mdi" collection has no icon "no-such-icon"',
  )
})

// Iconify's packages run while the site builds and stay out of dist/, so this plugin carries them
// itself, at the icons library's versions (libs/icons/docs/adr/0001). Its build refuses to drift.
test("refuses to build unless it carries the icons library's dependencies, at its versions", async () => {
  const build = await buildPluginCopy("cgc-post-listing", (copy) => {
    const pkg = JSON.parse(fs.readFileSync(path.join(copy, "package.json"), "utf8"))
    pkg.dependencies["@iconify-json/mdi"] = "^1.0.0"
    fs.writeFileSync(path.join(copy, "package.json"), JSON.stringify(pkg))
  })
  expect(build.code).not.toBe(0)
  expect(build.output).toContain('"@iconify-json/mdi": "1.2.3" (here: ^1.0.0)')
  expect(build.dist).toBe(false)
})
