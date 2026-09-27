// `bluesky-post`, proven through `quartz-mdx`: the fixture page /lab/bluesky.mdx imports it as a package
// (`@chaoticgoodcomputing/widgets/bluesky-post`) and shows three posts, fetched in the browser after
// hydration (#36, #75). Bluesky itself is the suite's stand-in (tests/harness/bluesky.mjs), which
// answers from tests/fixture-bluesky/xrpc.json.
import { test, expect, resolvedColour, toggleScheme } from "../../../tests/harness/test.mjs"
import { BLUESKY_API, BLUESKY_HOSTS } from "../../../tests/harness/bluesky.mjs"
import { jsonResponse } from "../../../tests/harness/stand-in.mjs"
import { buildScratchSite } from "../../../tests/harness/site.mjs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const PAGE = "/lab/bluesky.mdx"
const POST_A = "https://bsky.app/profile/fixture.bsky.social/post/3lcgcfixturea"
const POST_B = "https://bsky.app/profile/fixture.bsky.social/post/3lcgcfixtureb"

test("a reader without JavaScript gets a loading state and a link to each post", async ({
  browser,
  colorScheme,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme })
  const page = await context.newPage()
  await page.goto(PAGE)
  const widgets = page.locator(".cgc-mdx-island .cgc-bluesky-post")
  await expect(widgets).toHaveCount(3)
  const [first, second] = [widgets.nth(0), widgets.nth(1)]
  await expect(first).toContainText("Loading post")
  await expect(first.getByRole("link", { name: "View on Bluesky" })).toHaveAttribute("href", POST_A)
  await expect(second.getByRole("link", { name: "View on Bluesky" })).toHaveAttribute(
    "href",
    POST_B,
  )
  // v4's `maxWidth` prop, and its default.
  await expect(first).toHaveCSS("max-width", "480px")
  await expect(second).toHaveCSS("max-width", "600px")
  await context.close()
})

// The widgets on /lab/bluesky.mdx, once their islands have hydrated and each has drawn its post.
async function shown(page) {
  for (const island of await page.locator(".cgc-mdx-island").all()) {
    await expect(island).toHaveAttribute("data-cgc-hydrated", "")
  }
  const widgets = page.locator(".cgc-bluesky-post")
  await expect(widgets.locator(".cgc-bluesky")).toHaveCount(3)
  return [widgets.nth(0), widgets.nth(1), widgets.nth(2)]
}

test("it hydrates, fetches the post in the browser and draws it", async ({ page }) => {
  const asked = []
  page.on("request", (req) => {
    if (BLUESKY_API.test(req.url())) asked.push(new URL(req.url()))
  })
  await page.goto(PAGE)
  const [first] = await shown(page)
  // One call per widget, for the post its URL names.
  expect(asked.map((u) => u.pathname)).toEqual(Array(3).fill("/xrpc/app.bsky.feed.getPostThread"))
  expect(asked.map((u) => u.searchParams.get("uri")).sort()).toEqual([
    "at://fixture.bsky.social/app.bsky.feed.post/3lcgcfixturea",
    "at://fixture.bsky.social/app.bsky.feed.post/3lcgcfixtureb",
    "at://fixture.bsky.social/app.bsky.feed.post/3lcgcfixtureb",
  ])

  const post = first.locator(".cgc-bluesky")
  await expect(post.locator(".cgc-bluesky__name")).toHaveText("Fixture Author")
  await expect(post.locator(".cgc-bluesky__handle")).toHaveText("@fixture.bsky.social")
  await expect(post.locator(".cgc-bluesky__avatar")).toHaveAttribute(
    "src",
    /^https:\/\/cdn\.bsky\.app\/img\/avatar\//,
  )
  // The text is text: its line break is kept, and markup in it is shown, never parsed.
  const text = post.locator(".cgc-bluesky__text").first()
  // innerText is the text as laid out, so the line break shows only if it is drawn as one.
  expect(await text.innerText()).toBe(
    "A post from the fixture.\nIts second line, and <b>markup</b> that stays text.",
  )
  await expect(text.locator("b")).toHaveCount(0)
  // Its images, with their alt text.
  await expect(post.locator(".cgc-bluesky__image")).toHaveCount(2)
  await expect(post.locator(".cgc-bluesky__image").first()).toHaveAttribute(
    "alt",
    "The fixture's first image",
  )
  // The post it quotes, and that post's link card.
  const quote = post.locator(".cgc-bluesky__quote")
  await expect(quote).toContainText("Quoted Author")
  await expect(quote).toContainText("@quoted.bsky.social")
  await expect(quote).toContainText("The post being quoted.")
  await expect(quote.getByRole("link", { name: /The quoted post's link/ })).toHaveAttribute(
    "href",
    "https://example.com/quoted-article",
  )
  await expect(post.locator("time")).toHaveAttribute("datetime", "2025-01-15T12:00:00.000Z")
  const link = post.getByRole("link", { name: "View on Bluesky" })
  await expect(link).toHaveAttribute("href", POST_A)
  await expect(link).toHaveAttribute("target", "_blank")
  // The loading state is gone, and so is its link: one link to the post, the card's own.
  await expect(first.locator(".cgc-bluesky-post__status")).toHaveCount(0)
  await expect(first.getByRole("link", { name: "View on Bluesky" })).toHaveCount(1)
})

test("on a narrow screen only the card's own padding and avatar shrink, as in Quartz 4", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 900 })
  await page.goto(PAGE)
  const [first] = await shown(page)
  const post = first.locator(".cgc-bluesky")
  const style = (locator, property) =>
    locator.evaluate((el, property) => getComputedStyle(el)[property], property)
  expect(await style(post, "paddingTop")).toBe("14px")
  expect(await style(post.locator(".cgc-bluesky__avatar"), "width")).toBe("40px")
  // Everything inside the card keeps its full-size spacing.
  expect(await style(post.locator(".cgc-bluesky__content"), "marginBottom")).toBe("16px")
  expect(await style(post.locator(".cgc-bluesky__quote"), "paddingTop")).toBe("16px")
  expect(await style(post.locator(".cgc-bluesky__quote"), "marginTop")).toBe("16px")
})

test("a link card opens its page in a new tab", async ({ page }) => {
  await page.goto(PAGE)
  const [, second] = await shown(page)
  const card = second.getByRole("link", { name: /An article/ })
  await expect(card).toHaveAttribute("href", "https://example.com/article")
  await expect(card).toHaveAttribute("target", "_blank")
  await expect(card).toContainText("The link card's description.")
  await expect(card.locator(".cgc-bluesky__card-thumb")).toHaveAttribute(
    "src",
    /^https:\/\/cdn\.bsky\.app\//,
  )
})

test("with showMetrics, its counts sit beside v4's emoji", async ({ page }) => {
  await page.goto(PAGE)
  const [first, second, third] = await shown(page)
  const metrics = first.locator(".cgc-bluesky__metric")
  await expect(metrics).toHaveCount(3)
  const expected = [
    ["12 replies", "💬"],
    ["3 reposts", "🔁"],
    ["45 likes", "❤️"],
  ]
  for (const [i, [label, emoji]] of expected.entries()) {
    const metric = metrics.nth(i)
    // The count and what it counts are the metric's text; the emoji is decoration before it, with
    // empty alternative text, so a screen reader hears only the count.
    await expect(metric).toHaveText(label)
    const before = await metric.evaluate((el) => getComputedStyle(el, "::before").content)
    expect(before).toBe(`"${emoji}" / ""`)
  }
  await expect(first.locator("svg")).toHaveCount(0)
  // v4's default: no counts.
  await expect(second.locator(".cgc-bluesky__metrics")).toHaveCount(0)
  // v4 read the prop as text and showed counts only for "true", so a quoted "false" shows none.
  await expect(third.locator(".cgc-bluesky__metrics")).toHaveCount(0)
})

// The stock fixture makes off-site requests of its own on every page (Google Fonts, the graph's d3
// and pixi from jsDelivr, Plausible), so the widget's page is held to the same page without it.
// Bluesky's hosts are left to the stand-in; every other off-site request is recorded and refused.
test("nothing is fetched but the post and its pictures", async ({
  page,
  baseURL,
}) => {
  const site = new URL(baseURL).host
  let offsite = []
  const bluesky = []
  await page.route(
    (u) => u.protocol.startsWith("http") && u.host !== site,
    (route) => {
      const url = route.request().url()
      if (BLUESKY_HOSTS.test(url)) {
        bluesky.push(new URL(url).host)
        return route.fallback()
      }
      offsite.push(url)
      return route.abort()
    },
  )
  await page.goto("/lab/bluesky-twin")
  await page.waitForLoadState("networkidle")
  const withoutWidget = offsite

  offsite = []
  await page.goto(PAGE)
  const [first] = await shown(page)
  await expect(first.locator(".cgc-bluesky__metric")).toHaveCount(3)
  await page.waitForLoadState("networkidle")
  expect(offsite.filter((u) => !withoutWidget.includes(u))).toEqual([])
  expect([...new Set(bluesky)].sort()).toEqual(["cdn.bsky.app", "public.api.bsky.app"])
})

// What a widget says when its post can't be fetched, for each way the fetch can fail. The link to
// the post stays, and nothing is thrown at the page.
const FAILURES = [
  [
    "Bluesky answers with an error",
    (route) => route.fulfill({ status: 502, body: "bad gateway" }),
    "Failed to load post",
  ],
  [
    "Bluesky can't be reached",
    (route) => route.abort("internetdisconnected"),
    "Failed to load post",
  ],
  [
    "the post doesn't exist",
    (route) =>
      route.fulfill(jsonResponse(400, { error: "NotFound", message: "Post not found" })),
    "Post not found",
  ],
  [
    "the post is blocked",
    (route) =>
      route.fulfill(
        jsonResponse(200, { thread: { $type: "app.bsky.feed.defs#blockedPost", uri: "at://x", blocked: true } }),
      ),
    "Post blocked",
  ],
  [
    "Bluesky answers with a post the renderer can't read",
    (route) =>
      route.fulfill(
        jsonResponse(200, { thread: { $type: "app.bsky.feed.defs#threadViewPost", post: { uri: "at://x", author: null } } }),
      ),
    "Failed to load post",
  ],
]

for (const [when, answer, says] of FAILURES) {
  test(`when ${when}, it says so and keeps the link, with no uncaught error`, async ({ page }) => {
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.route(BLUESKY_API, answer)
    await page.goto(PAGE)
    for (const island of await page.locator(".cgc-mdx-island").all()) {
      await expect(island).toHaveAttribute("data-cgc-hydrated", "")
    }
    const widgets = page.locator(".cgc-bluesky-post")
    for (const [i, url] of [POST_A, POST_B, POST_B].entries()) {
      const status = widgets.nth(i).locator(".cgc-bluesky-post__status--failed")
      await expect(status).toContainText(says)
      await expect(status.getByRole("link", { name: "View on Bluesky" })).toHaveAttribute(
        "href",
        url,
      )
    }
    await expect(page.locator(".cgc-bluesky")).toHaveCount(0)
    await expect(page.locator(".cgc-bluesky-post__spinner")).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

// quartz-mdx's island runtime unmounts islands before an SPA navigation and hydrates them after one.
test("it survives SPA navigation away and back, drawing each post once", async ({ page }) => {
  let asked = 0
  page.on("request", (req) => {
    if (BLUESKY_API.test(req.url())) asked++
  })
  await page.goto(PAGE)
  await shown(page)
  expect(asked).toBe(3)

  await page.locator("article a.internal", { hasText: "plain-note" }).click()
  await expect(page).toHaveURL(/\/plain-note$/)
  await expect(page.locator(".cgc-bluesky-post")).toHaveCount(0)

  await page.goBack()
  await expect(page).toHaveURL(/\/lab\/bluesky\.mdx$/)
  for (const widget of await shown(page)) await expect(widget.locator(".cgc-bluesky")).toHaveCount(1)
  expect(asked).toBe(6)
})

// A reader who leaves before the post arrives: the unmounted widget abandons its request, rather than
// leaving it to finish for a page that is gone.
test("leaving before the post arrives abandons the request", async ({ page }) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  const held = []
  const abandoned = []
  page.on(
    "requestfailed",
    (req) => BLUESKY_API.test(req.url()) && abandoned.push(req.failure().errorText),
  )
  await page.route(BLUESKY_API, (route) => held.push(route))
  await page.goto(PAGE)
  await expect.poll(() => held.length).toBe(3)
  await page.locator("article a.internal", { hasText: "plain-note" }).click()
  await expect(page).toHaveURL(/\/plain-note$/)
  await expect.poll(() => abandoned).toEqual(Array(3).fill("net::ERR_ABORTED"))
  expect(errors).toEqual([])
})

// Skin is Quartz's colour properties and nothing else, so the post follows the scheme when a reader
// toggles it on a loaded page (ADR-0003's scheme amendment); nothing is resolved in script.
test("its skin follows the colour scheme when the reader toggles it", async ({ page }) => {
  await page.goto(PAGE)
  const [first] = await shown(page)
  const skin = async () => ({
    expected: {
      background: await resolvedColour(page, "var(--light)"),
      counts: await resolvedColour(page, "var(--gray)"),
    },
    actual: await first.evaluate((el) => ({
      background: getComputedStyle(el.querySelector(".cgc-bluesky")).backgroundColor,
      counts: getComputedStyle(el.querySelector(".cgc-bluesky__metric")).color,
    })),
  })
  const before = await skin()
  expect(before.actual).toEqual(before.expected)
  await toggleScheme(page)
  const after = await skin()
  expect(after.actual).toEqual(after.expected)
  expect(after.actual.background).not.toBe(before.actual.background)
  expect(after.actual.counts).not.toBe(before.actual.counts)
})

// A post is written by a stranger: everything in it is text, and only http(s) URLs become links or
// pictures.
test("a hostile post is shown as text, and its script URLs lead nowhere", async ({ page }) => {
  const dialogs = []
  page.on("dialog", (dialog) => {
    dialogs.push(dialog.message())
    return dialog.dismiss()
  })
  const hostile = {
    thread: {
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: "at://did:plc:hostile/app.bsky.feed.post/3lhostile",
        cid: "bafyhostile",
        author: {
          did: "did:plc:hostile",
          handle: "hostile.bsky.social",
          displayName: '<img src=x onerror="alert(1)">',
          avatar: "javascript:alert(2)",
        },
        record: { text: "<script>alert(3)</script>\"quoted\" & 'single'", createdAt: "not a date" },
        embed: {
          $type: "app.bsky.embed.external#view",
          external: { uri: "javascript:alert(4)", title: "A card", thumb: "javascript:alert(5)" },
        },
        replyCount: '<img src=x onerror="alert(6)">',
      },
    },
  }
  await page.route(BLUESKY_API, (route) => route.fulfill(jsonResponse(200, hostile)))
  await page.goto(PAGE)
  const [first] = await shown(page)
  const post = first.locator(".cgc-bluesky")
  await expect(post.locator(".cgc-bluesky__name")).toHaveText('<img src=x onerror="alert(1)">')
  await expect(post.locator(".cgc-bluesky__text")).toHaveText(
    "<script>alert(3)</script>\"quoted\" & 'single'",
  )
  await expect(post.locator(".cgc-bluesky__card")).toContainText("A card")
  await expect(
    post.locator(
      '[href^="javascript:"], [src^="javascript:"], script, .cgc-bluesky__name img, .cgc-bluesky__metrics img',
    ),
  ).toHaveCount(0)
  // A count that isn't a number counts nothing.
  await expect(post.locator(".cgc-bluesky__metric").first()).toHaveText("0 replies")
  await expect(post.getByRole("link", { name: "A card" })).toHaveCount(0)
  // A date that isn't one is left out, rather than failing the post.
  await expect(post.locator("time")).toHaveCount(0)
  await page.waitForTimeout(100)
  expect(dialogs).toEqual([])
})

// A post URL is written by hand, so a typo is caught where the author can fix it: the widget throws
// while rendering at build time, which fails the build and names the page (quartz-mdx ADR-0001). A
// scratch site's content sits outside the repo, so it imports the widget by its source path.
test("a URL that isn't a Bluesky post's fails the build, naming the page and the URL", async () => {
  const widget = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../src/bluesky-post/index.tsx",
  )
  const page = (props) =>
    `---\ntitle: Broken\n---\n\nimport { BlueskyPost } from ${JSON.stringify(widget)}\n\n<BlueskyPost ${props} />\n`
  const { code, output } = await buildScratchSite("bluesky-url", {
    "index.md": "# home\n",
    "typo.mdx": page('url="https://bsky.app/profile/fixture.bsky.social/posts/3lcgcfixturea"'),
  })
  expect(code).not.toBe(0)
  expect(output).toContain("typo.mdx")
  expect(output).toContain("https://bsky.app/profile/fixture.bsky.social/posts/3lcgcfixturea")
})
