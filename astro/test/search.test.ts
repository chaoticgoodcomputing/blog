import { expect, test } from "vitest"
import { isSearched } from "../src/lib/search.ts"
import { getNoteIndex } from "../src/lib/notes.ts"

// test/fixtures/vault/search: `findable`, an indexable page with an alias, `found-it`, and
// `drafts/unfindable`, a private page.

test("a note's page is searched unless it is a private page", () => {
  expect(isSearched("/search/findable", getNoteIndex())).toBe(true)
  expect(isSearched("/", getNoteIndex())).toBe(true)
  expect(isSearched("/search/drafts/unfindable", getNoteIndex())).toBe(false)
})

test("a tag page is searched unless its tag is a private tag or under one", () => {
  expect(isSearched("/tags/engineering/ai", getNoteIndex())).toBe(true)
  expect(isSearched("/tags", getNoteIndex())).toBe(true)
  expect(isSearched("/tags/private", getNoteIndex())).toBe(false)
  expect(isSearched("/tags/private/drafts", getNoteIndex())).toBe(false)
})

test("a page that is neither a note's nor a tag's is not searched", () => {
  expect(isSearched("/404", getNoteIndex())).toBe(false)
  // The alias redirect, which only forwards the reader to the note.
  expect(isSearched("/search/found-it", getNoteIndex())).toBe(false)
})
