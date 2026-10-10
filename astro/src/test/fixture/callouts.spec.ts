import type { Locator } from "@playwright/test"
import { contrast } from "../contrast.ts"
import { expect, test } from "../site.ts"

// A note with a callout of each kind, one of a type Obsidian reads as another kind (`faq`, a
// question), a folded tip and an open fold.
const kinds = "/callouts/kinds"

const KINDS = ["note", "abstract", "info", "todo", "tip", "success", "question", "warning", "failure", "danger", "bug", "example", "quote"]

/** A colour as the browser paints it, `rgb(r, g, b)`, whatever CSS syntax it computes to. */
const painted = (element: Locator, property: "color" | "background-color") =>
  element.evaluate((element, property) => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    const context = canvas.getContext("2d")!
    context.fillStyle = getComputedStyle(document.body).backgroundColor
    context.fillRect(0, 0, 1, 1)
    context.fillStyle = getComputedStyle(element).getPropertyValue(property)
    context.fillRect(0, 0, 1, 1)
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data
    return `rgb(${red}, ${green}, ${blue})`
  }, property)

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`in the ${colorScheme} colour scheme`, () => {
    test.use({ colorScheme })

    test("each kind of callout has a title with an icon, in a colour of its kind's own, legible on its tinted background", async ({ page }) => {
      await page.goto(kinds)
      const colours = new Map<string, string>()
      for (const kind of KINDS) {
        const callout = page.locator(`.prose div.callout[data-callout="${kind}"]`)
        const title = callout.locator(".callout-title")
        const icon = title.locator("svg.callout-icon")
        await expect(icon, kind).toBeVisible()
        const colour = await painted(title, "color")
        await expect(icon, kind).toHaveCSS("color", colour)
        expect(contrast(colour, await painted(callout, "background-color")), kind).toBeGreaterThanOrEqual(4.5)
        colours.set(kind, colour)
      }
      // Obsidian draws a few kinds alike, as the Quartz site did: a to-do as information, a failure
      // and a bug as a danger. Every other kind has a colour of its own.
      expect(colours.get("todo")).toBe(colours.get("info"))
      expect(colours.get("failure")).toBe(colours.get("danger"))
      expect(colours.get("bug")).toBe(colours.get("danger"))
      expect(new Set(colours.values()).size).toBe(KINDS.length - 3)
    })
  })
}

test("a type Obsidian reads as another kind is drawn as that kind", async ({ page }) => {
  await page.goto(kinds)
  const title = (type: string) => page.locator(`.prose .callout[data-callout="${type}"] > .callout-title`)
  expect(await painted(title("faq"), "color")).toBe(await painted(title("question"), "color"))
})

test("a callout that folds opens and closes from its title, whose fold icon turns with it", async ({ page }) => {
  await page.goto(kinds)
  const folded = page.locator(".prose details.callout").filter({ hasText: "A folded tip" })
  const title = folded.locator("summary")
  const fold = title.locator("svg.callout-fold")
  await expect(fold).toBeVisible()
  await expect(folded.getByText("The folded body.")).toBeHidden()
  const turned = () => fold.evaluate((icon) => getComputedStyle(icon).rotate)
  // Closed, it points to the side; open, down.
  await expect.poll(turned).toBe("-90deg")

  await title.click()
  await expect(folded.getByText("The folded body.")).toBeVisible()
  await expect.poll(turned).toBe("none")

  await title.click()
  await expect(folded.getByText("The folded body.")).toBeHidden()

  // One that opens open is open.
  await expect(page.locator(".prose details.callout").filter({ hasText: "An open fold" }).getByText("The open body.")).toBeVisible()
})
