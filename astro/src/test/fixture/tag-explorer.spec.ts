import type { Page } from "@playwright/test"
import { site } from "../../site.config.ts"
import { expect, test } from "../site.ts"

// Three notes under `horticulture/seasons`: one under each of its subtags `rhythm` and `systems`,
// the fixture vault's only notes there, and one under the tag itself, which other features' notes
// also carry (share-card/pruning-roses). And a private page, the only note under
// `horticulture/off-season`, which the explorer leaves out or marks as `site.private.explorer` says.
const rhythm = "/tag-explorer/rhythm"
const systems = "/tag-explorer/systems"
const overview = "/tag-explorer/overview"

const explorer = (page: Page) => page.locator(".tag-explorer")
/** A tag's branch of the tree: its row, and the list under it. */
const branch = (page: Page, tag: string) => explorer(page).locator(`li[data-tag="${tag}"]`)
/** The button that opens and closes a tag's branch. */
const fold = (page: Page, tag: string) => explorer(page).getByRole("button", { name: tag, exact: true })

test("the tree shows every tag, nested, with the notes under each", async ({ page }) => {
  await page.goto(overview)
  const seasons = branch(page, "horticulture/seasons")
  await expect(branch(page, "horticulture").locator('li[data-tag="horticulture/seasons"]')).toBeVisible()

  // Its subtags, the most notes first and then by name, then its own notes. Each tag links to its
  // page, and says how many notes are under it. Another feature's note under the tag may follow.
  await expect(seasons.locator(":scope > ul")).toMatchAriaSnapshot(`
    - list:
      - listitem:
        - button "horticulture/seasons/rhythm"
        - link "rhythm (1)"
      - listitem:
        - button "horticulture/seasons/systems"
        - link "systems (1)"
      - listitem:
        - link "The seasons, an overview"
  `)
  await expect(seasons.getByRole("link", { name: /^seasons \(\d+\)$/ })).toHaveAttribute(
    "href",
    "/tags/horticulture/seasons",
  )
  await expect(seasons.getByRole("link", { name: "The seasons, an overview" })).toHaveAttribute("href", overview)

  // A branch opens to show what is under it.
  const rhythmNotes = branch(page, "horticulture/seasons/rhythm").getByRole("link", { name: "The rhythm of the seasons" })
  await expect(rhythmNotes).toBeHidden()
  await fold(page, "horticulture/seasons/rhythm").click()
  await expect(rhythmNotes).toBeVisible()
  await expect(rhythmNotes).toHaveAttribute("href", rhythm)
})

// Horticulture's green, as a browser computes it: light, then dark.
const horticulture = ["rgb(26, 138, 26)", "rgb(0, 255, 0)"]

for (const [index, scheme] of (["light", "dark"] as const).entries()) {
  test(`each tag is drawn with its icon in a rim of its colour, in the ${scheme} scheme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto(overview)
    const bubble = (tag: string) => branch(page, tag).locator(":scope > .row .tag-bubble")
    // Each with an icon of its own, and the colour of `horticulture`, above them.
    await expect(bubble("horticulture/seasons/rhythm").locator("svg")).toHaveAttribute("data-icon", "mdi:music-note")
    await expect(bubble("horticulture/seasons/rhythm")).toHaveCSS("border-top-color", horticulture[index]!)
    await expect(bubble("horticulture/seasons").locator("svg")).toHaveAttribute("data-icon", "mdi:weather-sunny")
    await expect(bubble("horticulture/seasons")).toHaveCSS("border-top-color", horticulture[index]!)
  })
}

test("a private page is left out, as the site configures, and so are the private tags", async ({ page }) => {
  test.skip(site.private.explorer !== "omit", "the site marks private pages in the explorer")
  await page.goto(overview)
  await expect(explorer(page)).toContainText("The seasons, an overview")
  await expect(explorer(page)).not.toContainText("A private season")
  // Nor the private tags, nor a tag only private pages carry.
  await expect(branch(page, "private")).toHaveCount(0)
  await expect(branch(page, "horticulture/off-season")).toHaveCount(0)
})

test("a private page is listed with a lock, as the site configures", async ({ page }) => {
  test.skip(site.private.explorer !== "mark", "the site leaves private pages out of the explorer")
  await page.goto(overview)
  await fold(page, "horticulture/off-season").click()
  const listed = branch(page, "horticulture/off-season").getByRole("link", { name: "A private season" })
  await expect(listed).toBeVisible()
  await expect(listed.getByRole("img", { name: "Private page" })).toBeVisible()
})

test("the page being read is shown where it is in the tree", async ({ page }) => {
  await page.goto(systems)
  const current = explorer(page).getByRole("link", { name: "Seasonal systems" })
  await expect(current).toBeVisible()
  await expect(current).toHaveAttribute("aria-current", "page")
  await expect(fold(page, "horticulture/seasons/systems")).toHaveAttribute("aria-expanded", "true")
  // A branch the page is not under stays closed.
  await expect(fold(page, "horticulture/seasons/rhythm")).toHaveAttribute("aria-expanded", "false")
})

test("on a tag's page, the tag is shown where it is in the tree", async ({ page }) => {
  await page.goto("/tags/horticulture/seasons/rhythm")
  const current = branch(page, "horticulture/seasons/rhythm").getByRole("link", { name: "rhythm (1)" })
  await expect(current).toBeVisible()
  await expect(current).toHaveAttribute("aria-current", "page")
  await expect(fold(page, "horticulture/seasons")).toHaveAttribute("aria-expanded", "true")
  await expect(fold(page, "horticulture/seasons/rhythm")).toHaveAttribute("aria-expanded", "true")
  // No note is the page being read.
  await expect(explorer(page).locator('a.note[aria-current="page"]')).toHaveCount(0)
})

test("a tag's count is drawn in a colour that reads against the page", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto(overview)
  const count = branch(page, "horticulture/seasons").locator(":scope > .row .count")
  const name = branch(page, "horticulture/seasons").locator(":scope > .row .name")
  // The tree's text colour, `--darkgray`, which its names are drawn in.
  await expect(count).toHaveCSS("color", await name.evaluate((element) => getComputedStyle(element).color))
})

test("a branch the reader opens or closes stays so on the pages they go to next", async ({ page }) => {
  await page.goto(rhythm)
  // The page is under `rhythm`, so it starts open; `systems` starts closed.
  await fold(page, "horticulture/seasons/rhythm").click()
  await fold(page, "horticulture/seasons/systems").click()

  // To another page, by a link in the tree, with no page load: a page load would wipe the mark.
  await page.evaluate(() => Object.assign(window, { samePage: true }))
  await explorer(page).getByRole("link", { name: "Seasonal systems" }).click()
  await expect(page).toHaveURL(systems)
  expect(await page.evaluate(() => "samePage" in window)).toBe(true)
  await expect(fold(page, "horticulture/seasons/systems")).toHaveAttribute("aria-expanded", "true")
  await expect(fold(page, "horticulture/seasons/rhythm")).toHaveAttribute("aria-expanded", "false")

  // Back to the page the closed branch is open on by default, and it is still closed.
  await page.goBack()
  await expect(page).toHaveURL(rhythm)
  await expect(fold(page, "horticulture/seasons/rhythm")).toHaveAttribute("aria-expanded", "false")
  await expect(explorer(page).getByRole("link", { name: "The rhythm of the seasons" })).toBeHidden()

  // And after a page load.
  await page.reload()
  await expect(fold(page, "horticulture/seasons/rhythm")).toHaveAttribute("aria-expanded", "false")
  await expect(fold(page, "horticulture/seasons/systems")).toHaveAttribute("aria-expanded", "true")
})

test.describe("on a phone", () => {
  test.use({ viewport: { width: 400, height: 800 } })

  const drawerButton = (page: Page) => page.locator("aside.left").getByRole("button", { name: "Tag Explorer" })
  const drawer = (page: Page) => page.getByRole("navigation", { name: "Tag Explorer" })

  test("the tree is a drawer, opened from a button in the header", async ({ page }) => {
    await page.goto(overview)
    await expect(drawer(page)).toBeHidden()
    // The button is in the header the left sidebar is on a phone, beside the scheme switch, over the
    // note's title.
    const button = (await drawerButton(page).boundingBox())!
    const scheme = (await page.getByRole("switch", { name: "Dark colour scheme" }).boundingBox())!
    const heading = (await page.locator("main").getByRole("heading", { level: 1 }).boundingBox())!
    expect(Math.abs(button.y + button.height / 2 - (scheme.y + scheme.height / 2))).toBeLessThan(2)
    expect(button.y + button.height).toBeLessThan(heading.y)

    await drawerButton(page).click()
    await expect(drawer(page)).toBeVisible()
    await expect(drawer(page).getByRole("link", { name: "The seasons, an overview" })).toBeInViewport()

    await drawer(page).getByRole("button", { name: "Close" }).click()
    await expect(drawer(page)).toBeHidden()
  })

  test("the drawer closes when a link in it is followed", async ({ page }) => {
    await page.goto(overview)
    await drawerButton(page).click()
    await fold(page, "horticulture/seasons/systems").click()
    await drawer(page).getByRole("link", { name: "Seasonal systems" }).click()

    await expect(page).toHaveURL(systems)
    await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText("Seasonal systems")
    await expect(drawer(page)).toBeHidden()
  })

  test("the drawer is reached, used and closed by keyboard", async ({ page }) => {
    await page.goto(overview)
    // Tab reaches the button, past the site's title, the search box and the scheme switch.
    for (let tabs = 0; tabs < 10 && !(await drawerButton(page).evaluate((el) => el === document.activeElement)); tabs++) {
      await page.keyboard.press("Tab")
    }
    await expect(drawerButton(page)).toBeFocused()

    await page.keyboard.press("Enter")
    await expect(drawer(page)).toBeVisible()
    // The focus is in the drawer, and Tab goes on through its tree.
    await expect(drawer(page).getByRole("button", { name: "Close" })).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(drawer(page).locator(".fold").first()).toBeFocused()
    // A branch opens from the keyboard.
    await fold(page, "horticulture/seasons/systems").focus()
    await page.keyboard.press("Enter")
    await expect(drawer(page).getByRole("link", { name: "Seasonal systems" })).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(drawer(page)).toBeHidden()
    await expect(drawerButton(page)).toBeFocused()
  })

  test("the drawer closes when Tab takes the focus out of it", async ({ page }) => {
    await page.goto(overview)
    await drawerButton(page).click()
    await expect(drawer(page).getByRole("button", { name: "Close" })).toBeFocused()

    // On from the drawer's Close button, through its tree, to whatever follows it.
    const inDrawer = () => page.evaluate(() => !!document.activeElement?.closest("#tag-explorer-drawer"))
    for (let tabs = 0; tabs < 100 && (await inDrawer()); tabs++) await page.keyboard.press("Tab")

    expect(await inDrawer()).toBe(false)
    await expect(page.locator("#tag-explorer-drawer")).toBeHidden()
  })
})
