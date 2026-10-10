import { expect, test } from "../site.ts"

// test/fixtures/vault/note-embeds: one note embeds another, whole, one section and one block of it.

test("an embed shows the whole of a note in place, rendered as a note is, its links going where they go from that note", async ({
  page,
}) => {
  await page.goto("/note-embeds/embedding")
  const whole = page.locator(".prose .markdown-embed").nth(0)
  await expect(whole.getByRole("heading", { name: "First section" })).toBeVisible()
  await expect(whole.locator("mark")).toHaveText("a highlight")
  await expect(whole.locator(".callout")).toContainText("Inside the embed.")
  await expect(whole).toContainText("Only in the second section.")
  await expect(whole).not.toContainText("A comment.")
  // Highlighted as the page's own code is.
  await expect(whole.locator("pre.astro-code")).toContainText("const steeped = true")

  await whole.getByRole("link", { name: "Sibling" }).click()
  await expect(page).toHaveURL(/\/note-embeds\/shelf\/Sibling$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sibling on the shelf")
})

test("an embed of a heading shows that section, and links back to it on its note's page", async ({ page }) => {
  await page.goto("/note-embeds/embedding")
  const section = page.locator(".prose .markdown-embed").nth(1)
  await expect(section.getByRole("heading", { name: "Second section" })).toBeVisible()
  await expect(section).toContainText("A line worth quoting.")
  await expect(section).not.toContainText("First section")

  await section.locator(".markdown-embed-link").click()
  await expect(page).toHaveURL(/\/note-embeds\/shelf\/Embedded#second-section$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Embedded")
})

for (const [colorScheme, text] of [
  ["light", "rgb(78, 78, 78)"],
  ["dark", "rgb(212, 212, 212)"],
] as const) {
  test(`in the ${colorScheme} colour scheme, the link back to an embed's note is in the body's text colour`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto("/note-embeds/embedding")
    // The palette's --darkgray, which reads at well over 4.5:1 on the page, link chip and all.
    await expect(page.locator(".prose .markdown-embed-link").first()).toHaveCSS("color", text)
  })
}

test("an embed of a block shows that block alone", async ({ page }) => {
  await page.goto("/note-embeds/embedding")
  const block = page.locator(".prose .markdown-embed").nth(2)
  await expect(block.locator(".markdown-embed-content")).toHaveText("A line worth quoting.")
  await expect(block.locator(".markdown-embed-link")).toHaveAttribute("href", "/note-embeds/shelf/Embedded#^quote")
})

test("an embed of no note shows nothing, and is marked unresolved", async ({ page }) => {
  await page.goto("/note-embeds/embedding")
  await expect(page.locator(".prose .markdown-embed")).toHaveCount(3)
  await expect(page.locator(".prose .internal-embed.is-unresolved")).toHaveText("Nowhere to be found")
})
