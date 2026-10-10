import type { Locator, Page } from "@playwright/test"
import { graph as settings } from "../../site.config.ts"
import { expect, test } from "../site.ts"

// The fixture vault's local-graph/ notes: a hub tagged `engineering/ai` that links to a spoke and to
// a private page, a spoke tagged `horticulture` that links on to a far note, and a note that links
// to the hub. The canvas is read through the list inside it, which says what it draws, and through
// its pixels for how.
const hub = "/local-graph/hub"

const canvas = (page: Page) => page.locator(".local-graph canvas")

/** The graph the canvas shows, from its text alternative: each node by its label. */
async function drawnGraph(page: Page) {
  await expect(canvas(page).locator("li").first()).toBeAttached()
  return canvas(page).evaluate((element) => {
    const nodes: Record<string, { href: string; current: boolean; private: boolean; edges: string[] }> = {}
    for (const item of element.querySelectorAll(":scope > ul > li")) {
      const link = item.querySelector("a")!
      nodes[link.textContent!] = {
        href: link.getAttribute("href")!,
        current: link.getAttribute("aria-current") === "page",
        private: item.textContent!.includes("(private page)"),
        edges: [...item.querySelectorAll("ul > li")].map((edge) => edge.textContent!),
      }
    }
    return nodes
  })
}

/**
 * Where the node labelled `label` is drawn, in the viewport, once the layout is still: the middle of
 * the points where the list inside the canvas marks it as the one under the pointer.
 */
async function nodePosition(page: Page, label: string) {
  await canvas(page).scrollIntoViewIfNeeded()
  let last: { x: number; y: number } | null = null
  for (let attempt = 0; attempt < 60; attempt++) {
    const at = await canvas(page).evaluate((element, label) => {
      const box = element.getBoundingClientRect()
      const hovered = () => element.querySelector("li[data-hovered] > a")?.textContent
      let [x, y, hits] = [0, 0, 0]
      for (let py = box.top + 1; py < box.bottom; py += 2) {
        for (let px = box.left + 1; px < box.right; px += 2) {
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

/** How many of the canvas's opaque pixels, within `within` of a point if given, are `rgb`. */
const pixelsLike = (graph: Locator, rgb: number[], within?: { x: number; y: number; radius: number }) =>
  graph.evaluate(
    (element: HTMLCanvasElement, { rgb, within }) => {
      const box = element.getBoundingClientRect()
      const k = element.width / box.width
      const data = element.getContext("2d")!.getImageData(0, 0, element.width, element.height).data
      let count = 0
      for (let y = 0; y < element.height; y++) {
        for (let x = 0; x < element.width; x++) {
          if (within && Math.hypot(x / k + box.left - within.x, y / k + box.top - within.y) > within.radius) continue
          const i = (y * element.width + x) * 4
          if (data[i + 3]! < 250) continue
          // Within a level of it, so a pixel where the edge of a shape is blended with what is
          // under it is not counted, unless it happens to land there.
          if ([0, 1, 2].every((c) => Math.abs(data[i + c]! - rgb[c]!) <= 1)) count++
        }
      }
      return count
    },
    { rgb, within },
  )

test("the site publishes a graph index of its notes, each with its date, tags and the notes it links to", async ({ request }) => {
  const index = await (await request.get("/graph.json")).json()
  const note = (url: string) => index.notes.find((each: { url: string }) => each.url === url)
  expect(note(hub)).toEqual({
    url: hub,
    title: "Hub",
    date: "2026-03-01T00:00:00.000Z",
    tags: ["engineering/ai"],
    links: ["/local-graph/spoke", "/local-graph/private-spoke"],
    private: false,
  })
  expect(note("/local-graph/inbound").links).toEqual([hub])
  // A private page is in it, flagged.
  expect(note("/local-graph/private-spoke")).toMatchObject({ title: "Private Spoke", tags: ["private"], private: true })
})

test("a note's local graph is the note, the notes it links to and from, and their tags, listed inside the canvas", async ({ page }) => {
  await page.goto(hub)
  await expect(page.locator("aside.right .local-graph").getByRole("heading", { level: 2 })).toHaveText("Graph View")
  await expect(canvas(page)).toHaveAttribute("aria-label", "Graph of the pages around Hub")
  const graph = await drawnGraph(page)
  expect(Object.keys(graph).sort()).toEqual(["#ai", "Hub", "Inbound", "Private Spoke", "Spoke"])
  expect(graph.Hub).toEqual({
    href: hub,
    current: true,
    private: false,
    edges: ["Spoke", "Private Spoke", "#ai"],
  })
  expect(graph.Inbound).toMatchObject({ href: "/local-graph/inbound", current: false, edges: ["Hub"] })
  // A tag is a node of its own, which goes to its tag page.
  expect(graph["#ai"]).toMatchObject({ href: "/tags/engineering/ai", edges: [] })
  // The far note is two links away, and the spoke's tag is the spoke's, not the hub's.
  expect(graph.Far).toBeUndefined()
  expect(graph["#horticulture"]).toBeUndefined()
})

test("the text alternative names a note's links apart from its tags", async ({ page }) => {
  await page.goto(hub)
  await drawnGraph(page)
  const item = canvas(page).locator(':scope > ul > li[data-node="/local-graph/hub"]')
  await expect(item.locator("ul")).toHaveCount(2)
  await expect(item.locator('ul[aria-label="Hub links to"] > li')).toHaveText(["Spoke", "Private Spoke"])
  await expect(item.locator('ul[aria-label="Hub is tagged"] > li')).toHaveText(["#ai"])
})

test("the private tag is left out of the local graph, and a private page is drawn, marked, as the site configures", async ({ page }) => {
  test.skip(settings.local.privatePages !== "mark", "the site leaves private pages out of the local graph")
  await page.goto(hub)
  const graph = await drawnGraph(page)
  expect(graph["Private Spoke"]).toMatchObject({ href: "/local-graph/private-spoke", private: true })
  expect(graph["#private"]).toBeUndefined()
  expect(graph.Hub!.private).toBe(false)
})

test("left out, a private page is not in the local graph", async ({ page }) => {
  test.skip(settings.local.privatePages !== "omit", "the site draws private pages in the local graph")
  await page.goto(hub)
  const graph = await drawnGraph(page)
  expect(graph["Private Spoke"]).toBeUndefined()
})

test("the home page has a local graph around the home note", async ({ page }) => {
  await page.goto("/")
  const graph = await drawnGraph(page)
  expect(graph["Fixture Home"]).toMatchObject({ href: "/", current: true })
  expect(graph["Fixture Home"]!.edges).toContain("Alpha")
})

test("clicking a node goes to its page, whose own graph is then drawn", async ({ page }) => {
  await page.goto(hub)
  const spoke = await nodePosition(page, "Spoke")
  await page.mouse.click(spoke.x, spoke.y)
  await expect(page).toHaveURL("/local-graph/spoke")
  await expect(canvas(page)).toHaveAttribute("aria-label", "Graph of the pages around Spoke")
  const graph = await drawnGraph(page)
  expect(graph.Spoke!.current).toBe(true)
  expect(Object.keys(graph).sort()).toEqual(["#horticulture", "Far", "Hub", "Spoke"])

  const tag = await nodePosition(page, "#horticulture")
  await page.mouse.click(tag.x, tag.y)
  await expect(page).toHaveURL("/tags/horticulture")
})

test.describe("on a high-density screen, where a rim is wide enough to have pixels of its colour alone", () => {
  test.use({ deviceScaleFactor: 2 })

  test("a tag node is its tag bubble, its rim in the tag colour and its icon in the palette's, in the reader's colour scheme", async ({ page }) => {
    // engineering's colour (site configuration's tag dictionary), which `engineering/ai` takes, and
    // the palette's `--dark`, which a bubble's icon is drawn in (src/styles/global.css).
    const engineering = { light: [0x00, 0x70, 0xcc], dark: [0x00, 0x8c, 0xff] }
    const dark = { light: [0x2b, 0x2b, 0x2b], dark: [0xeb, 0xeb, 0xec] }

    await page.emulateMedia({ colorScheme: "light" })
    await page.goto(hub)
    const ai = await nodePosition(page, "#ai")
    // Inside the bubble, short of its rim: the robot.
    const icon = { ...ai, radius: 5 }
    await expect.poll(() => pixelsLike(canvas(page), dark.light, icon)).toBeGreaterThan(5)
    await expect.poll(() => pixelsLike(canvas(page), engineering.light)).toBeGreaterThan(20)
    expect(await pixelsLike(canvas(page), engineering.dark)).toBe(0)

    // Painted again on `themechange`, with nothing laid out again.
    await page.locator("aside.left").getByRole("switch", { name: "Dark colour scheme" }).click()
    await expect.poll(() => pixelsLike(canvas(page), engineering.dark)).toBeGreaterThan(20)
    expect(await pixelsLike(canvas(page), engineering.light)).toBe(0)
    await expect.poll(() => pixelsLike(canvas(page), dark.dark, icon)).toBeGreaterThan(5)
  })
})
