// The Playwright `test` every spec imports, in place of Playwright's own. A page of the site is
// offline: a request to any other host is refused and recorded, so no spec depends on the network,
// and a spec can say which hosts a page asked for. A spec that needs an answer from another host
// (a feed, an analytics endpoint) routes a stand-in of its own, which takes precedence.

import { test as base, expect } from "@playwright/test"
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
