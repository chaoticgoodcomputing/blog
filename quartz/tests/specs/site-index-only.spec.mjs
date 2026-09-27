// The home page's own components on the real site (#70): v4's index layout had the post listing
// after the body, and the "Newsletter" subscribe box and the social cards in the right sidebar,
// where no note has them. Quartz 5 ships no `is-index` condition, and the site adds none (the owner's
// decision on #70). The site's steering file `quartz.ts` places them instead: on the index, and on
// the page types it names for each (the listing on tag pages and the 404 page, the sidebar box on
// tag pages), and on no other page, of any page type the site renders. Proven on a scratch site
// built from the site config; annotation pages are site-annotations.spec's. That the site config
// leaves the choice of pages to quartz.ts is config shape, checked by
// utils/test/site-home-page.test.mjs. Built offline: nothing here depends on the typeface, and
// site-config.spec proves the fonts.
import { test, expect, routeSite } from "../harness/test.mjs"
import { buildScratchSite, siteConfig } from "../harness/site.mjs"

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  // With headings, so the table of contents, the sidebar's other `desktop-only` component, has
  // something to show.
  "content/notes/a-note.md":
    "---\ntitle: A note\ndate: 2024-02-01\ntags: [topic]\n---\n## One\n\nA note.\n\n## Two\n\nTwo folders down.\n",
  "tags/topic.md": "---\ntitle: Topic\n---\nWhat the topic tag is about.\n",
  // One page of each other page type the site renders, which quartz.ts places by its layout name.
  "content/notes/a-canvas.canvas": JSON.stringify({
    nodes: [{ id: "a", type: "text", text: "A card.", x: 0, y: 0, width: 200, height: 100 }],
    edges: [],
  }),
  "content/notes/a-base.base": "views:\n  - type: table\n    name: Notes\n",
  "content/notes/an-mdx-note.mdx": "---\ntitle: An MDX note\ndate: 2024-02-02\n---\n## One\n\nAn MDX note.\n",
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

// quartz.ts places them on each page type by its layout name, so each page type the site renders is
// checked on its own, whatever keeps them off it: an `.mdx` page takes the `content` layout, and the
// canvas frame draws none of these slots. Folder pages are off on the site (#42, #43).
for (const [pageType, url, body] of [
  ["canvas", "/content/notes/a-canvas.canvas", ".canvas-container"],
  ["bases", "/content/notes/a-base.base", ".bases-page"],
  ["mdx", "/content/notes/an-mdx-note.mdx", "article:has-text('An MDX note.')"],
]) {
  test(`shows none of them on a ${pageType} page`, async ({ page }) => {
    const response = await open(page, url)
    expect(response.status()).toBe(200)
    // Rendered as that page type.
    await expect(page.locator(body)).toHaveCount(1)
    await expect(listing(page)).toHaveCount(0)
    await expect(cards(page)).toHaveCount(0)
    await expect(sidebarBox(page)).toHaveCount(0)
    // No empty-wrapper check, as on the note: these pages have no headings, so the table of
    // contents leaves its own empty `desktop-only` wrapper.
  })
}
