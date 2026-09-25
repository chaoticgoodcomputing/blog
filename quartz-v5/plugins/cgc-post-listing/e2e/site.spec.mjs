// cgc-post-listing on the real site (#73): the site config places it after the body of the index,
// the 404 page and every tag page, as v4's layouts did (FORK-LEDGER components/PostListing.tsx).
// Proven on a scratch site built from the site config, with a few pages in the vault's shapes.
// Built offline: nothing here depends on the typeface, and site-config.spec proves the fonts.
import fs from "node:fs"
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig } from "../../../tests/harness/site.mjs"
import { postHogStandIn } from "../../../tests/harness/analytics.mjs"

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  // Two posts of one date, as the vault writes dates, the second under a subtag. The folder sorts
  // them Z→A, so their A→Z order is the listing's own.
  "content/notes/b.md":
    "---\ntitle: Alder\ndescription: A post under the topic.\ndate: 2024-02-01\ntags:\n  - topic\n  - engineering\n---\nAlder.\n",
  "content/notes/a.md":
    "---\ntitle: Birch\ndescription: A post under a subtopic.\ndate: 2024-02-01\ntags:\n  - topic/sub\n---\nBirch.\n",
  "content/notes/older.md":
    "---\ntitle: Cedar\ndescription: An older post.\ndate: 2023-06-01\ntags:\n  - topic\n---\nCedar.\n",
  // One of the vault's private stubs.
  "content/notes/stub.md":
    '---\ntitle: Stub\ndate: 2024-03-01\ntags:\n  - "private"\n---\nPrivate.\n',
  "tags/topic.md": "---\ntitle: Topic\n---\nWhat the topic tag is about.\n",
}

const ORIGIN = "https://blog.chaoticgood.computer"
// The site's tag table: `engineering: { color: "light-dark(#0070cc, #008CFF)" }`.
const ENGINEERING = { light: "rgb(0, 112, 204)", dark: "rgb(0, 140, 255)" }

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  site = await buildScratchSite("post-listing", CONTENT, {
    config: siteConfig({ offline: true }),
    keep: true,
  })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site && fs.rmSync(site.root, { recursive: true, force: true }))

const listing = (page) => page.locator(".cgc-post-listing")
const titles = (page) => listing(page).locator(".cgc-post-listing__link").allTextContents()

test("lists the index's posts after its body, newest first and same-date A→Z, without the private ones", async ({
  page,
}) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  await expect(page.locator(".page-footer .cgc-post-listing")).toHaveCount(1)
  const all = await titles(page)
  expect(all.filter((title) => ["Alder", "Birch", "Cedar"].includes(title))).toEqual([
    "Alder",
    "Birch",
    "Cedar",
  ])
  expect(all).not.toContain("Stub")
  // Pages with a source file, and no others: not the folder pages, `content/` and `content/notes/`,
  // nor the 404 page, which v4 never listed.
  expect([...all].sort()).toEqual(["Alder", "Birch", "Cedar", "Home"])
  // Before the subscribe box.
  await expect(page.locator(".cgc-post-listing + .cgc-email-subscribe")).toHaveCount(1)
})

test("lists a tag page's posts, its subtags' included", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/tags/topic`)
  expect(await titles(page)).toEqual(["Alder", "Birch", "Cedar"])
  await page.goto(`${ORIGIN}/tags/topic/sub`)
  expect(await titles(page)).toEqual(["Birch"])
})

test("keeps to the index, the 404 page and tag pages", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/b`)
  await expect(listing(page)).toHaveCount(0)
  // The 404 page is served at any depth, so its links start from the site's root.
  const response = await page.goto(`${ORIGIN}/content/notes/no-such-page`)
  expect(response.status()).toBe(404)
  await listing(page).getByRole("link", { name: "Alder" }).click()
  await expect(page).toHaveURL(`${ORIGIN}/content/notes/b`)
  await expect(page.locator("h1.article-title")).toHaveText("Alder")
})

test("rings each post's tags in the site's tag colours", async ({ page, colorScheme }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/tags/topic`)
  const ring = listing(page).locator(
    '.cgc-post-listing__tag[data-tag="engineering"] .cgc-post-listing__ring',
  )
  await expect(ring).toHaveCSS("border-top-color", ENGINEERING[colorScheme])
})

// v4 labelled a click on a listing's tag badge `tag-badge`, and one on a post's title `other`.
test("labels navigations from the listing as v4 did", async ({ page }) => {
  const posthog = await postHogStandIn(page, "https://app.posthog.com")
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/tags/topic`)
  await listing(page).locator('.cgc-post-listing__tag[data-tag="topic/sub"] a').click()
  await expect(page).toHaveURL(`${ORIGIN}/tags/topic/sub`)
  await listing(page).getByRole("link", { name: "Birch" }).click()
  await expect(page).toHaveURL(`${ORIGIN}/content/notes/a`)
  const sources = () =>
    posthog.captures
      .filter(({ event }) => event === "navigation")
      .map(({ properties }) => properties.source)
  await expect.poll(sources).toEqual(["tag-badge", "other"])
})
