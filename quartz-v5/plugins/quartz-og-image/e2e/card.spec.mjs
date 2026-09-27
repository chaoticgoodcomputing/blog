// What a crawler gets from a page's `og:image`: the card quartz-og-image draws in place of
// stock og-image's. Cards are compared as files, so a spec never has to read text out of an image:
// two pages that differ only in something the card must not show get byte-identical cards.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test, expect } from "../../../tests/harness/test.mjs"
import { buildScratchSite, editConfig, fixtureConfig, testsRoot } from "../../../tests/harness/site.mjs"

// The fixture site's baseUrl, where Quartz points a page's `og:image`.
const SITE = "https://localhost"

// The card a crawler would fetch for `slug`, found through the page's own `og:image`.
async function cardOf(page, request, slug) {
  await page.goto(`/${slug}`)
  // One `og:image`, ours: core writes a default one too unless an emitter has stock's name.
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
  const og = await page.locator('meta[property="og:image"]').getAttribute("content")
  expect(og).toBe(`${SITE}/${slug}-og-image.webp`)
  const response = await request.get(new URL(og).pathname)
  expect(response.ok(), og).toBe(true)
  return response.body()
}

// The fixture config's `icon`: a flat, loud square no stock icon resembles.
const ICON = fileURLToPath(new URL("./icon.png", import.meta.url))

// How many of the card's pixels are the icon's colour, give or take lossy WebP. Decoded by the
// browser, which is what draws the card for a reader who is shown it.
const iconPixelsOn = (page, cardImage, iconImage) =>
  page.evaluate(
    async ([cardSrc, iconSrc]) => {
      const pixels = async (src) => {
        const image = new Image()
        image.src = src
        await image.decode()
        const canvas = new OffscreenCanvas(image.naturalWidth, image.naturalHeight)
        const context = canvas.getContext("2d")
        context.drawImage(image, 0, 0)
        return context.getImageData(0, 0, image.naturalWidth, image.naturalHeight)
      }
      const [card, icon] = await Promise.all([pixels(cardSrc), pixels(iconSrc)])
      const centre = 4 * (icon.width * Math.floor(icon.height / 2) + Math.floor(icon.width / 2))
      const colour = icon.data.slice(centre, centre + 3)
      let count = 0
      for (let i = 0; i < card.data.length; i += 4) {
        if ([0, 1, 2].every((c) => Math.abs(card.data[i + c] - colour[c]) < 40)) count++
      }
      return count
    },
    [`data:image/webp;base64,${cardImage.toString("base64")}`, `data:image/png;base64,${iconImage.toString("base64")}`],
  )

test("the card carries the configured icon in place of the stock one", async ({ page, request }) => {
  const flat = await cardOf(page, request, "og/tag-flat")
  // The icon is drawn as a 56px circle: about 2,460 pixels of its colour.
  expect(await iconPixelsOn(page, flat, fs.readFileSync(ICON))).toBeGreaterThan(2000)
})

// Three fixture pages identical but for their one tag: `writing/articles`, `articles` and
// `writing/essays`.
test("a tag chip shows only the tag's last segment", async ({ page, request }) => {
  const nested = await cardOf(page, request, "og/tag-nested")
  const flat = await cardOf(page, request, "og/tag-flat")
  const sibling = await cardOf(page, request, "og/tag-sibling")
  // `#articles` for both, where stock draws `#writing/articles` for the first...
  expect(nested.equals(flat), "writing/articles and articles draw the same chip").toBe(true)
  // ...and the chip is really drawn, from the last segment: `#essays` is a different card.
  expect(nested.equals(sibling), "writing/articles and writing/essays draw different chips").toBe(false)
})

// v4's card never carried the site's title suffix; stock og-image adds it to the card's title.
test("the card's title is the page's own, without the site's title suffix", async ({ page, request }) => {
  test.setTimeout(120_000)
  const suffix = " | A site-wide suffix"
  const config = editConfig(fixtureConfig(), (doc) => doc.setIn(["configuration", "pageTitleSuffix"], suffix))
  const flat = fs.readFileSync(path.join(testsRoot, "content-fixture/og/tag-flat.md"), "utf8")
  const site = await buildScratchSite("og-suffix", { "og/tag-flat.md": flat }, { config, keep: true })
  try {
    expect(site.code, site.output).toBe(0)
    // The suffix is on the page's title...
    expect(fs.readFileSync(path.join(site.public, "og/tag-flat.html"), "utf8")).toContain(`<title>OG card${suffix}</title>`)
    // ...and the card is the one the fixture draws for the same page with no suffix.
    const card = fs.readFileSync(path.join(site.public, "og/tag-flat-og-image.webp"))
    expect(card.equals(await cardOf(page, request, "og/tag-flat"))).toBe(true)
  } finally {
    site.remove()
  }
})

test("an icon that cannot be read fails the build", async () => {
  test.setTimeout(120_000)
  const config = editConfig(fixtureConfig(), (_, entry) => entry("@chaoticgoodcomputing/quartz-og-image").setIn(["options", "icon"], "./no-such-icon.png"))
  const site = await buildScratchSite("og-no-icon", { "index.md": "---\ntitle: Home\n---\nA page.\n" }, { config })
  expect(site.code, site.output).not.toBe(0)
  expect(site.output).toContain("no-such-icon.png")
})

// Both would write every card and every `og:image` tag, each over the other's.
test("a site that also enables stock og-image fails the build", async () => {
  test.setTimeout(120_000)
  const config = editConfig(fixtureConfig(), (_, entry) => entry("@quartz-community/og-image").set("enabled", true))
  const site = await buildScratchSite("og-twice", { "index.md": "---\ntitle: Home\n---\nA page.\n" }, { config })
  expect(site.code, site.output).not.toBe(0)
  expect(site.output).toContain("disable @quartz-community/og-image")
})
