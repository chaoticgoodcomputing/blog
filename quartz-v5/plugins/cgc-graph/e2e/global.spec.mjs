// The global graph (#74): every page of the site, behind the local graph's button, in a dialog with
// v4's two filters. The time filter reads each page's date from the plugin's own index, which is why
// the plugin publishes one; the private filter reads the `privateTags` option.
import { test, expect } from "../../../tests/harness/test.mjs"
import { drawnGraph, globalGraph, localGraph } from "./graph.mjs"

const dialog = (page) => page.locator(".cgc-graph__dialog")

async function openGlobalGraph(page) {
  await page.goto("/plain-note")
  await expect(localGraph(page).locator(".cgc-graph__node").first()).toBeAttached()
  await page.getByRole("button", { name: "View Global Graph" }).click()
  await expect(dialog(page)).toBeVisible()
  return drawnGraph(globalGraph(page))
}

test("opens every page of the site in a dialog, and closes on Escape", async ({ page }) => {
  const graph = await openGlobalGraph(page)
  for (const node of [
    "/",
    "plain-note",
    "mdx-article",
    "graph/old-note",
    "seo/private-note",
    "tags/writing",
  ]) {
    expect(graph, node).toHaveProperty([node])
  }
  expect(graph["plain-note"].current).toBe(true)
  await page.keyboard.press("Escape")
  await expect(dialog(page)).toBeHidden()
})

test("closes when the reader clicks outside the graph", async ({ page }) => {
  await openGlobalGraph(page)
  await page.mouse.click(5, 5)
  await expect(dialog(page)).toBeHidden()
})

test("opens and closes with Ctrl+G, as v4's did", async ({ page }) => {
  await page.goto("/plain-note")
  await expect(localGraph(page).locator(".cgc-graph__node").first()).toBeAttached()
  await page.keyboard.press("Control+g")
  await expect(dialog(page)).toBeVisible()
  await page.keyboard.press("Control+g")
  await expect(dialog(page)).toBeHidden()
})

test("filters pages by date, from each page's date in the index", async ({ page, emitted }) => {
  await openGlobalGraph(page)
  const slider = page.getByRole("slider", { name: "Time period" })
  await expect(slider).toHaveValue("0")
  // All → Year: graph/old-note was last changed in 2020. The rest are dated by git, so which of them
  // are within the year depends on the day the suite runs: every page left must be.
  await slider.focus()
  await page.keyboard.press("ArrowRight")
  await expect(slider).toHaveAttribute("aria-valuetext", "Year")
  await expect
    .poll(async () => Object.keys(await drawnGraph(globalGraph(page))))
    .not.toContain("graph/old-note")
  const { pages } = JSON.parse(emitted.read("static/cgcGraph.json"))
  const yearAgo = new Date()
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)
  for (const node of Object.keys(await drawnGraph(globalGraph(page)))) {
    const slug = node === "/" ? "index" : node
    if (pages[slug]) expect(new Date(pages[slug].date) >= yearAgo, node).toBe(true)
  }
  // Back to All.
  await page.keyboard.press("ArrowLeft")
  await expect
    .poll(async () => Object.keys(await drawnGraph(globalGraph(page))))
    .toContain("graph/old-note")
})

test("hides private pages when the reader asks", async ({ page }) => {
  const graph = await openGlobalGraph(page)
  expect(graph["seo/private-note"].private).toBe(true)
  expect(graph["seo/private-descendant"].private).toBe(true)
  // A tag that only starts with the private tag's name is not under it.
  expect(graph["seo/authored"].private).toBe(false)

  const toggle = page.getByRole("checkbox", { name: "Include private notes" })
  await expect(toggle).toBeChecked()
  await toggle.uncheck()
  await expect
    .poll(async () => Object.keys(await drawnGraph(globalGraph(page))))
    .not.toContain("seo/private-note")
  const filtered = Object.keys(await drawnGraph(globalGraph(page)))
  expect(filtered).not.toContain("seo/private-descendant")
  expect(filtered).toContain("seo/authored")
})

test("closes on navigation, and opens again on the new page", async ({ page }) => {
  await openGlobalGraph(page)
  await page.keyboard.press("Escape")
  await page.locator("article").getByRole("link", { name: "mdx-article" }).first().click()
  await expect(page).toHaveURL(/\/mdx-article$/)
  await page.getByRole("button", { name: "View Global Graph" }).click()
  await expect(dialog(page)).toBeVisible()
  expect((await drawnGraph(globalGraph(page)))["mdx-article"].current).toBe(true)
})
