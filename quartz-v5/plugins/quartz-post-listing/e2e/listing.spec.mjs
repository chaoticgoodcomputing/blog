// cgc-post-listing: v4's PostListing, as a consumer of the cgc-tags engine (#42, #44, #73). The
// index lists every post, newest first with same-date posts A→Z, and a tag page lists that tag's.
// The fixture's own pages are under content-fixture/post-listing/, tagged `listing`:
//   Newest   2024-05-01  listing, markdown
//   Zephyr   2024-04-01  listing        (its file sorts before Aster's)
//   Aster    2024-04-01  listing/sub
//   Oldest   2024-03-01  listing        (no description)
// Its options are in tests/quartz.config.yaml: the defaults, which filter a tag page's listing to
// the tag with its subtags, and the real site's first five shown. The real site's own options, the
// 404 page's listing among them, are proven in site.spec.mjs.
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"

const OURS = ["Newest", "Aster", "Zephyr", "Oldest"]

const listing = (page) => page.locator(".cgc-post-listing")
// Every listed post's title in order, the collapsed ones included.
const titles = (page) => listing(page).locator(".cgc-post-listing__link").allTextContents()
const post = (page, title) =>
  listing(page)
    .locator(".cgc-post-listing__post")
    .filter({
      has: page.locator(".cgc-post-listing__link", { hasText: new RegExp(`^${title}$`) }),
    })
const badge = (page, title, tag) =>
  post(page, title).locator(`.cgc-post-listing__tag[data-tag="${tag}"]`)
const bubble = (page, title, tag) => badge(page, title, tag).locator(".cgc-tag-bubble")

test("lists the index's posts newest first", async ({ page }) => {
  await page.goto("/")
  await expect(listing(page)).toHaveCount(1)
  await expect(listing(page).locator(".cgc-post-listing__title")).toHaveText("Recent Posts")
  const all = await titles(page)
  expect(all.filter((title) => OURS.includes(title))).toEqual(OURS)
  // Every date the listing shows runs newest first.
  const shown = await listing(page)
    .locator("time")
    .evaluateAll((times) => times.map((time) => Date.parse(time.getAttribute("datetime"))))
  expect(shown.length).toBeGreaterThan(3)
  expect(shown).toEqual([...shown].sort((a, b) => b - a))
})

// v4's tie-break was reverse-alphabetical, and in practice never ran on two dated posts (#42).
test("puts two posts of the same date in A→Z order", async ({ page }) => {
  await page.goto("/tags/listing")
  expect(await titles(page)).toEqual(OURS)
})

test("leaves private pages and tag pages out of the index", async ({ page }) => {
  await page.goto("/")
  const all = await titles(page)
  // seo/private-note is tagged `private`, seo/private-descendant `private/work`.
  expect(all).not.toContain("Private Note")
  expect(all).not.toContain("Private Descendant")
  // tags/fixture.md, a tag's description file
  expect(all).not.toContain("Fixture tag")
  expect(all).toContain("Plain Note")
})

// Quartz hands components its virtual pages too: stock folder-page's one per folder, and the 404.
// None is a post. The .mdx pages cgc-mdx builds are, since each has a source file of its own.
test("lists only pages with a source file: no folder page, no 404 page", async ({ page }) => {
  await page.goto("/")
  const paths = await listing(page)
    .locator(".cgc-post-listing__link")
    .evaluateAll((links) => links.map((link) => new URL(link.href).pathname))
  // A folder page's URL ends in a slash, as `/post-listing/` does. Only the home page's is `/`.
  expect(paths.filter((path) => path !== "/" && path.endsWith("/"))).toEqual([])
  expect(paths).not.toContain("/404")
  const all = await titles(page)
  expect(all).not.toContain("Not Found")
  expect(all).toEqual(expect.arrayContaining(["Fixture Vault", "MDX Article"]))
})

test("narrows a tag page's listing to the posts under the tag, its subtags' included", async ({
  page,
}) => {
  await page.goto("/tags/listing/sub")
  expect(await titles(page)).toEqual(["Aster"])
  await page.goto("/tags/markdown")
  expect(await titles(page)).toEqual(expect.arrayContaining(["Newest", "Plain Note"]))
  expect(await titles(page)).not.toContain("Oldest")
})

test("says so when a tag has no posts to list", async ({ page }) => {
  // Every page under `private` is left out.
  await page.goto("/tags/private")
  await expect(listing(page).locator(".cgc-post-listing__empty")).toHaveText("No posts found.")
  await expect(listing(page).locator(".cgc-post-listing__post")).toHaveCount(0)
})

// v4 rendered each tag page's listing at build time, and its router carried it from page to page.
test("keeps each page's filter through SPA navigation", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => (window.__sameDocument = true))
  const sameDocument = () => page.evaluate(() => window.__sameDocument === true)

  // The fixture's pages are older than the rest, so on the index they sit behind the toggle.
  await listing(page).locator(".cgc-post-listing__more-toggle").click()
  await badge(page, "Newest", "listing").locator(".cgc-post-listing__tag-link").click()
  await expect(page).toHaveURL(/\/tags\/listing$/)
  await expect.poll(() => titles(page)).toEqual(OURS)

  await badge(page, "Aster", "listing/sub").locator(".cgc-post-listing__tag-link").click()
  await expect(page).toHaveURL(/\/tags\/listing\/sub$/)
  await expect.poll(() => titles(page)).toEqual(["Aster"])

  await page.goBack()
  await expect(page).toHaveURL(/\/tags\/listing$/)
  await expect.poll(() => titles(page)).toEqual(OURS)
  await page.goBack()
  await expect.poll(() => titles(page)).toContain("Plain Note")
  expect(await sameDocument()).toBe(true)
})

test("shows each post's date, description and reading time, and links to it", async ({ page }) => {
  await page.goto("/tags/listing")
  const newest = post(page, "Newest")
  await expect(newest.locator(".cgc-post-listing__description")).toHaveText(
    "May 01, 2024 — The most recent post in the listing's fixture. (1 min read)",
  )
  // As in v4, a post with no description shows neither the date nor the reading time.
  await expect(post(page, "Oldest").locator(".cgc-post-listing__description")).toHaveCount(0)
  await newest.locator(".cgc-post-listing__link").click()
  await expect(page).toHaveURL(/\/post-listing\/newest$/)
  await expect(page.locator("h1.article-title")).toHaveText("Newest")
})

test("shows the first five posts, and the rest behind a toggle", async ({ page }) => {
  await page.goto("/")
  const count = (await titles(page)).length
  expect(count).toBeGreaterThan(5)
  const more = listing(page).locator(".cgc-post-listing__more")
  const summary = more.locator(".cgc-post-listing__more-toggle")
  await expect(summary).toHaveText(`Show ${count - 5} more posts`)
  await expect(listing(page).locator(".cgc-post-listing__post:visible")).toHaveCount(5)
  await summary.click()
  await expect(listing(page).locator(".cgc-post-listing__post:visible")).toHaveCount(count)
  // A short listing has no toggle.
  await page.goto("/tags/listing")
  await expect(listing(page).locator(".cgc-post-listing__more")).toHaveCount(0)
})

// Quartz 5 has no `is-index` layout condition a plugin can add, so the component keeps to the pages
// its `showOn` names, and to tag pages, wherever the site places it (docs/adr/0001).
test("renders only on the index and on tag pages", async ({ page }) => {
  for (const url of ["/", "/tags/listing", "/tags/fixture"]) {
    await page.goto(url)
    await expect(listing(page), url).toHaveCount(1)
  }
  for (const url of ["/plain-note", "/post-listing/newest", "/nested/deep-note", "/tags"]) {
    await page.goto(url)
    await expect(listing(page), url).toHaveCount(0)
  }
})

// The fixture palette's `darkgray`, the colour of a tag with none of its own (`--cgc-tags-default`).
const DEFAULT = { light: "rgb(78, 78, 78)", dark: "rgb(212, 212, 212)" }
// `markdown: { color: "light-dark(#b35f00, #de8200)" }`
const MARKDOWN = { light: "rgb(179, 95, 0)", dark: "rgb(222, 130, 0)" }

test("paints each post's tags' rims in their colours from the tag engine", async ({
  page,
  colorScheme,
}) => {
  await page.goto("/tags/listing")
  await expect(bubble(page, "Newest", "markdown")).toHaveCSS(
    "border-top-color",
    MARKDOWN[colorScheme],
  )
  await expect(bubble(page, "Newest", "listing")).toHaveCSS(
    "border-top-color",
    DEFAULT[colorScheme],
  )
  // Tags in frontmatter order, each named by its last segment, the whole tag in the bubble's tooltip.
  const tags = await post(page, "Newest")
    .locator(".cgc-post-listing__tag")
    .evaluateAll((items) => items.map((item) => item.dataset.tag))
  expect(tags).toEqual(["listing", "markdown"])
  await expect(
    badge(page, "Aster", "listing/sub").locator(".cgc-post-listing__tag-name"),
  ).toHaveText("#sub")
  await expect(bubble(page, "Aster", "listing/sub")).toHaveAttribute("title", "listing/sub")
})

test("repaints the rims when the reader switches scheme", async ({ page, colorScheme }) => {
  await page.goto("/tags/listing")
  await expect(bubble(page, "Newest", "markdown")).toHaveCSS(
    "border-top-color",
    MARKDOWN[colorScheme],
  )
  const other = await toggleScheme(page)
  await expect(bubble(page, "Newest", "markdown")).toHaveCSS("border-top-color", MARKDOWN[other])
})

test("never paints text in a tag's colour", async ({ page }) => {
  await page.goto("/tags/listing")
  const item = badge(page, "Newest", "markdown")
  await expect(item.locator(".cgc-tag-bubble")).toHaveText("")
  const text = await listing(page).evaluate((list) => getComputedStyle(list).color)
  await expect(item.locator(".cgc-post-listing__tag-name")).toHaveCSS("color", text)
})

// v4's narrow screens: only each badge's bubble, until a long press expands it to its name.
test.describe("on a narrow screen", () => {
  test.use({ viewport: { width: 400, height: 800 } })

  test("shows only each bubble, and a long press expands a badge without following its link", async ({
    page,
  }) => {
    await page.goto("/tags/listing")
    const link = badge(page, "Newest", "markdown").locator(".cgc-post-listing__tag-link")
    await expect(link.locator(".cgc-post-listing__tag-name")).toBeHidden()
    await expect(link.locator(".cgc-tag-bubble")).toBeVisible()

    await link.scrollIntoViewIfNeeded()
    const box = await link.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(700)
    await page.mouse.up()
    await expect(link.locator(".cgc-post-listing__tag-name")).toBeVisible()
    await expect(page).toHaveURL(/\/tags\/listing$/)

    // A tap anywhere else collapses it.
    await page.locator(".article-title").first().click()
    await expect(link.locator(".cgc-post-listing__tag-name")).toBeHidden()
  })

  test("follows the link on a tap", async ({ page }) => {
    await page.goto("/tags/listing")
    await badge(page, "Newest", "markdown").locator(".cgc-post-listing__tag-link").click()
    await expect(page).toHaveURL(/\/tags\/markdown$/)
  })
})
