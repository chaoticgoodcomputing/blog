import { site } from "../../site.config.ts"
import { expect, test } from "../site.ts"

// The fixture vault's backlinks/ notes: one note linked to by a note, embedded by another, and
// linked to by a private page; and one nothing links to. Which of the two tests about the private
// page runs is the site's setting, `site.private.backlinks`: change it, and the other one does.
const linked = "/backlinks/linked"

test("a note's backlinks panel lists the pages that link to it, an embed counting as a link", async ({ page }) => {
  await page.goto(linked)
  const panel = page.locator(".backlinks")
  await expect(panel.getByRole("heading", { level: 2 })).toHaveText("Backlinks")
  await expect(panel.getByRole("link", { name: "Links to it", exact: true })).toHaveAttribute("href", "/backlinks/by-link")
  await expect(panel.getByRole("link", { name: "Embeds it", exact: true })).toHaveAttribute("href", "/backlinks/by-embed")
})

test("a backlink is set as the headings are", async ({ page }) => {
  await page.goto(linked)
  const link = page.locator(".backlinks").getByRole("link", { name: "Links to it", exact: true })
  await expect(link).toHaveCSS("font-weight", "600")
  const heading = page.locator("main h1")
  expect(await link.evaluate((element) => getComputedStyle(element).fontFamily)).toBe(
    await heading.evaluate((element) => getComputedStyle(element).fontFamily),
  )
})

test("left out, a private page that links to a note is not among its backlinks", async ({ page }) => {
  test.skip(site.private.backlinks !== "omit", "the site marks private backlinks")
  await page.goto(linked)
  const panel = page.locator(".backlinks")
  await expect(panel.getByRole("link", { name: "Embeds it" })).toBeVisible()
  await expect(panel.getByRole("link", { name: /Links to it privately/ })).toHaveCount(0)
  await expect(panel.getByRole("img", { name: "Private page" })).toHaveCount(0)
})

test("marked, a private page that links to a note is listed after the public ones, with a lock", async ({ page }) => {
  test.skip(site.private.backlinks !== "mark", "the site leaves private backlinks out")
  await page.goto(linked)
  const items = page.locator(".backlinks li")
  await expect(items).toHaveCount(3)
  const last = items.last()
  await expect(last.getByRole("link")).toHaveAttribute("href", "/backlinks/by-private-page")
  await expect(last.getByRole("link")).toHaveAccessibleName("Private page Links to it privately")
  await expect(last.getByRole("img", { name: "Private page" })).toBeVisible()
  // Only the private page is marked.
  await expect(page.locator(".backlinks").getByRole("img", { name: "Private page" })).toHaveCount(1)
})

test("a note nothing links to has no backlinks panel, and nor does the home page", async ({ page }) => {
  await page.goto("/backlinks/alone")
  await expect(page.locator("main .prose")).toContainText("No other note links here.")
  await expect(page.locator(".backlinks")).toHaveCount(0)

  // The home note is linked to by backlinks/by-link.
  await page.goto("/")
  await expect(page.locator("main .prose")).toContainText("The home note.")
  await expect(page.locator(".backlinks")).toHaveCount(0)
})
