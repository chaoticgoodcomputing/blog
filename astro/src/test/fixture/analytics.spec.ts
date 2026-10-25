import type { Page } from "@playwright/test"
import { events, postHog } from "../analytics.ts"
import { expect, expectAt, test } from "../site.ts"

const start = "/analytics/start"

test("a page view is recorded when a page is loaded, with the trail it was reached by", async ({ page }) => {
  await page.goto(start)
  await expect.poll(() => events(page, "$pageview")).toEqual([{ path: "/analytics/start", trail: [] }])
})

test("a page loaded at an address with a trail is recorded with that trail, oldest first", async ({ page }) => {
  await page.goto(`${start}?trail=/&trail=/analytics/destination`)
  await expect
    .poll(() => events(page, "$pageview"))
    .toEqual([{ path: "/analytics/start", trail: ["/", "/analytics/destination"] }])
})

test("a page reached by a link is recorded too, by the PostHog the visit has already loaded", async ({ page }) => {
  await page.goto(start)
  await expect.poll(() => events(page, "$pageview")).toHaveLength(1)

  await page.getByRole("link", { name: "a link in the text" }).click()

  await expectAt(page, "/analytics/destination")
  await expect
    .poll(() => events(page, "$pageview"))
    .toEqual([
      { path: "/analytics/start", trail: [] },
      { path: "/analytics/destination", trail: ["/analytics/start"] },
    ])
  // From the project's host, and set up once, with its key.
  expect(postHog(page).loads).toEqual(["https://app.posthog.com/static/array.js"])
  expect(postHog(page).inits.map((init) => init.token)).toEqual(["phc_BviHJVml66FIB1RFmgeAzZpKRWA0nntGdIOo47hTA3X"])
})

// The privacy options the site has had since Quartz 4. `ip: false` is passed on as it was, though
// PostHog's library no longer reads it: an IP is kept out by the project's "Discard client IP data".
test("PostHog is set up with no cookie and no session recording", async ({ page }) => {
  await page.goto(start)

  await expect.poll(() => postHog(page).inits).toHaveLength(1)
  expect(postHog(page).inits[0].config).toEqual({
    api_host: "https://app.posthog.com",
    capture_pageview: false,
    persistence: "localStorage",
    disable_session_recording: true,
    ip: false,
  })
})

// Each kind of link on the page the router follows, and what site configuration names it.
for (const { kind, link, name, to } of [
  { kind: "a link in a note's text", link: (page: Page) => page.getByRole("link", { name: "a link in the text" }), name: "inline-link", to: "/analytics/destination" },
  { kind: "a tag badge", link: (page: Page) => page.locator(".tag-list").getByRole("link", { name: "#analytics" }), name: "tag-badge", to: "/tags/analytics" },
  { kind: "a link of no kind it names", link: (page: Page) => page.locator(".site-title"), name: "other", to: "/" },
]) {
  test(`following ${kind} is recorded as a navigation from "${name}"`, async ({ page, baseURL }) => {
    await page.goto(start)
    await expect.poll(() => postHog(page).inits).toHaveLength(1)

    await link(page).click()

    await expectAt(page, to)
    await expect.poll(() => events(page, "navigation")).toEqual([
      { source: name, from_page: "/analytics/start", to_page: to, url: new URL(to, baseURL).href, trail: ["/analytics/start"] },
    ])
  })
}

test("no navigation is recorded where the router moves to no other page, or no link was followed", async ({ page }) => {
  await page.goto(start)
  await expect.poll(() => postHog(page).inits).toHaveLength(1)

  // A heading on the same page: the page scrolls to it.
  await page.getByRole("link", { name: "a link to a heading on this page" }).click()
  await expectAt(page, "/analytics/start#further-down")
  // Then to another page, and back by the browser's button.
  await page.getByRole("link", { name: "a link in the text" }).click()
  await expectAt(page, "/analytics/destination")
  await page.goBack()
  await expectAt(page, "/analytics/start#further-down")

  // Each page shown is a page view, and only the link to another page a navigation.
  await expect.poll(() => events(page, "$pageview")).toHaveLength(3)
  expect(events(page, "navigation").map((event) => event.to_page)).toEqual(["/analytics/destination"])
})

// Wherever a browser has reported it: the standard place, then old Safari's and old IE's.
for (const [where, setDoNotTrack] of [
  ["navigator.doNotTrack", () => Object.defineProperty(Navigator.prototype, "doNotTrack", { get: () => "1" })],
  ["window.doNotTrack", () => Object.defineProperty(window, "doNotTrack", { get: () => "1" })],
  ["navigator.msDoNotTrack", () => Object.defineProperty(Navigator.prototype, "msDoNotTrack", { get: () => "1" })],
] as const) {
  test(`a reader with Do Not Track set (${where}) is not tracked: PostHog is never loaded`, async ({ page }) => {
    await page.addInitScript(setDoNotTrack)
    await page.goto(start)
    await page.getByRole("link", { name: "a link in the text" }).click()
    await expectAt(page, "/analytics/destination")
    await page.goto(start)

    // The page is shown, and whatever it would have sent has been sent.
    await expect(page.locator("main h1")).toHaveText("Where the reader starts")
    await page.waitForLoadState("load")
    expect(postHog(page)).toEqual({ loads: [], inits: [], captures: [] })
  })
}
