import { expect, expectAt, test } from "../site.ts"

// The fixture vault's tags: `ledger`, with a description note, `tags/ledger.md`, and six posts under
// it or under `ledger/accounts` (test/fixtures/vault/post-listing); `ledger/sealed`, which only a
// private page carries (tag-pages/sealed.md); and `unworn`, with a description note and no note
// that carries it.

test("a tag's page shows its description note, then the posts under the tag", async ({ page }) => {
  const response = await page.goto("/tags/ledger")
  expect(response!.status()).toBe(200)
  await expect(page.locator("main header").getByRole("heading", { level: 1 })).toHaveText("#ledger")
  await expect(page.locator("main .prose")).toContainText("description note: everything written in the ledger")
  await expect(page.locator('head meta[name="description"]')).toHaveAttribute("content", "What the ledger keeps.")

  const listing = page.locator("main .after-body .post-listing")
  await listing.locator("summary").click()
  await expect(listing.locator(".post h3")).toHaveText([
    "Ledger Six",
    "Ledger Five",
    "Ledger Four",
    "Ledger Three",
    "Ledger Two",
    "Ledger One",
  ])
})

test("a tag page links to its subtags as tag badges, each with how many posts are under it", async ({ page }) => {
  await page.goto("/tags/ledger")
  const tags = page.locator("main .tag-page-tags .tag-badge")
  await expect(tags).toHaveText([/^#accounts\s*\(2\)$/, /^#sealed\s*\(0\)$/])
  await expect(tags.first()).toHaveAttribute("href", "/tags/ledger/accounts")
})

test("a subtag's page lists only the posts under it", async ({ page }) => {
  await page.goto("/tags/ledger/accounts")
  // No description note: the page is titled by the tag's name.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("#accounts")
  await expect(page.locator(".post-listing .post h3")).toHaveText(["Ledger Four", "Ledger Two"])
})

test("the page of a tag only private pages carry lists no posts, and asks to be indexed", async ({ page }) => {
  await page.goto("/tags/ledger/sealed")
  await expect(page.locator(".post-listing")).toContainText("No posts found.")
  await expect(page.locator(".post-listing .post")).toHaveCount(0)
  await expect(page.locator('head meta[name="robots"]')).toHaveCount(0)
})

test("a private tag's page asks not to be indexed, and lists no posts", async ({ page }) => {
  await page.goto("/tags/private")
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", "noindex")
  await expect(page.locator(".post-listing .post")).toHaveCount(0)
})

test("a tag no note carries has no page, and its description note has none either", async ({ page }) => {
  expect((await page.goto("/tags/unworn"))!.status()).toBe(404)
})

test("a tag description note's page is its tag's page, at the address the note's would have had", async ({ page }) => {
  // One page at `tags/ledger`, the tag's, with the note as its body and the posts under the tag.
  await page.goto("/tags/ledger")
  await expect(page.locator("main .prose")).toHaveCount(1)
  await expect(page.locator("main .prose")).toContainText("description note: everything written in the ledger")
  await expect(page.locator(".post-listing")).toHaveCount(1)
  // A note's page links to its source, and a tag page does not.
  await expect(page.locator(".source-link")).toHaveCount(0)
})

test("a wikilink to a tag's description note lands on the tag's page, and is not unresolved", async ({ page }) => {
  await page.goto("/tag-pages/links")
  const wikilink = page.locator("main .prose").getByRole("link", { name: "the ledger", exact: true })
  await expect(wikilink).toHaveAttribute("href", "/tags/ledger")
  await expect(wikilink).not.toHaveClass(/is-unresolved/)
  const markdown = page.locator("main .prose").getByRole("link", { name: "the ledger again" })
  await expect(markdown).toHaveAttribute("href", "/tags/ledger")
  await expect(markdown).not.toHaveClass(/is-unresolved/)
  await wikilink.click()
  await expectAt(page, /\/tags\/ledger$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("#ledger")
})

test("a wikilink to the page of a tag with no description note lands on it, and is not unresolved", async ({ page }) => {
  await page.goto("/tag-pages/links")
  const wikilink = page.locator("main .prose").getByRole("link", { name: "the accounts", exact: true })
  await expect(wikilink).toHaveAttribute("href", "/tags/ledger/accounts")
  await expect(wikilink).not.toHaveClass(/is-unresolved/)
  await wikilink.click()
  await expectAt(page, /\/tags\/ledger\/accounts$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("#accounts")
})

test("a wikilink to the description note of a tag with no page is unresolved", async ({ page }) => {
  await page.goto("/tag-pages/links")
  const wikilink = page.locator("main .prose").getByRole("link", { name: "the unworn tag", exact: true })
  await expect(wikilink).toHaveClass(/is-unresolved/)
  await expect(wikilink).not.toHaveAttribute("href", "/tags/unworn")
})

test("a note's tag badge lands on its tag's page", async ({ page }) => {
  await page.goto("/post-listing/ledger-two")
  await page.locator("main header .tag-badge", { hasText: "#accounts" }).click()
  await expectAt(page, /\/tags\/ledger\/accounts$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("#accounts")
})

test("the tags index lists the top-level tags, and no private tag", async ({ page }) => {
  await page.goto("/tags")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tags")
  const tags = page.locator("main .tag-page-tags .tag-badge")
  await expect(tags.filter({ hasText: "#ledger" })).toHaveText(/^#ledger\s*\(6\)$/)
  await expect(tags.filter({ hasText: "#engineering" })).toHaveCount(1)
  await expect(tags.filter({ hasText: "#accounts" })).toHaveCount(0)
  await expect(tags.filter({ hasText: "#private" })).toHaveCount(0)
})
