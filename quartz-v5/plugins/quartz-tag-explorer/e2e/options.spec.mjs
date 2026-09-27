// quartz-tag-explorer's options other than the ones the fixture sets (#76), on scratch sites: the order
// of each level of tags (`tagSort`), tags that start open (`defaultState`), no counts (`showCount`),
// state kept for the visit only (`useSavedState`), pages with no date, and private pages left out
// (`excludePrivate`, #85). The content fixture keeps the defaults, which tree.spec.mjs and
// state.spec.mjs prove: with `excludePrivate` off, a private page is counted and listed, with a lock.
import fs from "node:fs"
import path from "node:path"
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
const OTHERS = othersOff(fixtureConfig(), ["quartz-styles", "quartz-tags", "quartz-tag-explorer"])
const explorerWith = (options, more = []) =>
  withPlugins(fixtureConfig(), [
    ...OTHERS,
    {
      source: "@chaoticgoodcomputing/quartz-tag-explorer",
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
const scratchSite = (name, config, content = CONTENT) => {
  const site = {}
  test.beforeAll(async () => {
    test.setTimeout(180_000)
    Object.assign(site, await buildScratchSite(name, content, { config, keep: true }))
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

// The owner's review notes of 2026-09-26 (#85): private pages left out of the explorer entirely, from
// every count and every listing, and the private tags out of the tree. `private` is the private tag
// and in no `excludeTags`, so the option alone keeps it out. "Locked" also carries the public
// `shared`; "Locked deep" is under `private/work` and `hush`, which no public page carries.
// "Privateer" only shares the private tag's prefix, so it is public.
const PRIVATE_CONTENT = {
  "index.md": "---\ntitle: Home\n---\nHome.\n",
  "open.md": note("Open", "2025-01-01", ["shared"]),
  "locked.md": note("Locked", "2025-01-03", ["shared", "private"]),
  "locked-deep.md": note("Locked deep", "2025-01-02", ["private/work", "hush"]),
  "privateer.md": note("Privateer", "2025-01-01", ["privateer", "shared"]),
}

test.describe("private pages left out", () => {
  test.describe.configure({ mode: "serial" })
  const site = scratchSite(
    "tag-explorer-private",
    explorerWith({ privateTags: ["private"], excludePrivate: true, defaultState: "open" }),
    PRIVATE_CONTENT,
  )

  const counted = (page) =>
    page.locator(".cgc-tag-explorer__tag").evaluateAll((items) =>
      Object.fromEntries(
        items.map((item) => [
          item.dataset.tag,
          Number(
            item
              .querySelector(":scope > .cgc-tag-explorer__row .cgc-tag-explorer__count")
              .textContent.replace(/\D/g, ""),
          ),
        ]),
      ),
    )

  test("leaves the private tags, their subtags and the tags only private pages carry out of the tree, and private pages out of every count", async ({
    page,
  }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/`)
    expect(await counted(page)).toEqual({ shared: 2, privateer: 1 })
  })

  test("lists only public pages under a tag, with no lock", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/`)
    await expect(pageTitles(page, "shared")).toHaveText(["Open", "Privateer"])
    await expect(page.locator(".cgc-tag-explorer__tree .cgc-tag-explorer__lock")).toHaveCount(0)
  })

  test("never sends a private page to the browser", async () => {
    const index = JSON.parse(
      fs.readFileSync(path.join(site.public, "static/cgcTagExplorer.json"), "utf8"),
    )
    expect(index.pages.map(({ slug }) => slug).sort()).toEqual(["open", "privateer"])
    expect(Object.keys(index.tags).sort()).toEqual(["privateer", "shared"])
  })

  test("shows the same tree on a private page", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/locked`)
    expect(await counted(page)).toEqual({ shared: 2, privateer: 1 })
  })
})
