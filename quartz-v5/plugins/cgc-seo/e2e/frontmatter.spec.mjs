// What a page's own frontmatter can and can't ask of cgc-seo, on a scratch site built from the fixture
// config, since the content fixture carries none of these pages: `unlisted: true` keeps an **unlisted
// page** (CONTEXT.md) out of the sitemap and the feed; a description with `]]>` in it reaches a feed
// reader whole, though the feed wraps it in CDATA, which `]]>` ends; and `author` is a name (#57), so a
// list or an object there isn't read.
import fs from "node:fs"
import path from "node:path"
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite } from "../../../tests/harness/site.mjs"
import { readFeed, readSitemap } from "./feeds.mjs"

// The fixture's baseUrl, where the site is served.
const ORIGIN = "https://localhost"
const BRACKETS = "Ends a CDATA section early: ]]> unless escaped."

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nHome.\n",
  "listed.md": "---\ntitle: Listed\n---\nAn indexable article.\n",
  "unlisted.md": "---\ntitle: Unlisted\nunlisted: true\n---\nKept off every listing.\n",
  "brackets.md": `---\ntitle: Brackets\ndescription: "${BRACKETS}"\n---\nA short article.\n`,
  "authors.md": "---\ntitle: Two authors\nauthor:\n  - Ada Lovelace\n  - Grace Hopper\n---\nWritten by two.\n",
  "author-object.md":
    "---\ntitle: An author object\nauthor:\n  name: Grace Hopper\n  url: https://example.com/grace\n---\nWritten by one.\n",
}

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  test.setTimeout(180_000)
  site = await buildScratchSite("seo-frontmatter", CONTENT, { keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

const read = (file) => fs.readFileSync(path.join(site.public, file), "utf8")

test("an unlisted page is in neither the sitemap nor the feed", () => {
  const listed = readSitemap(read("sitemap.xml")).map(({ loc }) => loc)
  const carried = readFeed(read("index.xml")).items.map(({ link }) => link)
  for (const urls of [listed, carried]) {
    expect(urls).toContain(`${ORIGIN}/listed`)
    expect(urls).not.toContain(`${ORIGIN}/unlisted`)
  }
})

test("a description holding `]]>` reaches a feed reader whole", async ({ page }) => {
  // As a feed reader parses it: the text of the item's description, CDATA sections joined.
  const description = await page.evaluate(
    ([xml, link]) => {
      const doc = new DOMParser().parseFromString(xml, "application/xml")
      const item = [...doc.querySelectorAll("item")].find((item) => item.querySelector("link")?.textContent === link)
      return item?.querySelector("description")?.textContent.trim()
    },
    [read("index.xml"), `${ORIGIN}/brackets`],
  )
  expect(description).toBe(`${BRACKETS} (1 min read)`)
})

test("an author that isn't a name isn't read: the page keeps the default author", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  for (const url of ["/authors", "/author-object"]) {
    await page.goto(`${ORIGIN}${url}`)
    const authors = page.locator('head meta[property="article:author"]')
    await expect(authors, url).toHaveCount(1)
    await expect(authors, url).toHaveAttribute("content", "https://localhost/about")
    const jsonLd = JSON.parse(await page.locator('head script[type="application/ld+json"]').textContent())
    expect(jsonLd.author, url).toEqual({ "@type": "Person", name: "Fixture Author", url: "https://localhost/about" })
  }
})
