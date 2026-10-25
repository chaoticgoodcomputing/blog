import type { Page } from "@playwright/test"
import { expect, expectAt, test } from "../site.ts"

const start = "/client-side-navigation/start"

/**
 * Leaves a mark on the window, which a full page load wipes out and a navigation that swaps the
 * page's content keeps.
 */
const mark = (page: Page) => page.evaluate(() => Object.assign(window, { navigationMark: "kept" }))
const marked = (page: Page) => page.evaluate(() => (window as unknown as { navigationMark?: string }).navigationMark)

const heading = (page: Page) => page.locator("main").getByRole("heading", { level: 1 })

test("following a link changes the page without loading a new one", async ({ page }) => {
  await page.goto(start)
  await mark(page)

  await page.getByRole("link", { name: "To the destination" }).click()

  await expectAt(page, "/client-side-navigation/destination")
  await expect(heading(page)).toHaveText("The destination")
  // The head is swapped with the page: the title, with the site's suffix (ticket 16), is the new one's.
  await expect(page).toHaveTitle("The destination | Spencer Elkington")
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/client-side-navigation\/destination$/)
  expect(await marked(page)).toBe("kept")
})

test("the back and forward buttons go between pages reached by links, without loading either", async ({ page }) => {
  await page.goto(start)
  await mark(page)
  await page.getByRole("link", { name: "To the destination" }).click()
  await expect(heading(page)).toHaveText("The destination")

  await page.goBack()
  await expectAt(page, start)
  await expect(heading(page)).toHaveText("Where navigation starts")

  await page.goForward()
  await expectAt(page, "/client-side-navigation/destination")
  await expect(heading(page)).toHaveText("The destination")
  expect(await marked(page)).toBe("kept")
})

test("a link to a heading on another page lands on the heading", async ({ page }) => {
  await page.goto(start)
  await mark(page)

  await page.getByRole("link", { name: "To a heading far down the destination" }).click()

  await expectAt(page, "/client-side-navigation/destination#far-heading")
  await expect(page.getByRole("heading", { name: "Far heading" })).toBeInViewport()
  await expect(page.getByText("The top of the destination.")).not.toBeInViewport()
  expect(await marked(page)).toBe("kept")
})

test("a link to a block on another page lands on the block", async ({ page }) => {
  await page.goto(start)
  await mark(page)

  await page.getByRole("link", { name: "To a block far down the destination" }).click()

  await expect(page.getByText("A block far down the destination.")).toBeInViewport()
  await expect(page.getByRole("heading", { name: "Far heading" })).not.toBeInViewport()
  expect(await marked(page)).toBe("kept")
})

test("a diagram on a page reached by a link is drawn", async ({ page }) => {
  const errors: Error[] = []
  page.on("pageerror", (error) => errors.push(error))
  await page.goto(start)
  await mark(page)

  await page.getByRole("link", { name: "To a page with a diagram" }).click()

  await expectAt(page, "/mermaid/diagram")
  await expect(heading(page)).toHaveText("A diagram")
  const svg = page.locator(".prose mermaid-diagram svg")
  await expect(svg).toBeVisible()
  await expect(svg.getByText("Choice", { exact: true })).toBeVisible()
  expect(await marked(page)).toBe("kept")
  expect(errors).toEqual([])
})

// What the page's Bluesky post widget asks Bluesky for.
const bluesky = "https://public.api.bsky.app/**"

test("a widget on a page reached by a link is hydrated, and works", async ({ page }) => {
  // Bluesky's answer for a post that is not there, which the widget says in words of its own.
  await page.route(bluesky, (route) =>
    route.fulfill({ status: 400, json: { error: "NotFound", message: "Post not found" } }),
  )
  await page.goto(start)
  await mark(page)

  await page.getByRole("link", { name: "To a page with a widget" }).click()

  await expect(heading(page)).toHaveText("A page with a widget")
  await expect(page.getByRole("status")).toContainText("This post may have been deleted or is not publicly accessible.")
  expect(await marked(page)).toBe("kept")
})

test("a widget on a page that is left abandons its request", async ({ page }) => {
  // Bluesky never answers, so the widget's request is still open when its page is left.
  await page.route(bluesky, () => {})
  await page.goto(start)
  const asked = page.waitForRequest(bluesky)
  await page.getByRole("link", { name: "To a page with a widget" }).click()
  const request = await asked

  const abandoned = page.waitForEvent("requestfailed", (failed) => failed === request)
  await page.getByRole("link", { name: "the destination" }).click()

  await expect(heading(page)).toHaveText("The destination")
  expect((await abandoned).failure()?.errorText).toBe("net::ERR_ABORTED")
})

/** Rests the pointer on a link for longer than the router waits before fetching a page ahead. */
async function pointAt(page: Page, name: string) {
  await page.getByRole("link", { name }).hover()
  await page.waitForTimeout(300)
}

/** How each request the page makes for one of the fixture's attachments was made. */
function attachmentRequests(page: Page): string[] {
  const kinds: string[] = []
  page.on("request", (request) => {
    if (request.url().includes("/client-side-navigation/files/")) kinds.push(request.resourceType())
  })
  return kinds
}

test("a link to an attachment the browser can show opens it, asked for once, as a page is", async ({ page }) => {
  const requests = attachmentRequests(page)
  await page.goto(start)

  await pointAt(page, "The reading list")
  await page.getByRole("link", { name: "The reading list" }).click()

  await expectAt(page, "/client-side-navigation/files/reading%20list.txt")
  await expect(page.locator("body")).toHaveText("The reading list, as plain text.")
  expect(requests).toEqual(["document"])
})

test("a link to an attachment the browser can't show downloads it, asked for once", async ({ page }) => {
  const requests = attachmentRequests(page)
  await page.goto(start)

  const download = page.waitForEvent("download")
  await pointAt(page, "The handout")
  await page.getByRole("link", { name: "The handout" }).click()

  expect((await download).suggestedFilename()).toBe("handout.pdf")
  await expectAt(page, start)
  expect(requests).toEqual(["document"])
})

test.describe("with scripts disabled", () => {
  test.use({ javaScriptEnabled: false })

  test("a link is an ordinary link, to a page and to a heading on it", async ({ page }) => {
    await page.goto(start)
    await page.getByRole("link", { name: "To the destination" }).click()
    await expectAt(page, "/client-side-navigation/destination")
    await expect(heading(page)).toHaveText("The destination")

    await page.goBack()
    await page.getByRole("link", { name: "To a heading far down the destination" }).click()
    await expectAt(page, "/client-side-navigation/destination#far-heading")
    await expect(page.getByRole("heading", { name: "Far heading" })).toBeInViewport()
  })
})
