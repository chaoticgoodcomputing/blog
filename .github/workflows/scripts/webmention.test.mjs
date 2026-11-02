// node --test .github/workflows/scripts/*.test.mjs
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { discover, endpointFromHtml, endpointFromLinkHeader, owed, readManifest, send } from "./webmention.mjs"

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
