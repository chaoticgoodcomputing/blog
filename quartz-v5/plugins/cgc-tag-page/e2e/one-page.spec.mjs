// One page per tag (#72). A tag's page is at `tags/<t>`, and three things would give a tag a second:
// stock tag-page left on beside this plugin, which makes every tag's page again; stock folder-page,
// which makes a page for every folder under `tags/` a nested description file sits in; and the
// vault's description files in their old shape, `tags/<t>/index.md`, which stock doesn't recognise
// as a tag's. The site refuses the first, disables the second (#43), and renames the third at
// cutover (#43).
import fs from "node:fs"
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import {
  buildScratchSite,
  fixtureConfig,
  siteConfig,
  withPlugins,
} from "../../../tests/harness/site.mjs"

// The tag URL each emitted page serves: `tags/a.html` and `tags/a/index.html` are both `tags/a`,
// and `tags/index.html`, the index of tags, is `tags`.
const tagUrls = (files) =>
  files
    .filter((file) => file.startsWith("tags/") && file.endsWith(".html"))
    .map((file) => file.replace(/(\/index)?\.html$/, ""))
    .sort()
const twice = (urls) => urls.filter((url, i) => urls.indexOf(url) !== i)

test("emits one page for each tag", ({ emitted }) => {
  const urls = tagUrls(emitted.list(".html"))
  expect(twice(urls)).toEqual([])
  // A tag with a description file, tags pages carry, an ancestor only, and the index of tags.
  expect(urls).toEqual(
    expect.arrayContaining([
      "tags",
      "tags/articles",
      "tags/markdown",
      "tags/writing",
      "tags/writing/essays",
    ]),
  )
})

test("refuses to run beside stock tag-page, which would make every tag's page again", async () => {
  test.setTimeout(180_000)
  const config = withPlugins(fixtureConfig(), [
    { source: "@quartz-community/tag-page", enabled: true },
  ])
  const site = await buildScratchSite(
    "tag-page-twice",
    { "index.md": "---\ntitle: Home\ntags: [topic]\n---\nA page.\n" },
    { config },
  )
  expect(site.code, site.output).not.toBe(0)
  expect(site.output).toContain("disable @quartz-community/tag-page")
})

// On the real site's config, with description files nested as the vault's are, once renamed.
test.describe("on the site config", () => {
  test.describe.configure({ mode: "serial" })

  const ORIGIN = "https://blog.chaoticgood.computer"
  const CONTENT = {
    "index.md": "---\ntitle: Home\n---\nWelcome.\n",
    "content/notes/a-note.md": "---\ntitle: A note\ntags: [topic/sub, other]\n---\nA note.\n",
    "tags/topic.md": '---\ntitle: "#topic"\n---\nWhat the topic tag is about.\n',
    "tags/topic/sub.md": '---\ntitle: "#sub"\n---\nWhat the sub tag is about.\n',
  }

  let site
  test.beforeAll(async () => {
    test.setTimeout(180_000)
    // Offline: nothing here looks at type, so the site's Google Fonts needn't be fetched.
    site = await buildScratchSite("tag-page-site", CONTENT, {
      config: siteConfig({ offline: true }),
      keep: true,
    })
    expect(site.code, site.output).toBe(0)
  })
  test.afterAll(() => site && fs.rmSync(site.root, { recursive: true, force: true }))

  test("emits one page for each tag, nested description files included", () => {
    const urls = tagUrls(fs.readdirSync(site.public, { recursive: true }))
    expect(urls).toEqual(["tags", "tags/other", "tags/topic", "tags/topic/sub"])
  })

  test("renders each description file as its tag page's body", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    for (const [tag, text] of [
      ["topic", "What the topic tag is about."],
      ["topic/sub", "What the sub tag is about."],
    ]) {
      await page.goto(`${ORIGIN}/tags/${tag}`)
      await expect(page.locator(".cgc-tag-page"), tag).toHaveText(text)
      await expect(page.locator(".page-listing"), tag).toHaveCount(0)
    }
  })

  // v4 titled a tag with no description file "Tag: <tag>", which is stock's `prefixTags`.
  test("titles a tag with no description file as v4 did", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/tags/other`)
    await expect(page.locator("h1.article-title")).toHaveText("Tag: other")
    await expect(page).toHaveTitle("Tag: other | Spencer Elkington")
    await expect(page.locator(".cgc-tag-page")).toHaveText("")
  })
})
