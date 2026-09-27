// cgc-tag-explorer on the real site (#76), proven on a scratch site built from the site config, with
// pages carrying the vault's tags: v4's left-sidebar navigation, private pages and `private` left out
// altogether (the owner's review notes, #85), the site's own icons, a drawer at the site's
// 1000px breakpoint that leaves a phone's header alone, the 404 page at any depth, v4's PostHog label
// for a navigation from it, and the plugin note (#48).
import fs from "node:fs"
import path from "node:path"
import { test, expect, routeSite, schemeOf } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig, testsRoot } from "../../../tests/harness/site.mjs"
import { postHogStandIn } from "../../../tests/harness/analytics.mjs"

// The site is served at its own `baseUrl`, where Quartz points its absolute URLs.
const ORIGIN = "https://blog.chaoticgood.computer"
const VAULT = path.resolve(testsRoot, "../../content/public")

const note = (title, date, tags) =>
  `---\ntitle: ${title}\ntags: [${tags.join(", ")}]\ncreated: ${date}\nmodified: ${date}\npublished: ${date}\n---\n${title}.\n`

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  "content/notes/game-log.md": note("Game log", "2025-02-01", ["projects/games", "engineering/ai"]),
  "content/notes/old-game.md": note("Old game", "2024-01-01", ["projects/games"]),
  // Private, and the newest, under a public tag: left out, of the listing and of the count.
  "content/notes/game-plans.md": note("Game plans", "2025-03-01", ["private", "projects/games"]),
  // The plugin note, as the vault has it: a symlink to the README (#48).
  "plugins/quartz-tag-explorer.md": fs.readFileSync(
    path.join(VAULT, "plugins/quartz-tag-explorer.md"),
    "utf8",
  ),
}

const tagItem = (page, tag) => page.locator(`.cgc-tag-explorer__tag[data-tag="${tag}"]`)
const fold = (page, tag) =>
  tagItem(page, tag).locator(":scope > .cgc-tag-explorer__row .cgc-tag-explorer__fold")
const list = (page, tag) =>
  tagItem(page, tag).locator(":scope > .cgc-tag-explorer__children > .cgc-tag-explorer__list")

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  test.setTimeout(180_000)
  site = await buildScratchSite("tag-explorer-site", CONTENT, {
    config: siteConfig({ offline: true }),
    keep: true,
  })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

test("navigates the site by tag from the left sidebar, `private` left out", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/game-log`)
  const explorer = page.locator(".left.sidebar .cgc-tag-explorer")
  await expect(explorer.locator(".cgc-tag-explorer__title")).toHaveText("Tag Explorer")
  await expect(explorer.locator('[data-tag="private"]')).toHaveCount(0)
  const top = await explorer
    .locator(".cgc-tag-explorer__tree > .cgc-tag-explorer__tag")
    .evaluateAll((items) => items.map((item) => item.dataset.tag))
  expect(top).toEqual(["projects", "engineering"])
  // `projects/games: { icon: custom:d20 }`, from the site's own collection, in its tag's colour.
  await fold(page, "projects").click()
  const mark = tagItem(page, "projects/games").locator(
    ":scope > .cgc-tag-explorer__row .cgc-tag-explorer__mark",
  )
  const drawn = await mark.evaluate((mark) => {
    const svg = mark.querySelector("svg")
    const { width, height } = svg.getBBox()
    const paints = [...svg.querySelectorAll("*")].flatMap((shape) => {
      const style = getComputedStyle(shape)
      return [style.fill, style.stroke].filter((paint) => paint !== "none")
    })
    return {
      area: width * height,
      paints: [...new Set(paints)],
      colour: getComputedStyle(mark).color,
    }
  })
  expect(drawn.area).toBeGreaterThan(0)
  expect(drawn.paints).toEqual([drawn.colour])
})

// v4 listed a private page under its public tags, last, with a lock. The site now leaves it out, as
// the owner's review notes decided (#85).
test("leaves a private page out of its public tag's listing and count", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  await fold(page, "projects").click()
  await expect(
    tagItem(page, "projects/games").locator(
      ":scope > .cgc-tag-explorer__row .cgc-tag-explorer__count",
    ),
  ).toHaveText("(2)")
  await fold(page, "projects/games").click()
  const pages = list(page, "projects/games").locator(":scope > .cgc-tag-explorer__page")
  await expect(pages.locator(".cgc-tag-explorer__page-title")).toHaveText(["Game log", "Old game"])
  await expect(page.locator(".cgc-tag-explorer__tree .cgc-tag-explorer__lock")).toHaveCount(0)
})

// At the site's own mobile query, `max-width: 1000px`, where site-styles makes the left sidebar a row.
test("is a drawer at and below the site's 1000px breakpoint", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  const toggle = page.locator(".cgc-tag-explorer__toggle")
  const panel = page.locator(".cgc-tag-explorer__panel")
  await page.setViewportSize({ width: 1001, height: 800 })
  await page.goto(`${ORIGIN}/content/notes/game-log`)
  await expect(toggle).toBeHidden()
  await expect(panel).toBeVisible()
  await page.setViewportSize({ width: 1000, height: 800 })
  await expect(toggle).toBeVisible()
  await expect(panel).toBeHidden()
  await toggle.click()
  await expect(panel).toBeVisible()
  await expect(panel).toBeInViewport({ ratio: 1 })
})

// On a phone the left sidebar is a row, and the site's title, search and scheme toggle fill it: the
// explorer, its caret, panel and backdrop fixed to the window, takes no room from it.
test("takes no room from the phone's header row", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  for (const width of [360, 390, 414, 430]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto(`${ORIGIN}/content/notes/game-log`)
    const box = await page.locator(".left.sidebar > .cgc-tag-explorer").boundingBox()
    expect(box?.width ?? 0, `${width}px`).toBe(0)
  }
})

// Where the site's own row fits, every control in it stays within reach with the explorer on. Below
// 414px the row, in the site's typeface, is wider than the page with or without the explorer, which
// is the site's to fix; this scratch site is built offline, in a fallback face, so it can't show it.
for (const width of [414, 430]) {
  test(`leaves the search and scheme toggle within reach on a ${width}px phone`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 })
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/content/notes/game-log`)
    const controls = {
      toggle: page.locator(".cgc-tag-explorer__toggle"),
      search: page.locator(".left.sidebar .search-button"),
      scheme: page.locator(".left.sidebar .darkmode"),
    }
    for (const [name, control] of Object.entries(controls)) {
      await expect(control, name).toBeInViewport()
      // A tap at its centre lands on it.
      const hit = await control.evaluate((element) => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return element.contains(document.elementFromPoint(x + width / 2, y + height / 2))
      })
      expect(hit, name).toBe(true)
    }
    // And each control still works.
    await controls.toggle.click()
    await expect(page.locator(".cgc-tag-explorer__panel")).toBeInViewport({ ratio: 1 })
    await page.keyboard.press("Escape")
    await expect(page.locator(".cgc-tag-explorer__panel")).toBeHidden()
    const before = await schemeOf(page)
    await controls.scheme.click()
    await expect.poll(() => schemeOf(page)).not.toBe(before)
  })
}

// The 404 page is in the site's shell, explorer and all, and served at whatever depth the missing
// address has: its links start from the site's root, not from where the reader happens to be.
test("works on the 404 page at any depth", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await routeSite(page, site.public, ORIGIN)
  const response = await page.goto(`${ORIGIN}/content/notes/no-such-page`)
  expect(response.status()).toBe(404)
  await fold(page, "projects").click()
  await fold(page, "projects/games").click()
  await expect(list(page, "projects/games").locator(".cgc-tag-explorer__page-title")).toHaveText([
    "Game log",
    "Old game",
  ])
  await list(page, "projects/games").getByRole("link", { name: "Old game" }).click()
  await expect(page).toHaveURL(`${ORIGIN}/content/notes/old-game`)
  await expect(page.locator("h1.article-title")).toHaveText("Old game")
  await page.goto(`${ORIGIN}/tags/projects/games/no-such-tag`)
  await tagItem(page, "projects")
    .locator(":scope > .cgc-tag-explorer__row .cgc-tag-explorer__link")
    .click()
  await expect(page).toHaveURL(`${ORIGIN}/tags/projects`)
  await expect(page.locator("h1.article-title")).toContainText("projects")
})

// v4 labelled a navigation from the tag explorer `tag-explorer` (FORK-LEDGER Spa.inline.ts).
test("labels a navigation from it as v4 did", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  const posthog = await postHogStandIn(page, "https://app.posthog.com")
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  await fold(page, "engineering").click()
  await fold(page, "engineering/ai").click()
  await list(page, "engineering/ai").getByRole("link", { name: "Game log" }).click()
  await expect(page).toHaveURL(`${ORIGIN}/content/notes/game-log`)
  const navigations = () =>
    posthog.captures
      .filter(({ event }) => event === "navigation")
      .map(({ properties }) => properties.source)
  await expect.poll(navigations).toEqual(["tag-explorer"])
})

test("the plugin note renders at /plugins/quartz-tag-explorer, with absolute links only", async ({
  page,
}) => {
  expect(fs.lstatSync(path.join(VAULT, "plugins/quartz-tag-explorer.md")).isSymbolicLink()).toBe(true)
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/plugins/quartz-tag-explorer`)
  await expect(page).toHaveTitle("quartz-tag-explorer | Spencer Elkington")
  // Every link the README writes; a heading's own anchor is Quartz's.
  const hrefs = await page
    .locator("article a:not([role=anchor])")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")))
  expect(hrefs.length).toBeGreaterThan(0)
  expect(hrefs.filter((href) => !/^https:\/\//.test(href))).toEqual([])
})
