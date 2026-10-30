// The plugin's pages, as blob: documents: their base, their options, and their scripts' version.

import assert from "node:assert/strict"
import { test } from "node:test"
import { framePage } from "../src/frame-page.ts"

const PAGE = '<!doctype html><html><head><title>x</title></head><body><script src="viewer.js"></script><script src="https://example.org/a.js"></script></body></html>'

test("a page's own scripts are loaded at the plugin's version, so a new install is never an old script", () => {
  const html = framePage(PAGE, "app://x/plugin/frames/", { version: "abc" })
  assert.match(html, /<script src="viewer\.js\?v=abc"><\/script>/)
  // Scripts from elsewhere are left alone.
  assert.match(html, /<script src="https:\/\/example\.org\/a\.js"><\/script>/)
  assert.match(html, /<head><base href="app:\/\/x\/plugin\/frames\/">/)
})

test("with no version, a page's scripts are as written", () => {
  assert.match(framePage(PAGE, "app://x/"), /<script src="viewer\.js"><\/script>/)
})
