import { builtAddresses } from "../build.ts"
import { expect, test } from "../site.ts"
import { UNRENDERED_SYNTAX } from "../unrendered-syntax.ts"

// The rendering gate over the real vault: no page shows the reader Obsidian's syntax.

const SHARDS = 4
for (let shard = 0; shard < SHARDS; shard++) {
  test(`no page of the vault shows Obsidian syntax as text (${shard + 1} of ${SHARDS})`, async ({ page }) => {
    test.setTimeout(600_000)
    const pages = builtAddresses("vault")
    expect(pages.length).toBeGreaterThan(0)
    const shown: string[] = []
    for (const address of pages.filter((_, index) => index % SHARDS === shard)) {
      await page.goto(address)
      // What a reader reads in the body, without its code, where syntax is shown on purpose.
      const text = await page.locator(".prose").evaluateAll((bodies) =>
        bodies
          .map((body) => {
            const copy = body.cloneNode(true) as HTMLElement
            for (const code of copy.querySelectorAll("pre, code, .katex, math")) code.remove()
            return copy.innerText
          })
          .join("\n"),
      )
      for (const [name, pattern] of Object.entries(UNRENDERED_SYNTAX)) {
        const match = pattern.exec(text)
        if (match) shown.push(`${address}: ${name}, "${match[0].trim()}"`)
      }
    }
    expect(shown).toEqual([])
  })
}
