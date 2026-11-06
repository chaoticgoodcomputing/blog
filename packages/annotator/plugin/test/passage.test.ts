// A passage's address: the same as the site makes (packages/obsidian-markdown's own test).

import assert from "node:assert/strict"
import { test } from "node:test"
import { passageAddress } from "../src/passage.ts"

test("a passage's address is its page's, with a text fragment for it and the words either side", () => {
  assert.equal(
    passageAddress("https://example.org/pickle#history", { exact: "A pickle is a cucumber", prefix: "So, the long Introduction. ", suffix: " kept in brine, mostly." }),
    "https://example.org/pickle#:~:text=the%20long%20Introduction.-,A%20pickle%20is%20a%20cucumber,-kept%20in%20brine%2C",
  )
  assert.equal(passageAddress("https://example.org/a", { exact: "well-known" }), "https://example.org/a#:~:text=well%2Dknown")
  assert.equal(passageAddress("https://example.org/a", {}), "https://example.org/a")
})
