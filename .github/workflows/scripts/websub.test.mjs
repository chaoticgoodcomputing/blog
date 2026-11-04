// node --test .github/workflows/scripts/*.test.mjs
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { feedLinks, owesPing, pingBody, readFeed } from "./websub.mjs"

const FEED = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>A</title><language>en-us</language><atom:link rel="hub" href="https://hub.example/"/><atom:link rel="self" href="https://blog.example.com/index.xml" type="application/rss+xml"/><item><title>One</title></item></channel></rss>`

test("a feed names its hub and its own address", () => {
  assert.deepEqual(feedLinks(FEED), { hub: "https://hub.example/", self: "https://blog.example.com/index.xml" })
  assert.deepEqual(feedLinks("<rss><channel></channel></rss>"), { hub: undefined, self: undefined })
})

test("the hub is told only when the deploy changed the feed, or when there was none before", () => {
  assert.equal(owesPing(FEED, FEED), false)
  assert.equal(owesPing(FEED, FEED.replace("One", "Two")), true)
  assert.equal(owesPing(undefined, FEED), true)
  assert.equal(owesPing(FEED, undefined), false)
})

test("a ping is a publish of the feed's own address", () => {
  assert.equal(pingBody("https://blog.example.com/index.xml").toString(), "hub.mode=publish&hub.url=https%3A%2F%2Fblog.example.com%2Findex.xml")
})

test("a dir without a feed has none", () => {
  const dir = mkdtempSync(join(tmpdir(), "websub-"))
  assert.equal(readFeed(dir), undefined)
  writeFileSync(join(dir, "index.xml"), FEED)
  assert.equal(readFeed(dir), FEED)
})
