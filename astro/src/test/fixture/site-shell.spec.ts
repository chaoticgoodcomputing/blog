import type { Page } from "@playwright/test"
import { expect, test } from "../site.ts"

// A note with every kind of Markdown in its body, a table and a line of code wider than a phone
// among them, and a backlink.
const note = "/site-shell/body"

/** How far the page scrolls sideways: nothing, when it is as wide as the screen. */
const sideways = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

test("a note's page has the site title, a search box, the note and the footer", async ({ page }) => {
  await page.goto(note)

  const siteTitle = page.getByRole("link", { name: "Chaotic Good Computing by Spencer Elkington" })
  await expect(siteTitle).toHaveAttribute("href", "/")
  // The icon is drawn, at the size the title gives it. It has no name of its own beside the site's.
  const icon = siteTitle.locator("img")
  await expect(icon).toBeVisible()
  expect(await icon.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible()

  await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText("A note with everything in its body")
  await expect(page.locator("main .prose")).toContainText("After the rule.")

  const footer = page.getByRole("contentinfo")
  const links = {
    GitHub: "https://github.com/spelkington",
    Email: "mailto:spencer@chaoticgood.computer",
    LinkedIn: "https://www.linkedin.com/in/spelkington",
    Bluesky: "https://bsky.app/profile/speen.us",
    "Spencer Elkington": "https://chaoticgood.computer/contact",
    "Chaotic Good Computing": "https://github.com/chaoticgoodcomputing",
  }
  for (const [name, href] of Object.entries(links)) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href)
  }
  await expect(footer).toContainText(/Copyright Spencer Elkington & Chaotic Good Computing © 20\d\d/)
  await expect(footer).toContainText("All content on this site is handwritten.")
})

test("the footer's links are bold, and not underlined", async ({ page }) => {
  await page.goto(note)
  for (const link of await page.getByRole("contentinfo").getByRole("link").all()) {
    await expect(link).toHaveCSS("font-weight", "600")
    await expect(link).toHaveCSS("text-decoration-line", "none")
  }
})

test("the note body styles every kind of Markdown, not only Obsidian's", async ({ page }) => {
  await page.goto(note)
  const body = page.locator(".prose")
  const style = (selector: string, property: string) =>
    body
      .locator(selector)
      .first()
      .evaluate((element, property) => getComputedStyle(element).getPropertyValue(property), property)

  // Each heading level a step smaller, from a 16px root: 1.4rem, 1.12rem, 1rem.
  expect(await style("h2", "font-size")).toBe("22.4px")
  expect(await style("h3", "font-size")).toBe("17.92px")
  expect(await style("h4", "font-size")).toBe("16px")

  expect(await style("ul", "list-style-type")).toBe("disc")
  expect(await style("ul.contains-task-list", "list-style-type")).toBe("none")
  expect(await style("blockquote", "border-left-width")).toBe("3px")
  expect(await style("td", "border-bottom-style")).toBe("solid")
  expect(await style("pre", "font-family")).toContain("IBM Plex Mono")
  expect(await style("p > code", "font-family")).toContain("IBM Plex Mono")
  expect(await style("pre", "border-top-style")).toBe("solid")

  // The footnotes are set apart under the body, smaller, and their heading is for a screen reader.
  expect(await style(".footnotes", "border-top-style")).toBe("solid")
  expect(await style(".footnotes", "font-size")).toBe("14px")
  await expect(body.locator(".footnotes h2")).toHaveCSS("position", "absolute")
  await expect(body.locator(".footnotes h2")).toHaveCSS("width", "1px")
})

test("the shell takes its colours from the palette, in either colour scheme", async ({ page }) => {
  // The palette's values, as written in the site's configuration of old (research/quartz-site.md):
  // light, dark, secondary.
  const schemes = {
    light: { light: "rgb(250, 248, 248)", dark: "rgb(43, 43, 43)", secondary: "rgb(40, 75, 99)" },
    dark: { light: "rgb(22, 22, 24)", dark: "rgb(235, 235, 236)", secondary: "rgb(123, 151, 170)" },
  }
  for (const [scheme, palette] of Object.entries(schemes)) {
    await page.emulateMedia({ colorScheme: scheme as "light" | "dark" })
    await page.goto(note)
    await expect(page.locator("body"), scheme).toHaveCSS("background-color", palette.light)
    await expect(page.locator(".site-title"), scheme).toHaveCSS("color", palette.dark)
    await expect(page.getByRole("heading", { level: 1 }), scheme).toHaveCSS("color", palette.dark)
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "GitHub" }), scheme).toHaveCSS(
      "color",
      palette.secondary,
    )
  }
})

test("the shell reads its colours from the palette's tokens, and follows a token that changes", async ({ page }) => {
  await page.goto(note)
  await page.evaluate(() => {
    const root = document.documentElement.style
    root.setProperty("--light", "rgb(1, 2, 3)")
    root.setProperty("--dark", "rgb(4, 5, 6)")
    root.setProperty("--secondary", "rgb(7, 8, 9)")
  })
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(1, 2, 3)")
  await expect(page.locator(".site-title")).toHaveCSS("color", "rgb(4, 5, 6)")
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("color", "rgb(4, 5, 6)")
  await expect(page.locator(".prose h2").first()).toHaveCSS("color", "rgb(4, 5, 6)")
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "GitHub" })).toHaveCSS("color", "rgb(7, 8, 9)")
})

test("a callout of a kind with a colour of its own takes it from the palette, in either colour scheme", async ({
  page,
}) => {
  // A burnt orange in the light scheme, a light orange in the dark one, which its title is drawn in.
  const title = page.locator('.prose .callout[data-callout="warning"] > .callout-title')
  for (const [scheme, colour] of [
    ["light", "rgb(163, 68, 0)"],
    ["dark", "rgb(242, 155, 69)"],
  ] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto(note)
    await expect(title, scheme).toHaveCSS("color", colour)
  }
  await page.evaluate(() => document.documentElement.style.setProperty("--callout-warning", "rgb(1, 2, 3)"))
  await expect(title).toHaveCSS("color", "rgb(1, 2, 3)")
})

test("Inter and IBM Plex Mono are the site's own files, and no font comes from anywhere else", async ({
  page,
  baseURL,
  externalRequests,
}) => {
  const fonts: string[] = []
  page.on("request", (request) => {
    if (request.resourceType() === "font") fonts.push(request.url())
  })
  await page.goto(note)
  await page.evaluate(() => document.fonts.ready)

  expect(await page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily)).toMatch(/^"?Inter/)
  // Astro names each family it serves after the font, with a hash of its own, and a metric-matched
  // fallback beside it, which is a local font and no file.
  const loaded = await page.evaluate(() =>
    [...document.fonts]
      .filter((font) => font.status === "loaded" && !font.family.includes("fallback"))
      .map((font) => font.family.replaceAll('"', "").replace(/-[0-9a-f]+$/, "")),
  )
  expect(new Set(loaded)).toEqual(new Set(["Inter", "IBM Plex Mono"]))

  expect(fonts.length).toBeGreaterThan(0)
  for (const url of fonts) expect(url.startsWith(`${baseURL}/`), url).toBe(true)
  expect(externalRequests).toEqual([])
})

// A desktop, a tablet, a common phone, and the narrowest one the site is laid out for.
for (const width of [1440, 1100, 390, 320]) {
  test(`at ${width}px wide nothing scrolls sideways: what is wider than the note scrolls in its own box`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto(note)
    expect(await sideways(page)).toBe(0)

    // On a phone the note's wide table and long line of code are wider than the screen.
    if (width < 1000) {
      for (const wide of ["pre", "table"]) {
        const overflow = await page.locator(`.prose ${wide}`).evaluate((element) => element.scrollWidth - element.clientWidth)
        expect(overflow, wide).toBeGreaterThan(0)
      }
    }
    // A path in inline code, in a link or not, breaks where it must, and stays within the note.
    const main = (await page.locator("main").boundingBox())!
    for (const code of await page.locator(".prose p > code, .prose p > a > code").all()) {
      const box = (await code.boundingBox())!
      expect(box.x + box.width, (await code.textContent()) ?? "").toBeLessThanOrEqual(main.x + main.width)
    }
  })
}

test("on a phone the note comes first, and a menu opens the search box, the graph and the footer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(note)
  await expect(page.locator("main").getByRole("heading", { level: 1 })).toBeInViewport()
  await expect(page.getByRole("button", { name: "Search" })).toBeHidden()

  await page.getByRole("button", { name: "Menu" }).click()
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible()
  await expect(page.getByRole("region", { name: "Graph View" }).locator("canvas")).toBeVisible()
  await expect(page.getByRole("contentinfo")).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(page.getByRole("button", { name: "Search" })).toBeHidden()
})

test("on a phone a title with nowhere to break breaks anyway, and nothing scrolls sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto("/site-shell/long-title")
  const title = page.getByRole("heading", { level: 1 })
  await expect(title).toHaveText("#writing/annotations/meetings/a-title-with-no-space-in-it-and-wider-than-any-phone")
  const box = (await title.boundingBox())!
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  expect(await sideways(page)).toBe(0)
})
