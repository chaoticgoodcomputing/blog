// cgc-tag-explorer's options other than the ones the fixture sets (#76), on scratch sites: the order
// of each level of tags (`tagSort`), tags that start open (`defaultState`), no counts (`showCount`),
// state kept for the visit only (`useSavedState`), and pages with no date. The content fixture keeps
// the defaults, which tree.spec.mjs and state.spec.mjs prove.
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, fixtureConfig, othersOff, withPlugins } from "../../../tests/harness/site.mjs"

const ORIGIN = "https://cgc-tag-explorer.test"

const note = (title, date, tags) =>
  `---\ntitle: ${title}\ntags: [${tags.join(", ")}]\ncreated: ${date}\nmodified: ${date}\npublished: ${date}\n---\n${title}.\n`

// Three top-level tags whose orders by count, by name and by name reversed all differ: `banana` has
// three pages, `cherry` two and `apple` one. Under `banana`, `banana/zed` has two and `banana/ant` one.
// Under `banana/zed`, "Opt Two" is the newer, and "Opt One" comes first by name.
const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nHome.\n",
  "one.md": note("Opt One", "2025-01-02", ["banana/zed", "cherry"]),
  "two.md": note("Opt Two", "2025-01-03", ["banana/zed", "cherry"]),
  "three.md": note("Opt Three", "2025-01-01", ["banana/ant", "apple"]),
}

// The explorer alone of our plugins that render, beside the engine and the cascade.
const OTHERS = othersOff(fixtureConfig(), ["cgc-styles", "cgc-tags", "cgc-tag-explorer"])
const explorerWith = (options, more = []) =>
  withPlugins(fixtureConfig(), [
    ...OTHERS,
    {
      source: "../../plugins/cgc-tag-explorer",
      enabled: true,
      options,
      layout: { position: "left", priority: 55 },
    },
    ...more,
  ])

const tagItem = (page, tag) => page.locator(`.cgc-tag-explorer__tag[data-tag="${tag}"]`)
const fold = (page, tag) =>
  tagItem(page, tag).locator(":scope > .cgc-tag-explorer__row .cgc-tag-explorer__fold")
const list = (page, tag) =>
  tagItem(page, tag).locator(":scope > .cgc-tag-explorer__children > .cgc-tag-explorer__list")
const pageTitles = (page, tag) =>
  list(page, tag).locator(":scope > .cgc-tag-explorer__page .cgc-tag-explorer__page-title")
const levels = (page) =>
  page.evaluate(() => {
    const tags = (selector) =>
      [...document.querySelectorAll(selector)].map((item) => item.dataset.tag)
    return {
      top: tags(".cgc-tag-explorer__tree > .cgc-tag-explorer__tag"),
      banana: tags(
        '[data-tag="banana"] > .cgc-tag-explorer__children > .cgc-tag-explorer__list > .cgc-tag-explorer__tag',
      ),
    }
  })

// Marks the document, so a spec can tell an SPA navigation, which keeps it, from a page load.
const markDocument = (page) => page.evaluate(() => (window.cgcSameDocument = true))
const sameDocument = (page) => page.evaluate(() => window.cgcSameDocument === true)

// One build per site per colour-scheme project, shared by that site's tests.
const scratchSite = (name, config) => {
  const site = {}
  test.beforeAll(async () => {
    test.setTimeout(180_000)
    Object.assign(site, await buildScratchSite(name, CONTENT, { config, keep: true }))
    expect(site.code, site.output).toBe(0)
  })
  test.afterAll(() => site.remove?.())
  return site
}

test.describe("tags by name, open, with no counts, remembered for the visit only", () => {
  test.describe.configure({ mode: "serial" })
  const site = scratchSite(
    "tag-explorer-options",
    explorerWith({
      tagSort: "alphabetical",
      defaultState: "open",
      showCount: false,
      useSavedState: false,
    }),
  )

  test("orders each level of tags A→Z, whatever their counts", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/`)
    expect(await levels(page)).toEqual({
      top: ["apple", "banana", "cherry"],
      banana: ["banana/ant", "banana/zed"],
    })
  })

  test("starts every tag open, its pages filled in, and shows no counts", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/`)
    const folds = page.locator(".cgc-tag-explorer__fold")
    await expect(folds).toHaveCount(5)
    for (const each of await folds.all()) await expect(each).toHaveAttribute("aria-expanded", "true")
    await expect(pageTitles(page, "banana/zed")).toHaveText(["Opt Two", "Opt One"])
    await expect(pageTitles(page, "apple")).toHaveText(["Opt Three"])
    await expect(pageTitles(page, "apple").first()).toBeVisible()
    await expect(page.locator(".cgc-tag-explorer__count")).toHaveCount(0)
  })

  test("keeps a closed tag closed across an SPA navigation, but not a reload, and stores nothing", async ({
    page,
  }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/`)
    await fold(page, "cherry").click()
    await expect(fold(page, "cherry")).toHaveAttribute("aria-expanded", "false")
    expect(await page.evaluate(() => localStorage.getItem("tagTree"))).toBeNull()
    await markDocument(page)
    await list(page, "apple").getByRole("link", { name: "Opt Three" }).click()
    await expect(page).toHaveURL(`${ORIGIN}/three`)
    expect(await sameDocument(page)).toBe(true)
    await expect(fold(page, "cherry")).toHaveAttribute("aria-expanded", "false")
    await expect(list(page, "cherry")).toBeHidden()
    await expect(fold(page, "apple")).toHaveAttribute("aria-expanded", "true")
    await page.reload()
    await expect(fold(page, "cherry")).toHaveAttribute("aria-expanded", "true")
    await expect(pageTitles(page, "cherry")).toHaveText(["Opt Two", "Opt One"])
    expect(await page.evaluate(() => localStorage.getItem("tagTree"))).toBeNull()
  })
})

test.describe("tags by name, reversed", () => {
  test.describe.configure({ mode: "serial" })
  const site = scratchSite(
    "tag-explorer-reverse",
    explorerWith({ tagSort: "alphabetical-reverse" }),
  )

  test("orders each level of tags Z→A", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/`)
    expect(await levels(page)).toEqual({
      top: ["cherry", "banana", "apple"],
      banana: ["banana/zed", "banana/ant"],
    })
  })
})

// A page has no date only where no plugin gives it one: stock created-modified-date falls back to
// the time of the build for a page with no date of its own. So this site runs without it.
test.describe("tags fewest pages first, on a site with no dates", () => {
  test.describe.configure({ mode: "serial" })
  const site = scratchSite(
    "tag-explorer-count-asc",
    explorerWith({ tagSort: "count-asc" }, [
      { source: "@quartz-community/created-modified-date", enabled: false },
    ]),
  )

  test("orders each level of tags by count, fewest first", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/`)
    expect(await levels(page)).toEqual({
      top: ["apple", "cherry", "banana"],
      banana: ["banana/ant", "banana/zed"],
    })
  })

  test("lists undated pages A→Z", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/`)
    await fold(page, "banana").click()
    await fold(page, "banana/zed").click()
    await expect(pageTitles(page, "banana/zed")).toHaveText(["Opt One", "Opt Two"])
  })
})
