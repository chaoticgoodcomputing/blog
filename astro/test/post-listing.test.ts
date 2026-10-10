import { expect, test } from "vitest"
import { listedPosts, postCounts } from "../src/lib/post-listing.ts"

// test/fixtures/vault/post-listing: six posts under `ledger`, one a day each month of 2024 from
// January to June, two of them under `ledger/accounts`, and `Locked Ledger`, the newest, a private
// page. Other features' notes are in the listing too, so what is asked here is asked of these.
const ledger = (titles: string[]) => titles.filter((title) => /Ledger/.test(title))
const titles = (tag?: string) => ledger(listedPosts(tag).map((note) => note.title))

test("the listing holds the site's posts, newest first", () => {
  expect(titles()).toEqual(["Ledger Six", "Ledger Five", "Ledger Four", "Ledger Three", "Ledger Two", "Ledger One"])
})

test("a tag page's listing holds only the posts under its tag, a tag under it included", () => {
  expect(listedPosts("ledger").map((note) => note.title)).toEqual([
    "Ledger Six",
    "Ledger Five",
    "Ledger Four",
    "Ledger Three",
    "Ledger Two",
    "Ledger One",
  ])
  expect(listedPosts("ledger/accounts").map((note) => note.title)).toEqual(["Ledger Four", "Ledger Two"])
  // `ledger-book` is beside `ledger`, not under it.
  expect(listedPosts("ledger-book")).toEqual([])
})

test("a note under a private tag is in no listing", () => {
  expect(listedPosts().map((note) => note.title)).not.toContain("Locked Ledger")
  expect(listedPosts("ledger").map((note) => note.title)).not.toContain("Locked Ledger")
  expect(listedPosts("private")).toEqual([])
})

test("a tag's count is how many posts its tag page lists", () => {
  const counts = postCounts()
  expect(counts.get("ledger")).toBe(6)
  expect(counts.get("ledger/accounts")).toBe(2)
  // Carried only by a private page, so no post is under it.
  expect(counts.get("private")).toBeUndefined()
})

test("the home page is not one of its own posts", () => {
  expect(listedPosts().map((note) => note.url)).not.toContain("/")
})
