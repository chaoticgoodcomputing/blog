import { expect, expectAt, test } from "../site.ts"

// A note with links to other sites, and links that stay on this one.
const links = "/external-links/links"

test("a link to another site opens in a new tab, safely, and says so to a screen reader", async ({
  page,
  externalRequests,
}) => {
  await page.goto(links)
  const link = page.locator(".prose").getByRole("link", { name: "Astro’s documentation (opens in a new tab)", exact: true })
  await expect(link).toHaveAttribute("target", "_blank")
  await expect(link).toHaveAttribute("rel", "noopener")
  // What it reads as is the link's text alone.
  await expect(link).toHaveText("Astro’s documentation")

  // The new tab asks for the other site, which the suite refuses (site.ts); this one stays.
  const opened = page.waitForEvent("popup")
  await link.click()
  await (await opened).waitForLoadState()
  expect(externalRequests).toContain("https://docs.astro.build/")
  await expectAt(page, new RegExp(`${links}$`))
})

test("a link to another site ends with an icon, in the link's colour, and is not underlined", async ({ page }) => {
  await page.goto(links)
  const link = page.locator(".prose").getByRole("link", { name: "Astro’s documentation (opens in a new tab)", exact: true })
  const icon = link.locator(".new-tab svg")
  await expect(icon).toBeVisible()
  const colour = await link.evaluate((element) => getComputedStyle(element).color)
  await expect(icon).toHaveCSS("color", colour)
  await expect(link).toHaveCSS("text-decoration-line", "none")
  // A link that stays on the site keeps its own look, and no icon.
  const stays = page.locator(".prose").getByRole("link", { name: "a place on this page", exact: true })
  await expect(stays.locator("svg")).toHaveCount(0)
})

test("an address written bare opens in a new tab too", async ({ page }) => {
  await page.goto(links)
  const link = page.locator(".prose").getByRole("link", { name: "https://example.org/ (opens in a new tab)", exact: true })
  await expect(link).toHaveAttribute("target", "_blank")
})

for (const name of [
  "another note",
  "the notes file",
  "a place on this page",
  "this site, by its whole address",
  "a letter",
]) {
  test(`a link that is not to another site stays in the tab: ${name}`, async ({ page }) => {
    await page.goto(links)
    const link = page.locator(".prose").getByRole("link", { name, exact: true })
    await expect(link).toHaveCount(1)
    await expect(link).not.toHaveAttribute("target", /.*/)
  })
}
