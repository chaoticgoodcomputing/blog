import { builtAddresses } from "../build.ts"
import { expect, test } from "../site.ts"

// At a phone's width, in shards that run side by side.
const SHARDS = 8
for (let shard = 0; shard < SHARDS; shard++) {
  test(`on a phone no page of the vault scrolls sideways (${shard + 1} of ${SHARDS})`, async ({ page }) => {
    test.setTimeout(600_000)
    const pages = builtAddresses("vault")
    expect(pages.length).toBeGreaterThan(0)
    await page.setViewportSize({ width: 390, height: 900 })
    const wide: string[] = []
    for (const address of pages.filter((_, index) => index % SHARDS === shard)) {
      await page.goto(address)
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      if (sideways !== 0) wide.push(`${address} (+${sideways}px)`)
    }
    expect(wide).toEqual([])
  })
}
