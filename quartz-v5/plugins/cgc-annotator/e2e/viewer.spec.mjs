// The annotation page (#37, #68): a note whose frontmatter names an `annotation-target` renders in
// the full-width frame, with the Viewer showing its mirror, every quoted passage highlighted, beside
// the annotations themselves. The fixture's /annotations/fixture-paper targets a URL the build never
// fetches: its source document is pinned by hand (tests/fixture-cache/), as the README tells a site
// to do for a host that refuses build machines. /annotations/withdrawn targets one that can't be
// fetched, so it has no mirror.
import { createHash } from "node:crypto"
import { test, expect, resolvedColour } from "../../../tests/harness/test.mjs"

const PAPER = "/annotations/fixture-paper"
const WITHDRAWN = "/annotations/withdrawn"
const TARGET = "https://cgc-fixture.invalid/paper.pdf"
// Where the mirror is served: the fixture keeps the default `mirrorDir`, and the name is the hash of
// the URL (the emitter's contract, pinned independently by mirrors.spec.mjs).
const MIRROR = `/mirrors/${createHash("sha256").update(new URL(TARGET).href).digest("hex").slice(0, 16)}`
// Every annotation on the paper, in the order its passages come in the document.
const IN_ORDER = ["highlights", "quoteonly", "orphan", "lastpage"]
// The ones whose passage is in the document, and so get a highlight.
const ANCHORED = ["highlights", "quoteonly", "lastpage"]

const viewerOf = (page) => page.locator(".cgc-annotator-viewer")
const annotation = (page, id) => page.locator(`.cgc-annotator__annotation[data-annotation="${id}"]`)
const highlights = (page, id) => page.locator(`.cgc-annotator-viewer__highlight[data-annotation="${id}"]`)

// The paper's Viewer once its island has hydrated, PDF.js has drawn both pages and every anchored
// passage is highlighted.
async function shown(page) {
  const viewer = viewerOf(page)
  await expect(viewer).toHaveAttribute("data-cgc-hydrated", "")
  await expect(viewer.locator(".cgc-annotator-viewer__page")).toHaveCount(2)
  for (const id of ANCHORED) await expect(highlights(page, id).first()).toBeAttached()
  return viewer
}

// How many dark pixels a drawn page has: none on a blank canvas.
const inked = (canvas) =>
  canvas.evaluate((c) => {
    const { data } = c.getContext("2d").getImageData(0, 0, c.width, c.height)
    let ink = 0
    for (let i = 0; i < data.length; i += 4) if (data[i] < 128 && data[i + 3] > 0) ink++
    return ink
  })

// Marks the loaded document, so a spec can tell an SPA navigation (the mark survives) from a load.
const mark = (page) => page.evaluate(() => (window.cgcSpaMark = true))
const marked = (page) => page.evaluate(() => window.cgcSpaMark === true)

test("an annotation page renders in the full-width frame, its source document drawn page by page", async ({ page }) => {
  await page.goto(PAPER)
  await expect(page.locator(".page")).toHaveAttribute("data-frame", "full-width")
  const viewer = await shown(page)
  for (const canvas of await viewer.locator("canvas").all()) await expect.poll(() => inked(canvas)).toBeGreaterThan(0)
  // The text layer lies over the drawing, so the document's text can be selected and found.
  await expect(viewer.getByText("The annotator draws highlights over quoted passages.")).toBeAttached()
  await expect(viewer.getByText("Quoted on the last page, far below the fold.")).toBeAttached()
  // The page names where the document comes from, and links there rather than to the mirror.
  await expect(page.locator(".cgc-annotator__source-link")).toHaveAttribute("href", TARGET)
  await expect(page.locator(`a[href$="${MIRROR}"]`)).toHaveCount(0)
})

test("each passage an annotation quotes is highlighted where it is in the document, and no other", async ({ page }) => {
  await page.goto(PAPER)
  await shown(page)
  await expect(highlights(page, "orphan")).toHaveCount(0)
  // The highlight covers the quoted words, not the whole line they're on.
  const line = await page.getByText("The annotator draws highlights over quoted passages.").boundingBox()
  const boxes = await Promise.all((await highlights(page, "highlights").all()).map((h) => h.boundingBox()))
  expect(boxes).toHaveLength(1)
  const [box] = boxes
  expect(box.y + box.height / 2).toBeGreaterThan(line.y)
  expect(box.y + box.height / 2).toBeLessThan(line.y + line.height)
  expect(box.x).toBeGreaterThan(line.x + line.width * 0.15)
  expect(box.x + box.width).toBeLessThan(line.x + line.width - 2)
  expect(box.width).toBeGreaterThan(line.width * 0.5)
  // The passage on page two is highlighted on page two.
  await expect(page.locator('.cgc-annotator-viewer__page[data-page="2"] .cgc-annotator-viewer__highlight[data-annotation="lastpage"]')).toHaveCount(1)
})

test("the annotations sit beside the document, each with the passage it quotes", async ({ page }) => {
  await page.goto(PAPER)
  const list = page.locator(".cgc-annotator__annotations")
  await expect(list.locator(".cgc-annotator__annotation")).toHaveCount(IN_ORDER.length)
  expect(await list.locator(".cgc-annotator__annotation").evaluateAll((els) => els.map((el) => el.dataset.annotation))).toEqual(IN_ORDER)
  await expect(annotation(page, "highlights").locator(".cgc-annotator__quote")).toHaveText("draws highlights over quoted passages")
  // Annotation text is markdown, rendered through the site's own pipeline: wikilinks resolve.
  const comment = annotation(page, "highlights").locator(".cgc-annotator__comment")
  await expect(comment.locator("strong")).toHaveText("highlighted")
  await expect(comment.getByRole("link", { name: "plain-note" })).toHaveAttribute("href", /\/plain-note$/)
  await expect(annotation(page, "highlights").locator(".cgc-annotator__tag")).toHaveText("#reading")
  await expect(annotation(page, "highlights").locator("time")).toHaveAttribute("datetime", "2024-03-14T22:23:53.656Z")
  await expect(annotation(page, "highlights").locator("time")).toHaveText("Mar 14, 2024")
  // A highlight with no note of its own still shows its passage.
  await expect(annotation(page, "quoteonly").locator(".cgc-annotator__quote")).toHaveText("A second sentence that a note quotes in full")
  await expect(annotation(page, "quoteonly").locator(".cgc-annotator__comment")).toHaveCount(0)
  // Side by side on a wide screen.
  const [viewerBox, listBox] = [await viewerOf(page).boundingBox(), await list.boundingBox()]
  expect(viewerBox.x + viewerBox.width).toBeLessThanOrEqual(listBox.x + 1)
  expect(viewerBox.width).toBeGreaterThan(listBox.width)
})

test("choosing an annotation scrolls the document to its passage, and choosing a highlight picks its annotation", async ({ page }) => {
  await page.goto(PAPER)
  await shown(page)
  const passage = highlights(page, "lastpage").first()
  await expect(passage).not.toBeInViewport()
  // Anywhere on it but a link in its note, which goes where the link does.
  await annotation(page, "lastpage").locator(".cgc-annotator__quote").click()
  await expect(passage).toBeInViewport()
  await expect(annotation(page, "lastpage")).toHaveClass(/cgc-annotator__annotation--active/)
  await expect(passage).toHaveClass(/cgc-annotator-viewer__highlight--active/)

  await annotation(page, "highlights").locator(".cgc-annotator__quote").click()
  await expect(highlights(page, "highlights").first()).toBeInViewport()
  await expect(annotation(page, "lastpage")).not.toHaveClass(/--active/)
  await highlights(page, "highlights").first().click()
  await expect(annotation(page, "highlights")).toHaveClass(/cgc-annotator__annotation--active/)
  await expect(highlights(page, "lastpage").first()).not.toHaveClass(/--active/)
})

test("dragging the divider resizes the document, which is drawn again to fit", async ({ page }) => {
  await page.goto(PAPER)
  const viewer = await shown(page)
  const before = await viewer.locator(".cgc-annotator-viewer__page").first().boundingBox()
  // Grabbed by its middle, scrolled into view first: however tall the page's header grows, the
  // middle of a divider as tall as the document can fall below the fold.
  const grip = page.locator(".cgc-annotator-viewer__handle")
  await grip.hover()
  const handle = await grip.boundingBox()
  await page.mouse.down()
  await page.mouse.move(handle.x - 200, handle.y + handle.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect.poll(async () => (await viewer.locator(".cgc-annotator-viewer__page").first().boundingBox()).width).toBeLessThan(before.width - 100)
  await expect(viewer.locator(".cgc-annotator-viewer__page")).toHaveCount(2)
  for (const id of ANCHORED) await expect(highlights(page, id)).not.toHaveCount(0)
  // Still over its passage after the redraw.
  const line = await page.getByText("The annotator draws highlights over quoted passages.").boundingBox()
  const box = await highlights(page, "highlights").first().boundingBox()
  expect(box.y + box.height / 2).toBeGreaterThan(line.y)
  expect(box.y + box.height / 2).toBeLessThan(line.y + line.height)
})

test("a reader without JavaScript gets every annotation and a link to the source document", async ({ browser, colorScheme }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme })
  const page = await context.newPage()
  await page.goto(PAPER)
  await expect(page.locator(".cgc-annotator__annotation")).toHaveCount(IN_ORDER.length)
  await expect(annotation(page, "lastpage").locator(".cgc-annotator__quote")).toHaveText("far below the fold")
  await expect(page.locator(".cgc-annotator__source-link")).toHaveAttribute("href", TARGET)
  await context.close()
})

// The two SPA bugs the v4 annotation page carried (#34, #37): its viewer CSS went missing on the
// second visit, and an unfinished load kept drawing after the reader had left.
test("navigating away and back keeps the Viewer's CSS, and the document is drawn once", async ({ page }) => {
  await page.goto(PAPER)
  await shown(page)
  await mark(page)
  await annotation(page, "highlights").getByRole("link", { name: "plain-note" }).click()
  await expect(page).toHaveURL(/\/plain-note$/)
  await expect(viewerOf(page)).toHaveCount(0)
  await page.goBack()
  await expect(page).toHaveURL(new RegExp(`${PAPER}$`))
  const viewer = await shown(page)
  expect(await marked(page)).toBe(true)
  // Styled: the text layer's text is invisible over the drawing, and laid out where PDF.js put it.
  const text = viewer.getByText("The annotator draws highlights over quoted passages.")
  await expect(text).toHaveCSS("color", "rgba(0, 0, 0, 0)")
  await expect(text).toHaveCSS("position", "absolute")
  await expect(page.locator(".cgc-annotator__split")).toHaveCSS("display", "flex")
  // Drawn once, not once per visit.
  await expect(viewer.getByText("The annotator draws highlights over quoted passages.")).toHaveCount(1)
  await expect(highlights(page, "highlights")).toHaveCount(1)
  await expect.poll(() => page.workers().length).toBe(1)
})

test("leaving while the document loads stops the load: nothing is drawn after the reader has gone", async ({ page }) => {
  // PDF.js's worker rejects the work it still had pending as it's shut down. That is its own
  // teardown, in a thread that is ending, not an error in the page.
  const errors = []
  page.on("pageerror", (error) => {
    if (!(error.message === "Worker was terminated" && error.stack?.includes("/pdf.worker.min.js"))) errors.push(error.message)
  })
  let release
  const held = new Promise((done) => (release = done))
  await page.route(`**${MIRROR}`, async (route) => {
    await held
    await route.continue().catch(() => {})
  })
  const requested = page.waitForRequest(`**${MIRROR}`)
  await page.goto(PAPER)
  await requested
  await mark(page)
  // To another annotation page, laid out like this one, whose Viewer a late drawing could land in.
  await annotation(page, "orphan").getByRole("link", { name: "withdrawn" }).click()
  await expect(page).toHaveURL(new RegExp(`${WITHDRAWN}$`))
  await expect(page.locator(".cgc-annotator-viewer__notice")).toBeVisible()
  release()
  await expect.poll(() => page.workers().length).toBe(0)
  await page.waitForTimeout(500)
  await expect(page.locator(".cgc-annotator-viewer__page, .cgc-annotator-viewer__highlight")).toHaveCount(0)
  expect(await marked(page)).toBe(true)

  await page.unroute(`**${MIRROR}`)
  await page.goBack()
  const viewer = await shown(page)
  await expect(viewer.locator(".cgc-annotator-viewer__page")).toHaveCount(2)
  await expect(viewer.getByText("Quoted on the last page, far below the fold.")).toHaveCount(1)
  expect(errors).toEqual([])
})

test("moving between two annotation pages shows each its own document", async ({ page }) => {
  await page.goto(PAPER)
  await shown(page)
  await mark(page)
  await annotation(page, "orphan").getByRole("link", { name: "withdrawn" }).click()
  await expect(page).toHaveURL(new RegExp(`${WITHDRAWN}$`))
  await expect(page.locator(".cgc-annotator-viewer__notice")).toBeVisible()
  await expect(page.locator(".cgc-annotator-viewer__page")).toHaveCount(0)
  await page.locator(".cgc-annotator__annotation").getByRole("link", { name: "fixture-paper" }).click()
  await expect(page).toHaveURL(new RegExp(`${PAPER}$`))
  await shown(page)
  expect(await marked(page)).toBe(true)
})

test("an annotation page whose mirror is missing shows each quoted passage and where to read along", async ({ page, emitted }) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  // The build couldn't fetch this one, and built the page anyway.
  expect(emitted.exists("annotations/withdrawn.html")).toBe(true)
  await page.goto(WITHDRAWN)
  const notice = page.locator(".cgc-annotator-viewer__notice")
  await expect(notice).toContainText("read along at")
  await expect(notice.getByRole("link")).toHaveAttribute("href", "https://cgc-fixture.invalid/withdrawn.pdf")
  await expect(page.locator(".cgc-annotator__annotation .cgc-annotator__quote")).toHaveText([
    "a passage from a document no one can fetch",
    "and a second, later passage",
  ])
  await expect(page.locator(".cgc-annotator-viewer__page")).toHaveCount(0)
  expect(errors).toEqual([])
})

test("a mirror that fails to load in the browser degrades the same way", async ({ page }) => {
  await page.route(`**${MIRROR}`, (route) => route.fulfill({ status: 404, body: "gone" }))
  await page.goto(PAPER)
  const notice = page.locator(".cgc-annotator-viewer__notice")
  await expect(notice).toContainText("read along at")
  await expect(notice.getByRole("link")).toHaveAttribute("href", TARGET)
  await expect(annotation(page, "lastpage").locator(".cgc-annotator__quote")).toHaveText("far below the fold")
  await expect(page.locator(".cgc-annotator-viewer__page")).toHaveCount(0)
})

// The stock fixture makes off-site requests of its own on every page (Google Fonts, the graph's d3
// and pixi from jsDelivr, Plausible), so the annotation page is held to an ordinary page. No off-site
// request reaches the network: each is recorded and refused.
test("PDF.js, its worker and its wasm come from the site: no CDN request", async ({ page, baseURL }) => {
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
  await page.goto("/plain-note")
  await page.waitForLoadState("networkidle")
  const ordinary = offsite
  offsite = []
  await page.goto(PAPER)
  await shown(page)
  await page.waitForLoadState("networkidle")
  expect(offsite.filter((u) => !ordinary.includes(u))).toEqual([])
  expect(local).toContain(MIRROR)
  expect(local).toContain("/static/cgc-annotator/pdf.worker.min.js")
  // The fixture's document prints in process black, which PDF.js hands to its colour engine.
  expect(local).toContain("/static/cgc-annotator/wasm/qcms_bg.wasm")
})

test("the highlights' colour is the scheme's text highlight", async ({ page }) => {
  await page.goto(PAPER)
  await shown(page)
  const actual = await highlights(page, "highlights")
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(actual).toBe(await resolvedColour(page, "var(--textHighlight)"))
})

test("a note whose annotation-target is empty stays an ordinary note", async ({ page }) => {
  await page.goto("/annotations/not-yet")
  await expect(page.locator(".page")).toHaveAttribute("data-frame", "default")
  await expect(page.locator("article")).toContainText("This is an ordinary note.")
  await expect(page.locator(".cgc-annotator")).toHaveCount(0)
})

test("annotation text feeds backlinks, the graph and search, and the Annotator markup is gone", async ({ page, emitted }) => {
  const index = JSON.parse(emitted.read("static/contentIndex.json"))
  const entry = index["annotations/fixture-paper"]
  expect(entry.links).toEqual(expect.arrayContaining(["plain-note", "linked-note", "annotations/withdrawn"]))
  expect(entry.content).toContain("This passage is highlighted")
  expect(entry.content).toContain("draws highlights over quoted passages")
  for (const markup of ["show annotation", "PREFIX", "annotation-json"]) expect(entry.content).not.toContain(markup)
  await page.goto("/plain-note")
  await expect(page.locator(".cgc-backlinks").getByRole("link", { name: "Fixture paper" })).toBeVisible()
})
