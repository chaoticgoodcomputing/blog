// Every plugin that treats private pages differently agrees on which pages those are: tags-core's
// **private page**, a page carrying one of the site's private tags or a tag under one. The site config
// names its private tags once, as `&privateTags` on cgc-seo's `noindexTags`, and every plugin that
// takes them aliases it: cgc-backlinks', cgc-graph's and cgc-tag-explorer's `privateTags`, and
// cgc-post-listing's `excludeTags`. Each plugin normalises a private tag as the tag engine normalises
// a tag a site writes (tags-core's `normaliseTag()`).
//
// Proven on a scratch site built from the site config with the anchored list rewritten to name a
// second private tag the way a site might write it, `Secret Stash/`: if any plugin read the list
// from anywhere but the anchor, or read it differently, it would disagree about the pages under it.
import path from "node:path"
import { createRequire } from "node:module"
import { test, expect, routeSite } from "../harness/test.mjs"
import { buildScratchSite, siteConfig, core } from "../harness/site.mjs"
import { drawnGraph, localGraph } from "../../plugins/cgc-graph/e2e/graph.mjs"

const YAML = createRequire(path.join(core, "package.json"))("yaml")

// The site's config, with the private tags it anchors once replaced by `tags`.
function withPrivateTags(tags) {
  const config = YAML.parseDocument(siteConfig({ offline: true }))
  let anchored = 0
  YAML.visit(config, {
    Seq(_, node) {
      if (node.anchor !== "privateTags") return
      node.items = tags.map((tag) => config.createNode(tag))
      anchored++
    },
  })
  expect(anchored, "the site config anchors its private tags once, as &privateTags").toBe(1)
  return String(config)
}

const ORIGIN = "https://blog.chaoticgood.computer"

// Every page is under `engineering`, a public tag, so the tag explorer would list each of them there,
// and links to the target, so each would be one of its backlinks, and is in its local graph.
const note = (title, tags) =>
  `---\ntitle: ${title}\ntags: [${["engineering", ...tags].join(", ")}]\ndate: 2025-01-01\n---\nAbout [[content/notes/target|the target]].\n`
const PAGES = {
  open: { title: "Open", tags: [], private: false },
  locked: { title: "Locked", tags: ["private"], private: true },
  "locked-deep": { title: "Locked deep", tags: ["private/work"], private: true },
  // Only starts with a private tag's name, so it is under no private tag.
  privateer: { title: "Privateer", tags: ["privateer"], private: false },
  // Under the second private tag, which the site config writes `Secret Stash/`.
  stashed: { title: "Stashed", tags: ["secret-stash"], private: true },
  "stashed-deep": { title: "Stashed deep", tags: ["secret-stash/deep"], private: true },
}
const PRIVATE = Object.values(PAGES)
  .filter((page) => page.private)
  .map((page) => page.title)
  .sort()
const PUBLIC = Object.values(PAGES)
  .filter((page) => !page.private)
  .map((page) => page.title)
  .sort()

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  "content/notes/target.md": "---\ntitle: Target\ntags: [writing]\n---\nLinked from every page.\n",
  ...Object.fromEntries(
    Object.entries(PAGES).map(([name, { title, tags }]) => [
      `content/notes/${name}.md`,
      note(title, tags),
    ]),
  ),
}

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  test.setTimeout(180_000)
  site = await buildScratchSite("private-pages", CONTENT, {
    config: withPrivateTags(["private", "Secret Stash/"]),
    keep: true,
  })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

test("cgc-seo asks search engines not to index the private pages, nor the private tags' pages", async ({
  page,
}) => {
  await routeSite(page, site.public, ORIGIN)
  const noindexed = []
  for (const [name, { title }] of Object.entries(PAGES)) {
    await page.goto(`${ORIGIN}/content/notes/${name}`)
    if ((await page.locator('head meta[name="robots"][content="noindex"]').count()) > 0)
      noindexed.push(title)
  }
  expect(noindexed.sort()).toEqual(PRIVATE)
  // A **private tag page**: the page of a private tag, or of a tag under one.
  for (const [url, noindex] of [
    ["/tags/private", true],
    ["/tags/secret-stash", true],
    ["/tags/secret-stash/deep", true],
    ["/tags/privateer", false],
    ["/tags/engineering", false],
  ]) {
    await page.goto(`${ORIGIN}${url}`)
    await expect(page.locator('head meta[name="robots"][content="noindex"]'), url).toHaveCount(
      noindex ? 1 : 0,
    )
  }
})

// The owner's review notes of 2026-09-26 (#85): the site leaves private pages out of backlinks
// (`excludePrivate`), where v4 marked them.
test("cgc-backlinks leaves the private pages out", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/target`)
  const listed = await page.locator(".cgc-backlinks__link .cgc-backlinks__name").allTextContents()
  expect(listed.sort()).toEqual(PUBLIC)
  await expect(page.locator(".cgc-backlinks__link--private")).toHaveCount(0)
})

test("cgc-graph draws the private pages as private", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/target`)
  const graph = await drawnGraph(localGraph(page))
  const drawn = Object.keys(PAGES).map((name) => graph[`content/notes/${name}`])
  expect(drawn.every(Boolean), "every page is in the target's local graph").toBe(true)
  const marked = drawn.filter((node) => node.private).map((node) => node.label)
  expect(marked.sort()).toEqual(PRIVATE)
})

// The owner's review notes of 2026-09-26 (#85): the site leaves private pages out of the tag
// explorer (`excludePrivate`), from every count and listing, and the private tags out of its tree,
// where v4 listed private pages with a lock.
test("cgc-tag-explorer leaves the private pages and the private tags out", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  const explorer = page.locator(".cgc-tag-explorer__tree")
  for (const tag of ["private", "private/work", "secret-stash", "secret-stash/deep"])
    await expect(explorer.locator(`[data-tag="${tag}"]`), tag).toHaveCount(0)
  await expect(explorer.locator('[data-tag="privateer"]')).toHaveCount(1)
  const engineering = page.locator('.cgc-tag-explorer__tag[data-tag="engineering"]')
  await expect(
    engineering.locator(":scope > .cgc-tag-explorer__row .cgc-tag-explorer__count"),
  ).toHaveText(`(${PUBLIC.length})`)
  await engineering.locator(":scope > .cgc-tag-explorer__row .cgc-tag-explorer__fold").click()
  const pages = engineering.locator(
    ":scope > .cgc-tag-explorer__children > .cgc-tag-explorer__list > .cgc-tag-explorer__page",
  )
  await expect(pages).toHaveCount(PUBLIC.length)
  const listed = await pages.locator(".cgc-tag-explorer__page-title").allTextContents()
  expect(listed.sort()).toEqual(PUBLIC)
  await expect(pages.locator(".cgc-tag-explorer__lock")).toHaveCount(0)
})

test("cgc-post-listing leaves the private pages out", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/`)
  const listed = await page
    .locator(".cgc-post-listing .cgc-post-listing__link")
    .allTextContents()
  const ours = Object.values(PAGES).map((page) => page.title)
  expect(listed.filter((title) => ours.includes(title)).sort()).toEqual(
    ours.filter((title) => !PRIVATE.includes(title)).sort(),
  )
})
