import type { Page } from "@playwright/test"
import { expect, expectAt, test } from "../site.ts"

test("an address that names nothing gets the site's 404 page, in the site shell", async ({ page, externalRequests }) => {
  const response = await page.goto("/content/notes/nothing/at/all")
  expect(response!.status()).toBe(404)
  await expect(page).toHaveTitle("Not Found | Spencer Elkington")
  await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText("404")
  await expect(page.locator("main")).toContainText("There is no page at this address.")
  await expect(page.getByRole("link", { name: "Chaotic Good Computing by Spencer Elkington" })).toBeVisible()
  await expect(page.getByRole("contentinfo")).toBeVisible()
  expect(externalRequests).toEqual([])
})

test("the 404 page leads home from any depth", async ({ page }) => {
  await page.goto("/a/b/c/nothing")
  await page.locator("main").getByRole("link", { name: "Return to the home page" }).click()
  await expectAt(page, "/")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fixture Home")
})

test("the 404 page is the file a static host serves for an unknown address", async ({ request }) => {
  // GitHub Pages serves /404.html for any address it has no file for.
  const response = await request.get("/404.html")
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain("There is no page at this address.")
})

// The 404 page sits in the site shell, and its heading is drawn as a note's title is, in the same
// place: here, aliases/renamed's.
const title = async (page: Page) => {
  const heading = page.locator("main h1")
  await expect(heading).toHaveCount(1)
  return {
    box: await heading.boundingBox(),
    size: await heading.evaluate((element) => getComputedStyle(element).fontSize),
  }
}

for (const [width, name] of [
  [1400, "a desktop"],
  [390, "a phone"],
] as const) {
  test(`on ${name}, the 404 page's heading is a note's title, where a note's is`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/aliases/renamed")
    const note = await title(page)
    await page.goto("/nothing/at/all")
    const notFound = await title(page)

    expect(notFound.size).toBe(note.size)
    expect(notFound.box!.x).toBe(note.box!.x)
    expect(notFound.box!.y).toBe(note.box!.y)
  })
}
