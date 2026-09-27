// quartz-social's GitHub card: v4's SocialMediaGitHub (#42, #44, #80), on the fixture's home page in
// the right sidebar. It reads the user's profile and their year of contributions in the browser,
// from the suite's GitHub stand-in (tests/harness/github.mjs), which holds one user, `fixture-octo`.
import { test, expect, resolvedColour, toggleScheme } from "../../../tests/harness/test.mjs"
import { CONTRIBUTIONS_API, GITHUB_API } from "../../../tests/harness/github.mjs"
import { jsonResponse } from "../../../tests/harness/stand-in.mjs"
import { expectRestOfSidebarUnaffected } from "./sidebar.mjs"

const card = (page) => page.locator(".cgc-social__card--github")

// The calendar's cell for one day, by the tooltip v4 gave it.
const day = (page, title) => card(page).locator(`.cgc-social__day[title="${title}"]`)

test("is built as v4's loading state, in the right sidebar of the home page", async ({ emitted }) => {
  const html = emitted.read("index.html")
  const built = html.slice(html.indexOf('class="cgc-social__card cgc-social__card--github"'))
  expect(built).toMatch(/^class="cgc-social__card cgc-social__card--github"[^>]*data-username="fixture-octo"/)
  expect(built).toContain('<h3 class="cgc-social__title">GitHub Contributions</h3>')
  expect(built).toContain('<p class="cgc-social__message">Loading contributions...</p>')
})

test("shows the user's profile, as v4 did, with their bio as text", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator(".right.sidebar .cgc-social__card--github")).toHaveCount(1)
  const profile = card(page).locator(".cgc-social__profile")
  await expect(profile.locator("img.cgc-social__avatar")).toHaveAttribute(
    "src",
    "https://avatars.githubusercontent.com/u/1?v=4",
  )
  const name = profile.getByRole("link", { name: "Fixture Octo" })
  await expect(name).toHaveAttribute("href", "https://github.com/fixture-octo")
  await expect(name).toHaveAttribute("target", "_blank")
  await expect(profile.locator(".cgc-social__username")).toHaveText("@fixture-octo")
  // A profile is written by its owner: v4 drew the bio as HTML, and now it is text.
  await expect(profile.locator(".cgc-social__bio")).toHaveText("Builds <b>fixtures</b> & tests them.")
  await expect(profile.locator(".cgc-social__bio b")).toHaveCount(0)
  await expect(card(page).locator(".cgc-social__status")).toHaveCount(0)
})

// A day's date is a calendar day, whatever the reader's zone: v4 read it in the reader's zone and
// added a day, a day late at or east of UTC, and a naive read in the reader's zone is a day early
// west of it. So the calendar is drawn in a zone on each side, never the host's.
for (const timezoneId of ["America/Los_Angeles", "Asia/Tokyo"]) {
  test.describe(`in ${timezoneId}`, () => {
    test.use({ timezoneId })

    test("draws the year's contributions as v4's calendar, its newest weeks in the space it has", async ({
      page,
    }) => {
      await page.goto("/")
      await expect(card(page).locator(".cgc-social__total")).toHaveText(
        "1457 contributions in the last year",
      )
      const rows = card(page).locator(".cgc-social__calendar tr")
      await expect(rows).toHaveCount(7)
      // Sunday to Saturday, with only Monday, Wednesday and Friday named.
      expect(await rows.locator(".cgc-social__weekday").allTextContents()).toEqual([
        "",
        "Mon",
        "",
        "Wed",
        "",
        "Fri",
        "",
      ])
      // The fixture's year ends on Wednesday 24 September 2025: the last column is that partial week.
      // The tooltips are v4's.
      const lastColumn = await rows.evaluateAll((trs) => trs.map((tr) => tr.lastElementChild.title))
      expect(lastColumn).toEqual([
        "No contributions on Sep 21, 2025",
        "6 contributions on Sep 22, 2025",
        "1 contribution on Sep 23, 2025",
        "10 contributions on Sep 24, 2025",
        "",
        "",
        "",
      ])
      // Whole weeks before it, as many as fit beside the day names without scrolling.
      const graph = card(page).locator(".cgc-social__graph")
      const fits = await graph.evaluate((el) => el.scrollWidth <= el.clientWidth)
      expect(fits).toBe(true)
      const columns = await rows.first().locator(".cgc-social__day").count()
      expect(columns).toBeGreaterThan(8)
      expect(columns).toBeLessThan(53)
      // Consecutive weeks: the first column's Sunday is that many weeks before the last one's.
      const sunday = new Date(Date.UTC(2025, 8, 21 - 7 * (columns - 1)))
      const named = sunday.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
      await expect(rows.first().locator(".cgc-social__day").first()).toHaveAttribute(
        "title",
        new RegExp(` on ${named}$`),
      )
      await expect(card(page).locator(".cgc-social__day")).toHaveCount(7 * (columns - 1) + 4)
    })
  })
}

// v4's presets were hex literals, GitHub's greens among them. A plugin takes colour values (ADR-0003),
// and by default the calendar is drawn from the theme: an empty day in `lightgray`, the busiest in
// `secondary`, and the three levels between mixed from the two.
test("colours each day by its level, from the theme by default", async ({ page }) => {
  await page.goto("/")
  await expect(day(page, "No contributions on Sep 21, 2025")).toHaveCSS(
    "background-color",
    await resolvedColour(page, "var(--lightgray)"),
  )
  await expect(day(page, "10 contributions on Sep 24, 2025")).toHaveCSS(
    "background-color",
    await resolvedColour(page, "var(--secondary)"),
  )
  const between = await resolvedColour(page, "color-mix(in srgb, var(--secondary) 25%, var(--lightgray))")
  await expect(day(page, "1 contribution on Sep 23, 2025")).toHaveCSS("background-color", between)
})

test("repaints the calendar when the scheme switches on a loaded page", async ({ page }) => {
  await page.goto("/")
  const busiest = day(page, "10 contributions on Sep 24, 2025")
  const before = await resolvedColour(page, "var(--secondary)")
  await expect(busiest).toHaveCSS("background-color", before)
  await toggleScheme(page)
  const after = await resolvedColour(page, "var(--secondary)")
  expect(after).not.toBe(before)
  await expect(busiest).toHaveCSS("background-color", after)
})

// v4 went on without the profile when GitHub's API failed, and showed the calendar.
test("leaves the profile out when GitHub doesn't answer for it", async ({ page }) => {
  await page.route(GITHUB_API, (route) => route.fulfill({ status: 503, body: "" }))
  await page.goto("/")
  await expect(card(page).locator(".cgc-social__calendar")).toBeVisible()
  await expect(card(page).locator(".cgc-social__profile")).toHaveCount(0)
})

test("says so in the card when the contributions can't be had, and the sidebar carries on", async ({
  page,
}) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error))
  await page.route(CONTRIBUTIONS_API, (route) => route.fulfill(jsonResponse(502, { error: "Upstream is down" })))
  await page.goto("/")
  const status = card(page).locator(".cgc-social__status--failed")
  await expect(status.locator(".cgc-social__message")).toHaveText("Failed to load contributions")
  await expect(status.locator(".cgc-social__details")).toHaveText("Upstream is down")
  // The rest of the sidebar, the Bluesky card beside it included, is unaffected.
  await expect(page.locator(".cgc-social__card--bluesky .cgc-bluesky")).not.toHaveCount(0)
  await expectRestOfSidebarUnaffected(page)
  expect(errors).toEqual([])
})

test("says so when the network fails", async ({ page }) => {
  await page.route(CONTRIBUTIONS_API, (route) => route.abort("internetdisconnected"))
  await page.goto("/")
  const status = card(page).locator(".cgc-social__status--failed")
  await expect(status.locator(".cgc-social__message")).toHaveText("Failed to load contributions")
  await expect(status.locator(".cgc-social__details")).toHaveText(/GitHub couldn't be reached/)
})
