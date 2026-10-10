import { expect, test } from "../site.ts"

// test/fixtures/vault/search: `A Findable Note`, about quillwort, and `An Unfindable Note`, a
// private page that mentions quillwort and a bramblefinch.

test("a reader searches from the left sidebar, and a result opens its note", async ({ page }) => {
  await page.goto("/site-shell/body")
  await page.locator("aside.left").getByRole("button", { name: "Search" }).click()

  const search = page.getByRole("dialog", { name: "Search" })
  await expect(search).toBeVisible()
  await search.getByRole("searchbox").fill("quillwort")

  const result = search.getByRole("link", { name: /A Findable Note/ })
  await expect(result).toBeVisible()
  // The passage that matched, with the word marked.
  await expect(result).toContainText("The quillwort grows at the edge of the pond")
  await expect(result.locator("mark")).toHaveText("quillwort")

  await result.click()
  await expect(page).toHaveURL(/\/search\/findable$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A Findable Note")
})

test("a page under a private tag is not found, by any word on it", async ({ page }) => {
  await page.goto("/site-shell/body")
  await page.keyboard.press("Control+k")
  const search = page.getByRole("dialog", { name: "Search" })

  // A word both pages have finds only the page that is not private.
  await search.getByRole("searchbox").fill("quillwort")
  await expect(search.getByRole("link", { name: /A Findable Note/ })).toBeVisible()
  await expect(search.getByRole("link", { name: /An Unfindable Note/ })).toHaveCount(0)

  // A word only the private page has finds it neither. (Pagefind, finding no page with the word,
  // shows the pages with a word the search starts with, so what this finds is not nothing.)
  await search.getByRole("searchbox").fill("bramblefinch")
  await expect(search.getByRole("link").first()).toBeVisible()
  await expect(search.locator('a[href="/search/drafts/unfindable"]')).toHaveCount(0)
  await expect(search).not.toContainText("bramblefinch", { useInnerText: true })

  // The page is still there, at its address.
  expect((await page.request.get("/search/drafts/unfindable")).status()).toBe(200)
})

test("a word that is only in the site shell finds nothing", async ({ page }) => {
  await page.goto("/site-shell/body")
  await page.keyboard.press("Control+k")
  const search = page.getByRole("dialog", { name: "Search" })
  // By its class: with nothing to say, the status has no text, and no role in the page's tree.
  const status = search.locator(".search-status")
  const results = search.locator(".search-results")
  // Each is on every page: in the footer, and in the left sidebar. No page is found by it. (Pagefind,
  // finding no page with the word, shows the pages with a word the search starts with: the spaced
  // capitals of test/fixtures/vault/annotations/handbook start "Elkington". So what this finds may
  // be not nothing, but the word itself is on none of it.)
  for (const word of ["Copyright", "Elkington"]) {
    await search.getByRole("searchbox").fill(word)
    await expect
      .poll(async () => {
        const said = await status.textContent()
        return said === `Nothing found for “${word}”.` || (said === "" && (await results.getByRole("link").count()) > 0)
      })
      .toBe(true)
    await expect(results).not.toContainText(word, { ignoreCase: true })
  }
})

test("a note's date, reading time and tags are not what a result shows, nor what a search finds", async ({ page }) => {
  await page.goto("/site-shell/body")
  await page.keyboard.press("Control+k")
  const search = page.getByRole("dialog", { name: "Search" })

  // The note's header reads "Jul 20, 2026, 1 min read": its passage is what matched.
  await search.getByRole("searchbox").fill("quillwort")
  const result = search.getByRole("link", { name: /A Findable Note/ })
  await expect(result).toContainText("The quillwort grows")
  await expect(result).not.toContainText("min read")
  await expect(result).not.toContainText("Jul 20")

  // Every note's header says how long it takes to read; no note says so in its text. (Pagefind,
  // finding no page with the words, may show pages with words they start, as the shell's words do.)
  await search.getByRole("searchbox").fill("min read")
  const status = search.locator(".search-status")
  const results = search.locator(".search-results")
  await expect
    .poll(async () => {
      const said = await status.textContent()
      return said === "Nothing found for “min read”." || (said === "" && (await results.getByRole("link").count()) > 0)
    })
    .toBe(true)
  await expect(results).not.toContainText("min read")
})

test("nothing of the index is fetched until the reader types a search", async ({ page }) => {
  const fetched: string[] = []
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/pagefind/")) fetched.push(request.url())
  })
  await page.goto("/site-shell/body")
  await page.waitForLoadState("networkidle")
  await page.locator("aside.left").getByRole("button", { name: "Search" }).click()
  await page.waitForLoadState("networkidle")
  expect(fetched).toEqual([])

  await page.getByRole("dialog", { name: "Search" }).getByRole("searchbox").fill("quillwort")
  await expect(page.getByRole("link", { name: /A Findable Note/ })).toBeVisible()
  expect(fetched.length).toBeGreaterThan(0)
})

test("on a phone the search box and its results fit the screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto("/site-shell/body")
  await page.locator("aside.left").getByRole("button", { name: "Search" }).click()
  const search = page.getByRole("dialog", { name: "Search" })
  await search.getByRole("searchbox").fill("quillwort")
  await expect(search.getByRole("link", { name: /A Findable Note/ })).toBeVisible()

  const box = (await search.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(16)
  expect(box.x + box.width).toBeLessThanOrEqual(390 - 16)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBe(0)
})

for (const shortcut of ["Control+k", "Meta+k"]) {
  test(`${shortcut} opens the search box from anywhere on the page, and Escape closes it`, async ({ page }) => {
    await page.goto("/site-shell/body")
    const search = page.getByRole("dialog", { name: "Search" })
    await expect(search).toBeHidden()

    await page.keyboard.press(shortcut)
    await expect(search).toBeVisible()
    await expect(search.getByRole("searchbox")).toBeFocused()

    await page.keyboard.type("quillwort")
    await expect(search.getByRole("link", { name: /A Findable Note/ })).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(search).toBeHidden()

    // Opened again, the box still holds the search, and Enter goes to its first result.
    await page.keyboard.press(shortcut)
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/\/search\/findable$/)
  })
}

test("Enter pressed before the results arrive opens the first result once they do", async ({ page }) => {
  await page.goto("/site-shell/body")
  await page.keyboard.press("Control+k")
  // Typed and entered at once: nothing of the index is loaded yet, so there is no result to go to.
  await page.keyboard.type("quillwort")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/search\/findable$/)
})
