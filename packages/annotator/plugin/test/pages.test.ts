import assert from "node:assert/strict"
import { test } from "node:test"
import { formatPageRange, inPageRange, parsePageRange } from "../src/pages.ts"

test("a page range is read from a note's property", () => {
  assert.deepEqual(parsePageRange("12-40"), [[12, 40]])
  assert.deepEqual(parsePageRange("3-5, 9"), [[3, 5], [9, 9]])
  assert.deepEqual(parsePageRange("3–5"), [[3, 5]])
  assert.deepEqual(parsePageRange(7), [[7, 7]])
  assert.deepEqual(parsePageRange(["1-2", 4]), [[1, 2], [4, 4]])
})

test("anything else is no range, which shows every page", () => {
  for (const value of [undefined, null, "", "pages", "5-3", "0-2", "1-2-3", {}, "3,", true]) {
    assert.equal(parsePageRange(value), undefined, String(value))
  }
})

test("a range goes to the viewer page as text, and back", () => {
  const range = parsePageRange("3-5, 9")!
  assert.equal(formatPageRange(range), "3-5,9")
  assert.deepEqual(parsePageRange(formatPageRange(range)), range)
  assert.equal(inPageRange(range, 4), true)
  assert.equal(inPageRange(range, 6), false)
  assert.equal(inPageRange(range, 9), true)
})
