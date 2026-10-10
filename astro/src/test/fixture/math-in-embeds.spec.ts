import { expect, test } from "../site.ts"

// Tickets 02 and 05 together: math-in-embeds/host has no math of its own, and embeds math/pythagoras,
// which has. The embedded math is typeset, and the page links the math stylesheet, since its render
// holds math.

test("math in an embedded note is typeset, in KaTeX's fonts", async ({ page, externalRequests }) => {
  await page.goto("/math-in-embeds/host")
  const embed = page.locator(".prose .markdown-embed")

  const inline = embed.locator("p .katex").first()
  await expect(inline).toBeVisible()
  await expect(inline.locator("annotation")).toHaveText("a^2 + b^2 = c^2")
  await expect(embed.locator(".katex-display")).toHaveCount(2)
  await expect(embed.locator(".katex-display").first()).toHaveCSS("text-align", "center")
  await expect(embed.locator("code")).toHaveCount(0)
  await expect(inline.locator(".katex-html .mord.mathnormal").first()).toHaveCSS("font-family", /KaTeX_Math/)
  expect(externalRequests).toEqual([])
})
