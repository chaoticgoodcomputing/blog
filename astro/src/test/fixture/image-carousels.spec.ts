import { expect, test } from "../site.ts"

// test/fixtures/vault/image-carousels: a note with three images embedded on adjacent lines after a
// line of text, of different sizes, then two images with a blank line between them.

const NOTE = "/image-carousels/carousels"

test("images on adjacent lines are a carousel; images with a blank line between them are not", async ({ page }) => {
  await page.goto(NOTE)
  const prose = page.locator("article.prose")
  const carousels = prose.locator(".image-carousel")
  await expect(carousels).toHaveCount(1)
  await expect(carousels.locator(".slide img")).toHaveCount(3)
  await expect(prose.locator("p", { hasText: "Three images on adjacent lines" })).toBeVisible()
  await expect(prose.locator(":scope > p > img")).toHaveCount(2)

  // Each image is the one the site built, at its own address, and is drawn.
  for (const image of await carousels.locator("img").all()) {
    await expect(image).toHaveAttribute("src", /^\/_astro\//)
    expect(await image.evaluate(async (drawn: HTMLImageElement) => (await drawn.decode(), drawn.naturalWidth))).toBeGreaterThan(0)
  }
})

test("the arrows step through the images, wrapping round, and the dots say which is in view", async ({ page }) => {
  await page.goto(NOTE)
  const carousel = page.locator(".prose .image-carousel")
  const dots = carousel.locator(".dot")
  const current = () => dots.evaluateAll((all) => all.findIndex((dot) => dot.getAttribute("aria-current") === "true"))
  await expect(dots).toHaveCount(3)
  await expect.poll(current).toBe(0)

  const height = await carousel.evaluate((element) => element.getBoundingClientRect().height)
  await carousel.getByRole("button", { name: "Next image" }).click()
  await expect.poll(current).toBe(1)
  // The row is as tall as its tallest image, whichever is in view.
  expect(await carousel.evaluate((element) => element.getBoundingClientRect().height)).toBe(height)

  await carousel.getByRole("button", { name: "Image 3 of 3" }).click()
  await expect.poll(current).toBe(2)
  await carousel.getByRole("button", { name: "Next image" }).click()
  await expect.poll(current).toBe(0)
  await carousel.getByRole("button", { name: "Previous image" }).click()
  await expect.poll(current).toBe(2)
})
