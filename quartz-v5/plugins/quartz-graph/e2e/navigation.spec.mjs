// A node is a way to its page (#74): a click on one follows it through Quartz's SPA router, as v4's
// graph did, and the graph is drawn again around the page it lands on, and keeps working there.
import { test, expect } from "../../../tests/harness/test.mjs"
import { postHogStandIn } from "../../../tests/harness/analytics.mjs"
import { drawnGraph, localGraph, nodePosition } from "./graph.mjs"

test("a click on a node follows it without reloading the page", async ({ page }) => {
  const errors = []
  page.on("pageerror", (err) => errors.push(err.message))
  await page.goto("/links/from-md")
  // Gone if the browser loads a new document.
  await page.evaluate(() => (window.cgcSameDocument = true))

  const graph = localGraph(page)
  const mdx = await nodePosition(graph, "MDX Article")
  await page.mouse.click(mdx.x, mdx.y)
  await expect(page).toHaveURL(/\/mdx-article\.mdx$/)
  expect(await page.evaluate(() => window.cgcSameDocument)).toBe(true)

  // The graph survives the navigation: drawn once, around the new page.
  await expect.poll(async () => (await drawnGraph(graph))["mdx-article.mdx"]?.current).toBe(true)
  await expect(graph.locator(".cgc-graph__canvas")).toHaveCount(1)

  // And it still leads on.
  const plain = await nodePosition(graph, "Plain Note")
  await page.mouse.click(plain.x, plain.y)
  await expect(page).toHaveURL(/\/plain-note$/)
  expect(await page.evaluate(() => window.cgcSameDocument)).toBe(true)
  await expect.poll(async () => (await drawnGraph(graph))["plain-note"]?.current).toBe(true)
  await expect(graph.locator(".cgc-graph__canvas")).toHaveCount(1)
  expect(errors).toEqual([])
})

test("a click on a tag node leads to the tag's page", async ({ page }) => {
  await page.goto("/links/from-md")
  await page.evaluate(() => (window.cgcSameDocument = true))
  const tag = await nodePosition(localGraph(page), "#fixture")
  await page.mouse.click(tag.x, tag.y)
  await expect(page).toHaveURL(/\/tags\/fixture$/)
  expect(await page.evaluate(() => window.cgcSameDocument)).toBe(true)
})

test("the browser's back button redraws the graph of the page it returns to", async ({ page }) => {
  await page.goto("/links/from-md")
  const graph = localGraph(page)
  const mdx = await nodePosition(graph, "MDX Article")
  await page.mouse.click(mdx.x, mdx.y)
  await expect(page).toHaveURL(/\/mdx-article\.mdx$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/links\/from-md$/)
  await expect.poll(async () => (await drawnGraph(graph))["links/from-md"]?.current).toBe(true)
  await expect(graph.locator(".cgc-graph__canvas")).toHaveCount(1)
})

// v4's graph told PostHog where a navigation came from, as the site's other links do through
// quartz-posthog. The fixture's PostHog host never resolves, so a stand-in answers it.
test("tells PostHog a navigation came from the graph", async ({ page }) => {
  const posthog = await postHogStandIn(page, "https://posthog.invalid")
  await page.goto("/links/from-md")
  const mdx = await nodePosition(localGraph(page), "MDX Article")
  await page.mouse.click(mdx.x, mdx.y)
  await expect(page).toHaveURL(/\/mdx-article\.mdx$/)
  await expect
    .poll(() =>
      posthog.captures
        .filter(({ event }) => event === "navigation")
        .map(({ properties }) => properties),
    )
    .toContainEqual(
      expect.objectContaining({
        source: "graph-drag-click",
        from_page: "/links/from-md",
        to_page: "/mdx-article.mdx",
      }),
    )
})
