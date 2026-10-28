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

test("a backlink shows its page's date and description under its title, an undated page its description alone", async ({ page }) => {
  await page.goto(linked)
  const items = page.locator(".backlinks li")
  const byLink = items.filter({ has: page.getByRole("link", { name: "Links to it", exact: true }) })
  await expect(byLink.locator("time")).toHaveAttribute("datetime", "2025-01-15T00:00:00.000Z")
  await expect(byLink.locator(".description")).toHaveText("— A note that links to it.")
  // Neither is part of the link's name.
  await expect(byLink.getByRole("link")).toHaveAccessibleName("Links to it")
  const byEmbed = items.filter({ has: page.getByRole("link", { name: "Embeds it", exact: true }) })
  await expect(byEmbed.locator("time")).toHaveCount(0)
  await expect(byEmbed.locator(".description")).toHaveText("The note embedded, and not linked to:")
})

test("beside a note's backlinks, its outlinks: the pages it links to", async ({ page }) => {
  await page.goto(linked)
  const out = page.locator(".page-links .outlinks")
  await expect(out.getByRole("heading", { level: 2 })).toHaveText("Outlinks")
  await expect(out.getByRole("link")).toHaveCount(1)
  await expect(out.getByRole("link", { name: "Embeds it", exact: true })).toHaveAttribute("href", "/backlinks/by-embed")
  // The outlinks on the left, the backlinks on the right, side by side.
  const [left, right] = [(await out.boundingBox())!, (await page.locator(".page-links .backlinks").boundingBox())!]
  expect(left.x + left.width).toBeLessThanOrEqual(right.x)
  expect(Math.abs(left.y - right.y)).toBeLessThan(1)
})

test("a note nothing links to has only its outlinks, with no backlinks column", async ({ page }) => {
  await page.goto("/backlinks/by-link")
  await expect(page.locator(".page-links .backlinks")).toHaveCount(0)
  await expect(page.locator(".page-links .outlinks").getByRole("link", { name: "A note with backlinks", exact: true })).toBeVisible()
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
