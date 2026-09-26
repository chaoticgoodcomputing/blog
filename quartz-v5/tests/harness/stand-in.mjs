// What the suite's stand-ins for remote services share: the Bluesky stand-in (bluesky.mjs), the
// GitHub stand-in (github.mjs), and every spec that routes one of their hosts itself, for a failure.

/**
 * A remote API's JSON answer, as `route.fulfill` takes it. Every one carries CORS headers, because a
 * page calls the API from its own origin.
 */
export const jsonResponse = (status, body) => ({
  status,
  contentType: "application/json",
  headers: { "access-control-allow-origin": "*" },
  body: JSON.stringify(body),
})

// Every image an image host serves, avatars and thumbnails alike: a square the browser can decode.
const PICTURE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#7b97aa"/><circle cx="4" cy="4" r="2" fill="#284b63"/></svg>`

/**
 * Answer every request `context` makes to `hosts` (a pattern, as `context.route` takes it): one to
 * `imageHost` with a small picture, and any other with `answer(url)`, a response as `route.fulfill`
 * takes it. A page's own routes take precedence over its context's, so a spec about a failure routes
 * the host on its page.
 */
export async function routeStandIn(context, hosts, { imageHost, answer }) {
  await context.route(hosts, (route) => {
    const url = new URL(route.request().url())
    if (url.host === imageHost) return route.fulfill({ status: 200, contentType: "image/svg+xml", body: PICTURE })
    return route.fulfill(answer(url))
  })
}
