// cgc-tag-list: v4's TagList, as a consumer of the cgc-tags engine (#20, #31, #69). Each of a page's
// tags is a badge whose ring is painted in the tag's colour, read from the engine's `--cgc-tag-*`
// custom properties. The fixture's tag dictionary is in tests/quartz.config.yaml.
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"

const ring = (page, tag) =>
  page.locator(`.cgc-tag-list__item[data-tag="${tag}"] .cgc-tag-list__ring`)

test("paints a badge's ring in its tag's colour", async ({ page }) => {
  await page.goto("/plain-note")
  // `fixture: { color: "#0a7d32" }`
  await expect(ring(page, "fixture")).toHaveCSS("border-top-color", "rgb(10, 125, 50)")
})

// The fixture palette's `secondary`, in each scheme (tests/quartz.config.yaml).
const SECONDARY = { light: "rgb(40, 75, 99)", dark: "rgb(123, 151, 170)" }

test("rings a child tag with no colour of its own in its parent's", async ({
  page,
  colorScheme,
}) => {
  // `writing: { color: "var(--secondary)" }`, and nothing for `writing/essays`.
  await page.goto("/og/tag-sibling")
  await expect(ring(page, "writing/essays")).toHaveCSS("border-top-color", SECONDARY[colorScheme])
})

// A colour follows the scheme through CSS alone, so a switch on a loaded page repaints every ring,
// with no script of this plugin's involved (ADR-0003's *the scheme changes under a loaded page*).
const SCHEMED = [
  // `markdown: { color: "light-dark(#b35f00, #de8200)" }`
  {
    url: "/plain-note",
    tag: "markdown",
    colour: { light: "rgb(179, 95, 0)", dark: "rgb(222, 130, 0)" },
  },
  // `writing: { color: "var(--secondary)" }`, inherited
  { url: "/og/tag-sibling", tag: "writing/essays", colour: SECONDARY },
]

for (const { url, tag, colour } of SCHEMED) {
  test(`repaints ${tag}'s ring when the reader switches scheme`, async ({ page, colorScheme }) => {
    await page.goto(url)
    await expect(ring(page, tag)).toHaveCSS("border-top-color", colour[colorScheme])
    const other = await toggleScheme(page)
    await expect(ring(page, tag)).toHaveCSS("border-top-color", colour[other])
  })
}

test("never paints text in a tag's colour", async ({ page }) => {
  await page.goto("/plain-note")
  const item = page.locator('.cgc-tag-list__item[data-tag="fixture"]')
  // The ring holds no text, and the link's text keeps the colour of the text around the list.
  await expect(item.locator(".cgc-tag-list__ring")).toHaveText("")
  const text = await page
    .locator(".cgc-tag-list")
    .evaluate((list) => getComputedStyle(list.parentElement).color)
  expect(text).not.toBe("rgb(10, 125, 50)")
  await expect(item.locator(".cgc-tag-list__name")).toHaveCSS("color", text)
})

// The link is followed through SPA navigation, and the engine's stylesheet stays on the page.
test("names each tag by its last segment and links to its tag page", async ({
  page,
  colorScheme,
}) => {
  await page.goto("/og/tag-sibling")
  const item = page.locator('.cgc-tag-list__item[data-tag="writing/essays"]')
  await expect(item.locator(".cgc-tag-list__name")).toHaveText("essays")
  await expect(item.locator(".cgc-tag-list__ring")).toHaveAttribute("title", "writing/essays")
  await item.locator(".cgc-tag-list__link").click()
  await expect(page).toHaveURL(/\/tags\/writing\/essays$/)
  await expect(page.locator("h1.article-title")).toContainText("essays")
  // The tag page lists its parent, still ringed in `var(--secondary)`.
  await expect(ring(page, "writing")).toHaveCSS("border-top-color", SECONDARY[colorScheme])
})

// v4's counts are cumulative: a tag counts the pages under any of its subtags too.
test("counts the pages under each tag", async ({ page }) => {
  await page.goto("/seo/private-note")
  // seo/private-note, and seo/private-descendant under `private/work`
  await expect(
    page.locator('.cgc-tag-list__item[data-tag="private"] .cgc-tag-list__count'),
  ).toHaveText("(2)")
})

// v4's tags layout: a tag page's list is the tag's parent, then its subtags, in order.
test("lists a tag page's parent and subtags", async ({ page }) => {
  const tagsOf = (list) =>
    list
      .locator(".cgc-tag-list__item")
      .evaluateAll((items) => items.map((item) => item.dataset.tag))
  await page.goto("/tags/writing")
  const list = page.locator(".cgc-tag-list")
  expect(await tagsOf(list)).toEqual(["writing/annotations", "writing/articles", "writing/essays"])
  // og/tag-nested, og/tag-sibling, tag-engine/annotated and tag-engine/most-specific
  await page.goto("/tags/writing/essays")
  expect(await tagsOf(list)).toEqual(["writing"])
  await expect(list.locator(".cgc-tag-list__count")).toHaveText("(4)")
})

// v4's narrow screens: only each badge's ring, until a long press expands it to its name and count.
test.describe("on a narrow screen", () => {
  test.use({ viewport: { width: 400, height: 800 } })

  test("shows only each ring, and a long press expands a badge without following its link", async ({
    page,
  }) => {
    await page.goto("/plain-note")
    const link = page.locator('.cgc-tag-list__item[data-tag="fixture"] .cgc-tag-list__link')
    await expect(link.locator(".cgc-tag-list__name")).toBeHidden()
    await expect(link.locator(".cgc-tag-list__ring")).toBeVisible()

    const box = await link.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(700)
    await page.mouse.up()
    await expect(link.locator(".cgc-tag-list__name")).toBeVisible()
    await expect(link.locator(".cgc-tag-list__count")).toBeVisible()
    await expect(page).toHaveURL(/\/plain-note$/)

    // A tap anywhere else collapses it.
    await page.locator(".article-title").first().click()
    await expect(link.locator(".cgc-tag-list__name")).toBeHidden()
  })

  test("follows the link on a tap", async ({ page }) => {
    await page.goto("/plain-note")
    await page.locator('.cgc-tag-list__item[data-tag="fixture"] .cgc-tag-list__link').click()
    await expect(page).toHaveURL(/\/tags\/fixture$/)
  })
})
