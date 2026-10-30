import type { Locator, Page } from "@playwright/test"
import { expect, expectAt, test } from "../site.ts"

// test/fixtures/vault/annotation-viewer: a note written with the Annotator plugin against a
// two-page PDF, "On Meetings", whose mirror is in the fixture's mirror directory
// (test/fixtures/mirrors/On-Meetings.pdf): an annotation on the first page and two on the
// second, a reply to the first of those, and one quoted from a draft the document doesn't have; and
// a note whose document has no mirror. The viewer lays the page out as the Quartz annotator does
// (docs/cutover/annotations-audit.md, ADR 3701).

const PAGE = "/annotation-viewer/on-meetings"
const MIRROR = "/assets/annotated-documents/On-Meetings.pdf"
// The cards in the order the page shows them once the document has opened: those whose passage it
// has, a reply after what it answers, then the one it hasn't.
const IN_ORDER = ["^promise", "^cancel", "^reply", "^minutes", "^draft"]

const DESKTOP = { width: 1440, height: 900 }
const TABLET = { width: 1100, height: 900 }
const PHONE = { width: 390, height: 844 }

const isMirror = (url: string) => new URL(url).pathname === MIRROR
const viewerOf = (page: Page) => page.locator("annotation-viewer")
const card = (page: Page, id: string) => page.locator(`.annotation[id="^${id}"]`)
const highlights = (page: Page, id: string) => page.locator(`annotation-viewer .highlight[data-annotation="${id}"]`)

// The page at a size, once its document has opened and taken the layout that fits.
async function opened(page: Page, size: { width: number; height: number }, address = PAGE) {
  await page.setViewportSize(size)
  await page.goto(address)
  const viewer = viewerOf(page)
  await expect(viewer).toHaveAttribute("data-state", "opened")
  await expect(viewer).not.toHaveAttribute("data-layout", "static")
  return viewer
}

// How far the page has scrolled sideways, which it never should.
const sideways = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

test("on a desktop the document is drawn from the site's own mirror, with the cards in its margin", async ({ page }) => {
  const mirror = page.waitForResponse((response) => isMirror(response.url()))
  const viewer = await opened(page, DESKTOP)
  expect((await mirror).status()).toBe(200)
  await expect(viewer).toHaveAttribute("data-layout", "margin")

  const pages = viewer.locator(".document-page")
  await expect(pages).toHaveCount(2)
  await expect(pages.first().locator("canvas")).toBeVisible()
  // Side by side: the document, then the cards, which are no wider than a card.
  const document = (await viewer.locator(".document").boundingBox())!
  const cards = (await page.locator("section.annotations").boundingBox())!
  expect(document.x + document.width).toBeLessThanOrEqual(cards.x)
  expect(cards.width).toBeCloseTo(320, 0)
  expect(document.width).toBeGreaterThan(cards.width)
  // One page scroll: the document never scrolls by itself, and nothing scrolls sideways.
  expect(await viewer.locator(".document").evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1)
  expect(await sideways(page)).toBe(0)
})

test("each card in the margin is level with its passage, or just below the card above, and none overlap", async ({ page }) => {
  await opened(page, DESKTOP)
  await expect(page.locator("section.annotations > .annotation")).toHaveCount(5)
  const ids = await page.locator("section.annotations > .annotation").evaluateAll((all) => all.map((each) => each.id))
  expect(ids).toEqual(IN_ORDER)
  let bottom = -Infinity
  for (const id of ["promise", "cancel", "reply", "minutes"]) {
    const box = (await card(page, id).boundingBox())!
    expect(box.y, id).toBeGreaterThanOrEqual(bottom)
    if (id === "reply") {
      // A reply follows what it answers.
      expect(box.y).toBeCloseTo(bottom + 12, 0)
    } else {
      // Level with its passage, give or take its first line's height, unless the card above is in the way.
      const passage = (await highlights(page, id).first().boundingBox())!
      if (box.y > bottom + 13) expect(Math.abs(box.y - passage.y), id).toBeLessThan(20)
      else expect(box.y, id).toBeGreaterThan(passage.y)
    }
    bottom = box.y + box.height
  }
})

test("what the document has no place for goes last, under its own heading, after the last page", async ({ page }) => {
  const viewer = await opened(page, DESKTOP)
  const heading = page.locator("section.annotations > .unplaced")
  await expect(heading).toHaveText("Not found in the document")
  const lastPage = (await viewer.locator(".document-page").last().boundingBox())!
  const under = (await heading.boundingBox())!
  const draft = (await card(page, "draft").boundingBox())!
  expect(under.y).toBeGreaterThanOrEqual(lastPage.y + lastPage.height - 1)
  expect(draft.y).toBeGreaterThan(under.y)
  await expect(highlights(page, "draft")).toHaveCount(0)
})

test("each annotation's passage is highlighted on the page of the document it is on, by a link to the annotation", async ({ page }) => {
  await opened(page, DESKTOP)
  const pages = page.locator("annotation-viewer .document-page")
  // A box over each line: "A meeting is a promise…" and "Write down what was decided…" run onto a
  // second line, and "Cancel any meeting…" fits on one.
  await expect(pages.nth(0).locator(".highlight")).toHaveCount(2)
  await expect(pages.nth(0).locator('.highlight[href="#^promise"]')).toHaveCount(2)
  await expect(pages.nth(1).locator('.highlight[href="#^cancel"]')).toHaveCount(1)
  await expect(pages.nth(1).locator('.highlight[href="#^minutes"]')).toHaveCount(2)
  // In the order they are on the page: the second page's rule before its last line.
  const cancel = (await pages.nth(1).locator('.highlight[href="#^cancel"]').boundingBox())!
  const minutes = (await pages.nth(1).locator('.highlight[href="#^minutes"]').first().boundingBox())!
  expect(cancel.y).toBeLessThan(minutes.y)
})

// Where each passage's lines are in On-Meetings.pdf, as shares of its page: from the left, from the
// top to the top of the line's text, and how wide the line's text is. Each line is 0.022 of the page
// tall.
const LINES = {
  promise: { page: 0, lines: [{ left: 0.134, top: 0.331, width: 0.717 }, { left: 0.134, top: 0.363, width: 0.485 }] },
  cancel: { page: 1, lines: [{ left: 0.134, top: 0.42, width: 0.711 }] },
  minutes: { page: 1, lines: [{ left: 0.134, top: 0.63, width: 0.717 }, { left: 0.134, top: 0.663, width: 0.069 }] },
}

test("each highlight is over its passage's line of text", async ({ page }) => {
  await opened(page, DESKTOP)
  const pages = page.locator("annotation-viewer .document-page")
  await expect(pages.nth(1).locator(".highlight")).toHaveCount(3)
  for (const [id, { page: n, lines }] of Object.entries(LINES)) {
    const box = (await pages.nth(n).boundingBox())!
    const each = pages.nth(n).locator(`.highlight[href="#^${id}"]`)
    await expect(each).toHaveCount(lines.length)
    for (const [i, line] of lines.entries()) {
      const at = (await each.nth(i).boundingBox())!
      expect(Math.abs((at.x - box.x) / box.width - line.left), `${id} line ${i} left`).toBeLessThan(0.01)
      expect(Math.abs(at.width / box.width - line.width), `${id} line ${i} width`).toBeLessThan(0.02)
      // The box covers the line's text, and reaches no further than half a line over or under it.
      const [top, bottom] = [(at.y - box.y) / box.height, (at.y + at.height - box.y) / box.height]
      expect(top, `${id} line ${i} top`).toBeLessThanOrEqual(line.top + 0.002)
      expect(top, `${id} line ${i} top`).toBeGreaterThan(line.top - 0.011)
      expect(bottom, `${id} line ${i} bottom`).toBeGreaterThanOrEqual(line.top + 0.022 - 0.006)
      expect(bottom, `${id} line ${i} bottom`).toBeLessThan(line.top + 0.022 + 0.011)
    }
  }
})

test("the document's text can be selected, under its highlights", async ({ page }) => {
  const viewer = await opened(page, DESKTOP)
  const text = viewer.locator(".document-page").first().locator(".text-layer")
  await expect(text).toContainText("On Meetings")
  await expect(text.getByText("When that promise is kept")).toHaveCSS("color", "rgba(0, 0, 0, 0)")
  await page.mouse.dblclick(...(await centre(text.getByText("When that promise is kept"))))
  expect(await page.evaluate(() => getSelection()?.toString().trim())).toMatch(/^\w+$/)
})

test("a highlight is the scheme's text highlight, and the page is paper, white in either scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" })
  await opened(page, DESKTOP)
  await expect(page.locator("annotation-viewer .document-page").first()).toHaveCSS("background-color", "rgb(255, 255, 255)")
  // --textHighlight's dark value, #b3aa0288.
  await expect(highlights(page, "promise").first()).toHaveCSS("background-color", "rgba(179, 170, 2, 0.533)")
})

test("every card is whole beside the document until one is selected, which then lays the others short", async ({ page }) => {
  await opened(page, DESKTOP)
  const promise = card(page, "promise")
  const comment = promise.locator(".annotation-comment")
  for (const id of ["promise", "cancel", "minutes"]) await expect(card(page, id)).not.toHaveClass(/\bshort\b/)
  expect((await comment.boundingBox())!.height).toBeGreaterThan(100)

  await card(page, "cancel").locator(".annotation-comment").click()
  await expect(card(page, "cancel")).toHaveAttribute("data-selected")
  // Every other card is cut to two lines, one of its passage and one of its comment, which fades
  // where it is cut; its tags and date are left for the whole card.
  await expect(promise).toHaveClass(/\bshort\b/)
  await expect(comment).toHaveClass(/\bclipped\b/)
  await expect.poll(async () => (await comment.boundingBox())!.height).toBeLessThan(30)
  await expect.poll(async () => (await promise.locator(".annotation-highlight").boundingBox())!.height).toBeLessThan(45)
  await expect(promise.locator(".annotation-date")).toBeHidden()

  await comment.click()
  await expect(promise).toHaveAttribute("data-selected")
  await expect(promise).not.toHaveClass(/\bshort\b/)
  await expect(promise).toHaveCSS("border-color", "rgb(40, 75, 99)")
  await expect.poll(async () => (await comment.boundingBox())!.height).toBeGreaterThan(100)
  for (const id of ["cancel", "minutes"]) await expect(card(page, id)).toHaveClass(/\bshort\b/)
})

test("where the cards, whole, would run on more than a screen past the end of the document, every one is short from the start", async ({ page }) => {
  const viewer = await opened(page, DESKTOP)
  const document = viewer.locator(".document")
  // Zoomed out, and on a short screen, the cards run on well past the document.
  await page.setViewportSize({ width: DESKTOP.width, height: 400 })
  for (let i = 0; i < 4; i++) await page.keyboard.press("-")
  await expect(viewer).toHaveAttribute("data-layout", "margin")
  for (const id of ["promise", "cancel", "minutes"]) await expect(card(page, id)).toHaveClass(/\bshort\b/)
  // The last card the document has a place for (^draft's passage it hasn't, and goes after it).
  const bottom = async (locator: Locator) => {
    const box = (await locator.boundingBox())!
    return box.y + box.height
  }
  await expect.poll(async () => (await bottom(card(page, "minutes"))) - (await bottom(document))).toBeLessThanOrEqual(0)

  // A selected card is whole, the others still short; zoomed back in, they are whole again.
  await card(page, "cancel").click()
  await expect(card(page, "cancel")).not.toHaveClass(/\bshort\b/)
  await expect(card(page, "promise")).toHaveClass(/\bshort\b/)
  await page.keyboard.press("Escape")
  await page.keyboard.press("0")
  for (const id of ["promise", "cancel", "minutes"]) await expect(card(page, id)).not.toHaveClass(/\bshort\b/)
})

test("a card takes the document to its passage, marks its highlights, and puts its address in place of the page's", async ({ page }) => {
  await opened(page, DESKTOP)
  const before = await page.evaluate(() => history.length)
  const highlight = highlights(page, "minutes").first()
  await expect(highlight).not.toBeInViewport()

  await card(page, "minutes").locator(".annotation-highlight").click()
  await expect(highlight).toBeInViewport()
  await expect(highlight).toHaveClass(/\bselected\b/)
  await expect(card(page, "minutes")).toHaveAttribute("data-selected")
  await expect(card(page, "minutes")).toBeInViewport()
  await expectAt(page, /#\^minutes$/)
  expect(await page.evaluate(() => history.length)).toBe(before)
})

test("a highlight selects its annotation, whose card is beside it", async ({ page }) => {
  await opened(page, DESKTOP)
  await highlights(page, "cancel").first().click()
  await expect(card(page, "cancel")).toHaveAttribute("data-selected")
  await expect(card(page, "cancel")).toBeInViewport()
  await expectAt(page, /#\^cancel$/)
})

test("j and k step through the annotations in order, Esc clears, and none of them act while the reader types", async ({ page }) => {
  await opened(page, DESKTOP)
  const selected = () => page.locator(".annotation[data-selected]").getAttribute("id")
  await page.keyboard.press("j")
  expect(await selected()).toBe("^promise")
  await page.keyboard.press("j")
  await page.keyboard.press("j")
  expect(await selected()).toBe("^reply")
  await page.keyboard.press("k")
  expect(await selected()).toBe("^cancel")
  await page.keyboard.press("Escape")
  await expect(page.locator(".annotation[data-selected]"), "Esc").toHaveCount(0)
  await expect(page).not.toHaveURL(/#/)

  // A field on the page, which the keys leave alone while the reader types in it.
  await page.evaluate(() => document.querySelector("main")!.appendChild(document.createElement("input")))
  await page.locator("main > input").focus()
  await page.keyboard.press("j")
  await expect(page.locator(".annotation[data-selected]"), "typing").toHaveCount(0)
})

test("a page opened at an annotation's address opens with it selected, at its passage", async ({ page }) => {
  await opened(page, DESKTOP, `${PAGE}#^cancel`)
  await expect(card(page, "cancel")).toHaveAttribute("data-selected")
  await expect(highlights(page, "cancel")).toBeInViewport()
  await expect(card(page, "cancel")).toBeInViewport()
})

test("hovering a card tints its highlights", async ({ page }) => {
  await opened(page, DESKTOP)
  await card(page, "promise").hover()
  await expect(highlights(page, "promise").first()).toHaveClass(/\bhovered\b/)
  await expect(highlights(page, "cancel")).not.toHaveClass(/\bhovered\b/)
})

test("the bar's toggle hides the margin, giving the document the column, and a reload remembers it", async ({ page }) => {
  const viewer = await opened(page, DESKTOP)
  const toggle = viewer.getByRole("button", { name: "Annotations (5)" })
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  const before = (await viewer.locator(".pages").boundingBox())!.width
  await toggle.click()
  await expect(viewer).toHaveAttribute("data-margin", "hidden")
  await expect(page.locator("section.annotations")).toBeHidden()
  expect((await viewer.locator(".pages").boundingBox())!.width).toBeGreaterThan(before)

  await page.reload()
  await expect(viewer).toHaveAttribute("data-margin", "hidden")
  await viewer.getByRole("button", { name: "Annotations (5)" }).click()
  await expect(page.locator("section.annotations")).toBeVisible()
})

test("the zoom is the bar's and the keyboard's: zoomed past the margin the cards go to the drawer, and a reload remembers it", async ({ page }) => {
  const viewer = await opened(page, DESKTOP)
  const level = viewer.getByRole("button", { name: "Reset the zoom" })
  await expect(level).toHaveText("100%")
  const width = async () => (await viewer.locator(".document-page").first().boundingBox())!.width
  const at100 = await width()

  await viewer.getByRole("button", { name: "Zoom out" }).click()
  await expect(level).toHaveText("90%")
  await expect.poll(width).toBeCloseTo(at100 * 0.9, 0)
  await page.keyboard.press("0")
  await expect(level).toHaveText("100%")

  await page.keyboard.press("+")
  await page.keyboard.press("+")
  await expect(level).toHaveText("125%")
  await expect(viewer).toHaveAttribute("data-layout", "drawer")
  // Wider than the column, it pans sideways in it, and the page never does.
  await page.keyboard.press("+")
  await page.keyboard.press("+")
  await expect(level).toHaveText("175%")
  await expect.poll(() => viewer.locator(".document").evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  expect(await sideways(page)).toBe(0)

  await page.reload()
  await expect(viewer.getByRole("button", { name: "Reset the zoom" })).toHaveText("175%")
  expect(await page.evaluate(() => location.href)).not.toContain("175")
  await viewer.getByRole("button", { name: "Reset the zoom" }).click()
  await expect(viewer).toHaveAttribute("data-layout", "margin")
})

test("on a phone the document takes the column, and the cards are in a drawer that starts closed", async ({ page }) => {
  const viewer = await opened(page, PHONE)
  await expect(viewer).toHaveAttribute("data-layout", "drawer")
  await expect(viewer).toHaveAttribute("data-drawer", "mobile")
  await expect(page.locator("section.annotations")).toBeHidden()
  const tab = viewer.getByRole("button", { name: "Annotations", exact: true })
  await expect(tab).toBeVisible()
  expect((await tab.boundingBox())!.x + (await tab.boundingBox())!.width).toBeCloseTo(PHONE.width, 0)
  const document = (await viewer.locator(".document").boundingBox())!
  const column = (await viewer.boundingBox())!
  expect(document.width).toBeCloseTo(column.width, 0)
  expect(await sideways(page)).toBe(0)
})

test("on a phone a highlight opens the drawer at its card, which holds the focus until it is closed", async ({ page }) => {
  const viewer = await opened(page, PHONE)
  await highlights(page, "minutes").first().click()
  const cards = page.locator("section.annotations")
  await expect(cards).toBeVisible()
  await expect(card(page, "minutes")).toBeInViewport()
  await expect(card(page, "minutes")).toHaveAttribute("data-selected")
  // Most of the screen, over a dimmed page.
  expect((await cards.boundingBox())!.width).toBeCloseTo(PHONE.width * 0.85, 0)
  await expect(viewer.locator(".scrim")).toBeVisible()
  await expect(cards).toBeFocused()
  await page.keyboard.press("Tab")
  expect(await page.evaluate(() => document.activeElement?.closest("section.annotations") !== null)).toBe(true)

  await page.keyboard.press("Escape")
  await expect(cards).toBeHidden()
  // A tap on the dimmed page closes it too.
  await viewer.getByRole("button", { name: "Annotations (5)" }).click()
  await expect(cards).toBeVisible()
  await page.mouse.click(20, 400)
  await expect(cards).toBeHidden()
})

test("on a phone a card in the drawer takes the document to its passage, and the drawer stays open", async ({ page }) => {
  const viewer = await opened(page, PHONE)
  await viewer.getByRole("button", { name: "Annotations", exact: true }).click()
  await card(page, "minutes").locator(".annotation-comment").click()
  await expect(highlights(page, "minutes").first()).toBeInViewport()
  await expect(page.locator("section.annotations")).toBeVisible()
})

test("on a tablet the drawer is a card's width, nothing is dimmed, and the document stays usable beside it", async ({ page }) => {
  const viewer = await opened(page, TABLET)
  await expect(viewer).toHaveAttribute("data-drawer", "tablet")
  await viewer.getByRole("button", { name: "Annotations (5)" }).click()
  const cards = page.locator("section.annotations")
  await expect(cards).toBeVisible()
  expect((await cards.boundingBox())!.width).toBeCloseTo(320, 0)
  await expect(viewer.locator(".scrim")).toBeHidden()
  await highlights(page, "promise").first().click()
  await expect(card(page, "promise")).toHaveAttribute("data-selected")
  await viewer.getByRole("button", { name: "Annotations", exact: true }).click()
  await expect(cards).toBeHidden()
})

test("dragging the tab out opens the drawer", async ({ page }) => {
  const viewer = await opened(page, TABLET)
  const [x, y] = await centre(viewer.getByRole("button", { name: "Annotations", exact: true }))
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x - 100, y, { steps: 10 })
  await page.mouse.up()
  await expect(page.locator("section.annotations")).toBeVisible()
})

test("narrowing the window past where the margin fits turns it into the drawer, and widening turns it back", async ({ page }) => {
  const viewer = await opened(page, DESKTOP)
  await page.setViewportSize(TABLET)
  await expect(viewer).toHaveAttribute("data-layout", "drawer")
  await page.setViewportSize(DESKTOP)
  await expect(viewer).toHaveAttribute("data-layout", "margin")
})

test.describe("by touch", () => {
  test.use({ hasTouch: true, isMobile: true })

  test("two fingers pinch the document, not the page, and the zoom is the one the bar shows", async ({ page }) => {
    const viewer = await opened(page, PHONE)
    // Where the reader pinches it: on the document, scrolled to.
    await viewer.locator(".document-page").first().scrollIntoViewIfNeeded()
    const before = (await viewer.locator(".document-page").first().boundingBox())!.width
    const [x, y] = await centre(viewer.locator(".document-page").first())
    await touch(page, [
      [
        { x: x - 20, y },
        { x: x - 60, y },
      ],
      [
        { x: x + 20, y },
        { x: x + 60, y },
      ],
    ])
    await expect(viewer.getByRole("button", { name: "Reset the zoom" })).not.toHaveText("100%")
    await expect.poll(async () => (await viewer.locator(".document-page").first().boundingBox())!.width).toBeGreaterThan(before * 1.5)
    // The page itself is never zoomed, and never scrolls sideways.
    expect(await page.evaluate(() => visualViewport?.scale ?? 1)).toBe(1)
    expect(await sideways(page)).toBe(0)
  })
})

test("a mirror that fails to load leaves the cards as on a note's page, with a link to the document itself", async ({ page }) => {
  await page.route(`**${MIRROR}`, (route) => route.fulfill({ status: 404, body: "Not found" }))
  await page.setViewportSize(DESKTOP)
  await page.goto(PAGE)

  const viewer = viewerOf(page)
  await expect(viewer).toHaveAttribute("data-state", "failed")
  await expect(viewer).toHaveAttribute("data-layout", "static")
  const notice = viewer.locator(".status").filter({ visible: true })
  await expect(notice).toHaveText("We couldn't show the PDF here, but you can read along at https://example.com/papers/On Meetings.pdf.")
  await expect(notice.getByRole("link")).toHaveAttribute("href", "https://example.com/papers/On%20Meetings.pdf")
  // The cards, one column, in the shell's own column, as on any note's page.
  await expect(page.locator("section.annotations")).toBeVisible()
  expect((await page.locator("article.prose").boundingBox())!.width).toBeLessThanOrEqual(640)
})

test("a document with no mirror shows the cards and where the document comes from, and no viewer", async ({ page }) => {
  const requested: string[] = []
  page.on("request", (request) => requested.push(request.url()))
  await page.setViewportSize(DESKTOP)
  await page.goto("/annotation-viewer/unpinned")
  await expect(page.locator(".annotation")).toHaveCount(1)
  await expect(page.locator(".annotated-document a")).toHaveAttribute("href", "https://example.com/papers/Unpinned.pdf")
  await expect(page.locator(".annotation-viewer, annotation-viewer")).toHaveCount(0)
  // The content is the shell's own column, as on any note's page.
  expect((await page.locator("article.prose").boundingBox())!.width).toBeLessThanOrEqual(640)
  expect(requested.filter((url) => /pdf/i.test(url))).toEqual([])
})

test("the viewer loads PDF.js and the mirror as the page loads, and a page of another kind loads no PDF code", async ({ page }) => {
  const requested: string[] = []
  page.on("request", (request) => requested.push(new URL(request.url()).pathname))
  await page.goto("/annotations/flatland")
  await page.waitForLoadState("networkidle")
  expect(requested.filter((path) => /pdf/i.test(path))).toEqual([])

  await opened(page, PHONE)
  expect(requested).toContain(MIRROR)
})

test("after a client-side navigation away, the keys are the next page's own again", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await opened(page, DESKTOP)
  await page.evaluate(() => ((window as { mark?: boolean }).mark = true))
  // Any link on the page is one the client router follows: here, one put there to follow.
  await page.evaluate(() => {
    const link = document.querySelector("main")!.appendChild(document.createElement("a"))
    link.href = "/annotation-viewer/unpinned"
    link.textContent = "Onwards"
  })
  await page.getByRole("link", { name: "Onwards" }).click()
  await expectAt(page, /\/annotation-viewer\/unpinned$/)
  expect(await page.evaluate(() => (window as { mark?: boolean }).mark)).toBe(true)
  await page.keyboard.press("j")
  await page.keyboard.press("+")
  await expectAt(page, /\/annotation-viewer\/unpinned$/)
  await expect(page.locator(".annotation[data-selected]")).toHaveCount(0)
  expect(errors).toEqual([])
})

test("crawlers are told to skip the mirror directory the document is served from", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text()
  expect(robots).toContain("Disallow: /assets/annotated-documents/\n")
})

// An element's centre, in the window.
async function centre(element: Locator): Promise<[number, number]> {
  const box = (await element.boundingBox())!
  return [box.x + box.width / 2, box.y + box.height / 2]
}

// Touches, as a phone sends them: Chromium's own touch input, through the DevTools protocol, so the
// page sees real touch and pointer events. Each finger moves from its first point to its last, all
// of them together, in `steps` moves. As the Quartz annotator's specs touch (its e2e/touch.mjs).
async function touch(page: Page, fingers: { x: number; y: number }[][], steps = 10) {
  const cdp = await page.context().newCDPSession(page)
  const at = (i: number) =>
    fingers.map((path, id) => {
      const [from, to] = [path[0]!, path.at(-1)!]
      return { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps, id }
    })
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(0) })
  for (let i = 1; i <= steps; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(i) })
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  await cdp.detach()
}

// test/fixtures/vault/annotation-viewer/garden.md: a scanned document, whose pages are pictures of
// text. Its mirror and text file are made for the run (scripts/fixture-mirrors.ts), the text
// recognized from the scans as the Annotator plugin recognizes it.
const GARDEN = "/annotation-viewer/garden"
const GARDEN_TEXT = "/assets/annotated-documents/Garden.pdf.text.json"

test("a scanned document's passages are found in its text file, the text the plugin recognized, and highlighted", async ({ page }) => {
  const text = page.waitForResponse((response) => new URL(response.url()).pathname === GARDEN_TEXT)
  const viewer = await opened(page, DESKTOP, GARDEN)
  expect((await text).status()).toBe(200)
  // The passage is on the first page, a scan, and its highlight is a link to its card.
  const highlight = highlights(page, "bench")
  await expect(highlight.first()).toBeVisible()
  await expect(highlight.first()).toHaveAttribute("href", "#^bench")
  expect(await viewer.locator('.document-page[data-page="1"] .highlight[data-annotation="bench"]').count()).toBeGreaterThan(0)
  // Its text is in the page's text layer, to select, though the page has none of its own.
  await expect(viewer.locator('.document-page[data-page="1"] .text-layer')).toContainText("surprise.")
})

test("a document with text of its own has no text file to fetch", async ({ page }) => {
  const requested: string[] = []
  page.on("request", (request) => requested.push(new URL(request.url()).pathname))
  await opened(page, DESKTOP)
  expect(requested.filter((path) => path.endsWith(".text.json"))).toEqual([])
})

test("beside the document, the preface and the epilogue read as a note does, and the document's source is just over it", async ({ page }) => {
  const viewer = await opened(page, DESKTOP, GARDEN)
  await expect(viewer).toHaveAttribute("data-layout", "margin")
  const main = (await page.locator("main").boundingBox())!
  // A note's column: 40rem, in the middle of the note's room.
  for (const part of [".annotation-preface", ".annotation-epilogue"]) {
    const box = (await page.locator(`article.prose > ${part}`).boundingBox())!
    expect(box.width, part).toBeCloseTo(640, 0)
    expect(box.x + box.width / 2, part).toBeCloseTo(main.x + main.width / 2, 0)
  }
  await expect(page.locator(".annotation-epilogue h3")).toHaveText("What it found")
  // The source, then the document under it, at its left edge; the preface above both.
  const preface = (await page.locator(".annotation-preface").boundingBox())!
  const source = (await page.locator(".annotated-document").boundingBox())!
  const document = (await viewer.locator(".document").boundingBox())!
  expect(source.y).toBeGreaterThanOrEqual(preface.y + preface.height)
  expect(document.y - (source.y + source.height)).toBeGreaterThanOrEqual(0)
  expect(document.y - (source.y + source.height)).toBeLessThan(24)
  expect(source.x).toBeCloseTo(document.x, 0)
})
