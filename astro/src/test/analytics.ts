// A stand-in for PostHog, which every page of the built site asks for its library. The stand-in is
// served in the library's place, and records what the page asks of PostHog instead of sending it:
// how it was set up, and each event it captured. So no spec reaches PostHog, and the analytics spec
// says what would have been sent. The test every spec imports puts it on each page (site.ts).

import type { BrowserContext, Page } from "@playwright/test"

/** What the pages of one test asked of PostHog, in the order they asked it. */
export interface PostHogRecord {
  /** The address of each library a page loaded: one for each page loaded, not for each navigation. */
  loads: string[]
  /** Each `posthog.init()`: the project's key, and the options. */
  inits: { token: string; config: Record<string, unknown> }[]
  /** Each `posthog.capture()`. */
  captures: { event: string; properties: Record<string, unknown> }[]
}

const records = new WeakMap<BrowserContext, PostHogRecord>()

/** One call the stand-in passes on to the test. */
type Call = { init: PostHogRecord["inits"][number] } | { capture: PostHogRecord["captures"][number] }

// The library a page is given. PostHog's snippet has queued every call made before the library
// arrived, the `init` in `_i` and the rest in the snippet itself, and the library plays them back
// when it loads, as PostHog's own does. Each call then goes to the test, by the binding below.
const LIBRARY = `(() => {
  const queued = window.posthog
  const record = (call) => window.__postHogStandIn(call)
  const posthog = {
    init: (token, config) => record({ init: { token, config } }),
    capture: (event, properties) => record({ capture: { event, properties } }),
  }
  for (const [token, config] of queued._i) posthog.init(token, config)
  for (const [method, ...args] of queued) posthog[method]?.(...args)
  window.posthog = posthog
})()`

/**
 * Serves the stand-in in place of PostHog's library, wherever a page asks for it, for every page
 * of the test. Called after other hosts are refused, so that its route is the one taken.
 */
export async function standInForPostHog(context: BrowserContext): Promise<void> {
  const record: PostHogRecord = { loads: [], inits: [], captures: [] }
  records.set(context, record)
  await context.exposeBinding("__postHogStandIn", (_source, call: Call) => {
    if ("init" in call) record.inits.push(call.init)
    else record.captures.push(call.capture)
  })
  await context.route(
    (url) => url.pathname === "/static/array.js",
    (route) => {
      record.loads.push(route.request().url())
      return route.fulfill({ contentType: "text/javascript", body: LIBRARY })
    },
  )
}

/** What the pages of `page`'s test asked of PostHog so far. */
export function postHog(page: Page): PostHogRecord {
  return records.get(page.context())!
}

/** The properties of each `event` the pages of `page`'s test captured, in order. */
export function events(page: Page, event: string): Record<string, unknown>[] {
  return postHog(page)
    .captures.filter((capture) => capture.event === event)
    .map((capture) => capture.properties)
}
