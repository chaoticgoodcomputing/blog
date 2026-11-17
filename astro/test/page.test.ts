import { expect, test } from "vitest"
import { getNote, getNoteIndex } from "../src/lib/notes.ts"
import { isDiscoverable, isIndexable, tagAt } from "../src/lib/page.ts"
import { sitePageAt } from "../src/lib/site-pages.ts"

// Whether the site's page at an address is discoverable, or indexable; undefined where the site has
// no page.
const discoverableAt = (url: string) => sitePageAt(getNoteIndex(), url)?.discoverable
const indexableAt = (url: string) => sitePageAt(getNoteIndex(), url)?.indexable

test("a note's page is discoverable and indexable unless it is a private page", () => {
  for (const ask of [isDiscoverable, isIndexable]) {
    expect(ask({ kind: "note", note: getNote("content/notes/alpha")! })).toBe(true)
    expect(ask({ kind: "home", note: getNote("index")! })).toBe(true)
    expect(ask({ kind: "note", note: getNote("content/notes/secret")! })).toBe(false)
    expect(ask({ kind: "annotation", note: getNote("content/notes/secret")! })).toBe(false)
  }
})

test("a tag page is discoverable unless its tag is a private tag or under one", () => {
  expect(isDiscoverable({ kind: "tag", tag: "engineering/ai" })).toBe(true)
  expect(isDiscoverable({ kind: "tag", tag: "privateer" })).toBe(true)
  expect(isDiscoverable({ kind: "tag", tag: "private" })).toBe(false)
  expect(isDiscoverable({ kind: "tag", tag: "private/work" })).toBe(false)
})

test("no tag page is indexable, the tags index among them: each is a listing of the posts under its tag", () => {
  expect(isIndexable({ kind: "tag", tag: "engineering/ai" })).toBe(false)
  expect(isIndexable({ kind: "tag", tag: "privateer" })).toBe(false)
  expect(isIndexable({ kind: "tag", tag: "private" })).toBe(false)
  expect(isIndexable({ kind: "tag", tag: undefined })).toBe(false)
})

test("a tag page whose tag only private pages carry is discoverable: it shows its description, and lists no posts", () => {
  // test/fixtures/vault/tag-pages/sealed.md, a private page, is the one note under `ledger/sealed`.
  expect(isDiscoverable({ kind: "tag", tag: "ledger/sealed" })).toBe(true)
  expect(discoverableAt("/tags/ledger/sealed")).toBe(true)
  expect(indexableAt("/tags/ledger/sealed")).toBe(false)
})

test("the 404 page is neither discoverable nor indexable", () => {
  expect(isDiscoverable({ kind: "404" })).toBe(false)
  expect(isIndexable({ kind: "404" })).toBe(false)
})

test("the graph page is neither discoverable nor indexable, at its address or by its kind: it is a tool, with no content of its own", () => {
  expect(isDiscoverable({ kind: "graph" })).toBe(false)
  expect(isIndexable({ kind: "graph" })).toBe(false)
  expect(discoverableAt("/graph")).toBe(false)
  expect(indexableAt("/graph")).toBe(false)
})

test("whether the page at an address is discoverable or indexable is asked of the note or tag the address names", () => {
  expect(discoverableAt("/content/notes/alpha")).toBe(true)
  expect(indexableAt("/content/notes/alpha")).toBe(true)
  expect(discoverableAt("/content/notes/secret")).toBe(false)
  expect(indexableAt("/content/notes/secret")).toBe(false)
  expect(discoverableAt("/tags")).toBe(true)
  expect(indexableAt("/tags")).toBe(false)
  expect(discoverableAt("/tags/engineering/ai")).toBe(true)
  expect(indexableAt("/tags/engineering/ai")).toBe(false)
  expect(discoverableAt("/tags/private")).toBe(false)
  expect(discoverableAt("/tags/private/work")).toBe(false)
  // No note's page and no tag's: the address names nothing the rule speaks of.
  expect(discoverableAt("/no-such-page")).toBeUndefined()
  expect(indexableAt("/no-such-page")).toBeUndefined()
})

test("the tag page at an address names its tag, as a tag page's props do: none for the tags index", () => {
  expect(tagAt("/tags/engineering/ai")).toEqual({ tag: "engineering/ai" })
  expect(tagAt("/tags")).toEqual({ tag: undefined })
  expect(tagAt("/content/notes/alpha")).toBeUndefined()
  expect(tagAt("/tagsmith")).toBeUndefined()
})
