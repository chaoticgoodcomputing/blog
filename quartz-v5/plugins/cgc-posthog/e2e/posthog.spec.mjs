// cgc-posthog: v4's PostHog analytics (#42, #44), with its privacy options and its `navigation`
// events. PostHog is never reached: the fixture's `apiHost` is a reserved host that never resolves,
// and each spec puts a stand-in for PostHog's library there (tests/harness/analytics.mjs), which
// records what the page asks of PostHog. The fixture labels navigations with
//   .left.sidebar → left-sidebar, .callout → callout, article p a.internal → inline-link
// (tests/quartz.config.yaml), and /posthog/navigation has a link in each of those places, and one in
// a list, which none of them labels.
import path from "node:path"
import { createRequire } from "node:module"
import { test, expect } from "../../../tests/harness/test.mjs"
import { postHogStandIn } from "../../../tests/harness/analytics.mjs"
import { buildScratchSite, fixtureConfig, vendored } from "../../../tests/harness/site.mjs"

const HOST = "https://posthog.invalid"
const YAML = createRequire(path.join(vendored, "package.json"))("yaml")

const events = (record, name) => record.captures.filter((capture) => capture.event === name).map((capture) => capture.properties)

test("loads PostHog from the configured host, once per page load", async ({ page }) => {
  const posthog = await postHogStandIn(page, HOST)
  await page.goto("/plain-note")
  await expect.poll(() => posthog.inits.length).toBe(1)
  expect(posthog.inits[0].token).toBe("phc_fixture")
  expect(posthog.inits[0].config.api_host).toBe(HOST)
  expect(posthog.requests).toEqual([`${HOST}/static/array.js`])
  // An SPA navigation keeps the loaded library: no second load, no second init.
  await page.locator("article a.internal", { hasText: "mdx-article" }).first().click()
  await expect(page).toHaveURL(/\/mdx-article$/)
  await expect.poll(() => events(posthog, "$pageview").length).toBe(2)
  expect(posthog.requests).toHaveLength(1)
  expect(posthog.inits).toHaveLength(1)
})

// v4's privacy options. `ip: false` is v4's; PostHog's library has since made it a no-op, so an IP
// is kept out only by the project's "Discard client IP data" setting (README).
test("configures capture with ip: false and no session recording", async ({ page }) => {
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
  await expect.poll(() => events(posthog, "$pageview")).toEqual([{ path: "/posthog/navigation" }])
  await page.locator("article p a.internal").first().click()
  await expect(page).toHaveURL(/\/plain-note$/)
  await expect.poll(() => events(posthog, "$pageview")).toEqual([{ path: "/posthog/navigation" }, { path: "/plain-note" }])
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
    await expect.poll(() => events(posthog, "navigation")).toEqual([
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
  await expect.poll(() => events(posthog, "navigation").map((event) => event.to_page)).toEqual(["/plain-note"])
  // Off the site: the browser leaves, and the router is not involved.
  await page.goBack()
  await expect(page).toHaveURL(new URL("/posthog/navigation#below", baseURL).href)
  await page.getByRole("link", { name: "off the site" }).click()
  await expect(page).toHaveURL("https://example.com/elsewhere")
  expect(events(posthog, "navigation")).toHaveLength(1)
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
  const config = YAML.parseDocument(fixtureConfig())
  const entry = config.get("plugins").items.find((item) => item.get("source") === "../../plugins/cgc-posthog")
  entry.deleteIn(["options", "apiKey"])
  const { code, output } = await buildScratchSite("posthog-no-key", { "index.md": "# home\n" }, { config: String(config) })
  expect(code).not.toBe(0)
  expect(output).toContain("cgc-posthog")
  expect(output).toContain("apiKey")
})

// It replaces core's PostHog, whose snippet would init PostHog a second time and count every page twice.
test("fails the build when core analytics is PostHog too", async () => {
  const config = YAML.parseDocument(fixtureConfig())
  config.setIn(["configuration", "analytics"], config.createNode({ provider: "posthog", apiKey: "phc_fixture" }))
  const { code, output } = await buildScratchSite("posthog-twice", { "index.md": "# home\n" }, { config: String(config) })
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
