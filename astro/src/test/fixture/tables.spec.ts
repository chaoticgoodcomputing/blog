import { expect, test } from "../site.ts"

// A note with a table narrower than its column.
const narrow = "/tables/narrow"

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1100, height: 900 },
  { width: 1440, height: 900 },
]) {
  test(`a table narrower than the note's column is centred in it, ${viewport.width}px wide`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto(narrow)
    const column = (await page.locator(".prose").boundingBox())!
    const table = (await page.locator(".prose table").boundingBox())!
    expect(table.width).toBeLessThan(column.width)
    const left = table.x - column.x
    const right = column.x + column.width - (table.x + table.width)
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1)
  })
}
