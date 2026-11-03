import { expect, test } from "../site.ts"

// The fixture's Bluesky account has posted one note, Alpha (test/fixtures/bluesky/author-feed.json).
const posted = "/content/notes/alpha"
const unposted = "/site-shell/body"

test("a posted note's discussion links to its Bluesky post, which its h-entry names as its copy", async ({ page }) => {
  await page.goto(posted)
  const discussion = page.locator("section.discussion")
  await expect(discussion.getByRole("heading", { level: 2 })).toHaveText("Discussion")
  const bluesky = discussion.getByRole("link", { name: "Discuss on Bluesky" })
  await expect(bluesky).toHaveAttribute("href", "https://bsky.app/profile/chaoticgood.computer/post/3fixturealpha")
  await expect(bluesky).toHaveClass(/\bu-syndication\b/)
  await expect(bluesky).toHaveAttribute("target", "_blank")
})

test("a note the account hasn't posted links to the account, and names no copy", async ({ page }) => {
  await page.goto(unposted)
  const bluesky = page.locator("section.discussion").getByRole("link", { name: "Discuss on Bluesky" })
  await expect(bluesky).toHaveAttribute("href", "https://bsky.app/profile/chaoticgood.computer")
  await expect(bluesky).not.toHaveClass(/\bu-syndication\b/)
})

test("a reader can send a webmention of their reply, to the site's endpoint, for the note's page", async ({ page }) => {
  await page.goto(posted)
  const form = page.locator("form.send-webmention")
  await expect(form).toHaveAttribute("action", "https://webmention.io/blog.chaoticgood.computer/webmention")
  await expect(form).toHaveAttribute("method", "post")
  await expect(form.locator('input[name="target"]')).toHaveValue(`https://blog.chaoticgood.computer${posted}`)
  await expect(form.getByLabel(/Send the address of your reply/)).toHaveAttribute("type", "url")
})

test("a note's page is an h-entry: its name, date, author, address and content", async ({ page }) => {
  await page.goto(posted)
  const entry = page.locator("main.h-entry")
  await expect(entry).toHaveCount(1)
  await expect(entry.locator("h1.p-name")).toHaveText("Alpha")
  await expect(entry.locator(".u-url")).toHaveAttribute("href", `https://blog.chaoticgood.computer${posted}`)
  await expect(entry.locator(".p-author.h-card")).toHaveText("Spencer Elkington")
  await expect(entry.locator("article.prose.e-content")).toHaveCount(1)
  // None of it is shown.
  await expect(entry.locator(".entry-meta")).toBeHidden()
})

test("a private page's stub is no h-entry, and has no discussion", async ({ page }) => {
  await page.goto("/content/notes/secret")
  await expect(page.locator(".h-entry")).toHaveCount(0)
  await expect(page.locator("section.discussion")).toHaveCount(0)
})
