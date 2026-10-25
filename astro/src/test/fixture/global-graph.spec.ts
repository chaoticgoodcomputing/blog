import type { Page } from "@playwright/test"
import { graph as settings } from "../../site.config.ts"
import { expect, expectAt, test } from "../site.ts"

// The fixture vault's global-graph/ notes, read on 15 January 2030: Global Recent, from this month,
// tagged `engineering`, which links to Global Older; Global Older, Global Project and Global Oldest,
// from earlier in the year, tagged `writing`, `projects` and `horticulture`; Global Secret, a
// private page from this month; and Global Ancient, from before the last year, with no tags. The
// graph is read through the list inside its canvas, which says what it draws; of what it lists, only
// these notes are this file's.
const NOW = new Date("2030-01-15T12:00:00.000Z")
const recent = "/global-graph/recent"

const opener = (page: Page) => page.locator(".local-graph").getByRole("button", { name: "Open the global graph" })
const dialog = (page: Page) => page.getByRole("dialog", { name: "Global graph" })
const canvas = (page: Page) => dialog(page).locator("canvas")
const period = (page: Page) => dialog(page).getByRole("slider", { name: "Time period" })

// A dialog the size of a small window, so that finding a node under the pointer is quick.
test.use({ viewport: { width: 640, height: 560 } })

/** Goes to `address`, and opens the menu where the local graph is in one, as it is on a window this small. */
async function visit(page: Page, address: string) {
  await page.goto(address)
  const menu = page.getByRole("button", { name: "Menu" })
  if (await menu.isVisible()) await menu.click()
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
})

/** The labels of the nodes the canvas draws, from its text alternative, sorted; or of those marked. */
async function drawn(page: Page, mark?: "data-lit") {
  await expect(canvas(page).locator("li").first()).toBeAttached()
  const labels = await canvas(page).evaluate(
    (element, mark) =>
      [...element.querySelectorAll(`:scope > ul > li${mark ? `[${mark}]` : ""}`)].map(
        (item) => item.querySelector("a")!.textContent! + (item.textContent!.includes("(private page)") ? " (private page)" : ""),
      ),
    mark,
  )
  return labels.sort()
}

/**
 * Where the node labelled `label` is drawn, in the viewport, once the layout is still: the middle of
 * the points where the list inside the canvas marks it as the one under the pointer.
 */
async function nodePosition(page: Page, label: string) {
  let last: { x: number; y: number } | null = null
  for (let attempt = 0; attempt < 60; attempt++) {
    const at = await canvas(page).evaluate((element, label) => {
      const box = element.getBoundingClientRect()
      const hovered = () => element.querySelector("li[data-hovered] > a")?.textContent
      let [x, y, hits] = [0, 0, 0]
      for (let py = box.top + 1; py < box.bottom; py += 3) {
        for (let px = box.left + 1; px < box.right; px += 3) {
          element.dispatchEvent(new MouseEvent("mousemove", { clientX: px, clientY: py }))
          if (hovered() === label) [x, y, hits] = [x + px, y + py, hits + 1]
        }
      }
      element.dispatchEvent(new MouseEvent("mouseleave"))
      return hits ? { x: x / hits, y: y / hits } : null
    }, label)
    if (at && last && Math.hypot(at.x - last.x, at.y - last.y) < 0.5) return at
    last = at
    await page.waitForTimeout(250)
  }
  throw new Error(`no node labelled "${label}" came to rest`)
}

test("a control on the local graph opens the global graph in a dialog, which Escape closes, giving the focus back", async ({ page }) => {
  await visit(page, recent)
  await expect(dialog(page)).toBeHidden()
  await opener(page).click()
  await expect(dialog(page)).toBeVisible()
  await expect(canvas(page)).toHaveAttribute("aria-label", "Graph of every page of the site")
  expect(await drawn(page)).toContain("Global Recent")

  await page.keyboard.press("Escape")
  await expect(dialog(page)).toBeHidden()
  await expect(opener(page)).toBeFocused()
  // Closed, it draws nothing.
  await expect(canvas(page)).toHaveCount(0)
})

test("the control is an icon button in the local graph's frame, named for a screen reader and reached by the keyboard", async ({ page }) => {
  await visit(page, recent)
  // An icon, with no text of its own: its name, "Open the global graph", is its label.
  await expect(opener(page).locator("svg")).toBeVisible()
  expect((await opener(page).innerText()).trim()).toBe("")

  const frame = (await page.locator("local-graph").boundingBox())!
  const button = (await opener(page).boundingBox())!
  expect(button.x).toBeGreaterThanOrEqual(frame.x)
  expect(button.y).toBeGreaterThanOrEqual(frame.y)
  expect(button.x + button.width).toBeLessThanOrEqual(frame.x + frame.width)
  expect(button.y + button.height).toBeLessThanOrEqual(frame.y + frame.height)

  // Tabbed to from the top of the page, and opened with Enter.
  for (let presses = 0; presses < 100 && !(await opener(page).evaluate((element) => element === document.activeElement)); presses++) {
    await page.keyboard.press("Tab")
  }
  await expect(opener(page)).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(dialog(page)).toBeVisible()
})

test("the global graph opens on the last month, widened to the last year when the month has fewer posts than it should", async ({ page }) => {
  // The month has one post, Global Recent, fewer than three; the year has four.
  expect(settings.global.filters).toMatchObject({ timePeriod: "month", minPosts: 3 })
  await visit(page, recent)
  await opener(page).click()
  await expect(period(page)).toHaveAttribute("aria-valuetext", "Year")
  const year = await drawn(page)
  expect(year).toEqual(expect.arrayContaining(["Global Recent", "Global Older", "Global Project", "Global Oldest", "#engineering", "#writing"]))
  // A note from before the year is left out, and so is the private page.
  expect(year).not.toContain("Global Ancient")
  expect(year).not.toContain("Global Secret")
})

test("the reader can filter the global graph by time period, and by whether private pages are drawn", async ({ page }) => {
  await visit(page, recent)
  await opener(page).click()

  // The slider runs from the widest period to the narrowest, all, the year, the month, and opens
  // on the year here; the keyboard moves it a step at a time.
  await period(page).press("ArrowRight")
  await expect(period(page)).toHaveAttribute("aria-valuetext", "Month")
  await expect.poll(() => drawn(page)).toEqual(["#engineering", "Global Recent"])

  await dialog(page).getByRole("checkbox", { name: "Include private pages" }).check()
  await expect.poll(() => drawn(page)).toEqual(["#engineering", "Global Recent", "Global Secret (private page)"])

  await period(page).press("Home")
  await expect(period(page)).toHaveAttribute("aria-valuetext", "All")
  await expect
    .poll(() => drawn(page))
    .toEqual(expect.arrayContaining(["Global Ancient", "Global Oldest", "Global Recent", "Global Secret (private page)"]))

  // The reader's choice stays when the dialog is opened again.
  await page.keyboard.press("Escape")
  await opener(page).click()
  await expect(period(page)).toHaveAttribute("aria-valuetext", "All")
  await expect(dialog(page).getByRole("checkbox", { name: "Include private pages" })).toBeChecked()
})

test("the filters are drawn over the graph's top corner, in the code font, with the period's three stops named over its slider", async ({ page }) => {
  await visit(page, recent)
  await opener(page).click()
  await expect(canvas(page)).toBeVisible()
  const filters = dialog(page).locator(".filters")
  const over = (await filters.boundingBox())!
  const graph = (await canvas(page).boundingBox())!
  expect(over.y).toBeGreaterThanOrEqual(graph.y)
  expect(over.x).toBeGreaterThanOrEqual(graph.x)
  expect(over.x + over.width).toBeLessThanOrEqual(graph.x + graph.width)

  const font = await dialog(page).getByRole("checkbox", { name: "Include private pages" }).evaluate((box) => getComputedStyle(box.closest("label")!).fontFamily)
  expect(font).toMatch(/IBM Plex Mono/)
  await expect(filters.locator(".stops")).toHaveText(["All", "Year", "Month"].join(""))
})

test("the configured top-level tags are pinned on a ring", async ({ page }) => {
  // Four of the five are in the year's graph: three points make a circle, and the fourth is on it.
  expect(settings.global.shell.pinnedTags).toEqual(expect.arrayContaining(["engineering", "writing", "horticulture", "projects"]))
  await visit(page, recent)
  await opener(page).click()
  const [a, b, c, d] = [
    await nodePosition(page, "#engineering"),
    await nodePosition(page, "#writing"),
    await nodePosition(page, "#horticulture"),
    await nodePosition(page, "#projects"),
  ]
  // The circle through a, b and c.
  const det = 2 * (a!.x * (b!.y - c!.y) + b!.x * (c!.y - a!.y) + c!.x * (a!.y - b!.y))
  const sq = (p: { x: number; y: number }) => p.x * p.x + p.y * p.y
  const centre = {
    x: (sq(a!) * (b!.y - c!.y) + sq(b!) * (c!.y - a!.y) + sq(c!) * (a!.y - b!.y)) / det,
    y: (sq(a!) * (c!.x - b!.x) + sq(b!) * (a!.x - c!.x) + sq(c!) * (b!.x - a!.x)) / det,
  }
  const radius = Math.hypot(a!.x - centre.x, a!.y - centre.y)
  expect(Math.abs(Math.hypot(d!.x - centre.x, d!.y - centre.y) - radius)).toBeLessThan(3)
})

test("hovering a node lights it and its neighbours", async ({ page }) => {
  await visit(page, recent)
  await opener(page).click()
  const node = await nodePosition(page, "Global Recent")
  await page.mouse.move(node.x, node.y)
  await expect.poll(() => drawn(page, "data-lit")).toEqual(["#engineering", "Global Older", "Global Recent"])
  await page.mouse.move(1, 1)
  await expect.poll(() => drawn(page, "data-lit")).toEqual([])
})

test("clicking a node closes the dialog and goes to its page", async ({ page }) => {
  await visit(page, recent)
  await opener(page).click()
  const node = await nodePosition(page, "Global Older")
  await page.mouse.click(node.x, node.y)
  await expectAt(page, "/global-graph/older")
  await expect(dialog(page)).toBeHidden()
})

test("the built site has no settings panel for the graph, in its markup or in its scripts", async ({ page }) => {
  const scripts: Promise<string>[] = []
  page.on("response", (response) => {
    if (response.request().resourceType() === "script") scripts.push(response.text())
  })
  await visit(page, recent)
  await opener(page).click()
  await expect(canvas(page)).toBeAttached()
  await expect(dialog(page).locator(".graph-settings")).toHaveCount(0)
  const bodies = await Promise.all(scripts)
  // The scripts are the ones that draw the global graph,
  expect(bodies.filter((body) => body.includes("global-graph"))).not.toEqual([])
  // and none of them holds the panel's heading, as src/components/global-graph/settings-panel.ts
  // writes it.
  expect(bodies.filter((body) => body.includes("Graph settings (dev only)"))).toEqual([])
})
