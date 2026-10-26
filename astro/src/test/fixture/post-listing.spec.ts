import type { Page } from "@playwright/test"
import { expect, test } from "../site.ts"

// test/fixtures/vault/post-listing: `Ledger One` to `Ledger Six`, posts dated the first of each
// month from January to June 2024 and under `ledger` or `ledger/accounts`, and `Locked Ledger`, a
// private page under `ledger`. Other features' notes are listed beside them, so what is asked here
// is asked of these.
const ledger = ["Ledger Six", "Ledger Five", "Ledger Four", "Ledger Three", "Ledger Two", "Ledger One"]

// The titles of a listing's posts that are this file's own, in the order listed.
const ledgerTitles = async (page: Page) =>
  (await page.locator(".post-listing .post h3").allInnerTexts()).filter((title) => /Ledger/.test(title))

// Every post of a listing in view, the ones it starts collapsed to and the rest.
const expand = async (page: Page) => {
  const more = page.locator(".post-listing details")
  if ((await more.count()) > 0) await more.locator("summary").click()
}

test("the home page shows the index note, and under it the site's posts, newest first", async ({ page }) => {
  await page.goto("/")
  const note = page.locator("main .prose")
  await expect(note).toContainText("The home note.")
  const listing = page.locator("main .after-body .post-listing")
  await expect(listing.getByRole("heading", { level: 2 })).toHaveText("Recent Posts")
  // The listing comes after the note.
  expect(
    await note.evaluate((body, after) => !!(body.compareDocumentPosition(after!) & Node.DOCUMENT_POSITION_FOLLOWING), await listing.elementHandle()),
  ).toBe(true)

  await expand(page)
  expect(await ledgerTitles(page)).toEqual(ledger)
})

test("a private page is in no listing", async ({ page }) => {
  await page.goto("/")
  await expand(page)
  await expect(page.locator(".post-listing")).not.toContainText("Locked Ledger")
})

test("each post shows its title as a link to it, its date, its description and its tags as tag badges", async ({ page }) => {
  await page.goto("/")
  await expand(page)
  const three = page.locator(".post-listing .post", { has: page.getByRole("heading", { name: "Ledger Three" }) })
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
  const two = page.locator(".post-listing .post", { has: page.getByRole("heading", { name: "Ledger Two" }) })
  await expect(two.locator(".description")).toHaveText(" — Under a tag under the ledger.")
})

// The listing of `ledger`'s tag page holds this file's six posts and no others: the one long
// listing whose length is this file's to say.
test("a long listing starts collapsed to five posts, and the reader can show the rest", async ({ page }) => {
  await page.goto("/tags/ledger")
  const posts = page.locator(".post-listing .post")
  await expect(posts.filter({ visible: true })).toHaveCount(5)

  const more = page.locator(".post-listing summary")
  await expect(more).toHaveText("Show 1 more post")
  await more.click()
  await expect(posts.filter({ visible: true })).toHaveCount(6)
})

test.describe("with no script", () => {
  test.use({ javaScriptEnabled: false })

  test("the reader can still show the rest of a long listing", async ({ page }) => {
    await page.goto("/tags/ledger")
    const posts = page.locator(".post-listing .post")
    await expect(posts.filter({ visible: true })).toHaveCount(5)
    await page.locator(".post-listing summary").click()
    await expect(posts.filter({ visible: true })).toHaveCount(6)
  })
})

test("the 404 page lists the posts too", async ({ page }) => {
  await page.goto("/nothing/at/all")
  await expand(page)
  expect(await ledgerTitles(page)).toEqual(ledger)
})

test("a note's page has no listing", async ({ page }) => {
  await page.goto("/post-listing/ledger-one")
  await expect(page.locator(".post-listing")).toHaveCount(0)
})
