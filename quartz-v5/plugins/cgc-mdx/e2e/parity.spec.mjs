// The body stays on Quartz's configured pipeline (#19): an .mdx page renders like its .md twin.
import { test, expect } from "../../../tests/harness/test.mjs"

test("an .mdx page is served at a clean URL", async ({ emitted }) => {
  expect(emitted.exists("mdx-article.html")).toBe(true)
  expect(emitted.exists("mdx-article.mdx.html")).toBe(false)
})

test("the configured transformers ran on the body", async ({ page }) => {
  await page.goto("/mdx-article")
  const article = page.locator("article")
  await expect(article.locator("a.internal", { hasText: "plain-note" })).toHaveAttribute("href", /plain-note$/)
  await expect(article.locator("table")).toBeVisible()
  await expect(article.locator("pre code[data-language='ts']")).toBeVisible()
  await expect(article.locator(".katex").first()).toBeAttached()
  await expect(article.locator(".callout")).toBeVisible()
  await expect(article.locator("section[data-footnotes]")).toBeAttached()
})

test("the page takes part in the site like a markdown page", async ({ page }) => {
  await page.goto("/plain-note")
  await expect(page.locator(".backlinks a", { hasText: "MDX Article" })).toBeVisible()
})
