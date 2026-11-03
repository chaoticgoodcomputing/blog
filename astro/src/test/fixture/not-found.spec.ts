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
