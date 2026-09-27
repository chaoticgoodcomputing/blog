// The home page's own components on the real site (#70): v4's index layout had the post listing
// after the body, and the "Newsletter" subscribe box and the social cards in the right sidebar,
// where no note has them. Quartz 5 ships no `is-index` condition, and the site adds none (the owner's
// decision on #70). The site's steering file `quartz.ts` places them instead: on the index, and on
// the page types it names for each (the listing on tag pages and the 404 page, the sidebar box on
// tag pages), and on no other page. Proven on a scratch site built from the site config. Built
// offline: nothing here depends on the typeface, and site-config.spec proves the fonts.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { test, expect, routeSite } from "../harness/test.mjs"
import { buildScratchSite, core, pluginEntries, siteConfig, siteConfigFile } from "../harness/site.mjs"

const YAML = createRequire(path.join(core, "package.json"))("yaml")

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  // With headings, so the table of contents, the sidebar's other `desktop-only` component, has
  // something to show.
  "content/notes/a-note.md":
    "---\ntitle: A note\ndate: 2024-02-01\ntags: [topic]\n---\n## One\n\nA note.\n\n## Two\n\nTwo folders down.\n",
  "tags/topic.md": "---\ntitle: Topic\n---\nWhat the topic tag is about.\n",
}
const ORIGIN = "https://blog.chaoticgood.computer"

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  site = await buildScratchSite("site-index-only", CONTENT, { config: siteConfig({ offline: true }), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

async function open(page, url) {
  await routeSite(page, site.public, ORIGIN)
  return page.goto(`${ORIGIN}${url}`)
}

const listing = (page) => page.locator(".cgc-post-listing")
const cards = (page) => page.locator(".cgc-social")
const sidebarBox = (page) => page.locator(".right.sidebar .cgc-email-subscribe")
const afterBodyBox = (page) => page.locator(".page-footer .cgc-email-subscribe")

test("puts v4's home page components on the index: the listing after the body, the box and the cards on the right", async ({
  page,
}) => {
  await open(page, "/")
  await expect(page.locator(".page-footer .cgc-post-listing")).toHaveCount(1)
  await expect(page.locator(".right.sidebar .cgc-social")).toHaveCount(1)
  await expect(sidebarBox(page).locator(".cgc-email-subscribe__title")).toHaveText("Newsletter")
  // In v4's order: the box above the cards.
  await expect(page.locator(".right.sidebar .cgc-email-subscribe ~ .desktop-only .cgc-social")).toHaveCount(1)
  // v4's index had no box after its body, only the one in the sidebar.
  await expect(afterBodyBox(page)).toHaveCount(0)
})

test("shows none of them on a note, which keeps its own box after the body", async ({ page }) => {
  await open(page, "/content/notes/a-note")
  await expect(listing(page)).toHaveCount(0)
  await expect(cards(page)).toHaveCount(0)
  await expect(sidebarBox(page)).toHaveCount(0)
  await expect(afterBodyBox(page)).toHaveCount(1)
  // Left out, not rendered empty: no wrapper stays behind in the sidebar.
  await expect(page.locator(".right.sidebar .desktop-only:empty")).toHaveCount(0)
})

test("keeps the listing and the sidebar box on tag pages, without the cards", async ({ page }) => {
  await open(page, "/tags/topic")
  await expect(listing(page)).toHaveCount(1)
  await expect(sidebarBox(page)).toHaveCount(1)
  await expect(cards(page)).toHaveCount(0)
})

test("keeps the listing on the 404 page, without the box or the cards", async ({ page }) => {
  const response = await open(page, "/content/notes/no-such-page")
  expect(response.status()).toBe(404)
  await expect(listing(page)).toHaveCount(1)
  await expect(cards(page)).toHaveCount(0)
  await expect(page.locator(".cgc-email-subscribe")).toHaveCount(0)
})

// The plugins' own page filter is the fallback for a site that can't edit its `quartz.ts`. This site
// places the components itself, so it turns the filter off, and nothing in the config picks pages.
test("leaves the choice of pages to quartz.ts: the site config turns the plugins' own filter off", () => {
  const entries = pluginEntries(fs.readFileSync(siteConfigFile, "utf8"))
  for (const name of ["@chaoticgoodcomputing/quartz-post-listing", "@chaoticgoodcomputing/quartz-social"]) {
    const entry = entries.find(({ source }) => source === name)
    expect(entry.options.showOn, name).toBe(false)
  }
  const byPageType = YAML.parse(fs.readFileSync(siteConfigFile, "utf8")).layout.byPageType
  expect(byPageType.content?.exclude ?? []).not.toContain("email-subscribe-sidebar")
})
