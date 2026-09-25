// `pdf-viewer`, proven through `cgc-mdx`: the fixture page /lab/pdf imports it as a package
// (`@chaoticgoodcomputing/widgets/pdf-viewer`) and shows /lab/fixture.pdf, a two-page PDF with a
// link on page one. PDF.js is bundled, so nothing is fetched from a CDN (#36, #66).
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"

const PAGE = "/lab/pdf"

test("a reader without JavaScript gets the title, a download link and a way to open the PDF", async ({
  browser,
  colorScheme,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme })
  const page = await context.newPage()
  await page.goto(PAGE)
  const viewer = page.locator(".cgc-mdx-island .cgc-pdf-viewer")
  await expect(viewer).toBeVisible()
  await expect(viewer.locator(".cgc-pdf-viewer__title")).toHaveText("Fixture PDF")
  await expect(viewer.getByRole("link", { name: "Download" })).toHaveAttribute(
    "href",
    "/lab/fixture.pdf",
  )
  await expect(viewer.getByRole("link", { name: "Open the PDF" })).toHaveAttribute(
    "href",
    "/lab/fixture.pdf",
  )
  // v4's `height` prop is kept, and `width` defaults to the column.
  await expect(viewer).toHaveCSS("height", "480px")
  await context.close()
})

// How many dark pixels a drawn page has: none on a blank canvas.
const inked = (canvas) =>
  canvas.evaluate((c) => {
    const { data } = c.getContext("2d").getImageData(0, 0, c.width, c.height)
    let ink = 0
    for (let i = 0; i < data.length; i += 4) if (data[i] < 128 && data[i + 3] > 0) ink++
    return ink
  })

// The viewer on /lab/pdf, once its island has hydrated and PDF.js has drawn both pages.
async function shown(page) {
  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  const viewer = page.locator(".cgc-pdf-viewer")
  await expect(viewer.locator(".cgc-pdf-viewer__page")).toHaveCount(2)
  await expect(viewer.getByText("Fixture PDF, page two")).toBeAttached()
  return viewer
}

test("it hydrates and draws every page, with selectable text", async ({ page }) => {
  await page.goto(PAGE)
  const viewer = await shown(page)
  await expect(viewer.locator(".cgc-pdf-viewer__info")).toContainText("2 pages")
  await expect(viewer.getByRole("link", { name: "Open the PDF" })).toHaveCount(0)
  for (const canvas of await viewer.locator(".cgc-pdf-viewer__page canvas").all()) {
    await expect.poll(() => inked(canvas)).toBeGreaterThan(0)
  }
  // The text layer sits over the drawing, so a reader can select and find the text.
  await expect(viewer.getByText("Fixture PDF, page one")).toBeAttached()
  // v4 kept the PDF's links clickable; they open in a new tab.
  const link = viewer.locator('a[href="https://example.com/"]')
  await expect(link).toHaveAttribute("target", "_blank")
  // PDF.js measures text on a canvas it parks in <body>; nothing of the viewer outlives drawing.
  await expect(page.locator("body > canvas")).toHaveCount(0)
})

// cgc-mdx's island runtime unmounts islands before an SPA navigation and hydrates them after one.
test("it survives SPA navigation away and back, and lets go of PDF.js in between", async ({
  page,
}) => {
  await page.goto(PAGE)
  await shown(page)
  // PDF.js parses in a worker, which lives as long as the document is open.
  await expect.poll(() => page.workers().length).toBe(1)

  await page.locator("article a.internal", { hasText: "plain-note" }).click()
  await expect(page).toHaveURL(/\/plain-note$/)
  await expect(page.locator(".cgc-pdf-viewer")).toHaveCount(0)
  await expect.poll(() => page.workers().length).toBe(0)

  await page.goBack()
  await expect(page).toHaveURL(/\/lab\/pdf$/)
  const viewer = await shown(page)
  // Drawn once, not once per visit.
  await expect(viewer.locator(".cgc-pdf-viewer__page")).toHaveCount(2)
  await expect(viewer.getByText("Fixture PDF, page one")).toHaveCount(1)
  for (const canvas of await viewer.locator(".cgc-pdf-viewer__page canvas").all()) {
    await expect.poll(() => inked(canvas)).toBeGreaterThan(0)
  }
  await expect.poll(() => page.workers().length).toBe(1)
})

// Quartz's SPA router takes every same-origin link: it would fetch the PDF as the next page, find
// it isn't HTML and `location.assign` it, which opens it in the browser rather than saving it.
// Headless Chromium saves either way, so the tell is the router's fetch.
test("Download saves the PDF instead of navigating to it", async ({ page }) => {
  await page.goto(PAGE)
  const viewer = await shown(page)
  const routed = []
  page.on("request", (req) => {
    if (req.url().endsWith("/lab/fixture.pdf") && req.resourceType() === "fetch")
      routed.push(req.url())
  })
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    viewer.getByRole("link", { name: "Download" }).click(),
  ])
  expect(download.suggestedFilename()).toBe("fixture.pdf")
  expect(routed).toEqual([])
  await expect(page).toHaveURL(/\/lab\/pdf$/)
  await expect(viewer.locator(".cgc-pdf-viewer__page")).toHaveCount(2)
})

test("a PDF that can't be loaded leaves a link to it, and no uncaught error", async ({ page }) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.route("**/lab/fixture.pdf", (route) => route.fulfill({ status: 404, body: "gone" }))
  await page.goto(PAGE)
  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  const viewer = page.locator(".cgc-pdf-viewer")
  await expect(viewer.locator(".cgc-pdf-viewer__status")).toContainText("couldn't be shown")
  await expect(viewer.getByRole("link", { name: "Open the PDF" })).toHaveAttribute(
    "href",
    "/lab/fixture.pdf",
  )
  await expect(viewer.locator(".cgc-pdf-viewer__page")).toHaveCount(0)
  expect(errors).toEqual([])
})

// Skin is Quartz's colour properties and nothing else, so the viewer follows the scheme when a
// reader toggles it on a loaded page (ADR-0003's scheme amendment); nothing is resolved in script.
test("its skin follows the colour scheme when the reader toggles it", async ({ page }) => {
  await page.goto(PAGE)
  const viewer = await shown(page)
  const toolbar = viewer.locator(".cgc-pdf-viewer__toolbar")
  const skin = () =>
    toolbar.evaluate((el) => {
      const probe = document.createElement("div")
      probe.style.backgroundColor = "var(--lightgray)"
      document.body.append(probe)
      const expected = getComputedStyle(probe).backgroundColor
      probe.remove()
      return { actual: getComputedStyle(el).backgroundColor, expected }
    })
  const before = await skin()
  expect(before.actual).toBe(before.expected)
  await toggleScheme(page)
  const after = await skin()
  expect(after.actual).toBe(after.expected)
  expect(after.actual).not.toBe(before.actual)
})

test("selected text stays invisible over the drawing", async ({ page }) => {
  await page.goto(PAGE)
  const viewer = await shown(page)
  const color = await viewer
    .getByText("Fixture PDF, page one")
    .evaluate((span) => getComputedStyle(span, "::selection").color)
  expect(color).toBe("rgba(0, 0, 0, 0)")
})

// The stock fixture makes off-site requests of its own on every page (Google Fonts, the graph's d3
// and pixi from jsDelivr, Plausible), so the widget's page is held to the same page without it. No
// off-site request reaches the network: each is recorded and refused.
test("the page makes no CDN request that the same page without the widget doesn't", async ({
  page,
  baseURL,
}) => {
  const site = new URL(baseURL).host
  let offsite = []
  const local = []
  await page.route(
    (u) => u.protocol.startsWith("http") && u.host !== site,
    (route) => {
      offsite.push(route.request().url())
      return route.abort()
    },
  )
  page.on("request", (req) => {
    const u = new URL(req.url())
    if (u.host === site) local.push(u.pathname)
  })

  await page.goto("/lab/pdf-twin")
  await page.waitForLoadState("networkidle")
  const withoutWidget = offsite

  offsite = []
  await page.goto(PAGE)
  await shown(page)
  await page.waitForLoadState("networkidle")
  expect(offsite.filter((u) => !withoutWidget.includes(u))).toEqual([])
  // The widget came from the site, and so did the PDF.
  expect(local.filter((p) => p.startsWith("/static/cgc-mdx/PDFViewer-"))).not.toEqual([])
  expect(local).toContain("/lab/fixture.pdf")
})
