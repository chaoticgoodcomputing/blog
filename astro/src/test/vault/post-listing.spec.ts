import { expect, test } from "../site.ts"

test("the real vault's home page lists the site's posts, newest first", async ({ page }) => {
  await page.goto("/")
  const listing = page.locator("main .after-body .post-listing")
  await listing.locator("summary").click()
  // Every date no later than the one before it.
  const dates = await listing.locator(".post time").evaluateAll((times) => times.map((time) => time.getAttribute("datetime")!))
  expect(dates.length).toBeGreaterThan(0)
  expect(dates.every((date, index) => index === 0 || date <= dates[index - 1]!)).toBe(true)
})

test("no page in the real vault's home page listing asks not to be indexed, as a private page does", async ({ page }) => {
  await page.goto("/")
  const links = await page.locator(".post-listing .post h3 a").evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href")!))
  expect(links.length).toBeGreaterThan(0)
  const noindexed = []
  for (const href of links) {
    const html = await (await page.request.get(href)).text()
    if (html.includes('name="robots" content="noindex"')) noindexed.push(href)
  }
  expect(noindexed).toEqual([])
})
