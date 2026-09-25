// cgc-tag-explorer lists the site's tags as a tree in the left sidebar (v4's TagExplorer, #76): each
// tag with its icon in its tag colour, the number of pages under it and a link to its tag page, and,
// opened, its subtags and then its pages. The fixture's tag dictionary, icon collection and the
// explorer's options are in tests/quartz.config.yaml; the pages under `explorer` are
// tests/content-fixture/tag-explorer/.
import fs from "node:fs"
import path from "node:path"
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"
import { testsRoot } from "../../../tests/harness/site.mjs"

// MDI's own drawing of an icon, read from the installed set.
const MDI = JSON.parse(
  fs.readFileSync(
    path.resolve(testsRoot, "../libs/icons/node_modules/@iconify-json/mdi/icons.json"),
    "utf8",
  ),
)
const mdiPath = (name) => MDI.icons[name].body.match(/ d="([^"]+)"/)[1]

// The fixture palette, each colour as the browser computes it in each scheme.
const SECONDARY = { light: "rgb(40, 75, 99)", dark: "rgb(123, 151, 170)" }
const DARKGRAY = { light: "rgb(78, 78, 78)", dark: "rgb(212, 212, 212)" }
// `markdown: { color: "light-dark(#b35f00, #de8200)" }`
const MARKDOWN = { light: "rgb(179, 95, 0)", dark: "rgb(222, 130, 0)" }
const OTHER = { light: "dark", dark: "light" }

const tagItem = (page, tag) => page.locator(`.cgc-tag-explorer__tag[data-tag="${tag}"]`)
const row = (page, tag) => tagItem(page, tag).locator(":scope > .cgc-tag-explorer__row")
const mark = (page, tag) => row(page, tag).locator(".cgc-tag-explorer__mark")
const list = (page, tag) =>
  tagItem(page, tag).locator(":scope > .cgc-tag-explorer__children > .cgc-tag-explorer__list")

// A tag list's items as a reader reads them: a subtag by its tag, a page by its title.
const itemsOf = (locator) =>
  locator
    .locator(":scope > li")
    .evaluateAll((items) =>
      items.map(
        (item) =>
          item.dataset.tag ?? item.querySelector(".cgc-tag-explorer__page-title")?.textContent,
      ),
    )

// The mark's glyph: each painted shape's geometry and computed fill.
const glyphOf = (locator) =>
  locator.evaluate((mark) =>
    [...mark.querySelectorAll("svg path, svg circle, svg rect, svg polygon, svg ellipse")].map(
      (shape) => ({
        d: shape.getAttribute("d"),
        fill: getComputedStyle(shape).fill,
      }),
    ),
  )

test("lists the top-level tags, most pages first, each with its count", async ({ page }) => {
  await page.goto("/plain-note")
  const top = page.locator(".cgc-tag-explorer__tree > .cgc-tag-explorer__tag")
  const tags = await top.evaluateAll((items) =>
    items.map((item) => ({
      tag: item.dataset.tag,
      count: Number(
        item
          .querySelector(":scope > .cgc-tag-explorer__row .cgc-tag-explorer__count")
          .textContent.replace(/\D/g, ""),
      ),
    })),
  )
  // `writing` is there though no page carries it alone: its subtags' pages are under it.
  expect(tags.map(({ tag }) => tag)).toEqual(
    expect.arrayContaining(["fixture", "writing", "explorer", "markdown", "mdtwin"]),
  )
  // v4's `count-desc`, ties A→Z.
  const sorted = [...tags].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  expect(tags).toEqual(sorted)
  // Newest, Alpha, Bravo, Oldest and Locked, and Nested under `explorer/nested`: each page once.
  expect(tags.find(({ tag }) => tag === "explorer").count).toBe(6)
})

test("leaves out an excluded tag and its subtags, but not a tag that only shares its prefix", async ({
  page,
}) => {
  await page.goto("/plain-note")
  const explorer = page.locator(".cgc-tag-explorer")
  // `excludeTags: [private, secret]`
  for (const tag of ["private", "private/work", "secret"]) {
    await expect(explorer.locator(`[data-tag="${tag}"]`), tag).toHaveCount(0)
  }
  await expect(tagItem(page, "privateer")).toHaveCount(1)
})

test("renders the tree of tags into the page as built", async ({ emitted }) => {
  const html = emitted.read("plain-note.html")
  expect(html).toContain('class="cgc-tag-explorer__tag" data-tag="writing/essays"')
  expect(html).toContain(mdiPath("feather"))
})

test("links each tag to its tag page", async ({ page }) => {
  await page.goto("/plain-note")
  await row(page, "fixture").locator(".cgc-tag-explorer__link").click()
  await expect(page).toHaveURL(/\/tags\/fixture$/)
})

test("draws each tag's icon in its tag colour, and never its name", async ({
  page,
  colorScheme,
}) => {
  await page.goto("/plain-note")
  // `writing: { color: "var(--secondary)", icon: "mdi:pencil" }`
  await expect(mark(page, "writing")).toHaveCSS("color", SECONDARY[colorScheme])
  expect(await glyphOf(mark(page, "writing"))).toEqual([
    { d: mdiPath("pencil"), fill: SECONDARY[colorScheme] },
  ])
  // `mdtwin: { icon: "custom:diamond" }`, the fixture's own collection, in the default colour.
  await expect(mark(page, "mdtwin")).toHaveCSS("color", DARKGRAY[colorScheme])
  const diamond = await glyphOf(mark(page, "mdtwin"))
  expect(diamond.length).toBeGreaterThan(0)
  expect(new Set(diamond.map(({ fill }) => fill))).toEqual(new Set([DARKGRAY[colorScheme]]))
  // `fixture: { color: "#0a7d32" }` has no icon: its mark is a dot in its colour.
  await expect(mark(page, "fixture")).toHaveCSS("background-color", "rgb(10, 125, 50)")
  await expect(mark(page, "fixture").locator("svg")).toHaveCount(0)
  // The colour paints marks, not text.
  const name = row(page, "fixture").locator(".cgc-tag-explorer__name")
  await expect(name).toHaveText("fixture")
  expect(await name.evaluate((el) => getComputedStyle(el).color)).not.toBe("rgb(10, 125, 50)")
})

test("repaints the tag colours when the scheme switches", async ({ page, colorScheme }) => {
  await page.goto("/plain-note")
  await expect(mark(page, "markdown")).toHaveCSS("background-color", MARKDOWN[colorScheme])
  await toggleScheme(page)
  const other = OTHER[colorScheme]
  await expect(mark(page, "markdown")).toHaveCSS("background-color", MARKDOWN[other])
  await expect(mark(page, "writing")).toHaveCSS("color", SECONDARY[other])
  expect(await glyphOf(mark(page, "writing"))).toEqual([
    { d: mdiPath("pencil"), fill: SECONDARY[other] },
  ])
})

test("opens a tag to its subtags, then its pages: public first, newest first, A→Z on one day", async ({
  page,
}) => {
  await page.goto("/plain-note")
  await expect(list(page, "explorer")).toBeHidden()
  await row(page, "explorer").locator(".cgc-tag-explorer__fold").click()
  await expect(list(page, "explorer")).toBeVisible()
  await expect
    .poll(() => itemsOf(list(page, "explorer")))
    .toEqual([
      "explorer/nested",
      "Explorer Newest",
      "Explorer Alpha",
      "Explorer Bravo",
      "Explorer Oldest",
      "Explorer Locked",
    ])
  // Locked is the newest, but private (`privateTags: [private, secret]`): last, with a lock.
  const pages = list(page, "explorer").locator(":scope > .cgc-tag-explorer__page")
  const locked = pages.filter({ hasText: "Locked" })
  expect(await glyphOf(locked.locator(".cgc-tag-explorer__lock"))).toEqual([
    { d: mdiPath("lock"), fill: expect.any(String) },
  ])
  await expect(pages.locator(".cgc-tag-explorer__lock")).toHaveCount(1)
  // Opening a subtag shows its own pages.
  await row(page, "explorer/nested").locator(".cgc-tag-explorer__fold").click()
  await expect.poll(() => itemsOf(list(page, "explorer/nested"))).toEqual(["Explorer Nested"])
  // Each page links to itself.
  await pages.filter({ hasText: "Alpha" }).getByRole("link").click()
  await expect(page).toHaveURL(/\/tag-explorer\/alpha$/)
})

test("marks the page being read", async ({ page }) => {
  await page.goto("/tag-explorer/alpha")
  await row(page, "explorer").locator(".cgc-tag-explorer__fold").click()
  const links = list(page, "explorer").locator(".cgc-tag-explorer__page-link")
  await expect(links.filter({ hasText: "Alpha" })).toHaveAttribute("aria-current", "page")
  await expect(links.filter({ hasText: "Bravo" })).not.toHaveAttribute("aria-current", /.*/)
})

test("shows every tag of the corpus on a tag page too", async ({ page }) => {
  await page.goto("/tags/writing")
  await expect(tagItem(page, "explorer")).toHaveCount(1)
  await expect(tagItem(page, "writing/essays")).toHaveCount(1)
})
