// Bluesky in the suite. No spec reaches the real Bluesky: a page that fetches from it, as the
// `bluesky-post` widget does in the browser, has its requests answered here instead.
//
// - `blueskyStandIn(context)` answers every request to Bluesky's hosts (`*.bsky.app`): the public
//   API's XRPC calls from `fixture-bluesky/xrpc.json`, and every image on its CDN with one small
//   picture. The harness applies it to every browser context it hands a spec, so a page that shows
//   a Bluesky post shows the fixture's, and an unknown post is not found, as the real API says.
// - A spec about a failure routes the API itself: a page's routes take precedence over its
//   context's, so `page.route(BLUESKY_API, …)` wins over the stand-in.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/** Every Bluesky host: the public API, the image CDN and the web app. */
export const BLUESKY_HOSTS = /^https:\/\/([a-z0-9-]+\.)*bsky\.app\//
/** The public API, as the widget library's `/bluesky` client calls it. */
export const BLUESKY_API = /^https:\/\/public\.api\.bsky\.app\/xrpc\//

const here = path.dirname(fileURLToPath(import.meta.url))
/** The stand-in's answers: `XRPC[method][what]`, as in fixture-bluesky/xrpc.json. */
export const XRPC = JSON.parse(
  fs.readFileSync(path.join(here, "../fixture-bluesky/xrpc.json"), "utf8"),
)

// The parameter that names what each call asks for.
const KEYS = ["uri", "handle", "actor"]

// Every image the CDN serves, avatars and thumbnails alike: a square the browser can decode.
const PICTURE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#7b97aa"/><circle cx="4" cy="4" r="2" fill="#284b63"/></svg>`

// The API answers the page's origin: every response it gives carries CORS headers.
const json = (status, body) => ({
  status,
  contentType: "application/json",
  headers: { "access-control-allow-origin": "*" },
  body: JSON.stringify(body),
})

/** The response the stand-in gives to one XRPC call, as `route.fulfill` takes it. */
export function xrpcResponse(url) {
  const { pathname, searchParams } = new URL(url)
  const method = pathname.replace(/^\/xrpc\//, "")
  const answers = XRPC[method]
  if (!answers)
    return json(501, { error: "MethodNotImplemented", message: `${method} is not in the stand-in` })
  const key = KEYS.map((k) => searchParams.get(k)).find((v) => v !== null)
  if (key !== undefined && Object.hasOwn(answers, key)) return json(200, answers[key])
  // What the real API says for a post that doesn't exist, or an unknown handle or actor.
  return method === "app.bsky.feed.getPostThread"
    ? json(400, { error: "NotFound", message: `Post not found: ${key}` })
    : json(400, { error: "InvalidRequest", message: `Unknown: ${key}` })
}

export async function blueskyStandIn(context) {
  await context.route(BLUESKY_HOSTS, (route) => {
    const url = new URL(route.request().url())
    if (url.host === "cdn.bsky.app")
      return route.fulfill({ status: 200, contentType: "image/svg+xml", body: PICTURE })
    if (url.pathname.startsWith("/xrpc/")) return route.fulfill(xrpcResponse(url.href))
    return route.fulfill({ status: 404, contentType: "text/plain", body: "not in the stand-in" })
  })
}
