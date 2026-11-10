// A passage's address: the same as the site makes (packages/obsidian-markdown's own test).

import assert from "node:assert/strict"
import { test } from "node:test"
import { passageAddress, passageOf } from "../src/passage.ts"

test("a passage's address is its page's, with a text fragment for it and the words either side", () => {
  assert.equal(
    passageAddress("https://example.org/pickle#history", { exact: "A pickle is a cucumber", prefix: "So, the long Introduction. ", suffix: " kept in brine, mostly." }),
    "https://example.org/pickle#:~:text=the%20long%20Introduction.-,A%20pickle%20is%20a%20cucumber,-kept%20in%20brine%2C",
  )
  assert.equal(passageAddress("https://example.org/a", { exact: "well-known" }), "https://example.org/a#:~:text=well%2Dknown")
  assert.equal(passageAddress("https://example.org/a", {}), "https://example.org/a")
})

test("a record's passage is its quote selector's: the text and the words either side", () => {
  const record = { target: { source: "https://example.org/a", selector: [{ type: "TextPositionSelector", start: 1, end: 5 }, { type: "TextQuoteSelector", exact: "pickle", prefix: "a ", suffix: " is" }] } }
  assert.deepEqual(passageOf(record), { exact: "pickle", prefix: "a ", suffix: " is" })
  // A reply names its parent, not a passage; a page note has no selector.
  assert.equal(passageOf({ target: "urn:uuid:00000000-0000-4000-8000-000000000001" }), undefined)
  assert.equal(passageOf({ target: { source: "https://example.org/a" } }), undefined)
})
