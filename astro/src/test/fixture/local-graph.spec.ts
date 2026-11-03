import type { Locator, Page } from "@playwright/test"
import { graph as settings } from "../../site.config.ts"
import { expect, expectAt, test } from "../site.ts"

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
      const hits: { x: number; y: number }[] = []
      for (let py = box.top + 1; py < box.bottom; py += 2) {
        for (let px = box.left + 1; px < box.right; px += 2) {
          // Only where the canvas is what a click there would reach, not a control over it.
          if (document.elementFromPoint(px, py) !== element) continue
          element.dispatchEvent(new MouseEvent("mousemove", { clientX: px, clientY: py }))
          if (hovered() === label) hits.push({ x: px, y: py })
        }
      }
      element.dispatchEvent(new MouseEvent("mouseleave"))
      if (hits.length === 0) return null
      // The point that hovered the node nearest the middle of all that did: a point on the node, where
      // the middle of a tag's circle and its label may be on neither.
      const middle = { x: hits.reduce((sum, hit) => sum + hit.x, 0) / hits.length, y: hits.reduce((sum, hit) => sum + hit.y, 0) / hits.length }
      return hits.reduce((best, hit) =>
        Math.hypot(hit.x - middle.x, hit.y - middle.y) < Math.hypot(best.x - middle.x, best.y - middle.y) ? hit : best,
      )
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
    // The pointer on the graph, which draws a node off the trail in colour.
    await page.mouse.move(ai.x, ai.y)
    // Inside the bubble, short of its rim: the robot.
    const icon = { ...ai, radius: 5 }
    await expect.poll(() => pixelsLike(canvas(page), dark.light, icon)).toBeGreaterThan(5)
    await expect.poll(() => pixelsLike(canvas(page), engineering.light)).toBeGreaterThan(20)
    expect(await pixelsLike(canvas(page), engineering.dark)).toBe(0)

    // Painted again when the reader's system turns dark, with nothing laid out again.
    await page.emulateMedia({ colorScheme: "dark" })
    await expect.poll(() => pixelsLike(canvas(page), engineering.dark)).toBeGreaterThan(20)
    expect(await pixelsLike(canvas(page), engineering.light)).toBe(0)
    await expect.poll(() => pixelsLike(canvas(page), dark.dark, icon)).toBeGreaterThan(5)
  })

  test("while the pointer is off the canvas, a node off the trail is drawn in grayscale, and in colour once it is on", async ({ page }) => {
    // engineering's colour, which `#ai` takes. The hub, the trail's one note, is tagged `#ai` and
    // drawn as its bubble too, in colour, so only the pixels round `#ai` are counted.
    const engineering = [0x00, 0x70, 0xcc]
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto(hub)
    const ai = await nodePosition(page, "#ai")
    const around = { ...ai, radius: 20 }
    await expect.poll(() => pixelsLike(canvas(page), engineering, around)).toBe(0)
    // While the trail's own node is in colour.
    expect(await pixelsLike(canvas(page), engineering)).toBeGreaterThan(20)

    await page.mouse.move(ai.x, ai.y)
    await expect.poll(() => pixelsLike(canvas(page), engineering, around)).toBeGreaterThan(20)

    // Off it again: grayscale again.
    const box = (await canvas(page).boundingBox())!
    await page.mouse.move(box.x > 40 ? box.x - 20 : box.x + box.width + 20, box.y + box.height / 2)
    await expect.poll(() => pixelsLike(canvas(page), engineering, around)).toBe(0)
  })
})
