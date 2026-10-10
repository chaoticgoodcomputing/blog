import type { APIRequestContext, Page } from "@playwright/test"
import sharp from "sharp"
import { SITE } from "../feed-and-sitemap.ts"
import { readStructuredData } from "../structured-data.ts"
import { expect, test } from "../site.ts"

// The content of the one element in the head that `selector` names.
async function head(page: Page, selector: string): Promise<string | null> {
  const element = page.locator(`head ${selector}`)
  await expect(element).toHaveCount(1)
  return element.getAttribute("content")
}

// The card at a whole address of the site, as the site serves it.
async function card(request: APIRequestContext, address: string) {
  const response = await request.get(new URL(address).pathname)
  expect(response.status(), address).toBe(200)
  expect(response.headers()["content-type"], address).toBe("image/png")
  const png = await response.body()
  const { width, height } = await sharp(png).metadata()
  const corner = await sharp(png).extract({ left: 0, top: 0, width: 1, height: 1 }).removeAlpha().raw().toBuffer()
  return { width, height, corner: `#${corner.toString("hex")}` }
}

test("a note's page names its own share card, a large image in the dark palette, to Open Graph and Twitter", async ({
  page,
  request,
}) => {
  const pages = {
    "/share-card/pruning-roses": `${SITE}/share-cards/share-card/pruning-roses.png`,
    "/share-card/long-title": `${SITE}/share-cards/share-card/long-title.png`,
    "/": `${SITE}/share-cards/index.png`,
  }
  for (const [address, image] of Object.entries(pages)) {
    await page.goto(address)
    expect(await head(page, 'meta[property="og:image"]'), address).toBe(image)
    expect(await head(page, 'meta[name="twitter:image"]'), address).toBe(image)
    expect(await head(page, 'meta[name="twitter:card"]'), address).toBe("summary_large_image")
    expect(await head(page, 'meta[property="og:image:width"]'), address).toBe("1200")
    expect(await head(page, 'meta[property="og:image:height"]'), address).toBe("630")
    expect(await head(page, 'meta[property="og:image:type"]'), address).toBe("image/png")
    // The card's background is the dark palette's --light.
    expect(await card(request, image)).toEqual({ width: 1200, height: 630, corner: "#161618" })
  }
})

test("a card says what is on it, for a reader who cannot see it", async ({ page }) => {
  await page.goto("/share-card/pruning-roses")
  expect(await head(page, 'meta[property="og:image:alt"]')).toBe("Pruning Roses")
  expect(await head(page, 'meta[name="twitter:image:alt"]')).toBe("Pruning Roses")
})

test("an article's JSON-LD names its card as its image", async ({ page }) => {
  await page.goto("/content/share-card/grafting")
  expect(await readStructuredData(page)).toMatchObject([
    { image: `${SITE}/share-cards/content/share-card/grafting.png` },
  ])
})

test("a tag's page has a card of its own", async ({ request }) => {
  // horticulture/seasons is carried by share-card/pruning-roses.
  expect(await card(request, `${SITE}/share-cards/tags/horticulture/seasons.png`)).toEqual({
    width: 1200,
    height: 630,
    corner: "#161618",
  })
})

test("a tag page and the tags index (ticket 12) name cards of their own, which say the page's title", async ({
  page,
  request,
}) => {
  const pages = {
    // rosarian's description note titles its page; rosarian/climbers has none.
    "/tags/rosarian": [`${SITE}/share-cards/tags/rosarian.png`, "The Rosarian"],
    "/tags/rosarian/climbers": [`${SITE}/share-cards/tags/rosarian/climbers.png`, "#climbers"],
    "/tags": [`${SITE}/share-cards/tags.png`, "Tags"],
  }
  for (const [address, [image, title]] of Object.entries(pages)) {
    await page.goto(address)
    await expect(page.locator("main header").getByRole("heading", { level: 1 }), address).toHaveText(title!)
    expect(await head(page, 'meta[property="og:image"]'), address).toBe(image)
    expect(await head(page, 'meta[property="og:image:alt"]'), address).toBe(title)
    expect(await head(page, 'meta[name="twitter:card"]'), address).toBe("summary_large_image")
    expect(await card(request, image!)).toEqual({ width: 1200, height: 630, corner: "#161618" })
  }
})

test("the 404 page has no card, and is a summary to Twitter", async ({ page }) => {
  await page.goto("/404")
  await expect(page.locator('head meta[property="og:image"]')).toHaveCount(0)
  await expect(page.locator('head meta[name="twitter:image"]')).toHaveCount(0)
  expect(await head(page, 'meta[name="twitter:card"]')).toBe("summary")
})

test("a private page has no card, none is drawn for it, and it is a summary to Twitter", async ({ page, request }) => {
  await page.goto("/content/seo/diary")
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", "noindex")
  await expect(page.locator('head meta[property="og:image"]')).toHaveCount(0)
  await expect(page.locator('head meta[name="twitter:image"]')).toHaveCount(0)
  expect(await head(page, 'meta[name="twitter:card"]')).toBe("summary")
  expect((await request.head("/share-cards/content/seo/diary.png")).status()).toBe(404)
})
