import { trail as settings } from "../../site.config.ts"
import { expect, expectAt, test } from "../site.ts"

// The reader's trail (src/lib/trail.ts): the notes they came through to the note shown, each a
// spine beside it that goes back to it. Fixture notes: client-side-navigation's start links to its
// destination, which links back; alpha links to beta.
const start = "/client-side-navigation/start"
const destination = "/client-side-navigation/destination"

const spines = (page: import("@playwright/test").Page) => page.getByRole("navigation", { name: "Trail" }).getByRole("link")

test("a page reached by its address has no trail before it", async ({ page }) => {
  await page.goto(start)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where navigation starts")
  await expect(spines(page)).toHaveCount(0)
})

test("following a link carries the trail on: the page it was followed from is a spine, which goes back to it", async ({
  page,
}) => {
  await page.goto(start)
  await page.getByRole("link", { name: "To the destination" }).click()
  await expectAt(page, destination)
  await expect(spines(page)).toHaveText(["Where navigation starts"])

  await spines(page).first().click()
  await expectAt(page, start)
  await expect(spines(page)).toHaveCount(0)
})

test("following a link to a note on the trail goes back to it, letting the notes after it go", async ({ page }) => {
  await page.goto(`${destination}?trail=/&trail=${start}`)
  await expect(spines(page)).toHaveText(["Fixture Home", "Where navigation starts"])
  await page.locator(".prose").getByRole("link", { name: "where navigation starts" }).click()
  await expectAt(page, start)
  await expect(spines(page)).toHaveText(["Fixture Home"])
})

test("a trail holds as many notes as the site configures, letting the oldest go", async ({ page }) => {
  test.skip(settings.length !== 4, "the fixture's trail is written for a trail of four notes")
  await page.goto(`/content/notes/alpha?trail=/&trail=${start}&trail=${destination}`)
  await expect(spines(page)).toHaveText(["Fixture Home", "Where navigation starts", "The destination"])

  await page.locator(".prose").getByRole("link", { name: "beta" }).click()
  await expectAt(page, "/content/notes/beta")
  await expect(spines(page)).toHaveText(["Where navigation starts", "The destination", "Alpha"])
})

test("the back and forward buttons return to a page with the trail it had", async ({ page }) => {
  await page.goto(start)
  await page.getByRole("link", { name: "To the destination" }).click()
  await expect(spines(page)).toHaveCount(1)

  await page.goBack()
  await expectAt(page, start)
  await expect(spines(page)).toHaveCount(0)
  await page.goForward()
  await expectAt(page, destination)
  await expect(spines(page)).toHaveText(["Where navigation starts"])
})

test("a link followed from the 404 page starts a trail afresh", async ({ page }) => {
  await page.goto("/nothing/at/all")
  await page.locator("main").getByRole("link", { name: "Return to the home page" }).click()
  await expectAt(page, "/")
  expect(new URL(page.url()).search).toBe("")
  await expect(spines(page)).toHaveCount(0)
})

test("the site's title goes to the home page with no trail: a fresh start", async ({ page }) => {
  await page.goto(`${destination}?trail=/&trail=${start}`)
  await page.getByRole("link", { name: "Chaotic Good Computing by Spencer Elkington" }).click()
  await expectAt(page, "/")
  expect(new URL(page.url()).search).toBe("")
  await expect(spines(page)).toHaveCount(0)
})

test("on a phone, the site's name in the bar is a fresh start too", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${destination}?trail=${start}`)
  await page.getByRole("banner").getByRole("link", { name: "Chaotic Good Computing" }).click()
  await expectAt(page, "/")
  expect(new URL(page.url()).search).toBe("")
})

test("the button beside a title copies the page's own address, with none of the trail", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto(`${destination}?trail=${start}`)
  await page.getByRole("heading", { level: 1 }).hover()
  await page.getByRole("button", { name: "Copy a link to this page" }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "https://blog.chaoticgood.computer/client-side-navigation/destination",
  )
})
