import type { Page } from "@playwright/test"
import { expect, expectAt, test } from "../site.ts"

// The style rules a page has that are about math: KaTeX's own all name a `.katex` class.
const mathRules = (page: Page) =>
  page.evaluate(() =>
    [...document.styleSheets].flatMap((sheet) =>
      [...sheet.cssRules].filter((rule) => rule.cssText.includes("katex")).map((rule) => rule.cssText),
    ),
  )

// The KaTeX fonts a page has finished loading.
const mathFonts = (page: Page) =>
  page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].filter((font) => font.family.includes("KaTeX") && font.status === "loaded").length
  })

test("inline math and block math are typeset, in KaTeX's fonts", async ({ page, externalRequests }) => {
  await page.goto("/math/pythagoras")
  const prose = page.locator(".prose")

  const inline = prose.locator("p .katex").first()
  await expect(inline).toBeVisible()
  await expect(inline.locator("annotation")).toHaveText("a^2 + b^2 = c^2")

  const display = prose.locator(".katex-display")
  await expect(display).toHaveCount(2)
  await expect(display.first().locator("annotation")).toHaveText("c = \\sqrt{a^2 + b^2}")
  await expect(display.nth(1).locator("annotation")).toHaveText("\\frac{a}{c} = \\sin \\alpha")
  // A display formula sits on a line of its own, centred, as KaTeX's stylesheet sets it.
  await expect(display.first()).toHaveCSS("text-align", "center")

  // No source is left showing: every formula was replaced.
  await expect(prose.locator("code")).toHaveCount(0)
  await expect(prose).not.toContainText("$")

  // The typeset glyphs are drawn in KaTeX's own fonts, served by the site.
  await expect(inline.locator(".katex-html .mord.mathnormal").first()).toHaveCSS("font-family", /KaTeX_Math/)
  expect(await mathFonts(page)).toBeGreaterThan(0)
  expect(externalRequests).toEqual([])
})

test("a page with prices and no math loads no math stylesheet or fonts", async ({ page }) => {
  const requests: string[] = []
  page.on("request", (request) => requests.push(request.url()))
  await page.goto("/math/prices")
  const prose = page.locator(".prose")

  await expect(prose).toContainText("The basic plan is $5 a month and the pro plan $10, or $100 a year for the lot.")
  await expect(prose.locator("strong")).toHaveText("$100")
  await expect(prose.getByRole("link", { name: "the lot" })).toHaveAttribute("href", "/math/pythagoras")
  await expect(prose.locator(".katex")).toHaveCount(0)

  expect(await mathRules(page)).toEqual([])
  expect(await mathFonts(page)).toBe(0)
  expect(requests.filter((url) => /katex/i.test(url))).toEqual([])
})

test("a link to a heading with math lands on the heading", async ({ page }) => {
  await page.goto("/math/heading")
  const heading = page.locator(".prose").getByRole("heading", { level: 2 })
  await expect(heading.locator(".katex")).toBeVisible()

  await page.locator(".prose").getByRole("link", { name: "The $x$ value" }).click()
  await expectAt(page, /\/math\/heading#the-x-value$/)
  await expect(page.locator(":target")).toHaveCount(1)
  await expect(heading).toHaveAttribute("id", "the-x-value")
  expect(await page.locator(":target").evaluate((element) => element.tagName)).toBe("H2")
})

test("the home page, which has no math, loads no math stylesheet", async ({ page }) => {
  await page.goto("/")
  expect(await mathRules(page)).toEqual([])
})

test.describe("with scripts turned off in the reader's browser", () => {
  test.use({ javaScriptEnabled: false })

  test("math is already typeset", async ({ page }) => {
    await page.goto("/math/pythagoras")
    await expect(page.locator(".prose .katex-html").first()).toBeVisible()
    await expect(page.locator(".prose .katex-display")).toHaveCount(2)
  })
})
