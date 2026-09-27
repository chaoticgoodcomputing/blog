// quartz-posthog: v4's PostHog analytics (#42, #44), with its privacy options and its `navigation`
// events. PostHog is never reached: the fixture's `apiHost` is a reserved host that never resolves,
// and each spec puts a stand-in for PostHog's library there (tests/harness/analytics.mjs), which
// records what the page asks of PostHog. The fixture labels navigations with
//   .left.sidebar → left-sidebar, .callout → callout, article p a.internal → inline-link
// (tests/quartz.config.yaml), and /posthog/navigation has a link in each of those places, and one in
// a list, which none of them labels.
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { postHogStandIn } from "../../../tests/harness/analytics.mjs"
import { buildScratchSite, editConfig, fixtureConfig } from "../../../tests/harness/site.mjs"

const HOST = "https://posthog.invalid"
// Where a scratch site is served: its `baseUrl`, the fixture's, is `localhost`.
const SCRATCH_ORIGIN = "http://localhost"

test("loads PostHog from the configured host, once per page load", async ({ page }) => {
  const posthog = await postHogStandIn(page, HOST)
  await page.goto("/plain-note")
  await expect.poll(() => posthog.inits.length).toBe(1)
  expect(posthog.inits[0].token).toBe("phc_fixture")
  expect(posthog.inits[0].config.api_host).toBe(HOST)
  expect(posthog.requests).toEqual([`${HOST}/static/array.js`])
  // An SPA navigation keeps the loaded library: no second load, no second init.
  await page.locator("article a.internal", { hasText: "mdx-article" }).first().click()
  await expect(page).toHaveURL(/\/mdx-article\.mdx$/)
  await expect.poll(() => posthog.events("$pageview").length).toBe(2)
  expect(posthog.requests).toHaveLength(1)
  expect(posthog.inits).toHaveLength(1)
})

// v4's privacy options. `ip: false` is v4's, passed on as v4 did; PostHog's library has since made
// it a no-op, so this proves nothing about IPs. One is kept out only by the PostHog project's
// "Discard client IP data" setting (README), which no spec can see.
test("configures no session recording, and passes v4's ip: false (a no-op; see README)", async ({ page }) => {
  const posthog = await postHogStandIn(page, HOST)
  await page.goto("/plain-note")
  await expect.poll(() => posthog.inits.length).toBe(1)
  expect(posthog.inits[0].config).toMatchObject({
    ip: false,
    disable_session_recording: true,
    persistence: "localStorage",
    // Page views are counted by the plugin, once per page shown, SPA navigations included.
    capture_pageview: false,
  })
})

test("counts a page view on load and on each SPA navigation", async ({ page }) => {
  const posthog = await postHogStandIn(page, HOST)
  await page.goto("/posthog/navigation")
  await expect.poll(() => posthog.events("$pageview")).toEqual([{ path: "/posthog/navigation" }])
  await page.locator("article p a.internal").first().click()
  await expect(page).toHaveURL(/\/plain-note$/)
  await expect.poll(() => posthog.events("$pageview")).toEqual([{ path: "/posthog/navigation" }, { path: "/plain-note" }])
})

// Each case clicks a link on /posthog/navigation, which the SPA router follows. The event carries
// v4's properties: the label, and where the reader went from and to.
for (const { place, link, label, to } of [
  { place: "the article's text", link: (page) => page.locator("article p a.internal").first(), label: "inline-link", to: "/plain-note" },
  // Also an `a.internal`: the first selector that matches wins, in the option's order.
  { place: "a callout", link: (page) => page.locator("article .callout a.internal").first(), label: "callout", to: "/nested/deep-note" },
  { place: "the left sidebar", link: (page) => page.locator(".left.sidebar .page-title a").first(), label: "left-sidebar", to: "/" },
  // Matches no selector.
  { place: "no labelled place", link: (page) => page.locator("article li a.internal").first(), label: "other", to: "/md-twin" },
]) {
  test(`labels a navigation from ${place} "${label}"`, async ({ page, baseURL }) => {
    const posthog = await postHogStandIn(page, HOST)
    await page.goto("/posthog/navigation")
    await expect.poll(() => posthog.inits.length).toBe(1)
    await link(page).click()
    await expect(page).toHaveURL(new URL(to, baseURL).href)
    await expect.poll(() => posthog.events("navigation")).toEqual([
      { source: label, from_page: "/posthog/navigation", to_page: to, url: new URL(to, baseURL).href },
    ])
  })
}

test("sends no navigation event for a click the SPA router does not follow", async ({ page, baseURL }) => {
  await page.route("https://example.com/**", (route) => route.fulfill({ contentType: "text/html", body: "<p>elsewhere</p>" }))
  const posthog = await postHogStandIn(page, HOST)
  await page.goto("/posthog/navigation")
  await expect.poll(() => posthog.inits.length).toBe(1)
  // A heading on the same page: the router scrolls, and nothing is navigated.
  await page.getByRole("link", { name: "a heading below" }).click()
  await expect(page).toHaveURL(/\/posthog\/navigation#below$/)
  // Then one that is followed, so the first one's event would have been recorded by now.
  await page.locator("article p a.internal").first().click()
  await expect(page).toHaveURL(/\/plain-note$/)
  await expect.poll(() => posthog.events("navigation").map((event) => event.to_page)).toEqual(["/plain-note"])
  // Off the site: the browser leaves, and the router is not involved.
  await page.goBack()
  await expect(page).toHaveURL(new URL("/posthog/navigation#below", baseURL).href)
  await page.getByRole("link", { name: "off the site" }).click()
  await expect(page).toHaveURL("https://example.com/elsewhere")
  expect(posthog.events("navigation")).toHaveLength(1)
})

// The router's other rules: it leaves a click with Ctrl or ⌘ held, a target="_blank" link and a
// `data-router-ignore` link to the browser. The browser's own action is held back here, by a listener
// that runs before the router's and the plugin's and stops neither, so the page stays put.
test("sends no navigation event for a Ctrl/⌘ click, a new-tab link or a router-ignore link", async ({ page }) => {
  await page.addInitScript(() =>
    document.addEventListener(
      "click",
      (event) => {
        if (event.ctrlKey || event.metaKey || event.target.closest?.("[target=_blank], [data-router-ignore]")) event.preventDefault()
      },
      true,
    ),
  )
  const posthog = await postHogStandIn(page, HOST)
  await page.goto("/posthog/navigation")
  await expect.poll(() => posthog.inits.length).toBe(1)
  await page.getByRole("link", { name: "in a new tab" }).click()
  await page.getByRole("link", { name: "ignored by the router" }).click()
  await page.locator("article p a.internal").first().click({ modifiers: ["ControlOrMeta"] })
  await expect(page).toHaveURL(/\/posthog\/navigation$/)
  // Then one that is followed, so the others' events would have been recorded by now.
  await page.locator("article li a.internal").first().click()
  await expect(page).toHaveURL(/\/md-twin$/)
  await expect.poll(() => posthog.events("navigation").map((event) => event.to_page)).toEqual(["/md-twin"])
})

// With SPA routing off, core installs no router, so no link is followed: every click is a full page
// load, counted by its `$pageview` alone. The browser's own action is held back, as above, so an
// event sent for the click could not be lost to the unload; a capture after it proves the record
// is caught up.
test("sends no navigation event on a site with SPA routing off", async ({ page, scratch }) => {
  const config = editConfig(fixtureConfig(), (doc) => doc.setIn(["configuration", "enableSPA"], false))
  const site = await scratch.site("posthog-no-spa", { "index.md": "# home\n\nTo [[other]].\n", "other.md": "# other\n" }, { config })
  expect(site.code, site.output).toBe(0)
  await page.addInitScript(() => document.addEventListener("click", (event) => event.preventDefault(), true))
  const posthog = await postHogStandIn(page, HOST)
  await routeSite(page, site.public, SCRATCH_ORIGIN)
  await page.goto(`${SCRATCH_ORIGIN}/`)
  await expect.poll(() => posthog.events("$pageview")).toEqual([{ path: "/" }])
  await page.locator("article a.internal", { hasText: "other" }).click()
  await page.evaluate(() => window.posthog.capture("probe"))
  await expect.poll(() => posthog.events("probe")).toHaveLength(1)
  expect(posthog.events("navigation")).toEqual([])
})

// v4 checked all three places a browser has reported Do Not Track in. With it set, the page never
// even fetches PostHog's library, so nothing can be sent.
for (const [where, setDoNotTrack] of [
  ["navigator.doNotTrack", () => Object.defineProperty(Navigator.prototype, "doNotTrack", { get: () => "1" })],
  ["window.doNotTrack", () => Object.defineProperty(window, "doNotTrack", { get: () => "1" })],
  ["navigator.msDoNotTrack", () => Object.defineProperty(Navigator.prototype, "msDoNotTrack", { get: () => "1" })],
]) {
  test(`sends nothing when Do Not Track is set (${where})`, async ({ page }) => {
    await page.addInitScript(setDoNotTrack)
    const posthog = await postHogStandIn(page, HOST)
    await page.goto("/posthog/navigation")
    await page.locator("article p a.internal").first().click()
    await expect(page).toHaveURL(/\/plain-note$/)
    await page.goto("/posthog/navigation")
    expect(posthog.requests).toEqual([])
    expect(posthog.inits).toEqual([])
    expect(posthog.captures).toEqual([])
  })
}

test("fails the build when apiKey is not set", async () => {
  const config = editConfig(fixtureConfig(), (_, entry) => entry("@chaoticgoodcomputing/quartz-posthog").deleteIn(["options", "apiKey"]))
  const { code, output } = await buildScratchSite("posthog-no-key", { "index.md": "# home\n" }, { config })
  expect(code).not.toBe(0)
  expect(output).toContain("cgc-posthog")
  expect(output).toContain("apiKey")
})

// It replaces core's PostHog, whose snippet would init PostHog a second time and count every page twice.
test("fails the build when core analytics is PostHog too", async () => {
  const config = editConfig(fixtureConfig(), (doc) =>
    doc.setIn(["configuration", "analytics"], doc.createNode({ provider: "posthog", apiKey: "phc_fixture" })),
  )
  const { code, output } = await buildScratchSite("posthog-twice", { "index.md": "# home\n" }, { config })
  expect(code).not.toBe(0)
  expect(output).toContain("cgc-posthog")
  expect(output).toContain("analytics")
})

test("renders nothing on the page and ships no stylesheet", async ({ page, emitted }) => {
  await page.goto("/plain-note")
  await expect(page.locator('[class*="cgc-posthog"]')).toHaveCount(0)
  // One script, extracted from the plugin's inline resource by core, which holds the key.
  const scripts = emitted.list(".js").filter((file) => emitted.read(file).includes("phc_fixture"))
  expect(scripts).toHaveLength(1)
  expect(emitted.list(".css").filter((file) => emitted.read(file).includes("posthog"))).toEqual([])
})
