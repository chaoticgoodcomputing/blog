import { expect, test } from "vitest"
import { getNote, getUnpublished, isPublished, noteOf, urlOfPath } from "../src/lib/notes.ts"
import { descriptionOf, tagPages, tagPageTags } from "../src/lib/tag-pages.ts"

// The fixture vault's tag description notes are `tags/ledger.md`, of a tag six posts carry, and
// `tags/unworn.md`, of a tag no note carries. `tag-pages/sealed.md` is a private page, and the one
// note under `ledger/sealed` (test/fixtures/vault/post-listing has the posts under `ledger`).

test("a tag description note has no page of its own, and a link to it goes to its tag's page", () => {
  expect(isPublished("tags/ledger.md")).toBe(false)
  expect(getNote("tags/ledger")).toBeUndefined()
  expect(noteOf("tags/ledger.md")).toMatchObject({ title: "#ledger", reason: "tag description", url: "/tags/ledger" })
  expect(getUnpublished("tag description").map((note) => note.file.path)).toContain("tags/ledger.md")
})

test("a tag has a page when a published note carries it or a tag under it, private pages included", () => {
  const tags = tagPages()
  expect(tags).toContain("ledger")
  expect(tags).toContain("ledger/accounts")
  // Carried only by a private page.
  expect(tags).toContain("ledger/sealed")
  expect(tags).toContain("private")
  // An ancestor of a tag in use, which no note carries itself.
  expect(tags).toContain("engineering")
})

test("a tag page shows its tag's description note, where the vault has one", () => {
  expect(descriptionOf("ledger")).toMatchObject({ title: "#ledger", description: "What the ledger keeps." })
  expect(descriptionOf("ledger/accounts")).toBeUndefined()
})

test("a tag page links to its subtags, each with how many posts are under it", () => {
  expect(tagPageTags("ledger", { showParents: false })).toEqual([
    { tag: "ledger/accounts", count: 2 },
    // Only a private page carries it: its page is there, and lists no posts.
    { tag: "ledger/sealed", count: 0 },
  ])
  expect(tagPageTags("ledger/accounts", { showParents: false })).toEqual([])
})

test("with parents shown, a tag page links first to the tags above it, from the top", () => {
  expect(tagPageTags("ledger/accounts", { showParents: true })).toEqual([{ tag: "ledger", count: 6 }])
  expect(tagPageTags("ledger", { showParents: true })).toEqual([
    { tag: "ledger/accounts", count: 2 },
    { tag: "ledger/sealed", count: 0 },
  ])
})

test("a tag page links to no private tag's page", () => {
  // `private/drafts` and `private/work` are in use, under `private`.
  expect(tagPageTags("private", { showParents: false })).toEqual([])
  expect(tagPageTags(undefined, { showParents: false }).map(({ tag }) => tag)).not.toContain("private")
})

test("the tags index links to the top-level tags", () => {
  const tags = tagPageTags(undefined, { showParents: true })
  expect(tags).toContainEqual({ tag: "ledger", count: 6 })
  expect(tags.map(({ tag }) => tag)).toContain("engineering")
  expect(tags.every(({ tag }) => !tag.includes("/"))).toBe(true)
})

test("a tag no published note carries has no page, though it has a description note", () => {
  expect(tagPages()).not.toContain("unworn")
  // The drawings' tag: a drawing has no page.
  expect(tagPages()).not.toContain("excalidraw")
})

test("a link to the description note of a tag with no page goes nowhere, and is unresolved", () => {
  expect(noteOf("tags/unworn.md")).toMatchObject({ reason: "tag description", url: undefined })
})

test("a link to a tag's page with no description note goes to that page", () => {
  expect(urlOfPath("tags/ledger/accounts")).toBe("/tags/ledger/accounts")
  expect(urlOfPath("/tags/ledger/accounts")).toBe("/tags/ledger/accounts")
  expect(urlOfPath("tags/ledger/sealed")).toBe("/tags/ledger/sealed")
  // A tag with no page, and a path that is no tag's.
  expect(urlOfPath("tags/unworn")).toBeUndefined()
  expect(urlOfPath("tags")).toBeUndefined()
  expect(urlOfPath("ledger/accounts")).toBeUndefined()
})
