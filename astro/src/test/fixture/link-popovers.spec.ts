import { devices, type Page } from "@playwright/test"
import { expect, test } from "../site.ts"

const start = "/link-popovers/start"

const popover = (page: Page) => page.locator(".link-popover")
const link = (page: Page, name: string) => page.locator(".prose").getByRole("link", { name, exact: true })

test("hovering a link to a note shows the note's content beside the link", async ({ page }) => {
  await page.goto(start)

  await link(page, "The previewed note").hover()

  await expect(popover(page)).toBeVisible()
  await expect(popover(page)).toContainText("The top of the previewed note.")
  await expect(popover(page).getByRole("heading", { name: "Far heading" })).toHaveCount(1)

  // Under the link, and inside the window.
  const linked = (await link(page, "The previewed note").boundingBox())!
  const shown = (await popover(page).boundingBox())!
  expect(shown.y).toBeGreaterThanOrEqual(linked.y + linked.height)
  expect(shown.y - (linked.y + linked.height)).toBeLessThan(10)
  expect(shown.x).toBeGreaterThanOrEqual(0)
  expect(shown.x + shown.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  expect(shown.y + shown.height).toBeLessThanOrEqual(page.viewportSize()!.height)
})

test("a preview's text is set in from its top edge, as from its sides", async ({ page }) => {
  await page.goto(start)

  await link(page, "The previewed note").hover()
  await expect(popover(page)).toContainText("The top of the previewed note.")

  const shown = (await popover(page).boundingBox())!
  const text = (await popover(page).getByText("The top of the previewed note.").boundingBox())!
  expect(text.y - shown.y).toBeGreaterThanOrEqual(text.x - shown.x)
})

test("a link to a heading opens the preview at the heading",async ({ page }) => {
  await page.goto(start)

  await link(page, "The far heading of the previewed note").hover()

  await expect(popover(page).getByRole("heading", { name: "Far heading" })).toBeInViewport()
  await expect(popover(page).getByText("The top of the previewed note.")).not.toBeInViewport()
})

test("a link to a heading of the note it is in opens the preview at the heading", async ({ page }) => {
  await page.goto("/link-popovers/destination")

  await link(page, "Its own far heading").hover()

  await expect(popover(page).getByRole("heading", { name: "Far heading" })).toBeInViewport()
  await expect(popover(page).getByText("The top of the previewed note.")).not.toBeInViewport()
})

test("a link to a block opens the preview at the block", async ({ page }) => {
  await page.goto(start)

  await link(page, "The far block of the previewed note").hover()

  await expect(popover(page).getByText("A block far down the previewed note.")).toBeInViewport()
  await expect(popover(page).getByRole("heading", { name: "Far heading" })).not.toBeInViewport()
})

/** Rests the pointer on a link for long enough that a preview of it would have been shown. */
async function restOn(page: Page, name: string) {
  await link(page, name).hover()
  await page.waitForTimeout(1000)
}

for (const name of ["A note that is not there", "The notes, an attachment"]) {
  test(`no preview is shown, or asked for, of a link to what is no note: ${name}`, async ({ page }) => {
    await page.goto(start)
    await page.waitForLoadState("networkidle")
    // What a script fetches. The client router's prefetch of a link it rests on is a request too,
    // and is the router's (ticket 09).
    const asked: string[] = []
    page.on("request", (request) => {
      if (request.resourceType() === "fetch") asked.push(new URL(request.url()).pathname)
    })

    await restOn(page, name)

    await expect(popover(page)).toBeHidden()
    expect(asked).toEqual([])
  })
}

test("no preview is shown, or asked for, of a link a widget draws to an attachment", async ({ page }) => {
  await page.goto(start)
  await page.waitForLoadState("networkidle")
  // A widget's own markup, as the vault's résumé widget draws its links to a PDF: no Markdown made
  // it, so it carries no `data-astro-reload`.
  await page.locator(".prose").evaluate((prose) => {
    const widget = document.createElement("a")
    widget.href = "/link-popovers/files/notes.txt"
    widget.textContent = "The notes, from a widget"
    prose.append(widget)
  })
  const asked: string[] = []
  page.on("request", (request) => {
    if (request.resourceType() === "fetch") asked.push(new URL(request.url()).pathname)
  })

  await restOn(page, "The notes, from a widget")

  await expect(popover(page)).toBeHidden()
  expect(asked).toEqual([])
})

test("no preview is shown of a note with nothing in it", async ({ page }) => {
  await page.goto(start)

  await restOn(page, "An empty note")

  await expect(popover(page)).toBeHidden()
})

test("a touch on a screen whose pointer also hovers shows no preview", async ({ page }) => {
  await page.goto(start)

  await link(page, "The previewed note").dispatchEvent("pointerover", { pointerType: "touch", bubbles: true })
  await page.waitForTimeout(1000)

  await expect(popover(page)).toBeHidden()
})

/** Moves the pointer to the top left of the window, where there is nothing on any page. */
const away = (page: Page) => page.mouse.move(2, 2)

test("the preview closes when the pointer leaves the link", async ({ page }) => {
  await page.goto(start)
  await link(page, "The previewed note").hover()
  await expect(popover(page)).toBeVisible()

  await away(page)

  await expect(popover(page)).toBeHidden()
})

test("the preview stays open while the pointer is on it, and closes when it leaves", async ({ page }) => {
  await page.goto(start)
  await link(page, "The previewed note").hover()
  await expect(popover(page)).toBeVisible()

  await popover(page).hover()
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(1000)
  await expect(popover(page)).toBeVisible()
  await expect(popover(page).getByText("The top of the previewed note.")).not.toBeInViewport()

  await away(page)
  await expect(popover(page)).toBeHidden()
})

test("Escape closes the preview", async ({ page }) => {
  await page.goto(start)
  await link(page, "The previewed note").hover()
  await expect(popover(page)).toBeVisible()

  await page.keyboard.press("Escape")

  await expect(popover(page)).toBeHidden()
})

test("a preview takes no focus, and Tab goes on through the page as it would without one", async ({ page }) => {
  await page.goto(start)
  await link(page, "The previewed note").focus()

  await link(page, "A note with math").hover()
  await expect(popover(page)).toBeVisible()
  await expect(link(page, "The previewed note")).toBeFocused()

  await page.keyboard.press("Tab")
  await expect(link(page, "The far heading of the previewed note")).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(link(page, "The far block of the previewed note")).toBeFocused()
})

test("a preview of a note with a diagram, from a page with none, shows its source and loads no mermaid", async ({
  page,
}) => {
  const scripts: string[] = []
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(new URL(request.url()).pathname)
  })
  await page.goto(start)

  await link(page, "A note with a diagram").hover()

  await expect(popover(page)).toContainText("Before the previewed diagram.")
  await expect(popover(page).locator("pre")).toContainText("A[Hovered] --> B[Previewed]")
  await page.waitForLoadState("networkidle")
  expect(scripts.filter((script) => /mermaid/i.test(script))).toEqual([])
})

test("a preview of a note with math, from a page with none, typesets it", async ({ page }) => {
  await page.goto(start)

  await link(page, "A note with math").hover()

  await expect(popover(page)).toContainText("The previewed formula:")
  // The typeset glyphs are drawn in KaTeX's own fonts, which only its stylesheet names.
  await expect(popover(page).locator(".katex-html .mord.mathnormal").first()).toHaveCSS("font-family", /KaTeX_Math/)
})

test("on a page reached by client-side navigation, a link shows its preview", async ({ page }) => {
  await page.goto(start)
  await page.evaluate(() => Object.assign(window, { navigationMark: "kept" }))

  await link(page, "Another page with links").click()
  await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText("Another page with links")
  expect(await page.evaluate(() => (window as unknown as { navigationMark?: string }).navigationMark)).toBe("kept")
  await expect(popover(page)).toBeHidden()

  await link(page, "the previewed note").hover()

  await expect(popover(page)).toBeVisible()
  await expect(popover(page)).toContainText("The top of the previewed note.")
  await expect(popover(page)).toHaveCount(1)
})

test.describe("outside a note's body", () => {
  // A desktop's window.
  test.use({ viewport: { width: 1440, height: 900 } })

  test("a link in the backlinks, a post listing or a tag badge shows its preview too", async ({
    page,
  }) => {
    const links = {
      backlinks: ["/link-popovers/destination", '.backlinks a[href="/link-popovers/start"]', "Each link here is pointed at"],
      "post listing": ["/tags/previewing", '.post-listing a[href="/link-popovers/tagged"]', "The top of the tagged note"],
      "tag badge": ["/link-popovers/tagged", 'main header .tag-badge[href="/tags/previewing"]', "The description of the previewed tag"],
    }
    for (const [where, [address, selector, text]] of Object.entries(links)) {
      await page.goto(address!)
      await page.locator(selector!).first().hover()
      await expect(popover(page), where).toBeVisible()
      await expect(popover(page), where).toContainText(text!)
      await away(page)
      await expect(popover(page), where).toBeHidden()
    }
  })

  test("the site's title, to the home page, shows none", async ({ page }) => {
    await page.goto("/link-popovers/tagged")

    await page.locator(".site-title").hover()
    await page.waitForTimeout(1000)

    await expect(popover(page)).toBeHidden()
  })

  test("a search result, over the results under it, shows none", async ({ page }) => {
    await page.goto(start)
    await page.keyboard.press("Control+k")
    const search = page.getByRole("dialog", { name: "Search" })
    await search.getByRole("searchbox").fill("tagged")
    const result = search.locator('a[href="/link-popovers/tagged"]')

    await result.hover()
    await page.waitForTimeout(1000)

    await expect(popover(page)).toBeHidden()
  })
})

test.describe("on a phone", () => {
  // A phone's screen, touch, and no pointer that hovers; the browser is the suite's own.
  const { defaultBrowserType: _, ...phone } = devices["Pixel 7"]
  test.use(phone)

  test("no preview is shown", async ({ page }) => {
    await page.goto(start)

    await restOn(page, "The previewed note")

    await expect(popover(page)).toBeHidden()
  })
})
