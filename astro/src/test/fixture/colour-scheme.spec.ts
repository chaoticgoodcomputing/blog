import type { Page } from "@playwright/test"
import { expect, test } from "../site.ts"

// The palette's two values for the page's background (src/styles/global.css).
const light = "rgb(250, 248, 248)"
const dark = "rgb(22, 22, 24)"

const note = "/content/notes/alpha"
const other = "/content/notes/beta"

const toggle = (page: Page) => page.locator(".graph-column").getByRole("switch", { name: "Dark colour scheme" })
const background = (page: Page) => page.locator("body")

test("the switch is to the right of the search box, on its row", async ({ page }) => {
  await page.goto(note)
  const search = (await page.locator(".graph-column").getByRole("button", { name: "Search" }).boundingBox())!
  const toggleBox = (await toggle(page).boundingBox())!
  expect(toggleBox.x).toBeGreaterThanOrEqual(search.x + search.width)
  expect(toggleBox.y + toggleBox.height / 2).toBeCloseTo(search.y + search.height / 2, 0)
})

test("the switch puts the page in the other colour scheme, and back", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto(note)
  await expect(background(page)).toHaveCSS("background-color", light)
  await expect(toggle(page)).not.toBeChecked()

  await toggle(page).click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await expect(background(page)).toHaveCSS("background-color", dark)
  await expect(toggle(page)).toBeChecked()

  await toggle(page).click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
  await expect(background(page)).toHaveCSS("background-color", light)
  await expect(toggle(page)).not.toBeChecked()
})

test("the choice is kept for the next page, and for the next visit", async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto(note)
  await toggle(page).click()

  await page.goto(other)
  await expect(background(page)).toHaveCSS("background-color", dark)
  await expect(toggle(page)).toBeChecked()

  // A visit later: another tab of the same browser, opened at the first page.
  await page.close()
  const later = await context.newPage()
  await later.emulateMedia({ colorScheme: "light" })
  await later.goto(note)
  await expect(background(later)).toHaveCSS("background-color", dark)
  await expect(toggle(later)).toBeChecked()
})

test("a kept scheme is on the page before anything of its body is, so the other palette is never painted", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto(note)
  await toggle(page).click()

  // Every scheme the root is in, from the moment the body begins to be parsed. A page is painted
  // no sooner, so a page that showed the other palette first would have it in this list.
  await page.addInitScript(() => {
    const seen: (string | null)[] = []
    Object.assign(window, { schemes: seen })
    const record = () => {
      const scheme = document.documentElement.dataset.theme ?? null
      if (seen.at(-1) !== scheme) seen.push(scheme)
    }
    new MutationObserver(() => document.body && record()).observe(document, { childList: true, subtree: true, attributes: true })
  })
  await page.goto(other)
  await expect(background(page)).toHaveCSS("background-color", dark)
  expect(await page.evaluate(() => (window as unknown as { schemes: (string | null)[] }).schemes)).toEqual(["dark"])
})

/** Follows the link in the first note's body to the other, by the client router, not a page load. */
async function navigate(page: Page) {
  await page.evaluate(() => Object.assign(window, { sameDocument: true }))
  await page.locator(".prose").getByRole("link", { name: "beta" }).click()
  await expect(page).toHaveURL(other)
  expect(await page.evaluate(() => (window as unknown as { sameDocument?: boolean }).sameDocument)).toBe(true)
}

test("a kept scheme survives a client-side navigation", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto(note)
  await toggle(page).click()

  await navigate(page)
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await expect(background(page)).toHaveCSS("background-color", dark)
  await expect(toggle(page)).toBeChecked()
})

test("a scheme chosen where storage is refused survives a client-side navigation", async ({ page }) => {
  // A private window, or a reader's settings, can refuse local storage: every use of it throws.
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("The operation is insecure.", "SecurityError")
      },
    })
  })
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto(note)
  await toggle(page).click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")

  await navigate(page)
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await expect(background(page)).toHaveCSS("background-color", dark)
  await expect(toggle(page)).toBeChecked()
})

// The same block of code in a Markdown note and in an MDX note, which is compiled to a program.
for (const [kind, code] of [
  ["a Markdown note", "/colour-scheme/code"],
  ["an MDX note", "/colour-scheme/code-in-mdx"],
] as const) {
  test.describe(`a block of code in ${kind} is highlighted in the page's scheme`, () => {
    // `const` as GitHub's two themes colour a keyword: github-light's #d73a49, github-dark's #f97583.
    const keyword = { light: "rgb(215, 58, 73)", dark: "rgb(249, 117, 131)" }
    const word = (page: Page) => page.locator(".prose pre").getByText("const", { exact: true })

    for (const colorScheme of ["light", "dark"] as const) {
      test(`the system's, ${colorScheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme })
        await page.goto(code)
        await expect(word(page)).toHaveCSS("color", keyword[colorScheme])
      })
    }

    test("the reader's, once they switch", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "light" })
      await page.goto(code)
      await toggle(page).click()
      await expect(word(page)).toHaveCSS("color", keyword.dark)
      await toggle(page).click()
      await expect(word(page)).toHaveCSS("color", keyword.light)
    })
  })
}

test("an embedded drawing shows the export for the scheme the reader switches to", async ({ page }) => {
  // colour-scheme/drawing embeds `scheme-sketch`, which has a light and a dark export.
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/colour-scheme/drawing")
  const sketch = page.locator(".prose .excalidraw-embed").getByRole("img", { name: "scheme-sketch" })
  await expect(sketch).toHaveAttribute("src", "/drawings/colour-scheme/scheme-sketch.light.svg")

  await toggle(page).click()
  await expect(sketch).toHaveAttribute("src", "/drawings/colour-scheme/scheme-sketch.dark.svg")
  await expect(sketch).toBeVisible()
  await toggle(page).click()
  await expect(sketch).toHaveAttribute("src", "/drawings/colour-scheme/scheme-sketch.light.svg")
})

test.describe("with no scheme chosen", () => {
  for (const [colorScheme, colour] of [["light", light], ["dark", dark]] as const) {
    test(`a system in the ${colorScheme} scheme has the page in it`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await page.goto(note)
      await expect(background(page)).toHaveCSS("background-color", colour)
      await expect(page.locator("html")).not.toHaveAttribute("data-theme")
      if (colorScheme === "dark") await expect(toggle(page)).toBeChecked()
      else await expect(toggle(page)).not.toBeChecked()
    })
  }

  test("the page follows the system when it changes, and the switch says so", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto(note)
    await page.emulateMedia({ colorScheme: "dark" })
    await expect(background(page)).toHaveCSS("background-color", dark)
    await expect(toggle(page)).toBeChecked()
  })
})

test.describe("a change of scheme is announced by `themechange` on the document", () => {
  /** Records the scheme each `themechange` names, from before the page's own scripts run. */
  async function listen(page: Page) {
    await page.addInitScript(() => {
      const heard: unknown[] = []
      Object.assign(window, { heard })
      document.addEventListener("themechange", (event) => heard.push((event as CustomEvent).detail?.theme))
    })
    return () => page.evaluate(() => (window as unknown as { heard: unknown[] }).heard)
  }

  test("by the switch", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" })
    const heard = await listen(page)
    await page.goto(note)
    expect(await heard()).toEqual([])
    await toggle(page).click()
    await toggle(page).click()
    expect(await heard()).toEqual(["dark", "light"])
  })

  test("by the system, while the reader has chosen none", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" })
    const heard = await listen(page)
    await page.goto(note)
    await page.emulateMedia({ colorScheme: "dark" })
    await expect.poll(heard).toEqual(["dark"])
  })

  test("and not by the system, once the reader has chosen", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" })
    const heard = await listen(page)
    await page.goto(note)
    await toggle(page).click()
    await page.emulateMedia({ colorScheme: "dark" })
    await page.emulateMedia({ colorScheme: "light" })
    expect(await heard()).toEqual(["dark"])
    await expect(background(page)).toHaveCSS("background-color", dark)
  })
})
