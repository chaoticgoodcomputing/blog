import { expect, test } from "vitest"
import { listingsOn } from "../src/lib/post-listing.ts"
import type { PostListingConfig } from "../src/site.config.types.ts"

// One set of listings, set out differently on each kind of page.
const config: PostListingConfig = {
  listings: [
    { order: "recent", title: "Recent" },
    { order: "central", title: "Central", show: 4 },
  ],
  pages: {
    home: { layout: "stacked", paging: { recent: { show: 2 } } },
    tag: { layout: "carousel" },
    404: { layout: "carousel", paging: { central: { more: 10 } } },
  },
  mentionWeight: 3,
  showTagCounts: false,
  emptyText: "None.",
}
const defaults = { show: 5, more: 3 }
const paging = (kind: "home" | "tag" | "404") =>
  listingsOn(kind, config, defaults).listings.map(({ show, more }) => [show, more])

test("every kind of page has the same listings, in the same order, set out as it says", () => {
  for (const kind of ["home", "tag", "404"] as const) {
    expect(listingsOn(kind, config, defaults).listings.map((listing) => [listing.order, listing.title])).toEqual([
      ["recent", "Recent"],
      ["central", "Central"],
    ])
  }
  expect(listingsOn("home", config, defaults).layout).toBe("stacked")
  expect(listingsOn("tag", config, defaults).layout).toBe("carousel")
})

test("a listing's paging is the page's, else the listing's, else every list's, a setting at a time", () => {
  expect(paging("home")).toEqual([[2, 3], [4, 3]])
  expect(paging("tag")).toEqual([[5, 3], [4, 3]])
  expect(paging("404")).toEqual([[5, 3], [4, 10]])
})

test("a kind of page may retitle a listing and narrow it to a tag; the others keep it as it is", () => {
  const narrowed: PostListingConfig = {
    ...config,
    pages: { ...config.pages, home: { ...config.pages.home, listings: { central: { title: "Core Essays", tag: "writing/essays" } } } },
  }
  const home = listingsOn("home", narrowed, defaults).listings
  expect(home.map(({ title, tag }) => [title, tag])).toEqual([
    ["Recent", undefined],
    ["Core Essays", "writing/essays"],
  ])
  expect(listingsOn("tag", narrowed, defaults).listings.map(({ title, tag }) => [title, tag])).toEqual([
    ["Recent", undefined],
    ["Central", undefined],
  ])
})
