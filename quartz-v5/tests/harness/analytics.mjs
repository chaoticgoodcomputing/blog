// Analytics in the suite. No spec reaches a real analytics service: a built page that would load
// PostHog, as every page does once cgc-posthog is on, has its requests answered here instead.
//
// - `quietAnalytics(context)` answers every request to PostHog, empty. The harness applies it to
//   every browser context it hands a spec, so a spec that never thinks about analytics sends none,
//   whether it browses the fixture site or a scratch site built from the site config.
// - `postHogStandIn(page, host)` puts a stand-in for PostHog's library at `host`, for a spec about
//   analytics. It records what the page asks of PostHog. A page's routes take precedence over its
//   context's, so the stand-in wins over the silence.

// PostHog's own hosts (the site config's `apiHost`, and the asset hosts its library loads from), and
// the fixture's, which is reserved and never resolves (tests/quartz.config.yaml).
export const POSTHOG_HOSTS = /^https:\/\/([a-z0-9-]+\.)*posthog\.(com|invalid)\//

export async function quietAnalytics(context) {
  await context.route(POSTHOG_HOSTS, (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }))
}

// The stand-in library, served as `<host>/static/array.js`. PostHog's snippet defines
// `window.posthog` as a queue before the library loads: an array of the calls made so far, with the
// `init` calls in `_i`. The real library replays that queue when it loads, then replaces the queue
// with itself. So does the stand-in, reporting each `init` and `capture` to the spec as it happens,
// through a binding that outlives the page, so a call made just before the page is left still counts.
const STAND_IN = `(() => {
  const report = (kind, payload) => window.__cgcPostHogStandIn(kind, JSON.parse(JSON.stringify(payload)))
  const queue = window.posthog
  const posthog = {
    __SV: 1,
    init(token, config) {
      report("inits", { token, config })
      return posthog
    },
    capture(event, properties = {}) {
      report("captures", { event, properties })
    },
  }
  window.posthog = posthog
  for (const [token, config] of (queue && queue._i) || []) posthog.init(token, config)
  for (const [method, ...args] of Array.isArray(queue) ? queue : []) posthog[method] && posthog[method](...args)
})()
`

/**
 * Answer every request `page` makes to `host` (an origin, e.g. `https://app.posthog.com`) with the
 * stand-in library. Resolves with the record, which fills as the page runs:
 * - `requests`: the URL of every request the page made to `host`;
 * - `inits`: each `posthog.init(token, config)`, as `{ token, config }`;
 * - `captures`: each `posthog.capture(event, properties)`, as `{ event, properties }`.
 */
export async function postHogStandIn(page, host) {
  const record = { requests: [], inits: [], captures: [] }
  await page.exposeBinding("__cgcPostHogStandIn", (_source, kind, payload) => {
    record[kind].push(payload)
  })
  await page.route(`${host}/**`, (route) => {
    record.requests.push(route.request().url())
    return route.fulfill({ status: 200, contentType: "application/javascript", body: STAND_IN })
  })
  return record
}
