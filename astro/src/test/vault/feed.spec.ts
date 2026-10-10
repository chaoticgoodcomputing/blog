import { readFeed } from "../feed-and-sitemap.ts"
import { expect, test } from "../site.ts"

// The feed's address, which readers subscribed to before the cutover still have.
const FEED = "https://blog.chaoticgood.computer/index.xml"

test("the real vault's feed is RSS 2.0, at the live feed's address, and every item is whole", async ({
  page,
  request,
}) => {
  const items = await readFeed(page, request, FEED)
  expect(items.length).toBeGreaterThan(0)
  for (const item of items) {
    expect(item.title).toBeTruthy()
    expect(item.link).toMatch(/^https:\/\/blog\.chaoticgood\.computer\//)
    expect(item.pubDate).toBeTruthy()
    expect(item.description).toBeTruthy()
  }
})
