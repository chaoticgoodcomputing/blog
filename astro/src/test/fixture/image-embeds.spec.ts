import { expect, test } from "../site.ts"

// test/fixtures/vault/image-embeds: a note that embeds a PNG by a wikilink and an SVG by a Markdown
// image, at an address relative to the note. The Quartz site once drew such an SVG as an `<object>`
// whose address, relative to the page, was not found.

test("every image a note embeds is drawn", async ({ page }) => {
  await page.goto("/image-embeds/embeds")
  const prose = page.locator("article.prose")
  await expect(prose.locator("object")).toHaveCount(0)

  const images = prose.locator("img")
  await expect(images).toHaveCount(2)
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded()
    await expect(image).toHaveJSProperty("complete", true)
    expect(await image.evaluate((drawn: HTMLImageElement) => drawn.naturalWidth)).toBeGreaterThan(0)
  }
})
