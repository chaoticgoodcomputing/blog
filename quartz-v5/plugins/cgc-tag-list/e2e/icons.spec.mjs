// cgc-tag-list draws each tag's icon in its bubble (#29, #71, #82): the icon id the cgc-tags engine
// publishes, drawn when the site builds by @chaoticgoodcomputing/icons, as inline SVG painted in the
// theme's `--dark`, as tags-core's bubble paints every icon. The fixture's tag dictionary and icon collection are in tests/quartz.config.yaml.
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
import { ICON_REQUEST, bubble } from "./bubble.mjs"

// The fixture palette's `secondary`, and its `dark`, which paints every bubble's icon (#82).
const { secondary: SECONDARY, dark: DARK } = FIXTURE_PALETTE

// MDI's own drawing of an icon, read from the installed set: the source of truth for what a bubble shows.
const MDI = JSON.parse(
  fs.readFileSync(
    path.resolve(testsRoot, "../libs/icons/node_modules/@iconify-json/mdi/icons.json"),
    "utf8",
  ),
)
const mdiPath = (name) => MDI.icons[name].body.match(/ d="([^"]+)"/)[1]

// The bubble's glyph as the reader sees it: each painted shape's geometry and computed fill.
const glyphOf = (locator) =>
  locator.evaluate((bubble) =>
    [...bubble.querySelectorAll("svg path, svg circle, svg rect, svg polygon, svg ellipse")].map(
      (shape) => ({ d: shape.getAttribute("d"), fill: getComputedStyle(shape).fill }),
    ),
  )

test("draws an mdi: icon inline, from the page the site built, with no request", async ({
  page,
  emitted,
}) => {
  const requests = []
  page.on("request", (request) => requests.push(request.url()))
  // `writing/essays: { icon: "mdi:feather" }`
  await page.goto("/og/tag-sibling")
  const glyph = await glyphOf(bubble(page, "writing/essays"))
  expect(glyph.map(({ d }) => d)).toEqual([mdiPath("feather")])
  // In the HTML as built, not added by a script.
  expect(emitted.read("og/tag-sibling.html")).toContain(mdiPath("feather"))
  expect(requests.filter((url) => ICON_REQUEST.test(url))).toEqual([])
})

// The fixture's own collection, tests/fixture-icons/, whose one icon is a diamond, 20px square in a
// 24px box, drawn in hard-coded magenta and cyan (tests/quartz.config.yaml).

test("draws a custom: icon from the site's own SVG files, in currentColor", async ({
  page,
  emitted,
  colorScheme,
}) => {
  const requests = []
  page.on("request", (request) => requests.push(request.url()))
  // `mdtwin: { icon: "custom:diamond" }`
  await page.goto("/md-twin")
  const svg = bubble(page, "mdtwin").locator("svg")
  await expect(svg).toHaveCount(1)
  const box = await svg.evaluate((svg) => {
    const { x, y, width, height } = svg.getBBox()
    return { x, y, width, height }
  })
  expect(box).toEqual({ x: 2, y: 2, width: 20, height: 20 })
  // Every mark takes the bubble's colour, the theme's `--dark`: none keeps the colour its file gave it.
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
  const html = emitted.read("md-twin.html")
  expect(html).not.toMatch(/#ff00ff|#0ff|#00ffff|#123456|magenta|cyan/i)
  // In the HTML as built, not fetched and added by a script.
  const d = await svg.locator("path").getAttribute("d")
  expect(d).toBeTruthy()
  expect(html).toContain(`d="${d}"`)
  expect(requests.filter((url) => ICON_REQUEST.test(url))).toEqual([])
})

test("draws a child tag with no icon of its own with its parent's", async ({ page }) => {
  // `writing: { icon: "mdi:pencil" }`, and nothing for `writing/articles`
  await page.goto("/og/tag-nested")
  const glyph = await glyphOf(bubble(page, "writing/articles"))
  expect(glyph.map(({ d }) => d)).toEqual([mdiPath("pencil")])
  // A tag page lists its subtags, each with the icon it resolves to: its own, or its parent's.
  await page.goto("/tags/writing")
  expect((await glyphOf(bubble(page, "writing/annotations"))).map(({ d }) => d)).toEqual([
    mdiPath("pencil"),
  ])
  expect((await glyphOf(bubble(page, "writing/essays"))).map(({ d }) => d)).toEqual([
    mdiPath("feather"),
  ])
})

test("leaves the bubble empty for a tag with no icon in its lineage", async ({ page }) => {
  // `markdown: { color: "light-dark(#b35f00, #de8200)" }`
  await page.goto("/plain-note")
  await expect(bubble(page, "markdown")).toBeVisible()
  await expect(bubble(page, "markdown").locator("*")).toHaveCount(0)
})

// The glyph is `currentColor`, the bubble's colour, which is the theme's `--dark` and never the tag's
// (#82): the tag colour paints only the rim. A scheme switch on a loaded page repaints both through CSS
// alone, with no script of this plugin's involved.
test("paints the glyph dark and the rim in the tag's colour, and repaints both when the reader switches scheme", async ({
  page,
  colorScheme,
}) => {
  // `writing: { color: "var(--secondary)", icon: "mdi:pencil" }`, both inherited
  await page.goto("/og/tag-nested")
  const paint = async () =>
    (await glyphOf(bubble(page, "writing/articles"))).map(({ fill }) => fill)
  await expect(bubble(page, "writing/articles")).toHaveCSS(
    "border-top-color",
    SECONDARY[colorScheme],
  )
  expect(await paint()).toEqual([DARK[colorScheme]])
  const other = await toggleScheme(page)
  await expect(bubble(page, "writing/articles")).toHaveCSS("border-top-color", SECONDARY[other])
  expect(await paint()).toEqual([DARK[other]])
})

// A misspelt icon id fails the build, where v4 logged a warning in the reader's console (#29, #53
// story 34). cgc-tags checks only that an id is `prefix:name`; the plugin drawing it knows whether it
// exists. Scratch sites: the content fixture must build.
const HOME = { "index.md": "---\ntitle: Home\ntags: [fixture]\n---\nHome.\n" }
const TAG_LIST = {
  source: "../../plugins/cgc-tag-list",
  enabled: true,
  layout: { position: "beforeBody", priority: 30 },
}
// Every other plugin of ours is off in these builds. Another that draws icons (cgc-tag-explorer,
// #76) would otherwise fail the build first, in its own words, and an entry that aliases the
// fixture's `&iconCollections` anchor would lose it when the entry below replaces this one.
const OTHERS = othersOff(fixtureConfig(), ["cgc-styles", "cgc-tags", "cgc-tag-list"])
const FAILURES = [
  {
    name: "an icon its collection doesn't have",
    icon: "mdi:no-such-icon",
    error:
      'cgc-tag-list: tag "fixture": unknown icon "mdi:no-such-icon": the "mdi" collection has no icon "no-such-icon"',
  },
  {
    name: "an icon the site's own collection doesn't have",
    icon: "custom:diamnod",
    error:
      'cgc-tag-list: tag "fixture": unknown icon "custom:diamnod": the "custom" collection has no icon "diamnod"',
  },
  {
    name: "an icon from a collection that isn't there",
    icon: "fixture:diamond",
    error:
      'cgc-tag-list: tag "fixture": unknown icon "fixture:diamond": no icon collection "fixture" is installed or configured ("custom")',
  },
  {
    name: "a collection directory that isn't there",
    icon: "custom:diamond",
    iconCollections: { custom: "../no-such-icons" },
    error:
      'cgc-tag-list: tag "fixture": icon collection "custom": "../no-such-icons" is not a directory',
  },
]
for (const { name, icon, iconCollections, error } of FAILURES) {
  test(`fails the build on ${name}`, async () => {
    const entries = [
      { source: "../../plugins/cgc-tags", enabled: true, options: { tags: { fixture: { icon } } } },
    ]
    if (iconCollections) entries.push({ ...TAG_LIST, options: { iconCollections } })
    entries.push(...OTHERS)
    const { code, output } = await buildScratchSite("tag-list-icon", HOME, {
      config: withPlugins(fixtureConfig(), entries),
    })
    expect(code).not.toBe(0)
    expect(output).toContain(error)
  })
}

// Iconify's packages run while the site builds and stay out of dist/, so this plugin carries them
// itself, at the icons library's versions (libs/icons/docs/adr/0001). Its build refuses to drift.
test("refuses to build unless it carries the icons library's dependencies, at its versions", async () => {
  const build = await buildPluginCopy("cgc-tag-list", (copy) => {
    const pkg = JSON.parse(fs.readFileSync(path.join(copy, "package.json"), "utf8"))
    pkg.dependencies["@iconify-json/mdi"] = "^1.0.0"
    fs.writeFileSync(path.join(copy, "package.json"), JSON.stringify(pkg))
  })
  expect(build.code).not.toBe(0)
  expect(build.output).toContain('"@iconify-json/mdi": "1.2.3" (here: ^1.0.0)')
  expect(build.dist).toBe(false)
})
