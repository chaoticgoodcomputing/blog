import type { Locator } from "@playwright/test"
import { contrast } from "../contrast.ts"
import { expect, expectAt, test } from "../site.ts"

// A note with headings, with a note embedded in it that has a heading of the same name as one of
// its own.
const sections = "/heading-anchors/sections"

const anchorOf = (heading: Locator) => heading.locator("a.heading-anchor")

test("each heading of a note ends with a link to itself, shown while the pointer is on the heading", async ({
  page,
}) => {
  await page.goto(sections)
  const heading = page.locator(".prose h3", { hasText: "Details" })
  const anchor = anchorOf(heading)
  await expect(anchor).toHaveAttribute("href", "#details")
  await expect(anchor.locator("svg")).toHaveCount(1)
  await expect(anchor).toHaveCSS("opacity", "0")

  await heading.hover()
  await expect(anchor).toHaveCSS("opacity", "1")
  await anchor.click()
  await expectAt(page, new RegExp(`${sections}#details$`))
  await expect(page.locator("#details")).toBeInViewport()
})

test("a heading of an MDX note has its link too", async ({ page }) => {
  await page.goto("/heading-anchors/program")
  const anchor = anchorOf(page.locator(".prose h2", { hasText: "In a program" }))
  await expect(anchor).toHaveAttribute("href", "#in-a-program")
  await expect(anchor.locator("svg path")).toHaveCount(1)
})

test("the link is for the pointer: a screen reader reads the heading alone, and the keyboard passes it by", async ({
  page,
}) => {
  await page.goto(sections)
  const heading = page.locator(".prose").getByRole("heading", { name: "Details", exact: true })
  await expect(heading).toHaveCount(1)
  await expect(heading.getByRole("link")).toHaveCount(0)
  await expect(anchorOf(heading)).toHaveAttribute("tabindex", "-1")
})

test("an embedded note's heading links to its own place on the page, not to the page's heading of that name", async ({
  page,
}) => {
  await page.goto(sections)
  const embedded = page.locator(".prose .internal-embed h2", { hasText: "Overview" })
  const own = page.locator(".prose > h2", { hasText: "Overview" })
  await expect(anchorOf(own)).toHaveAttribute("href", "#overview")
  const href = await anchorOf(embedded).getAttribute("href")
  expect(href).not.toBe("#overview")
  expect(href).toBe(`#${await embedded.getAttribute("id")}`)
  await expect(page.locator(`[id="${href!.slice(1)}"]`)).toHaveCount(1)

  await embedded.hover()
  await anchorOf(embedded).click()
  await expect(embedded).toBeInViewport()
})

for (const colorScheme of ["light", "dark"] as const) {
  test(`the link is legible on the page in the ${colorScheme} scheme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto(sections)
    const heading = page.locator(".prose h2", { hasText: "Elsewhere" })
    await heading.hover()
    const { fore, back } = await colours(anchorOf(heading))
    expect(contrast(fore, back)).toBeGreaterThanOrEqual(3)
  })
}

test("resting on a heading's link shows no preview of the heading the pointer is on", async ({ page }) => {
  await page.goto(sections)
  const heading = page.locator(".prose h2", { hasText: "Elsewhere" })
  await heading.hover()
  await anchorOf(heading).hover()
  await page.waitForTimeout(1000)
  await expect(page.locator(".link-popover")).toBeHidden()
})

test("a preview of a note shows its headings without their links", async ({ page }) => {
  await page.goto(sections)
  await page.locator(".prose").getByRole("link", { name: "the part’s overview", exact: true }).hover()
  const popover = page.locator(".link-popover")
  await expect(popover.getByRole("heading", { name: "Overview" })).toBeVisible()
  await expect(popover.locator("a.heading-anchor")).toHaveCount(0)
})

/** An element's colour, and the page's background, as the browser computes them. */
function colours(element: Locator) {
  return element.evaluate((element) => ({
    fore: getComputedStyle(element).color,
    back: getComputedStyle(document.body).backgroundColor,
  }))
}
