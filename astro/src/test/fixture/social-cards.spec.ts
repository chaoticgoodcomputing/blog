import type { Page } from "@playwright/test"
import { expect, test } from "../site.ts"

// The social cards are the site's own accounts, spelkington on GitHub and speen.us on Bluesky
// (site configuration's `social`), fetched in the reader's browser. No spec reaches either host:
// each answer is a stand-in routed here.
const contributions = "https://github-contributions-api.jogruber.de/v4/spelkington?y=last"
const feed = "https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?**"

const desktop = { width: 1440, height: 900 }

// A week of contributions from Sunday 28 September 2025, one day at each level and two more.
const week = {
  total: { lastYear: 1234 },
  contributions: [
    { date: "2025-09-28", count: 0, level: 0 },
    { date: "2025-09-29", count: 1, level: 1 },
    { date: "2025-09-30", count: 3, level: 2 },
    { date: "2025-10-01", count: 6, level: 3 },
    { date: "2025-10-02", count: 12, level: 4 },
    { date: "2025-10-03", count: 0, level: 0 },
    { date: "2025-10-04", count: 2, level: 1 },
  ],
}

const answer = (page: Page, url: string, json: unknown) =>
  page.route(url, (route) => route.fulfill({ json, headers: { "access-control-allow-origin": "*" } }))

test("on a desktop, the home page's GitHub card shows the year's contributions in the level colours", async ({ page }) => {
  await answer(page, contributions, week)
  await page.setViewportSize(desktop)
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/")

  const card = page.locator("aside.right .social-cards .github-card")
  await expect(card.getByRole("heading", { level: 2 })).toHaveText("GitHub Activity")
  await expect(card).toContainText("1,234 contributions in the last year")
  const days = card.locator(".day")
  await expect(days).toHaveCount(7)
  await expect(days.nth(4)).toHaveAttribute("title", "12 contributions on Oct 2, 2025")

  // The light colours of site configuration's five levels, #ebedf0 to #216e39.
  const light = ["rgb(235, 237, 240)", "rgb(155, 233, 168)", "rgb(64, 196, 99)", "rgb(48, 161, 78)", "rgb(33, 110, 57)"]
  for (const [level, colour] of light.entries()) {
    await expect(days.nth(level)).toHaveCSS("background-color", colour)
  }

  // And the dark ones, #161b22 to #39d353, once the reader chooses the dark scheme.
  await page.locator("aside.left").getByRole("switch", { name: "Dark colour scheme" }).click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  const dark = ["rgb(22, 27, 34)", "rgb(14, 68, 41)", "rgb(0, 109, 50)", "rgb(38, 166, 65)", "rgb(57, 211, 83)"]
  for (const [level, colour] of dark.entries()) {
    await expect(days.nth(level)).toHaveCSS("background-color", colour)
  }
})

// Two items of the account's feed: a post of its own, and another account's that it reposted.
const author = { did: "did:plc:owner", handle: "speen.us", displayName: "Spencer", avatar: "https://cdn.bsky.app/avatar.jpg" }
const items = {
  feed: [
    {
      post: {
        uri: "at://did:plc:owner/app.bsky.feed.post/one",
        cid: "c1",
        author,
        record: { text: "A post of the account's own.", createdAt: "2025-10-01T12:00:00Z" },
        likeCount: 7,
      },
    },
    {
      post: {
        uri: "at://did:plc:friend/app.bsky.feed.post/two",
        cid: "c2",
        author: { did: "did:plc:friend", handle: "friend.bsky.social", displayName: "A Friend" },
        record: { text: "A friend's post, reposted.", createdAt: "2025-09-30T12:00:00Z" },
      },
      reason: { $type: "app.bsky.feed.defs#reasonRepost", by: author },
    },
  ],
}

test("on a desktop, the home page's Bluesky card shows the account's latest posts as compact post cards", async ({ page }) => {
  const asked: URL[] = []
  await page.route(feed, (route) => {
    asked.push(new URL(route.request().url()))
    return route.fulfill({ json: items, headers: { "access-control-allow-origin": "*" } })
  })
  await page.setViewportSize(desktop)
  await page.goto("/")

  const card = page.locator("aside.right .social-cards .bluesky-card")
  await expect(card.getByRole("heading", { level: 2 })).toHaveText("ATProto Feed")
  const posts = card.locator("article")
  await expect(posts).toHaveCount(2)
  await expect(posts.nth(0)).toContainText("A post of the account's own.")
  await expect(posts.nth(0).getByRole("link", { name: "View on Bluesky" })).toHaveAttribute(
    "href",
    "https://bsky.app/profile/speen.us/post/one",
  )
  await expect(posts.nth(1)).toContainText("Spencer reposted")
  await expect(posts.nth(1)).toContainText("A friend's post, reposted.")
  // The compact card's avatar is 40px, where the full card's is 48px.
  await expect(posts.nth(0).locator("img").first()).toHaveCSS("width", "40px")
  // Site configuration shows no counts.
  await expect(posts.nth(0)).not.toContainText("likes")

  // The account's five latest, asked for by its handle.
  expect(asked.map((url) => Object.fromEntries(url.searchParams))).toEqual([{ actor: "speen.us", limit: "5" }])
})

test("while neither host has answered, each card says it is loading", async ({ page }) => {
  await page.route(contributions, () => {})
  await page.route(feed, () => {})
  await page.setViewportSize(desktop)
  await page.goto("/")

  const cards = page.locator("aside.right .social-cards")
  await expect(cards.locator(".github-card").getByRole("status")).toHaveText("Loading contributions…")
  await expect(cards.locator(".bluesky-card").getByRole("status")).toHaveText("Loading posts…")
})

test("a host that answers with an error leaves its card saying so, with a link to the profile", async ({ page }) => {
  await page.route(contributions, (route) => route.fulfill({ status: 500, json: { error: "down" } }))
  await page.route(feed, (route) =>
    route.fulfill({ status: 400, json: { error: "InvalidRequest", message: "Profile not found" } }),
  )
  await page.setViewportSize(desktop)
  await page.goto("/")

  const github = page.locator(".social-cards .github-card")
  await expect(github).toContainText("Couldn't load contributions.")
  await expect(github.getByRole("link", { name: "See them on GitHub" })).toHaveAttribute("href", "https://github.com/spelkington")
  await expect(github.getByRole("status")).toBeHidden()

  const bluesky = page.locator(".social-cards .bluesky-card")
  await expect(bluesky).toContainText("Couldn't load posts.")
  await expect(bluesky.getByRole("link", { name: "See them on Bluesky" })).toHaveAttribute("href", "https://bsky.app/profile/speen.us")
  await expect(bluesky.getByRole("status")).toBeHidden()
})

test("a host that can't be reached leaves its card saying so, with a link to the profile", async ({ page, externalRequests }) => {
  // No stand-in: the suite refuses the request, as a network that is down would.
  await page.setViewportSize(desktop)
  await page.goto("/")

  await expect(page.locator(".social-cards .github-card").getByRole("link", { name: "See them on GitHub" })).toBeVisible()
  await expect(page.locator(".social-cards .bluesky-card").getByRole("link", { name: "See them on Bluesky" })).toBeVisible()
  expect(externalRequests).toContain(contributions)
})

test("an account with no posts has a card that says so, with a link to the profile", async ({ page }) => {
  await answer(page, feed, { feed: [] })
  await page.setViewportSize(desktop)
  await page.goto("/")

  const bluesky = page.locator(".social-cards .bluesky-card")
  await expect(bluesky).toContainText("No posts yet.")
  await expect(bluesky.getByRole("link", { name: "See the profile on Bluesky" })).toHaveAttribute("href", "https://bsky.app/profile/speen.us")
})

/** Every request the page makes to either card's host. */
function cardRequests(page: Page): string[] {
  const urls: string[] = []
  page.on("request", (request) => {
    if (/jogruber\.de|bsky\.app/.test(request.url())) urls.push(request.url())
  })
  return urls
}

for (const [name, size] of [
  ["a tablet", { width: 1200, height: 900 }],
  ["a phone", { width: 390, height: 844 }],
] as const) {
  test(`on ${name}, the home page has no social cards, and asks neither host for anything`, async ({ page }) => {
    const asked = cardRequests(page)
    await page.setViewportSize(size)
    await page.goto("/")
    // The right sidebar's other sections are there, and these are not.
    await expect(page.locator("aside.right .subscribe-box")).toBeVisible()
    await expect(page.locator(".social-cards")).toBeHidden()
    await page.waitForLoadState("networkidle")
    expect(asked).toEqual([])
  })
}

test("a window widened to a desktop's shows the cards, and fills them then", async ({ page }) => {
  await answer(page, contributions, week)
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto("/")
  await expect(page.locator(".social-cards")).toBeHidden()

  await page.setViewportSize(desktop)
  await expect(page.locator(".social-cards .github-card .day")).toHaveCount(7)
})

for (const [kind, url] of [
  ["a note's page", "/content/notes/alpha"],
  ["a tag page", "/tags/ledger"],
  ["the 404 page", "/nothing/at/all"],
] as const) {
  test(`on a desktop, ${kind} has no social cards, and asks neither host for anything`, async ({ page }) => {
    const asked = cardRequests(page)
    await page.setViewportSize(desktop)
    await page.goto(url)
    await expect(page.locator("main")).toBeVisible()
    await expect(page.locator(".social-cards")).toHaveCount(0)
    await page.waitForLoadState("networkidle")
    expect(asked).toEqual([])
  })
}

test("leaving the home page by a link abandons the cards' requests", async ({ page }) => {
  // Neither host answers, so both requests are still open when the page is left.
  await page.route(contributions, () => {})
  await page.route(feed, () => {})
  const asked = Promise.all([page.waitForRequest(contributions), page.waitForRequest(feed)])
  await page.setViewportSize(desktop)
  await page.goto("/")
  const requests = await asked
  const abandoned = requests.map((request) => page.waitForEvent("requestfailed", (failed) => failed === request))
  // A mark a full page load would wipe out: the link is followed by the client router, which
  // keeps the document, so only the cards themselves can abandon what they asked for.
  await page.evaluate(() => Object.assign(window, { navigationMark: "kept" }))

  await page.locator(".post-listing a[href]").first().click()

  await expect(page.locator(".social-cards")).toHaveCount(0)
  expect(await page.evaluate(() => (window as unknown as { navigationMark?: string }).navigationMark)).toBe("kept")
  for (const failed of await Promise.all(abandoned)) expect(failed.failure()?.errorText).toBe("net::ERR_ABORTED")
})

test("the home page as built holds each card's loading state: what fills the cards is fetched by the reader's browser", async ({
  request,
}) => {
  // The page as the server sends it, with no script run.
  const html = await (await request.get("/")).text()
  expect(html).toContain("Loading contributions…")
  expect(html).toContain("Loading posts…")
  expect(html).not.toContain('class="day"')
  expect(html).not.toContain("contributions in the last year")
  expect(html).not.toContain("View on Bluesky")
})

test("the home page carries the calendar's level colours once, on the cards, for every element in them to read", async ({
  request,
}) => {
  const html = await (await request.get("/")).text()
  // The lightest level, as site configuration gives it.
  expect(html.split("light-dark(#ebedf0, #161b22)").length - 1).toBe(1)
})
