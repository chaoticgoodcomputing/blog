// quartz-social's Bluesky card: v4's SocialMediaBlueSky (#42, #44, #80), on the fixture's home page
// below the GitHub card. It reads the account's latest posts in the browser through the widget
// library's `/bluesky` client and draws them with its renderer, from the suite's Bluesky stand-in
// (tests/harness/bluesky.mjs): `fixture.bsky.social`, whose feed is a repost, a reply and a post.
import { test, expect } from "../../../tests/harness/test.mjs"
import { BLUESKY_API } from "../../../tests/harness/bluesky.mjs"
import { jsonResponse } from "../../../tests/harness/stand-in.mjs"
import { GITHUB_HOSTS } from "../../../tests/harness/github.mjs"
import { expectRestOfSidebarUnaffected } from "./sidebar.mjs"

const card = (page) => page.locator(".cgc-social__card--bluesky")
const posts = (page) => card(page).locator(".cgc-social__posts .cgc-bluesky")

// Every request the page makes to Bluesky's API, as [method, params].
function recordBluesky(page) {
  const asked = []
  page.on("request", (req) => {
    if (!BLUESKY_API.test(req.url())) return
    const url = new URL(req.url())
    asked.push([url.pathname.replace("/xrpc/", ""), Object.fromEntries(url.searchParams)])
  })
  return asked
}

const FEED = [
  ["com.atproto.identity.resolveHandle", { handle: "fixture.bsky.social" }],
  ["app.bsky.feed.getAuthorFeed", { actor: "did:plc:cgcfixtureauthor2345abcd", limit: "5" }],
]

test("is built as v4's loading state, below the GitHub card", async ({ emitted }) => {
  const html = emitted.read("index.html")
  const built = html.slice(html.indexOf('class="cgc-social__card cgc-social__card--bluesky"'))
  expect(html.indexOf("cgc-social__card--github")).toBeLessThan(html.indexOf("cgc-social__card--bluesky"))
  expect(built).toMatch(/^class="cgc-social__card cgc-social__card--bluesky"[^>]*data-handle="fixture\.bsky\.social"/)
  expect(built).toContain('<h3 class="cgc-social__title">Bluesky Feed</h3>')
  expect(built).toContain('<p class="cgc-social__message">Loading posts...</p>')
})

test("shows the account's latest posts, saying who reposted and what replies, with their counts", async ({
  page,
}) => {
  const asked = recordBluesky(page)
  await page.goto("/")
  await expect(posts(page)).toHaveCount(3)
  // v4's two requests: the handle's DID, then that many of its latest posts.
  expect(asked).toEqual(FEED)
  const [repost, reply, own] = [posts(page).nth(0), posts(page).nth(1), posts(page).nth(2)]
  await expect(repost.locator(".cgc-bluesky__context")).toHaveText("Fixture Author reposted")
  await expect(repost.locator(".cgc-bluesky__name")).toHaveText("Quoted Author")
  await expect(reply.locator(".cgc-bluesky__context")).toHaveText("Fixture Author replied")
  await expect(own.locator(".cgc-bluesky__context")).toHaveCount(0)
  await expect(own.locator(".cgc-bluesky__text")).toHaveText("A post with a link card.")
  await expect(own.locator(".cgc-bluesky__card-title")).toHaveText("An article")
  // `showMetrics` is on unless the site turns it off, as in v4.
  await expect(own.locator(".cgc-bluesky__metric")).toHaveText(["0 replies", "0 reposts", "2 likes"])
  await expect(own.getByRole("link", { name: "View on Bluesky" })).toHaveAttribute(
    "href",
    "https://bsky.app/profile/fixture.bsky.social/post/3lcgcfixtureb",
  )
  await expect(card(page).locator(".cgc-social__status")).toHaveCount(0)
})

// v4's sidebar drew its posts smaller than the post widget does: 40px avatars in a 12px-padded card
// with 4px corners. The widget library draws that as its compact post card.
test("draws each post as a compact card, smaller than the post widget's", async ({ page }) => {
  await page.goto("/")
  const post = posts(page).first()
  await expect(post).toHaveClass(/\bcgc-bluesky--compact\b/)
  await expect(post).toHaveCSS("padding-top", "12px")
  await expect(post).toHaveCSS("border-top-left-radius", "4px")
  await expect(post.locator(".cgc-bluesky__avatar")).toHaveCSS("width", "40px")
  await expect(post.locator(".cgc-bluesky__text")).toHaveCSS("font-size", "14px")
})

test("keeps to the home page, and asks nothing of Bluesky or GitHub elsewhere", async ({ page }) => {
  const asked = []
  page.on("request", (req) => (BLUESKY_API.test(req.url()) || GITHUB_HOSTS.test(req.url())) && asked.push(req.url()))
  await page.goto("/plain-note")
  await expect(page.locator(".cgc-social")).toHaveCount(0)
  await page.waitForLoadState("networkidle")
  expect(asked).toEqual([])
})

// v4 drew the cards once when its script loaded and again on Quartz's `nav`, which also fires on the
// first load, so every visit asked twice. Now each visit asks once, and SPA navigation back to the
// home page draws the cards again.
test("asks once per visit, and draws the cards again when navigation comes back", async ({ page }) => {
  const asked = recordBluesky(page)
  await page.goto("/")
  await expect(posts(page)).toHaveCount(3)
  await page.locator("article").getByRole("link", { name: "plain-note" }).click()
  await expect(page).toHaveURL(/\/plain-note$/)
  await expect(page.locator(".cgc-social")).toHaveCount(0)
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(posts(page)).toHaveCount(3)
  await expect(page.locator(".cgc-social__card--github .cgc-social__calendar")).toBeVisible()
  expect(asked).toEqual([...FEED, ...FEED])
})

test("says so in the card when Bluesky fails, and the sidebar carries on", async ({ page }) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error))
  await page.route(BLUESKY_API, (route) =>
    route.fulfill(jsonResponse(500, { error: "InternalServerError", message: "Something broke" })),
  )
  await page.goto("/")
  const status = card(page).locator(".cgc-social__status--failed")
  await expect(status.locator(".cgc-social__message")).toHaveText("Failed to load posts")
  await expect(status.locator(".cgc-social__details")).toHaveText("Bluesky answered 500: Something broke")
  await expect(card(page).locator(".cgc-social__title")).toHaveText("Bluesky Feed")
  // The GitHub card above it, and the rest of the sidebar, are unaffected.
  await expect(page.locator(".cgc-social__card--github .cgc-social__calendar")).toBeVisible()
  await expectRestOfSidebarUnaffected(page)
  expect(errors).toEqual([])
})

test("says so when the handle is unknown", async ({ page }) => {
  await page.route(BLUESKY_API, (route) =>
    route.request().url().includes("resolveHandle")
      ? route.fulfill(jsonResponse(400, { error: "InvalidRequest", message: "Unable to resolve handle" }))
      : route.fallback(),
  )
  await page.goto("/")
  await expect(card(page).locator(".cgc-social__details")).toHaveText(
    "Bluesky answered 400: Unable to resolve handle",
  )
})

test("says so when the network fails", async ({ page }) => {
  await page.route(BLUESKY_API, (route) => route.abort("internetdisconnected"))
  await page.goto("/")
  await expect(card(page).locator(".cgc-social__message")).toHaveText("Failed to load posts")
  await expect(card(page).locator(".cgc-social__details")).toHaveText(/^Bluesky couldn't be reached/)
})

test("says there are no posts when the feed is empty", async ({ page }) => {
  await page.route(BLUESKY_API, (route) =>
    route.request().url().includes("getAuthorFeed")
      ? route.fulfill(jsonResponse(200, { feed: [] }))
      : route.fallback(),
  )
  await page.goto("/")
  await expect(card(page).locator(".cgc-social__status--empty")).toHaveText("No posts found")
})

// A post the renderer can't read fails the card as a failed fetch does, rather than throwing into
// the page's other scripts.
test("fails the card, not the page, on a post it can't read", async ({ page }) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error))
  await page.route(BLUESKY_API, (route) =>
    route.request().url().includes("getAuthorFeed")
      ? route.fulfill(jsonResponse(200, { feed: [{ post: { uri: "at://x/app.bsky.feed.post/y" } }] }))
      : route.fallback(),
  )
  await page.goto("/")
  await expect(card(page).locator(".cgc-social__message")).toHaveText("Failed to load posts")
  expect(errors).toEqual([])
})
