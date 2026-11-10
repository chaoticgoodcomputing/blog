import assert from "node:assert/strict"
import { test } from "node:test"
import { formatPageRange, pageRangeIncludes } from "@chaoticgoodcomputing/web-annotations"
import { pageRangeOfAddress } from "../src/pages.ts"
import { propertiesOfText } from "../src/annotation-properties.ts"

const pagesOf = (value: string) => propertiesOfText(`---\nannotation-target: a.pdf\nannotation-pages: ${value}\n---\n`)

test("a note's page range is read by web-annotations, as a set", () => {
  assert.deepEqual(pagesOf("12-40")?.pages, [[12, 40]])
  assert.deepEqual(pagesOf("3-5, 9")?.pages, [[3, 5], [9, 9]])
  assert.deepEqual(pagesOf("3–5")?.pages, [[3, 5]])
  assert.deepEqual(pagesOf("7")?.pages, [[7, 7]])
  assert.deepEqual(pagesOf("[\"1-2\", 4]")?.pages, [[1, 2], [4, 4]])
  assert.equal(pagesOf("")?.pages, undefined)
})

test("a malformed page range is an error, never every page", () => {
  for (const value of ["pages", "5-3", "0-2", "1-2-3", "3,", "true", "[3, true]"]) {
    assert.equal(pagesOf(value)?.error?.property, "annotation-pages", value)
  }
})

test("a range goes to the viewer page as text, and back", () => {
  const range = pagesOf("3-5, 9")!.pages!
  assert.equal(formatPageRange(range), "3-5,9")
  assert.deepEqual(pageRangeOfAddress(formatPageRange(range)), range)
  assert.equal(pageRangeIncludes(range, 4), true)
  assert.equal(pageRangeIncludes(range, 6), false)
  assert.equal(pageRangeOfAddress(undefined), undefined)
  assert.equal(pageRangeOfAddress("nonsense"), undefined)
})
