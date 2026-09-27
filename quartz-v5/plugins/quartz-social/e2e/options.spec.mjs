// quartz-social's options: a mistake in them fails the build, naming the option, rather than shipping a
// card that shows someone else's account, or none; and v4's switches leave parts of a card out.
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, fixtureConfig, withPlugins } from "../../../tests/harness/site.mjs"

const SOURCE = "@chaoticgoodcomputing/quartz-social"
const LAYOUT = { position: "right", priority: 40 }
const ORIGIN = "https://social.example"

const buildWith = (name, options, { keep = false } = {}) =>
  buildScratchSite(name, {
    "index.md": "---\ntitle: Home\n---\nHome.\n",
    "a-note.md": "---\ntitle: A note\n---\nA note.\n",
  }, {
    config: withPlugins(fixtureConfig(), [{ source: SOURCE, enabled: true, options, layout: LAYOUT }]),
    keep,
  })

test("fails the build when neither card is configured", async () => {
  const { code, output } = await buildWith("social-no-cards", {})
  expect(code).not.toBe(0)
  expect(output).toContain("cgc-social")
  expect(output).toContain('"github"')
  expect(output).toContain('"bluesky"')
})

test("fails the build when the GitHub card has no username", async () => {
  const { code, output } = await buildWith("social-no-user", {
    github: { title: "GitHub Activity" },
    bluesky: { handle: "fixture.bsky.social" },
  })
  expect(code).not.toBe(0)
  expect(output).toContain("github.username")
})

test("fails the build when the Bluesky card has no handle", async () => {
  const { code, output } = await buildWith("social-no-handle", { bluesky: { postLimit: 3 } })
  expect(code).not.toBe(0)
  expect(output).toContain("bluesky.handle")
})

// The feed asks Bluesky for `postLimit` posts, and the API takes 1 to 100.
for (const postLimit of [0, 101]) {
  test(`fails the build when the feed's postLimit is ${postLimit}`, async () => {
    const { code, output } = await buildWith(`social-post-limit-${postLimit}`, {
      bluesky: { handle: "fixture.bsky.social", postLimit },
    })
    expect(code).not.toBe(0)
    expect(output).toContain("bluesky.postLimit")
    expect(output).toContain(`not ${postLimit}`)
  })
}

// ADR-0003's colour-value amendment: a colour option takes anything CSS reads as a colour, and a
// value that isn't one fails the build.
test("fails the build on a calendar colour that isn't a colour value", async () => {
  const { code, output } = await buildWith("social-bad-colour", {
    github: {
      username: "fixture-octo",
      levelColors: ["var(--lightgray)", "#9be9a8", "greenish", "#30a14e", "var(--secondary)"],
    },
  })
  expect(code).not.toBe(0)
  expect(output).toContain("github.levelColors")
  expect(output).toContain('"greenish"')
})

// v4's switches: each card's heading, and the GitHub card's profile and year's total, can be left out.
test("leaves out the headings, the profile and the total when a site turns them off", async ({ page }) => {
  const site = await buildWith(
    "social-switches",
    {
      github: { username: "fixture-octo", title: false, showProfile: false, showHeader: false },
      bluesky: { handle: "fixture.bsky.social", title: "" },
    },
    { keep: true },
  )
  try {
    expect(site.code, site.output).toBe(0)
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/`)
    const github = page.locator(".cgc-social__card--github")
    await expect(github.locator(".cgc-social__calendar")).toBeVisible()
    await expect(github.locator(".cgc-social__profile")).toHaveCount(0)
    await expect(github.locator(".cgc-social__total")).toHaveCount(0)
    await expect(page.locator(".cgc-social__card--bluesky .cgc-bluesky")).toHaveCount(3)
    await expect(page.locator(".cgc-social .cgc-social__title")).toHaveCount(0)
  } finally {
    site.remove()
  }
})

// For a site that places the cards itself, in its `quartz.ts`:
// `showOn: false` leaves the component no page filter of its own (the real site's, #70).
test("renders the cards on every page the layout puts them on when showOn is false", async ({ page }) => {
  const site = await buildWith(
    "social-show-on-false",
    { showOn: false, bluesky: { handle: "fixture.bsky.social" } },
    { keep: true },
  )
  try {
    expect(site.code, site.output).toBe(0)
    await routeSite(page, site.public, ORIGIN)
    for (const url of ["/", "/a-note"]) {
      await page.goto(`${ORIGIN}${url}`)
      await expect(page.locator(".cgc-social"), url).toHaveCount(1)
    }
  } finally {
    site.remove()
  }
})

test("fails the build when showOn is neither a list of slugs nor false", async () => {
  const { code, output } = await buildWith("social-show-on-true", { showOn: true, bluesky: { handle: "fixture.bsky.social" } })
  expect(code).not.toBe(0)
  expect(output).toContain('"showOn"')
})
