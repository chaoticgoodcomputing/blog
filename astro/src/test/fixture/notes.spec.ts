import { expect, test } from "../site.ts"

test("a note is published at its address, under its title, and its links go to the notes they name", async ({
  page,
  externalRequests,
}) => {
  await page.goto("/content/notes/alpha")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Alpha")

  await page.locator(".prose").getByRole("link", { name: "beta" }).click()
  await expect(page).toHaveURL(/\/content\/notes\/beta$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Beta")
  expect(externalRequests).toEqual([])
})

test("the home page is the vault's index note", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fixture Home")
  await expect(page.locator(".prose")).toContainText("The home note.")
})

test("an address that names no note is not found", async ({ page }) => {
  const response = await page.goto("/content/notes/nothing")
  expect(response!.status()).toBe(404)
})
