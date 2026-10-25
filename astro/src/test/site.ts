// The Playwright `test` every spec imports, in place of Playwright's own. A page of the site is
// offline: a request to any other host is refused and recorded, so no spec depends on the network,
// and a spec can say which hosts a page asked for. A spec that needs an answer from another host
// (a feed, an analytics endpoint) routes a stand-in of its own, which takes precedence.

import { test as base, expect, type Page } from "@playwright/test"
import { TRAIL_KEY } from "../lib/trail.ts"
import { standInForPostHog } from "./analytics.ts"

export const test = base.extend<{ externalRequests: string[] }>({
  externalRequests: [
    async ({ context, baseURL }, use) => {
      const requests: string[] = []
      const origin = new URL(baseURL!).origin
      await context.route(
        (url) => url.origin !== origin,
        (route) => {
          requests.push(route.request().url())
          return route.abort()
        },
      )

      // 26 analytics: every page asks PostHog for its library, and is given a stand-in (analytics.ts)
      await standInForPostHog(context)

      await use(requests)
    },
    { auto: true },
  ],
})

export { expect }

/**
 * Where a page is, as its address says without the reader's trail (src/lib/trail.ts): the path from
 * the site's root, the rest of the query, and the hash. The trail rides in the query of every page
 * a link reaches, so a durable test says where a page is with this, never with the whole address
 * (docs/adr/0006).
 */
export function placeOf(address: string): string {
  const url = new URL(address)
  url.searchParams.delete(TRAIL_KEY)
  return `${url.pathname}${url.search}${url.hash}`
}

/** Waits until the page is at `place`: a path from the site's root, with any hash, or a pattern it matches. */
export async function expectAt(page: Page, place: string | RegExp): Promise<void> {
  const at = expect.poll(() => placeOf(page.url()))
  if (typeof place === "string") await at.toBe(place)
  else await at.toMatch(place)
}
