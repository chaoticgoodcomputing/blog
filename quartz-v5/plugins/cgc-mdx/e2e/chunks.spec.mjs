// ADR-0001: one esbuild build with shared chunks, and each page loads only what its imports reach.
import { test, expect } from "../../../tests/harness/test.mjs"

// Every cgc-mdx asset the page fetches from here on.
function recordWidgetRequests(page) {
  const seen = []
  page.on("request", (req) => {
    const path = new URL(req.url()).pathname
    if (path.startsWith("/static/cgc-mdx/")) seen.push(path)
  })
  return seen
}

// Bring client:visible islands into view and wait until each has hydrated, so everything the page
// can load has loaded. `networkidle` alone isn't enough: it's sticky, so once the page has idled it
// returns before a visible island's import() starts (#51).
async function hydrateIslands(page) {
  for (const island of await page.locator(".cgc-mdx-island").all()) {
    await island.scrollIntoViewIfNeeded()
    await expect(island).toHaveAttribute("data-cgc-hydrated", "")
  }
  await page.waitForLoadState("networkidle")
}

// Every cgc-mdx asset a page fetches, once its islands are hydrated.
async function widgetRequests(page, url) {
  const seen = recordWidgetRequests(page)
  await page.goto(url)
  await hydrateIslands(page)
  return seen
}

const entry = (paths) => paths.filter((p) => /GameOfLife-[^/]+\.js$/.test(p))

test("a page with no widget loads no widget code", async ({ page }) => {
  expect(await widgetRequests(page, "/mdx-article")).toEqual([])
})

test("a markdown page loads no widget code", async ({ page }) => {
  expect(await widgetRequests(page, "/plain-note")).toEqual([])
})

test("two pages importing one widget load the same entry", async ({ browser }) => {
  const load = async (url) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const seen = await widgetRequests(page, url)
    await context.close()
    return seen
  }
  const life = await load("/lab/life")
  const again = await load("/lab/life-again")
  expect(entry(life)).toHaveLength(1)
  expect(entry(again)).toEqual(entry(life))
})

// The #51 flake made deterministic: a loaded machine idles the page before the scroll.
test("a visible island's entry is counted even when the page idles before it scrolls into view", async ({ page }) => {
  const seen = recordWidgetRequests(page)
  await page.goto("/lab/life-again")
  await page.waitForLoadState("networkidle")
  expect(entry(seen)).toEqual([])
  await hydrateIslands(page)
  expect(entry(seen)).toHaveLength(1)
})

test("a page loads only the widgets it imports", async ({ page }) => {
  const seen = await widgetRequests(page, "/lab/echo")
  expect(seen.some((p) => p.includes("Echo-"))).toBe(true)
  expect(seen.some((p) => p.includes("GameOfLife-"))).toBe(false)
})

test("the widget's imported CSS reaches the page", async ({ page }) => {
  await page.goto("/lab/life")
  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  await expect(page.locator(".life")).toHaveCSS("border-radius", "8px")
})

test("the widget's CSS is in the served head, so build-time markup is styled on first paint", async ({ emitted }) => {
  const head = emitted.read("lab/life.html").split("</head>")[0]
  expect(head).toMatch(/<link rel="stylesheet" href="\.\.\/static\/cgc-mdx\/GameOfLife-[^"]+\.css" data-persist/)
  expect(emitted.read("lab/echo.html")).not.toContain("GameOfLife-")
})
