import { builtPages } from "../build.ts"
import { expect, test } from "../site.ts"

test("every tag the vault's notes carry is drawn with a colour and an icon", () => {
  const bubbles = builtPages("vault").flatMap(({ file, html }) =>
    [...html.matchAll(/<a class="tag-badge" href="([^"]+)"[^>]*>(<span class="tag-bubble"[^>]*>(?:<svg)?)/g)].map(
      ([, href, bubble]) => ({ file, href, bubble: bubble! }),
    ),
  )
  expect(bubbles.length).toBeGreaterThan(0)
  const without = bubbles.filter(({ bubble }) => !bubble.includes("--tag-color: ") || !bubble.endsWith("<svg"))
  expect(without.map(({ file, href }) => `${file}: ${href}`)).toEqual([])
})
