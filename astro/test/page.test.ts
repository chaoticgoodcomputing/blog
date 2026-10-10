import { expect, test } from "vitest"
import { getNote } from "../src/lib/notes.ts"
import { isIndexable, isIndexableAt, tagAt } from "../src/lib/page.ts"

test("a note's page is indexable unless it is a private page", () => {
  expect(isIndexable({ kind: "note", note: getNote("content/notes/alpha")! })).toBe(true)
  expect(isIndexable({ kind: "home", note: getNote("index")! })).toBe(true)
  expect(isIndexable({ kind: "note", note: getNote("content/notes/secret")! })).toBe(false)
  expect(isIndexable({ kind: "annotation", note: getNote("content/notes/secret")! })).toBe(false)
})

test("a tag page is indexable unless its tag is a private tag or under one", () => {
  expect(isIndexable({ kind: "tag", tag: "engineering/ai" })).toBe(true)
  expect(isIndexable({ kind: "tag", tag: "privateer" })).toBe(true)
  expect(isIndexable({ kind: "tag", tag: "private" })).toBe(false)
  expect(isIndexable({ kind: "tag", tag: "private/work" })).toBe(false)
})

test("a tag page whose tag only private pages carry is indexable: it shows its description, and lists no posts", () => {
  // test/fixtures/vault/tag-pages/sealed.md, a private page, is the one note under `ledger/sealed`.
  expect(isIndexable({ kind: "tag", tag: "ledger/sealed" })).toBe(true)
  expect(isIndexableAt("/tags/ledger/sealed")).toBe(true)
})

test("the 404 page is not indexable", () => {
  expect(isIndexable({ kind: "404" })).toBe(false)
})

test("whether the page at an address is indexable is asked of the note or tag the address names", () => {
  expect(isIndexableAt("/content/notes/alpha")).toBe(true)
  expect(isIndexableAt("/content/notes/secret")).toBe(false)
  expect(isIndexableAt("/tags")).toBe(true)
  expect(isIndexableAt("/tags/engineering/ai")).toBe(true)
  expect(isIndexableAt("/tags/private")).toBe(false)
  expect(isIndexableAt("/tags/private/work")).toBe(false)
  // No note's page and no tag's: the address names nothing the rule speaks of.
  expect(isIndexableAt("/no-such-page")).toBeUndefined()
})

test("the tag page at an address names its tag, as a tag page's props do: none for the tags index", () => {
  expect(tagAt("/tags/engineering/ai")).toEqual({ tag: "engineering/ai" })
  expect(tagAt("/tags")).toEqual({ tag: undefined })
  expect(tagAt("/content/notes/alpha")).toBeUndefined()
  expect(tagAt("/tagsmith")).toBeUndefined()
})
