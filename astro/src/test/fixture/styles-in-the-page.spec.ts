import { expect, test } from "../site.ts"

// A page's styles arrive in the page itself, so nothing holds its first paint back for a stylesheet
// of its own (docs/adr/2902). The one stylesheet a page links is KaTeX's, on a page with math
// (docs/adr/0501).

const linkedStylesheets = (page: import("@playwright/test").Page) =>
  page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.map((link) => new URL((link as HTMLLinkElement).href).pathname))

test("a page with no math links no stylesheet, and is styled", async ({ page }) => {
  for (const url of ["/", "/tags"]) {
    await page.goto(url)
    expect(await linkedStylesheets(page), url).toEqual([])
    // The site shell's own rules are on the page: the left sidebar is laid out beside the body.
    await expect(page.locator("aside.left"), url).toBeVisible()
    expect(await page.locator("style").count(), url).toBeGreaterThan(0)
  }
})

test("a page with math links KaTeX's stylesheet, and no other", async ({ page }) => {
  await page.goto("/math/pythagoras")
  const linked = await linkedStylesheets(page)
  expect(linked).toHaveLength(1)
  expect(linked[0]).toMatch(/^\/_astro\/math\.[\w-]+\.css$/)
})
