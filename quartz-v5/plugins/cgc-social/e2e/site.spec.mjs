// cgc-social on the real site (#80): the site config puts v4's two cards in the home page's right
// sidebar, on desktop only, with v4's options: GitHub activity in GitHub's greens, and the ATProto
// feed without counts (FORK-LEDGER layouts/index.layout.ts). Proven on a scratch site built from the
// site config. The site's own accounts are answered with the stand-ins' (harness/github.mjs,
// harness/bluesky.mjs), so no request leaves the suite. Built offline: nothing here depends on the
// typeface, and site-config.spec proves the fonts.
import fs from "node:fs"
import { test, expect, routeSite, toggleScheme } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig } from "../../../tests/harness/site.mjs"
import { GITHUB_HOSTS, githubResponse } from "../../../tests/harness/github.mjs"
import { BLUESKY_API, xrpcResponse } from "../../../tests/harness/bluesky.mjs"

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  "content/notes/a-note.md": "---\ntitle: A note\ndate: 2024-02-01\n---\nA note.\n",
}
const ORIGIN = "https://blog.chaoticgood.computer"

// The site config's `levelColors`, the busiest level's and an empty day's, in each scheme.
const BUSIEST = { light: "rgb(33, 110, 57)", dark: "rgb(57, 211, 83)" }
const EMPTY = { light: "rgb(235, 237, 240)", dark: "rgb(22, 27, 34)" }

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  site = await buildScratchSite("social", CONTENT, { config: siteConfig({ offline: true }), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site && fs.rmSync(site.root, { recursive: true, force: true }))

// The site's accounts, answered as the stand-ins answer theirs, and every account asked for.
async function standInForTheSite(page) {
  const asked = []
  await page.route(GITHUB_HOSTS, (route) => {
    const url = route.request().url()
    if (!/api\.github\.com|jogruber/.test(url)) return route.fallback()
    asked.push(url)
    return route.fulfill(githubResponse(url.replace("/spelkington", "/fixture-octo")))
  })
  await page.route(BLUESKY_API, (route) => {
    const url = route.request().url()
    asked.push(url)
    return route.fulfill(xrpcResponse(url.replace("handle=speen.us", "handle=fixture.bsky.social")))
  })
  return asked
}

test("puts v4's cards in the home page's right sidebar, for the site's accounts", async ({ page }) => {
  const asked = await standInForTheSite(page)
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  const cards = page.locator(".right.sidebar .cgc-social")
  await expect(cards.locator(".cgc-social__title")).toHaveText(["GitHub Activity", "ATProto Feed"])
  await expect(cards.locator(".cgc-social__calendar")).toBeVisible()
  await expect(cards.locator(".cgc-bluesky")).toHaveCount(3)
  expect(asked).toEqual(
    expect.arrayContaining([
      "https://api.github.com/users/spelkington",
      "https://github-contributions-api.jogruber.de/v4/spelkington?y=last",
      "https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=speen.us",
    ]),
  )
  // v4's feed left the counts out, and drew its posts compact.
  await expect(cards.locator(".cgc-bluesky__metrics")).toHaveCount(0)
  await expect(cards.locator(".cgc-bluesky--compact")).toHaveCount(3)
})

test("draws the calendar in GitHub's greens, in either scheme", async ({ page, colorScheme }) => {
  await standInForTheSite(page)
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  const busiest = page.locator('.cgc-social__day[title="10 contributions on Sep 24, 2025"]')
  const empty = page.locator('.cgc-social__day[title="No contributions on Sep 21, 2025"]')
  await expect(busiest).toHaveCSS("background-color", BUSIEST[colorScheme])
  await expect(empty).toHaveCSS("background-color", EMPTY[colorScheme])
  const other = colorScheme === "light" ? "dark" : "light"
  expect(await toggleScheme(page)).toBe(other)
  await expect(busiest).toHaveCSS("background-color", BUSIEST[other])
})

test("keeps the cards to the home page, and off narrow screens", async ({ page }) => {
  await standInForTheSite(page)
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/a-note`)
  await expect(page.locator("article")).toContainText("A note.")
  await expect(page.locator(".cgc-social")).toHaveCount(0)
  await page.setViewportSize({ width: 600, height: 900 })
  await page.goto(`${ORIGIN}/`)
  await expect(page.locator(".cgc-social")).toHaveCount(1)
  await expect(page.locator(".cgc-social")).toBeHidden()
})
