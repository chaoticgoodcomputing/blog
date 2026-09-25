// cgc-tag-list draws each tag's icon in its ring (#29, #71): the icon id the cgc-tags engine
// publishes, drawn when the site builds by @chaoticgoodcomputing/icons, as inline SVG painted in the
// tag's colour. The fixture's tag dictionary and icon collection are in tests/quartz.config.yaml.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"
import {
  buildScratchSite,
  fixtureConfig,
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

const ring = (page, tag) =>
  page.locator(`.cgc-tag-list__item[data-tag="${tag}"] .cgc-tag-list__ring`)

// The ring's glyph as the reader sees it: each painted shape's geometry and computed fill.
const glyphOf = (locator) =>
  locator.evaluate((ring) =>
    [...ring.querySelectorAll("svg path, svg circle, svg rect, svg polygon, svg ellipse")].map(
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
  const glyph = await glyphOf(ring(page, "writing/essays"))
  expect(glyph.map(({ d }) => d)).toEqual([mdiPath("feather")])
  // In the HTML as built, not added by a script.
  expect(emitted.read("og/tag-sibling.html")).toContain(mdiPath("feather"))
  // v4 fetched each icon from jsDelivr (`@mdi/svg`), or `/static/icons/` for its own.
  expect(requests.filter((url) => /\.svg\b|@mdi\/|iconify|\/icons\//i.test(url))).toEqual([])
})

// The fixture's own collection, tests/fixture-icons/, whose one icon is a diamond, 20px square in a
// 24px box, drawn in hard-coded magenta and cyan (tests/quartz.config.yaml).
// The fixture palette's `darkgray`, the colour of a tag with none in its lineage, in each scheme.
const DARKGRAY = { light: "rgb(78, 78, 78)", dark: "rgb(212, 212, 212)" }

test("draws a custom: icon from the site's own SVG files, in currentColor", async ({
  page,
  emitted,
  colorScheme,
}) => {
  // `mdtwin: { icon: "custom:diamond" }`, in the default tag colour
  await page.goto("/md-twin")
  const svg = ring(page, "mdtwin").locator("svg")
  await expect(svg).toHaveCount(1)
  const box = await svg.evaluate((svg) => {
    const { x, y, width, height } = svg.getBBox()
    return { x, y, width, height }
  })
  expect(box).toEqual({ x: 2, y: 2, width: 20, height: 20 })
  // Every mark takes the ring's colour, the tag's: none keeps the colour its file gave it.
  const colour = await ring(page, "mdtwin").evaluate((ring) => getComputedStyle(ring).color)
  expect(colour).toBe(DARKGRAY[colorScheme])
  const paints = await svg.evaluate((svg) =>
    [...svg.querySelectorAll("*")].flatMap((mark) => {
      const style = getComputedStyle(mark)
      return [style.fill, style.stroke].filter((paint) => paint !== "none")
    }),
  )
  expect(paints.length).toBeGreaterThan(0)
  expect(new Set(paints)).toEqual(new Set([colour]))
  expect(emitted.read("md-twin.html")).not.toMatch(/#ff00ff|#0ff|#00ffff|#123456|magenta|cyan/i)
})

test("draws a child tag with no icon of its own with its parent's", async ({ page }) => {
  // `writing: { icon: "mdi:pencil" }`, and nothing for `writing/articles`
  await page.goto("/og/tag-nested")
  const glyph = await glyphOf(ring(page, "writing/articles"))
  expect(glyph.map(({ d }) => d)).toEqual([mdiPath("pencil")])
  // A tag page lists its subtags, each with the icon it resolves to: its own, or its parent's.
  await page.goto("/tags/writing")
  expect((await glyphOf(ring(page, "writing/annotations"))).map(({ d }) => d)).toEqual([
    mdiPath("pencil"),
  ])
  expect((await glyphOf(ring(page, "writing/essays"))).map(({ d }) => d)).toEqual([
    mdiPath("feather"),
  ])
})

test("leaves the ring empty for a tag with no icon in its lineage", async ({ page }) => {
  // `markdown: { color: "light-dark(#b35f00, #de8200)" }`
  await page.goto("/plain-note")
  await expect(ring(page, "markdown")).toBeVisible()
  await expect(ring(page, "markdown").locator("*")).toHaveCount(0)
})

// The fixture palette's `secondary`, in each scheme (tests/quartz.config.yaml).
const SECONDARY = { light: "rgb(40, 75, 99)", dark: "rgb(123, 151, 170)" }

// The glyph is `currentColor`, the ring's colour, so the tag colour paints it through CSS alone, and a
// scheme switch on a loaded page repaints it with no script of this plugin's involved.
test("paints the glyph in the tag's colour, and repaints it when the reader switches scheme", async ({
  page,
  colorScheme,
}) => {
  // `writing: { color: "var(--secondary)", icon: "mdi:pencil" }`, both inherited
  await page.goto("/og/tag-nested")
  const paint = async () => (await glyphOf(ring(page, "writing/articles"))).map(({ fill }) => fill)
  await expect(ring(page, "writing/articles")).toHaveCSS("border-top-color", SECONDARY[colorScheme])
  expect(await paint()).toEqual([SECONDARY[colorScheme]])
  const other = await toggleScheme(page)
  await expect(ring(page, "writing/articles")).toHaveCSS("border-top-color", SECONDARY[other])
  expect(await paint()).toEqual([SECONDARY[other]])
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
  const pluginRoot = path.resolve(testsRoot, "../plugins/cgc-tag-list")
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-tag-list-"))
  try {
    for (const entry of ["build.mjs", "src"])
      fs.cpSync(path.join(pluginRoot, entry), path.join(copy, entry), { recursive: true })
    fs.symlinkSync(path.join(pluginRoot, "node_modules"), path.join(copy, "node_modules"))
    const pkg = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8"))
    pkg.dependencies["@iconify-json/mdi"] = "^1.0.0"
    fs.writeFileSync(path.join(copy, "package.json"), JSON.stringify(pkg))
    const build = await promisify(execFile)("node", ["build.mjs"], { cwd: copy }).then(
      () => ({ code: 0, output: "" }),
      (err) => ({ code: err.code, output: `${err.stdout}${err.stderr}` }),
    )
    expect(build.code).not.toBe(0)
    expect(build.output).toContain('"@iconify-json/mdi": "1.2.3" (here: ^1.0.0)')
    expect(fs.existsSync(path.join(copy, "dist"))).toBe(false)
  } finally {
    fs.rmSync(copy, { recursive: true, force: true })
  }
})
