import { expect, test } from "../site.ts"

// test/fixtures/vault/quotes/kinds.md: a blockquote, a quote callout and a paraphrase, each ending
// with who said it, and a quote callout that doesn't.

const PAGE = "/quotes/kinds"

/** What sets a text's look, as the browser computes it. */
const TEXT = ["font-family", "font-size", "font-style", "font-weight", "line-height", "letter-spacing", "text-transform"] as const

test("a quote's words are set alike, whatever its kind, and as the note's text is", async ({ page }) => {
  await page.goto(PAGE)
  const looks = await page.locator(".prose .quote-body > p:first-child").evaluateAll((words, properties) =>
    words.map((element) => {
      const style = getComputedStyle(element)
      return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]))
    }), TEXT)
  expect(looks).toHaveLength(4)
  const paragraph = page.locator(".prose > p").first()
  const text = await paragraph.evaluate((element, properties) => {
    const style = getComputedStyle(element)
    return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]))
  }, TEXT)
  for (const look of looks) expect(look).toEqual(text)
})

test("a quote that ends with who said it sets that line apart by a dotted rule, and one that doesn't has none", async ({ page }) => {
  await page.goto(PAGE)
  const attributions = page.locator(".prose .quote-attribution")
  await expect(attributions).toHaveCount(3)
  for (const attribution of await attributions.all()) {
    await expect(attribution).toHaveCSS("border-top-style", "dotted")
    await expect(attribution).toContainText("Someone, Somewhere (2026)")
  }
  const unsaid = page.locator(".prose .quote").filter({ hasText: "A quote that says no one said it." })
  await expect(unsaid.locator(".quote-attribution")).toHaveCount(0)
})
