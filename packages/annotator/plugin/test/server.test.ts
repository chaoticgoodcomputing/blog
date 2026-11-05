// The local service over HTTP, on a free port: what it answers, and whom it refuses.

import assert from "node:assert/strict"
import { request as httpRequest } from "node:http"
import { after, before, describe, test } from "node:test"
import { type LocalService, serve } from "../src/server.ts"

/** A request as a browser would make it, with the headers it would send. */
function call(service: LocalService, path: string, headers: Record<string, string> = {}, method = "GET", body?: string) {
  return new Promise<{ status: number; headers: Record<string, unknown>; body: string }>((resolve, reject) => {
    const request = httpRequest(
      { host: "127.0.0.1", port: service.port, path, method, headers: { host: `127.0.0.1:${service.port}`, ...headers } },
      (response) => {
        let text = ""
        response.on("data", (chunk) => (text += chunk))
        response.on("end", () => resolve({ status: response.statusCode!, headers: response.headers, body: text }))
      },
    )
    request.on("error", reject)
    request.end(body)
  })
}

describe("the local service", () => {
  let service: LocalService
  const seen: { method: string; url: string; body?: string }[] = []

  before(async () => {
    service = await serve({
      port: 0,
      api: (apiUrl) => async (request) => {
        seen.push(request)
        return { status: 200, body: JSON.stringify({ apiUrl, path: request.url.slice(apiUrl.length) }) }
      },
    })
  })
  after(() => service.close())

  test("hands the API's requests to the API, at its own address", async () => {
    const response = await call(service, "/api/search?uri=x", { origin: "moz-extension://abc-123" })
    assert.equal(response.status, 200)
    assert.deepEqual(JSON.parse(response.body), { apiUrl: `http://127.0.0.1:${service.port}/api/`, path: "search?uri=x" })
    assert.equal(response.headers["access-control-allow-origin"], "moz-extension://abc-123")
  })

  test("passes a request's body on", async () => {
    await call(service, "/api/annotations", { "content-type": "application/json" }, "POST", '{"text":"hi"}')
    assert.equal(seen.at(-1)!.body, '{"text":"hi"}')
  })

  test("answers the extension's requests with no origin, as the background script's may be", async () => {
    assert.equal((await call(service, "/api/profile")).status, 200)
  })

  test("answers a preflight from the extension", async () => {
    const response = await call(service, "/api/annotations", { origin: "chrome-extension://abc", "access-control-request-headers": "authorization" }, "OPTIONS")
    assert.equal(response.status, 204)
    assert.equal(response.headers["access-control-allow-headers"], "authorization")
  })

  test("refuses a web page's requests", async () => {
    const before = seen.length
    const response = await call(service, "/api/search?uri=x", { origin: "https://evil.example" })
    assert.equal(response.status, 403)
    assert.equal(seen.length, before)
  })

  test("refuses a request for another host, as a rebound name would make", async () => {
    const response = await call(service, "/api/profile", { host: `evil.example:${service.port}` })
    assert.equal(response.status, 421)
  })

  test("shows the extension's welcome page", async () => {
    const response = await call(service, "/welcome")
    assert.equal(response.status, 200)
    assert.match(response.body, /serving your vault/)
  })

  test("rejects a port that is taken", async () => {
    await assert.rejects(serve({ port: service.port, api: () => async () => ({ status: 200, body: "{}" }) }), { code: "EADDRINUSE" })
  })
})
