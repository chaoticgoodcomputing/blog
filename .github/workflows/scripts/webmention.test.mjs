// node --test .github/workflows/scripts/*.test.mjs
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { deliver, discover, endpointFromHtml, endpointFromLinkHeader, isTransient, owed, readManifest, send, summary, warning } from "./webmention.mjs"

const entry = (source, target, digest = "d1") => ({ source, target, note: "https://blog/n", digest })
const manifest = (...entries) => new Map(entries.map((each) => [each.source, each]))

test("a deploy owes a webmention for each excerpt it added, changed or took out", () => {
  const before = manifest(entry("s/kept", "t/kept"), entry("s/changed", "t/changed"), entry("s/removed", "t/removed"))
  const after = manifest(entry("s/kept", "t/kept"), entry("s/changed", "t/changed", "d2"), entry("s/added", "t/added"))
  assert.deepEqual(owed(before, after), [
    { source: "s/added", target: "t/added", why: "added" },
    { source: "s/changed", target: "t/changed", why: "changed" },
    { source: "s/removed", target: "t/removed", why: "removed" },
  ])
})

test("with no manifest before, nothing is owed but by --all", () => {
  const after = manifest(entry("s/a", "t/a"))
  assert.deepEqual(owed(undefined, after), [])
  assert.deepEqual(owed(undefined, after, { all: true }), [{ source: "s/a", target: "t/a", why: "all" }])
})

test("a directory's manifest is read by source, and one without is undefined", () => {
  const dir = mkdtempSync(join(tmpdir(), "webmention-"))
  assert.equal(readManifest(dir), undefined)
  writeFileSync(join(dir, "webmentions.json"), JSON.stringify([entry("s/a", "t/a")]))
  assert.deepEqual([...readManifest(dir).keys()], ["s/a"])
})

test("a Link header names the endpoint by a rel among others, quoted or not", () => {
  assert.equal(endpointFromLinkHeader('<https://a.example/other>; rel="other", <https://wm.example/ep>; rel="webmention"'), "https://wm.example/ep")
  assert.equal(endpointFromLinkHeader("</ep?x=1>; rel=webmention"), "/ep?x=1")
  assert.equal(endpointFromLinkHeader('<https://a.example/>; rel="pingback me"'), undefined)
  assert.equal(endpointFromLinkHeader(null), undefined)
})

test("the page names the endpoint by its first link or anchor with the rel, outside comments", () => {
  assert.equal(endpointFromHtml('<!-- <link rel="webmention" href="/old"> --><a rel="me webmention" href="/ep?a=1&amp;b=2">x</a>'), "/ep?a=1&b=2")
  assert.equal(endpointFromHtml("<link href='https://wm.example/' rel='webmention'>"), "https://wm.example/")
  assert.equal(endpointFromHtml('<link rel="webmention" href="">'), "")
  assert.equal(endpointFromHtml('<link rel="stylesheet" href="/s.css">'), undefined)
})

test("an endpoint is found where the page is, by header first, and a webmention posted to it", async (t) => {
  const received = []
  const server = createServer((request, response) => {
    if (request.url === "/moved") return response.writeHead(301, { Location: "/post" }).end()
    if (request.url === "/post") {
      response.writeHead(200, { "Content-Type": "text/html", Link: '<ep>; rel="webmention"' })
      return response.end('<link rel="webmention" href="/not-this">')
    }
    if (request.url === "/plain") return response.writeHead(200, { "Content-Type": "text/plain" }).end("<link rel=webmention href=/x>")
    if (request.url === "/ep" && request.method === "POST") {
      let body = ""
      request.on("data", (chunk) => (body += chunk))
      return request.on("end", () => {
        received.push(Object.fromEntries(new URLSearchParams(body)))
        response.writeHead(202).end()
      })
    }
    response.writeHead(404).end()
  })
  await new Promise((done) => server.listen(0, done))
  t.after(() => server.close())
  const base = `http://localhost:${server.address().port}`

  const endpoint = await discover(`${base}/moved`)
  assert.equal(endpoint, `${base}/ep`)
  assert.equal(await discover(`${base}/plain`), undefined)
  assert.equal(await send(endpoint, "https://blog/s", `${base}/moved`), 202)
  assert.deepEqual(received, [{ source: "https://blog/s", target: `${base}/moved` }])
  await assert.rejects(send(`${base}/nowhere`, "s", "t"), /404/)
})

test("a target that can't be reached to look for an endpoint is skipped, and only a refused send fails", async () => {
  const endpoints = { "t/down": new Error("fetch failed"), "t/none": undefined, "t/ok": "e/ok", "t/refuses": "e/refuses" }
  const posted = []
  const find = async (target) => {
    if (endpoints[target] instanceof Error) throw endpoints[target]
    return endpoints[target]
  }
  const post = async (endpoint, source, target) => {
    posted.push([endpoint, source, target])
    if (endpoint === "e/refuses") throw Object.assign(new Error("400 Bad Request"), { status: 400 })
    return 202
  }
  const mentions = ["t/down", "t/none", "t/ok", "t/ok", "t/refuses"].map((target, index) => ({ source: `s/${index}`, target }))
  const result = await deliver(mentions, { find, post, log: () => {}, wait: async () => {} })
  assert.deepEqual(
    { sent: result.sent, without: result.without, unreachable: result.unreachable, failed: result.failed },
    { sent: 2, without: 1, unreachable: ["t/down"], failed: ["t/refuses"] },
  )
  assert.deepEqual(posted.map(([endpoint, source]) => `${endpoint} ${source}`), ["e/ok s/2", "e/ok s/3", "e/refuses s/4"])
})

const failing = (status) => Object.assign(new Error(`${status ?? "fetch failed"}`), status === undefined ? {} : { status })

test("no answer, a 429 or a server error may pass if tried again; a refusal won't", () => {
  assert.equal(isTransient(failing(undefined)), true)
  assert.equal(isTransient(failing(429)), true)
  assert.equal(isTransient(failing(503)), true)
  assert.equal(isTransient(failing(400)), false)
})

test("a transient failure is tried once more after a wait, and a refusal is not", async () => {
  const answers = { "e/flaky": [failing(503), 202], "e/down": [failing(undefined), failing(undefined)], "e/no": [failing(400)] }
  let waits = 0
  const post = async (endpoint) => {
    const answer = answers[endpoint].shift()
    if (answer instanceof Error) throw answer
    return answer
  }
  const result = await deliver(
    [
      { source: "s/1", target: "t/flaky" },
      { source: "s/2", target: "t/down" },
      { source: "s/3", target: "t/no" },
    ],
    { find: async (target) => target.replace("t/", "e/"), post, log: () => {}, wait: async () => void waits++ },
  )
  assert.equal(waits, 2)
  assert.deepEqual(
    result.sends.map(({ target, outcome }) => `${target} ${outcome}`),
    ["t/flaky sent", "t/down failed", "t/no failed"],
  )
  assert.deepEqual(answers, { "e/flaky": [], "e/down": [], "e/no": [] })
})

test("a warning annotation escapes what would end its title or its line", () => {
  assert.equal(warning("A: b, c", "100%\nmore"), "::warning title=A%3A b%2C c::100%25%0Amore")
})

test("the summary lists each send, and counts the rest", () => {
  const text = summary(
    {
      sent: 1,
      without: 3,
      unreachable: ["t/x"],
      failed: ["t/b"],
      sends: [
        { source: "s/a", target: "t/a", outcome: "sent", detail: "202" },
        { source: "s/b", target: "t/b|pipe", outcome: "failed", detail: "400 Bad\nRequest" },
      ],
    },
    6,
  )
  assert.match(text, /6 owed: 1 sent, 1 failed, 3 target\(s\) with no endpoint, 1 not reached\./)
  assert.match(text, /\| ✅ \| t\/a \| s\/a \| 202 \|/)
  assert.match(text, /\| ⚠️ \| t\/b\\\|pipe \| s\/b \| 400 Bad Request \|/)
})
