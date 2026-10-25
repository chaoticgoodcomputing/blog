import type { Locator, Page } from "@playwright/test"
import { expect, test } from "../site.ts"

// The fixture vault's drawings/post embeds `loop`, which has a light and a dark export, `single`,
// which has one, and `loop` again at a width of 120.

const POST = "/drawings/post"
const embeds = (page: Page) => page.locator(".prose .excalidraw-embed")

// The alpha of an image's top left pixel, as the page draws it: 0 where the drawing has no canvas.
const cornerAlpha = (image: Locator) =>
  image.evaluate(async (img: HTMLImageElement) => {
    await img.decode()
    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const context = canvas.getContext("2d")!
    context.drawImage(img, 0, 0)
    return context.getImageData(1, 1, 1, 1).data[3]
  })

test("in the light scheme, an embed of a drawing shows its light export, and only that one is fetched", async ({
  page,
  externalRequests,
}) => {
  await page.emulateMedia({ colorScheme: "light" })
  const fetched: string[] = []
  page.on("request", (request) => fetched.push(new URL(request.url()).pathname))
  await page.goto(POST)

  const loop = embeds(page).first()
  await expect(loop.getByRole("img", { name: "loop" })).toHaveCount(1)
  await expect(loop.getByRole("img", { name: "loop" })).toHaveAttribute("src", "/drawings/drawings/loop.light.svg")
  await expect(loop.getByRole("img", { name: "loop" })).toBeVisible()
  await expect.poll(() => loop.locator("img.excalidraw-light").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(200)
  expect(fetched).toContain("/drawings/drawings/loop.light.svg")
  expect(fetched).not.toContain("/drawings/drawings/loop.dark.svg")
  expect(externalRequests).toEqual([])
})

test("in the dark scheme, an embed of a drawing shows its dark export", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto(POST)
  const loop = embeds(page).first()
  await expect(loop.getByRole("img", { name: "loop" })).toHaveCount(1)
  await expect(loop.getByRole("img", { name: "loop" })).toHaveAttribute("src", "/drawings/drawings/loop.dark.svg")
})

test("a drawing with one export shows it in either scheme, under the embed's alternative text", async ({ page }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme })
    await page.goto(POST)
    const single = embeds(page).nth(1).getByRole("img", { name: "A single circle" })
    await expect(single).toBeVisible()
    await expect(single).toHaveAttribute("src", "/drawings/drawings/single.svg")
  }
})

test("a drawing is as wide as the text, unless the embed gives it a width", async ({ page }) => {
  await page.goto(POST)
  const text = await page.locator(".prose p").first().evaluate((p) => p.getBoundingClientRect().width)
  const full = await embeds(page).first().getByRole("img").evaluate((img) => img.getBoundingClientRect().width)
  const sized = await embeds(page).nth(2).getByRole("img").evaluate((img) => img.getBoundingClientRect().width)
  expect(full).toBeCloseTo(text, 0)
  expect(sized).toBe(120)
})

test("a drawing's note has no page, and a link to it goes nowhere", async ({ page }) => {
  expect((await page.goto("/drawings/loop"))!.status()).toBe(404)
  await page.goto(POST)
  await expect(page.locator(".prose a.internal-link", { hasText: "loop" })).toHaveClass(/is-unresolved/)
})
