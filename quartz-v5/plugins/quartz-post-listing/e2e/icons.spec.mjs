// cgc-post-listing draws each badge's tag icon in its bubble, as v4's PostListing did (#53 story 8,
// #73, #82): the icon id the cgc-tags engine publishes, drawn when the site builds by
// @chaoticgoodcomputing/icons, as inline SVG in tags-core's tag bubble, painted in the theme's
// `--dark`. v4 drew them with a script
// after the page loaded. The fixture's tag dictionary and icon collection are in
// tests/quartz.config.yaml, and cgc-tag-list's e2e/icons.spec.mjs proves the drawing itself.
import fs from "node:fs"
import path from "node:path"
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"
import { FIXTURE_PALETTE } from "../../../tests/harness/palette.mjs"
import {
  buildPluginCopy,
  buildScratchSite,
  fixtureConfig,
  othersOff,
  testsRoot,
  withPlugins,
} from "../../../tests/harness/site.mjs"

// MDI's own drawing of an icon, read from the installed set: the source of truth for what a bubble shows.
const MDI = JSON.parse(
  fs.readFileSync(
    path.resolve(testsRoot, "../libs/icons/node_modules/@iconify-json/mdi/icons.json"),
    "utf8",
  ),
)
const mdiPath = (name) => MDI.icons[name].body.match(/ d="([^"]+)"/)[1]

// The first listed badge for `tag`'s bubble. Three fixture pages share the title "OG card", so badges
// are found by their tag.
const bubble = (page, tag) =>
  page.locator(`.cgc-post-listing .cgc-post-listing__tag[data-tag="${tag}"] .cgc-tag-bubble`).first()

// The bubble's glyph as the reader sees it: each painted shape's geometry and computed fill.
const glyphOf = (locator) =>
  locator.evaluate((bubble) =>
    [...bubble.querySelectorAll("svg path, svg circle, svg rect, svg polygon, svg ellipse")].map(
      (shape) => ({ d: shape.getAttribute("d"), fill: getComputedStyle(shape).fill }),
    ),
  )

test("draws a tag's icon in its badge's bubble, in the page the site built, with no request", async ({
  page,
  emitted,
}) => {
  const requests = []
  page.on("request", (request) => requests.push(request.url()))
  // `writing/essays: { icon: "mdi:feather" }`, on og/tag-sibling
  await page.goto("/tags/writing")
  const glyph = await glyphOf(bubble(page, "writing/essays"))
  expect(glyph.map(({ d }) => d)).toEqual([mdiPath("feather")])
  // In the HTML as built, not added by a script.
  const html = emitted.read("tags/writing.html")
  expect(html).toMatch(/class="cgc-tag-bubble cgc-tag-bubble--badge"[^>]*><svg [^>]*class="cgc-tag-bubble__icon"/)
  expect(html).toContain(mdiPath("feather"))
  // v4 fetched each icon from jsDelivr (`@mdi/svg`), or `/static/icons/` for its own.
  expect(requests.filter((url) => /\.svg\b|@mdi\/|iconify|\/icons\//i.test(url))).toEqual([])
})

// The fixture palette's `secondary`, and its `dark`, which paints every bubble's icon (#82).
const { secondary: SECONDARY, dark: DARK } = FIXTURE_PALETTE

test("draws a child tag with no icon of its own with its parent's, dark in its tag-coloured rim", async ({
  page,
  colorScheme,
}) => {
  // `writing: { color: "var(--secondary)", icon: "mdi:pencil" }`, and nothing for `writing/articles`
  await page.goto("/tags/writing")
  const articles = bubble(page, "writing/articles")
  const glyph = async () => glyphOf(articles)
  expect((await glyph()).map(({ d }) => d)).toEqual([mdiPath("pencil")])
  await expect(articles).toHaveCSS("border-top-color", SECONDARY[colorScheme])
  expect((await glyph()).map(({ fill }) => fill)).toEqual([DARK[colorScheme]])
  // The glyph is `currentColor`, the bubble's `--dark`, so a scheme switch repaints it through CSS alone.
  const other = await toggleScheme(page)
  await expect(articles).toHaveCSS("border-top-color", SECONDARY[other])
  expect((await glyph()).map(({ fill }) => fill)).toEqual([DARK[other]])
})

test("draws a custom: icon from the site's own SVG files, in currentColor, at the bubble's size", async ({
  page,
  colorScheme,
}) => {
  // `mdtwin: { icon: "custom:diamond" }`, from tests/fixture-icons/, drawn in magenta and cyan
  await page.goto("/tags/mdtwin")
  const svg = bubble(page, "mdtwin").locator("svg.cgc-tag-bubble__icon")
  await expect(svg).toHaveCount(1)
  // v4's 18px icon, as cgc-tag-list draws it.
  await expect(svg).toHaveCSS("width", "18px")
  await expect(svg).toHaveCSS("height", "18px")
  const colour = await bubble(page, "mdtwin").evaluate((bubble) => getComputedStyle(bubble).color)
  expect(colour).toBe(DARK[colorScheme])
  const paints = await svg.evaluate((svg) =>
    [...svg.querySelectorAll("*")].flatMap((mark) => {
      const style = getComputedStyle(mark)
      return [style.fill, style.stroke].filter((paint) => paint !== "none")
    }),
  )
  expect(paints.length).toBeGreaterThan(0)
  expect(new Set(paints)).toEqual(new Set([colour]))
})

test("leaves the bubble empty for a tag with no icon in its lineage", async ({ page }) => {
  // `markdown: { color: "light-dark(#b35f00, #de8200)" }`
  await page.goto("/tags/listing")
  const markdown = bubble(page, "markdown")
  await expect(markdown).toBeVisible()
  await expect(markdown.locator("*")).toHaveCount(0)
})

// A misspelt icon id fails the build, where v4 logged a warning in the reader's console (#29, #53
// story 34), and says which tag it was. Every other plugin of ours is off, so no other plugin that
// draws icons fails the build first, in its own words.
test("fails the build on an icon its collection doesn't have", async () => {
  const entries = [
    {
      source: "@chaoticgoodcomputing/quartz-tags",
      enabled: true,
      options: { tags: { fixture: { icon: "mdi:no-such-icon" } } },
    },
    ...othersOff(fixtureConfig(), ["quartz-styles", "quartz-tags", "quartz-post-listing"]),
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
  const build = await buildPluginCopy("quartz-post-listing", (copy) => {
    const pkg = JSON.parse(fs.readFileSync(path.join(copy, "package.json"), "utf8"))
    pkg.dependencies["@iconify-json/mdi"] = "^1.0.0"
    fs.writeFileSync(path.join(copy, "package.json"), JSON.stringify(pkg))
  })
  expect(build.code).not.toBe(0)
  expect(build.output).toContain('"@iconify-json/mdi": "1.2.3" (here: ^1.0.0)')
  expect(build.dist).toBe(false)
})
