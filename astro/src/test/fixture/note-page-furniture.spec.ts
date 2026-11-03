import { site } from "../../site.config.ts"
import { expect, test } from "../site.ts"

// A note of five hundred and some words, dated in its frontmatter, with headings; and a short note
// with no headings.
const sections = "/note-page-furniture/A-note-with-sections"
const noHeadings = "/note-page-furniture/no-headings"
// Which of the tests about the link to a note's file runs is the site's setting, `site.sourceLink`.
const skipUnlessLinked = () => test.skip(!site.sourceLink, "the site links to no note's file")

test("a note links to its file in the repository", async ({ page }) => {
  skipUnlessLinked()
  await page.goto(sections)
  await expect(page.locator(".after-body .source-link").getByRole("link", { name: "View source on GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/chaoticgoodcomputing/blog/blob/main/content/public/note-page-furniture/A%20note%20with%20sections.md",
  )
})

test("the link to a note's file is drawn as a button, with GitHub's mark, and not underlined", async ({ page }) => {
  skipUnlessLinked()
  await page.goto(sections)
  const link = page.locator(".after-body .source-link").getByRole("link", { name: "View source on GitHub" })
  await expect(link.locator("svg")).toBeVisible()
  await expect(link).toHaveCSS("text-decoration-line", "none")
  await expect(link).toHaveCSS("border-top-style", "solid")
  await expect(link).toHaveCSS("display", "inline-flex")
})

test("a note with no headings still has its date, reading time and source, where the site links to it", async ({ page }) => {
  await page.goto(noHeadings)
  await expect(page.locator(".date-and-reading-time")).toHaveText("Mar 15, 2026, 1 min read")
  if (!site.sourceLink) return
  await expect(page.locator(".source-link a")).toHaveAttribute(
    "href",
    "https://github.com/chaoticgoodcomputing/blog/blob/main/content/public/note-page-furniture/no-headings.md",
  )
})

test("the home page has no date, reading time or source link", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText("Fixture Home")
  for (const furniture of [".date-and-reading-time", ".source-link"]) {
    await expect(page.locator(furniture)).toHaveCount(0)
  }
})

test("with the link to a note's file off, a note has none", async ({ page }) => {
  test.skip(site.sourceLink, "the site links to each note's file")
  await page.goto(sections)
  await expect(page.locator(".source-link")).toHaveCount(0)
})
