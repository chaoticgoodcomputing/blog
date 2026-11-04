import type { Locator, Page } from "@playwright/test"
import { expect, test } from "../site.ts"

// test/fixtures/vault/post-listing: `Ledger One` to `Ledger Six`, posts dated the first of each
// month from January to June 2024 and under `ledger` or `ledger/accounts`, and `Locked Ledger`, a
// private page under `ledger`. Other features' notes are listed beside them, so what is asked here
// is asked of these.
// The 404 page lists every post, in a carousel; these tests ask of its newest-first listing. The home
// page lists only a few, one listing under the other (the tests at the end).
const recent = '.post-listing[data-order="recent"]'
const everything = "/nothing/at/all"

const ledger = ["Ledger Six", "Ledger Five", "Ledger Four", "Ledger Three", "Ledger Two", "Ledger One"]

// The titles of a listing's posts that are this file's own, in the order listed.
const ledgerTitles = async (page: Page) =>
  (await page.locator(`${recent} .post h3`).allInnerTexts()).filter((title) => /Ledger/.test(title))

// Every post of a listing in view, pressing its button until it has no more to show.
const expand = async (page: Page) => {
  const more = page.locator(`${recent} .more`)
  while (await more.isVisible()) await more.click()
}

test("the 404 page lists the site's posts, newest first", async ({ page }) => {
  await page.goto(everything)
  await expect(page.locator(`main .after-body ${recent}`).getByRole("heading", { level: 2 })).toHaveText("Recent Posts")
  await expand(page)
  expect(await ledgerTitles(page)).toEqual(ledger)
})

test("a private page is in no listing", async ({ page }) => {
  await page.goto(everything)
  await expand(page)
  await expect(page.locator(recent)).not.toContainText("Locked Ledger")
})

test("each post shows its title as a link to it, its date, its description and its tags as tag badges", async ({ page }) => {
  await page.goto(everything)
  await expand(page)
  const three = page.locator(`${recent} .post`, { has: page.getByRole("heading", { name: "Ledger Three" }) })
  await expect(three.getByRole("link", { name: "Ledger Three" })).toHaveAttribute("href", "/post-listing/ledger-three")
  await expect(three.locator("time")).toHaveText("Mar 01, 2024")
  await expect(three.locator("time")).toHaveAttribute("datetime", "2024-03-01T00:00:00.000Z")
  await expect(three).toContainText("Two tags, one of them the site's.")
  const badges = three.locator(".tag-badge")
  await expect(badges).toHaveText(["#ledger", "#ai"])
  await expect(badges.first()).toHaveAttribute("href", "/tags/ledger")
  await expect(badges.last()).toHaveAttribute("href", "/tags/engineering/ai")
  // A tag badge's bubble holds the tag's icon: engineering/ai's robot.
  await expect(badges.last().locator(".tag-bubble svg")).toHaveAttribute("data-icon", "mdi:robot")

  // A post with no description shows its first paragraph in its place.
  const two = page.locator(`${recent} .post`, { has: page.getByRole("heading", { name: "Ledger Two" }) })
  await expect(two.locator(".description")).toHaveText(" — Under a tag under the ledger.")
})

// The listing of `ledger`'s tag page holds this file's six posts and no others: the one long
// listing whose length is this file's to say. Every list is paged five at a time.
test("a long listing shows five posts, and five more at each press of its button", async ({ page }) => {
  await page.goto("/tags/ledger")
  const posts = page.locator(".post-listing .post")
  await expect(posts.filter({ visible: true })).toHaveCount(5)

  const more = page.locator(".post-listing .more")
  await expect(more).toHaveText("Show more")
  await more.click()
  await expect(posts.filter({ visible: true })).toHaveCount(6)
  // With nothing more to show, the button goes, and the post it showed last has the focus.
  await expect(more).toBeHidden()
  await expect(page.getByRole("link", { name: "Ledger One" })).toBeFocused()
})

test.describe("with no script", () => {
  test.use({ javaScriptEnabled: false })

  test("a long listing shows every post, and no button", async ({ page }) => {
    await page.goto("/tags/ledger")
    await expect(page.locator(".post-listing .post").filter({ visible: true })).toHaveCount(6)
    await expect(page.locator(".post-listing .more")).toBeHidden()
  })
})

test("a note's page has no listing", async ({ page }) => {
  await page.goto("/post-listing/ledger-one")
  await expect(page.locator(".post-listing")).toHaveCount(0)
})

// Whether the middle of a badge's name is where a pointer there would land on the name: not while
// it is clipped away behind its bubble.
const nameShows = (badge: Locator) =>
  badge.locator(".name").evaluate((name) => {
    const box = name.getBoundingClientRect()
    return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2) === name
  })

test.describe("on a touch screen, with no pointer that hovers", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } })

  test("a tag badge is its bubble alone until it is held, when it opens without leaving the page; a tap still goes to the tag's page", async ({ page, context }) => {
    await page.goto(everything)
    await expand(page)
    const three = page.locator(`${recent} .post`, { has: page.getByRole("heading", { name: "Ledger Three" }) })
    const badge = three.locator(".tag-badge").first()
    await badge.scrollIntoViewIfNeeded()
    const box = (await badge.boundingBox())!
    expect(Math.abs(box.width - box.height)).toBeLessThan(1)
    expect(await nameShows(badge)).toBe(false)

    // A hold: a touch kept down past the hold's time, through Chromium's own touch input.
    const touch = await context.newCDPSession(page)
    const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [at] })
    await page.waitForTimeout(700)
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
    await expect.poll(() => nameShows(badge)).toBe(true)
    expect(new URL(page.url()).pathname).toBe(everything)

    // A touch elsewhere closes it, and a tap follows it.
    await page.touchscreen.tap(5, 5)
    await expect.poll(() => nameShows(badge)).toBe(false)
    await page.touchscreen.tap(at.x, at.y)
    await expect(page).toHaveURL(/\/tags\/ledger(\?|$)/)
  })
})

// The carousel, on the 404 page: every post newest first, then the posts other posts link to most
// (test/central-posts.test.ts says how they are counted).
const inView = (page: Page) =>
  page.locator(".post-listings .track").evaluate((track) => Math.round(track.scrollLeft / track.clientWidth))

test("the 404 page's listings are a carousel: the newest posts first, then the most central", async ({ page }) => {
  await page.goto(everything)
  await expect(page.locator(".post-listing > h2")).toHaveText(["Recent Posts", "Core Posts"])
  await page.getByRole("button", { name: "Core Posts" }).click()
  await expect(page.locator('.post-listing[data-order="central"] .post h3', { hasText: "A note with backlinks" })).toBeVisible()
})

test("the arrows step through the listings, wrapping round at either end, and the dots say which is in view", async ({ page }) => {
  await page.goto(everything)
  const dots = page.locator(".post-listings .dot")
  const next = page.getByRole("button", { name: "Next listing" })
  await expect(dots.first()).toHaveAttribute("aria-current", "true")

  await next.click()
  await expect.poll(() => inView(page)).toBe(1)
  await expect(dots.last()).toHaveAttribute("aria-current", "true")
  await next.click()
  await expect.poll(() => inView(page)).toBe(0)
  await page.getByRole("button", { name: "Previous listing" }).click()
  await expect.poll(() => inView(page)).toBe(1)
  await page.getByRole("button", { name: "Recent Posts" }).click()
  await expect.poll(() => inView(page)).toBe(0)
})

test("a tag page whose posts no post links to has only the newest-first listing, and no carousel buttons", async ({ page }) => {
  await page.goto("/tags/ledger")
  await expect(page.locator(".post-listing > h2")).toHaveText(["Recent Posts"])
  await expect(page.locator(".post-listings .controls")).toHaveCount(0)
})

test("a swipe stops at the next listing however hard, and every listing is as tall as the tallest", async ({ page }) => {
  await page.goto(everything)
  const listings = page.locator(".post-listings .post-listing")
  await expect(listings.first()).toHaveCSS("scroll-snap-stop", "always")
  const heights = await listings.evaluateAll((each) => each.map((listing) => listing.getBoundingClientRect().height))
  expect(new Set(heights).size).toBe(1)
})

test.describe("with no script, the carousel", () => {
  test.use({ javaScriptEnabled: false })

  test("has no buttons, and scrolls sideways to its other listings", async ({ page }) => {
    await page.goto(everything)
    await expect(page.locator(".post-listings .controls")).toBeHidden()
    await page.locator(".post-listings .track").evaluate((track) => track.scrollTo({ left: track.clientWidth, behavior: "instant" }))
    await expect.poll(() => inView(page)).toBe(1)
  })
})

// The home page: no carousel, but the same listings one under the other, the three newest posts
// then the five most central in view, and the rest of each on asking (`postListing.pages.home`).
test("the home page shows the index note, and under it the three newest posts, then the five most central", async ({ page }) => {
  await page.goto("/")
  const note = page.locator("main .prose")
  await expect(note).toContainText("The home note.")
  await expect(page.locator(".post-listing > h2")).toHaveText(["Recent Posts", "Core Posts"])
  const central = '.post-listing[data-order="central"]'
  await expect(page.locator(`${recent} .post`).filter({ visible: true })).toHaveCount(3)
  await expect(page.locator(`${central} .post`).filter({ visible: true })).toHaveCount(5)
  await expect(page.locator(`${central} .post h3`).first()).toHaveText("A note with backlinks")
  // Both in view, one under the other, after the note, with no carousel.
  const [newest, core] = [(await page.locator(recent).boundingBox())!, (await page.locator(central).boundingBox())!]
  expect(core.y).toBeGreaterThanOrEqual(newest.y + newest.height)
  expect(
    await note.evaluate((body, after) => !!(body.compareDocumentPosition(after!) & Node.DOCUMENT_POSITION_FOLLOWING), await page.locator(".post-listings").elementHandle()),
  ).toBe(true)
  await expect(page.locator(".post-listings .controls")).toHaveCount(0)
})

test("the home page's listings show more of their posts on asking, as a tag page's do", async ({ page }) => {
  await page.goto("/")
  const posts = page.locator(`${recent} .post`)
  await page.locator(`${recent} .more`).click()
  await expect(posts.filter({ visible: true })).toHaveCount(8)
  await expand(page)
  expect(await ledgerTitles(page)).toEqual(ledger)
})
