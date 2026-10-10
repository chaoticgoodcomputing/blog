import { expect, test } from "../site.ts"

// A note of five hundred and some words, dated in its frontmatter, with headings at three levels
// and a fourth, one of them with math; and a short note with no headings.
const sections = "/note-page-furniture/A-note-with-sections"
const noHeadings = "/note-page-furniture/no-headings"

// The site's widths (README.md, "Styling"): a desktop from 1300px, a tablet from 1000px.
const desktop = { width: 1300, height: 800 }
const tablet = { width: 1299, height: 800 }
const phone = { width: 390, height: 844 }

test("a note's date and reading time are under its title", async ({ page }) => {
  await page.goto(sections)
  const meta = page.locator("main header .date-and-reading-time")
  await expect(meta).toHaveText("Mar 14, 2026, 3 min read")
  await expect(meta.locator(".formatted-date")).toHaveAttribute("datetime", "2026-03-14T00:00:00.000Z")
})

test("a note links to its file in the repository", async ({ page }) => {
  await page.goto(sections)
  await expect(page.locator(".after-body .source-link").getByRole("link", { name: "View source on GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/chaoticgoodcomputing/blog/blob/main/content/public/note-page-furniture/A%20note%20with%20sections.md",
  )
})

test("the link to a note's file is drawn as a button, with GitHub's mark, and not underlined", async ({ page }) => {
  await page.goto(sections)
  const link = page.locator(".after-body .source-link").getByRole("link", { name: "View source on GitHub" })
  await expect(link.locator("svg")).toBeVisible()
  await expect(link).toHaveCSS("text-decoration-line", "none")
  await expect(link).toHaveCSS("border-top-style", "solid")
  await expect(link).toHaveCSS("display", "inline-flex")
})

test("on a desktop, a table of contents in the right sidebar links to each of the note's headings to the third level", async ({
  page,
}) => {
  await page.setViewportSize(desktop)
  await page.goto(sections)
  const contents = page.locator("aside.right .table-of-contents")
  await expect(contents.getByRole("heading", { level: 2 })).toHaveText("Table of Contents")
  const links = contents.getByRole("link")
  // The heading with math reads as it is written, not as KaTeX typesets it.
  await expect(links).toHaveText(["Getting started", "A smaller step", "The x value", "The end"])

  await links.filter({ hasText: "A smaller step" }).click()
  await expect(page).toHaveURL(/#a-smaller-step$/)
  await expect(page.locator("#a-smaller-step")).toBeInViewport()
  await links.filter({ hasText: "The x value" }).click()
  await expect(page).toHaveURL(/#the-x-value$/)
})

test("the table of contents marks the section being read", async ({ page }) => {
  await page.setViewportSize(desktop)
  await page.goto(sections)
  const contents = page.locator("aside.right .table-of-contents")
  const current = contents.locator('a[aria-current="location"]')

  // The top of the page is the paragraph before the first heading, in no section.
  await expect(current).toHaveCount(0)

  await page.locator("#a-smaller-step").evaluate((heading) => heading.scrollIntoView())
  await expect(current).toHaveText(["A smaller step"])

  // A deeper heading the table does not list is still in the section of the one above it.
  await page.locator("#too-deep-to-list").evaluate((heading) => heading.scrollIntoView())
  await expect(current).toHaveText(["A smaller step"])

  await page.locator("#getting-started").evaluate((heading) => heading.scrollIntoView())
  await expect(current).toHaveText(["Getting started"])
})

test("the table of contents folds from a button in its heading, which says whether it is open", async ({ page }) => {
  await page.setViewportSize(desktop)
  await page.goto(sections)
  const contents = page.locator("aside.right .table-of-contents")
  const fold = contents.getByRole("heading", { level: 2 }).getByRole("button", { name: "Table of Contents" })
  const links = contents.getByRole("link")
  await expect(fold).toHaveAttribute("aria-expanded", "true")
  await expect(fold.locator("svg")).toBeVisible()
  await expect(links.first()).toBeVisible()

  await fold.click()
  await expect(fold).toHaveAttribute("aria-expanded", "false")
  // Folded away, the links are hidden from everyone, a screen reader too.
  await expect(links).toHaveCount(0)
  await expect(contents.locator("a")).toHaveCount(4)
  for (const link of await contents.locator("a").all()) await expect(link).toBeHidden()

  await fold.press("Enter")
  await expect(fold).toHaveAttribute("aria-expanded", "true")
  await expect(links.first()).toBeVisible()
})

test("the table of contents' links are set as the headings are, and not underlined", async ({ page }) => {
  await page.setViewportSize(desktop)
  await page.goto(sections)
  const link = page.locator("aside.right .table-of-contents").getByRole("link", { name: "Getting started" })
  await expect(link).toHaveCSS("text-decoration-line", "none")
  await expect(link).toHaveCSS("font-weight", "600")
  const heading = page.locator(".prose h2").first()
  expect(await link.evaluate((element) => getComputedStyle(element).fontFamily)).toBe(
    await heading.evaluate((element) => getComputedStyle(element).fontFamily),
  )
})

test("below a desktop there is no table of contents", async ({ page }) => {
  for (const size of [tablet, phone]) {
    await page.setViewportSize(size)
    await page.goto(sections)
    await expect(page.locator(".table-of-contents")).toBeHidden()
  }
})

test("a note with no headings has no table of contents, and still has its date, reading time and source", async ({
  page,
}) => {
  await page.setViewportSize(desktop)
  await page.goto(noHeadings)
  await expect(page.locator(".table-of-contents")).toHaveCount(0)
  await expect(page.locator(".date-and-reading-time")).toHaveText("Mar 15, 2026, 1 min read")
  await expect(page.locator(".source-link a")).toHaveAttribute(
    "href",
    "https://github.com/chaoticgoodcomputing/blog/blob/main/content/public/note-page-furniture/no-headings.md",
  )
})

test("the home page has no date, reading time, source link or table of contents", async ({ page }) => {
  await page.setViewportSize(desktop)
  await page.goto("/")
  await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText("Fixture Home")
  // The home note has a heading, so its table of contents is left out for the kind of page, not for
  // want of entries.
  await expect(page.locator(".prose").getByRole("heading", { level: 2, name: "On the home page" })).toBeVisible()
  for (const furniture of [".date-and-reading-time", ".source-link", ".table-of-contents"]) {
    await expect(page.locator(furniture)).toHaveCount(0)
  }
})
