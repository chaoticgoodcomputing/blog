import { expect, test } from "vitest"
import { isUnderTag, tagAncestors, tagName, tagSlug, tagUrl, underAny, withAncestors } from "../src/lib/tags.ts"

test("a tag's slug is its path as written, without the # or stray slashes", () => {
  expect(tagSlug("#engineering/ai")).toBe("engineering/ai")
  expect(tagSlug(" /engineering//ai/ ")).toBe("engineering/ai")
  expect(tagSlug("Engineering/AI")).toBe("Engineering/AI")
})

test("a tag's name is the last level of its slug", () => {
  expect(tagName("engineering/languages/typescript")).toBe("typescript")
  expect(tagName("engineering")).toBe("engineering")
})

test("a tag's ancestors are every tag above it, nearest last", () => {
  expect(tagAncestors("a/b/c")).toEqual(["a", "a/b"])
  expect(tagAncestors("a")).toEqual([])
})

test("tags with their ancestors are each tag and every tag above one, once, sorted", () => {
  expect(withAncestors(["writing/articles", "a/b/c", "a/b"])).toEqual(["a", "a/b", "a/b/c", "writing", "writing/articles"])
})

test("a tag is under itself and under each ancestor, and not under a tag it merely starts with", () => {
  expect(isUnderTag("private", "private")).toBe(true)
  expect(isUnderTag("private/work", "private")).toBe(true)
  expect(isUnderTag("Private/Work", "private")).toBe(true)
  expect(isUnderTag("privateer", "private")).toBe(false)
  expect(isUnderTag("work/private", "private")).toBe(false)
})

test("tags are under a set of tags when any one of them is under any of the set", () => {
  expect(underAny(["engineering", "private/work"], ["private"])).toBe(true)
  expect(underAny(["engineering", "privateer"], ["private"])).toBe(false)
  expect(underAny([], ["private"])).toBe(false)
})

test("a tag's page is at its tag slug, under tags", () => {
  expect(tagUrl("engineering/languages/typescript")).toBe("/tags/engineering/languages/typescript")
  expect(tagUrl("engineering")).toBe("/tags/engineering")
})
