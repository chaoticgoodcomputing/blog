import { expect, test } from "../site.ts"

// A paragraph citing a footnote in its first sentence and another far down it.
const note = "/sidenotes/lines"

test("in the margin, the odd sidenotes are to the right, the even to the left, each level with its line", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto(note)
  const text = page.locator(".prose > .sidenoted > p")
  const first = page.locator("#user-content-sn-1")
  const second = page.locator("#user-content-sn-2")
  await expect(first).toHaveCSS("float", "right")
  await expect(second).toHaveCSS("float", "left")
  await expect(first.locator(".sidenote-number")).toHaveText("1.")
  await expect(second.locator(".sidenote-number")).toHaveText("2.")

  const box = async (locator: typeof text) => (await locator.boundingBox())!
  expect((await box(first)).x).toBeGreaterThan((await box(text)).x + (await box(text)).width)
  expect((await box(second)).x + (await box(second)).width).toBeLessThan((await box(text)).x)
  // Level with the line of its reference, within the difference of the two type sizes.
  for (const n of [1, 2]) {
    await expect
      .poll(async () => {
        const note = await box(page.locator(`#user-content-sn-${n}`))
        const reference = await box(page.locator(`#user-content-fnref-${n}`))
        return Math.abs(note.y - reference.y)
      })
      .toBeLessThan(8)
  }
})

test("a click on a sidenote's number flashes the sentence that cites it, and stays on the page", async ({ page }) => {
  await page.goto(note)
  await page.locator("#user-content-sn-2 .sidenote-number").click()
  const flashed = await page.evaluate(() => {
    const highlight = CSS.highlights.get("sidenote-source")
    return highlight ? [...highlight].map((range) => range.toString()).join("") : null
  })
  expect(flashed).toBe("Here is the sentence that cites the second footnote2 at last.")
  expect(new URL(page.url()).hash).toBe("")
  await expect.poll(() => page.evaluate(() => CSS.highlights.size), { timeout: 4000 }).toBe(0)
})
