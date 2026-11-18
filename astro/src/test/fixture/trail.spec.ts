import { trail as settings } from "../../site.config.ts"
import { TRAIL_KEY } from "../../lib/trail.ts"
import { expect, expectAt, test } from "../site.ts"

// The reader's trail (src/lib/trail.ts): the notes they came through to the note shown, carried in
// the page's address. Fixture notes: client-side-navigation's start links to its
// destination, which links back; alpha links to beta.
const start = "/client-side-navigation/start"
const destination = "/client-side-navigation/destination"

// The notes of the trail before the note shown, as the page's address carries them.
const before = (page: import("@playwright/test").Page) => () => new URL(page.url()).searchParams.getAll(TRAIL_KEY)

test("a page reached by its address has no trail before it", async ({ page }) => {
  await page.goto(start)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where navigation starts")
  expect(before(page)()).toEqual([])
})

test("following a link carries the trail on: the page it was followed from is on it", async ({ page }) => {
  await page.goto(start)
  await page.getByRole("link", { name: "To the destination" }).click()
  await expectAt(page, destination)
  await expect.poll(before(page)).toEqual([start])
})

test("following a link to a note on the trail goes back to it, letting the notes after it go", async ({ page }) => {
  await page.goto(`${destination}?trail=/&trail=${start}`)
  await expect.poll(before(page)).toEqual(["/", start])
  await page.locator(".prose").getByRole("link", { name: "where navigation starts" }).click()
  await expectAt(page, start)
  await expect.poll(before(page)).toEqual(["/"])
})

test("a trail holds as many notes as the site configures, letting the oldest go", async ({ page }) => {
  test.skip(settings.length !== 4, "the fixture's trail is written for a trail of four notes")
  await page.goto(`/content/notes/alpha?trail=/&trail=${start}&trail=${destination}`)
  await expect.poll(before(page)).toEqual(["/", start, destination])

  await page.locator(".prose").getByRole("link", { name: "beta" }).click()
  await expectAt(page, "/content/notes/beta")
  await expect.poll(before(page)).toEqual([start, destination, "/content/notes/alpha"])
})

test("the back and forward buttons return to a page with the trail it had", async ({ page }) => {
  await page.goto(start)
  await page.getByRole("link", { name: "To the destination" }).click()
  await expect.poll(before(page)).toEqual([start])

  await page.goBack()
  await expectAt(page, start)
  await expect.poll(before(page)).toEqual([])
  await page.goForward()
  await expectAt(page, destination)
  await expect.poll(before(page)).toEqual([start])
})

test("a link followed from the 404 page starts a trail afresh", async ({ page }) => {
  await page.goto("/nothing/at/all")
  await page.locator("main").getByRole("link", { name: "Return to the home page" }).click()
  await expectAt(page, "/")
  expect(new URL(page.url()).search).toBe("")
  await expect.poll(before(page)).toEqual([])
})

test("the site's title goes to the home page with no trail: a fresh start", async ({ page }) => {
  await page.goto(`${destination}?trail=/&trail=${start}`)
  await page.getByRole("link", { name: "Chaotic Good Computing by Spencer Elkington" }).click()
  await expectAt(page, "/")
  expect(new URL(page.url()).search).toBe("")
  await expect.poll(before(page)).toEqual([])
})

test("on a phone, the site's name in the bar is a fresh start too", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${destination}?trail=${start}`)
  await page.getByRole("banner").getByRole("link", { name: "Chaotic Good Computing" }).click()
  await expectAt(page, "/")
  expect(new URL(page.url()).search).toBe("")
})

test("the copy-link button copies the page's own address, with none of the trail, and says so", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto(`${destination}?trail=${start}`)
  const copy = page.getByRole("button", { name: "Copy link" })
  await copy.click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "https://blog.chaoticgood.computer/client-side-navigation/destination",
  )
  await expect(page.getByRole("status")).toHaveText("Copied")
  await expect(page.getByRole("status")).toBeHidden()
})

test("the QR code button shows the page's own address as a QR code, with none of the trail, until it is closed", async ({ page }) => {
  await page.goto(`${destination}?trail=${start}`)
  const badge = page.getByRole("button", { name: "QR code" })
  await badge.click()
  const dialog = page.getByRole("dialog", { name: "A QR code for this page" })
  await expect(dialog).toBeVisible()
  const address = "https://blog.chaoticgood.computer/client-side-navigation/destination"
  await expect(dialog.getByRole("img", { name: `A QR code for ${address}` }).locator("svg")).toBeVisible()
  await expect(dialog.locator(".qr-address")).toHaveText(address)

  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await badge.click()
  await dialog.getByRole("button", { name: "Close" }).click()
  await expect(dialog).toBeHidden()
})

test("the services' share links go to their share intents for the page's own address, in a new tab", async ({ page }) => {
  await page.goto(`${destination}?trail=${start}`)
  const address = "https://blog.chaoticgood.computer/client-side-navigation/destination"
  const shares = page.getByRole("list", { name: "Share on:" })
  for (const [name, origin] of [
    ["Bluesky", "https://bsky.app"],
    ["Hacker News", "https://news.ycombinator.com"],
    ["LinkedIn", "https://www.linkedin.com"],
    ["X", "https://x.com"],
  ] as const) {
    const link = shares.getByRole("link", { name, exact: true })
    await expect(link).toHaveAttribute("target", "_blank")
    const href = new URL((await link.getAttribute("href"))!)
    expect(href.origin).toBe(origin)
    expect([...href.searchParams.values()].join(" ")).toContain(address)
  }
})

test("the title is centred on the note, with nothing beside it", async ({ page }) => {
  await page.goto(destination)
  const middle = (box: { x: number; width: number }) => box.x + box.width / 2
  const title = (await page.getByRole("heading", { level: 1 }).boundingBox())!
  const header = (await page.locator("main > header").boundingBox())!
  expect(Math.abs(middle(title) - middle(header))).toBeLessThan(2)
  const shares = (await page.getByRole("list", { name: "Share on:" }).boundingBox())!
  expect(shares.y).toBeGreaterThanOrEqual(title.y + title.height - 1)
})
