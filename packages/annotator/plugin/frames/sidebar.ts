// The sidebar page: the Hypothesis client's sidebar app, as Hypothesis's own server serves it
// (`<hypothesis-app>`, its settings as JSON, the boot script), with the API it calls answered by the
// fake service. The client calls the global `fetch` for every API request, so this script replaces
// it before the client loads: requests to the API go to the viewer page, this page's parent and on
// its origin, which asks the plugin; anything else goes out as before.

import { API_URL } from "../src/service.ts"

const bridge = (parent as any).annotatorBridge as { api(request: { method: string; url: string; body?: string }): Promise<{ status: number; body: string }> }
const networkFetch = window.fetch.bind(window)

window.fetch = async function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : null
  const url = request ? request.url : String(input)
  if (!url.startsWith(API_URL)) return networkFetch(input, init)
  const method = init?.method ?? request?.method ?? "GET"
  const body = init?.body != null ? String(init.body) : request ? await request.text() : undefined
  const answer = await bridge.api({ method, url, body: body || undefined })
  return new Response(answer.status === 204 ? null : answer.body, { status: answer.status, headers: { "Content-Type": "application/json" } })
}

const here = (path: string) => new URL(path, location.href).href

// The settings the sidebar reads from its page (ConfigFromSidebar in the client). `authDomain` is
// other than the service's authority, which makes the client a third party's, with no login of
// its own; and there is no Sentry.
const config = document.createElement("script")
config.type = "application/json"
config.className = "js-hypothesis-config"
config.textContent = JSON.stringify({
  assetRoot: here("hypothesis/"),
  apiUrl: API_URL,
  authDomain: "hypothes.is",
  oauthClientId: "annotator",
  rpcAllowedOrigins: [],
})
const boot = document.createElement("script")
boot.src = here("hypothesis/build/boot.js")
document.body.append(config, boot)
