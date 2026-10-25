import type { Page } from "@playwright/test"
import { contrast } from "../contrast.ts"
import { expect, test } from "../site.ts"

// The palette's two values for the page's background and for its text (src/styles/global.css).
const light = { background: "rgb(250, 248, 248)", text: "rgb(78, 78, 78)" }
const dark = { background: "rgb(22, 22, 24)", text: "rgb(212, 212, 212)" }

/** What the first node of the first diagram is painted with, and the line that leaves it. */
async function paint(page: Page) {
  const svg = page.locator("mermaid-diagram svg").first()
  const style = (selector: string, property: string) =>
    svg.locator(selector).first().evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property)
  return {
    fill: await style(".node rect", "fill"),
    label: await style(".node .nodeLabel", "color"),
    line: await style(".flowchart-link", "stroke"),
  }
}

test("a mermaid block is drawn as a diagram, in place of its source", async ({ page, externalRequests }) => {
  await page.goto("/mermaid/diagram")

  const diagram = page.locator(".prose mermaid-diagram")
  await expect(diagram.locator("svg")).toBeVisible()
  for (const label of ["Start", "Choice", "Yes", "Done"]) {
    await expect(diagram.locator("svg").getByText(label, { exact: true })).toBeVisible()
  }
  await expect(diagram.locator("pre")).toBeHidden()

  await expect(page.locator(".prose")).toContainText("Before the diagram.")
  await expect(page.locator(".prose")).toContainText("After the diagram.")
  expect(externalRequests).toEqual([])
})

for (const [colorScheme, palette] of [["light", light], ["dark", dark]] as const) {
  test.describe(`in the ${colorScheme} colour scheme`, () => {
    test.use({ colorScheme })

    test("a diagram is painted with the palette, its text and its lines legible", async ({ page }) => {
      await page.goto("/mermaid/diagram")
      await expect(page.locator("body")).toHaveCSS("background-color", palette.background)

      const painted = await paint(page)
      expect(painted).toEqual({ fill: palette.background, label: palette.text, line: palette.text })
      // WCAG's floor for text, and for a graphic a reader has to make out.
      expect(contrast(painted.label, painted.fill)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(painted.line, palette.background)).toBeGreaterThanOrEqual(3)
    })

    test("the line under a block that can't be drawn is legible", async ({ page }) => {
      await page.goto("/mermaid/broken")
      const error = page.locator(".mermaid-diagram-error")
      await expect(error).toHaveText("This diagram could not be drawn. Its source is shown instead.")
      const colour = await error.evaluate((element) => getComputedStyle(element).color)
      expect(colour).toBe(palette.text)
      expect(contrast(colour, palette.background)).toBeGreaterThanOrEqual(4.5)
    })
  })
}

test("a diagram's shapes cast no shadow", async ({ page }) => {
  await page.goto("/mermaid/diagram")
  const svg = page.locator("mermaid-diagram svg")
  await expect(svg).toBeVisible()
  const shadowed = await svg.evaluate((drawing) =>
    [...drawing.querySelectorAll("*")]
      .filter((element) => getComputedStyle(element).filter !== "none")
      .map((element) => `${element.tagName} ${getComputedStyle(element).filter}`),
  )
  expect(shadowed).toEqual([])
})

test("a diagram is drawn again when the system's colour scheme changes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/mermaid/diagram")
  expect((await paint(page)).label).toBe(light.text)

  await page.emulateMedia({ colorScheme: "dark" })
  await expect.poll(async () => (await paint(page)).label).toBe(dark.text)
})

test("a block that is not mermaid shows its source, and the rest of the page is as it would be", async ({ page }) => {
  const errors: Error[] = []
  page.on("pageerror", (error) => errors.push(error))
  await page.goto("/mermaid/broken")

  const diagrams = page.locator(".prose mermaid-diagram")
  await expect(diagrams.nth(0).locator("svg").getByText("Second", { exact: true })).toBeVisible()
  await expect(diagrams.nth(2).locator("svg").getByText("Fourth", { exact: true })).toBeVisible()

  await expect(diagrams.nth(1).locator("pre")).toBeVisible()
  await expect(diagrams.nth(1).locator("pre")).toContainText("A[Never closed --> B")
  await expect(diagrams.nth(1)).toContainText("This diagram could not be drawn.")
  await expect(diagrams.nth(1).locator("svg")).toHaveCount(0)

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A broken diagram")
  await expect(page.locator(".prose")).toContainText("After the diagrams.")
  // Mermaid draws an error of its own at the end of the page unless it is told not to. The graph
  // column's icons are not diagrams, nor are the menu's, the copy-link button's and the source link's.
  await expect(page.locator("svg:not(aside svg, .menu-bar svg, copy-link svg, .source-link svg)")).toHaveCount(2)
  expect(errors).toEqual([])
})

test("on a phone a diagram wider than the note shrinks to three quarters of its size, and then scrolls in its own box", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto("/mermaid/wide")
  const drawing = page.locator(".prose .mermaid-diagram-drawing")
  const svg = drawing.locator("svg")
  await expect(svg).toBeVisible()

  const natural = await svg.evaluate((element) => Number.parseFloat((element as SVGElement).style.maxWidth))
  const drawn = (await svg.boundingBox())!.width
  expect(natural).toBeGreaterThan(700)
  expect(drawn).toBeCloseTo(natural * 0.75, 0)
  expect(await drawing.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
})

test("on a desktop a diagram that fits the note is drawn at its own size", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/mermaid/diagram")
  const svg = page.locator(".prose mermaid-diagram svg")
  await expect(svg).toBeVisible()
  const natural = await svg.evaluate((element) => Number.parseFloat((element as SVGElement).style.maxWidth))
  expect((await svg.boundingBox())!.width).toBeCloseTo(natural, 0)
})

test("mermaid is loaded by a page with a diagram, and by no other", async ({ page }) => {
  const scripts: string[] = []
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(new URL(request.url()).pathname)
  })

  // What every page loads, the client router among it, is no diagram's.
  await page.goto("/content/notes/alpha")
  await page.waitForLoadState("networkidle")
  const everyPage = scripts.splice(0)

  await page.goto("/mermaid/diagram")
  await expect(page.locator("mermaid-diagram svg")).toBeVisible()
  const withDiagram = scripts.splice(0).filter((script) => !everyPage.includes(script))
  expect(withDiagram.filter((script) => /mermaid/i.test(script))).not.toEqual([])

  await page.goto("/content/notes/alpha")
  await expect(page.locator("mermaid-diagram")).toHaveCount(0)
  await page.waitForLoadState("networkidle")
  const withoutDiagram = scripts.splice(0)

  // What the site shell loads on every page, the 404 page's included, is not mermaid's.
  await page.goto("/404")
  await page.waitForLoadState("networkidle")
  const shell = scripts.splice(0)

  // Nothing of mermaid's, by name, and none of the files the diagram's page went on to ask for.
  expect(withoutDiagram.filter((script) => /mermaid/i.test(script))).toEqual([])
  expect(withoutDiagram.filter((script) => withDiagram.includes(script) && !shell.includes(script))).toEqual([])
})

// A diagram where a note's body is not a Markdown note's: an MDX note, compiled to a program, and a
// tag's description note, drawn on the tag's page. Each by words from its labels.
const elsewhere = [
  { kind: "an MDX note", url: "/mermaid/in-mdx", labels: ["Written in MDX", "Drawn all the same"] },
  { kind: "a tag's page", url: "/tags/rosarian", labels: ["Prune", "Bloom"] },
]

for (const { kind, url, labels } of elsewhere) {
  test(`a mermaid block in ${kind} is drawn`, async ({ page, externalRequests }) => {
    const errors: Error[] = []
    page.on("pageerror", (error) => errors.push(error))
    await page.goto(url)

    const diagram = page.locator(".prose mermaid-diagram")
    await expect(diagram).toHaveCount(1)
    await expect(diagram.locator("svg")).toBeVisible()
    for (const label of labels) await expect(diagram.locator("svg").getByText(label, { exact: true })).toBeVisible()
    await expect(diagram.locator("pre")).toBeHidden()
    expect(errors).toEqual([])
    expect(externalRequests).toEqual([])
  })
}

test("a label's HTML is drawn as HTML", async ({ page }) => {
  await page.goto("/mermaid/labels")
  const svg = page.locator(".prose mermaid-diagram svg")
  await expect(svg).toBeVisible()
  await expect(svg.locator("b", { hasText: "Theory" })).toHaveCSS("font-weight", "700")
  await expect(svg).toContainText("practice")
  await expect(svg).not.toContainText("<br>")
  await expect(svg).not.toContainText("<b>")
})
