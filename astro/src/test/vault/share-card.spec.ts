import { SITE } from "../feed-and-sitemap.ts"
import { builtPages } from "../build.ts"
import { expect, test } from "../site.ts"

test("every indexable page of the vault names a card of its own, which the build drew, and no other page does", async ({
  request,
}) => {
  test.setTimeout(300_000)
  const pages = builtPages("vault")
  expect(pages.length).toBeGreaterThan(0)
  const cards = new Set<string>()
  let carded = 0
  for (const { file, html } of pages) {
    const image = /<meta property="og:image" content="([^"]+)">/.exec(html)?.[1]
    // The 404 page and a private page ask not to be indexed, and have no card.
    if (file === "404.html" || html.includes('<meta name="robots" content="noindex">')) {
      expect(image, file).toBeUndefined()
      continue
    }
    carded++
    expect(image, file).toMatch(new RegExp(`^${SITE}/share-cards/.+\\.png$`))
    expect(html, file).toContain(`<meta name="twitter:image" content="${image}">`)
    const card = new URL(image!).pathname
    expect((await request.head(card)).status(), `${file}: ${card}`).toBe(200)
    cards.add(card)
  }
  // No two pages share a card.
  expect(cards.size).toBe(carded)
})
