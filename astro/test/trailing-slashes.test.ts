import { expect, test } from "vitest"
import { getTrailingSlashRedirects, trailingSlashRedirects } from "../src/lib/trailing-slashes.ts"

test("each page's address with a trailing slash forwards to the page, from its folder's index", () => {
  expect(trailingSlashRedirects(["/notes/plain", "/tags/garden", "/Move-to-Boston/Timeline"])).toEqual({
    "/notes/plain/index": "/notes/plain",
    "/tags/garden/index": "/tags/garden",
    "/Move-to-Boston/Timeline/index": "/Move-to-Boston/Timeline",
  })
})

test("a redirect's address with a trailing slash forwards straight to where the redirect does", () => {
  expect(trailingSlashRedirects([], { "/archive/old-name": "/notes/moved" })).toEqual({
    "/archive/old-name/index": "/notes/moved",
  })
})

test("the home page, the 404 page, a folder's index and a file's address get none", () => {
  const redirects = { "/tags/index": "/tags", "/notes/a.mdx": "/notes/a" }
  expect(trailingSlashRedirects(["/", "/404", "/graph.json", "/index.xml"], redirects)).toEqual({})
})

test("a folder index another redirect has, by a name that differs only in case, is left to it", () => {
  // The former address of /weekly/2026-W06, in lower case, is already the folder index's redirect.
  const redirects = { "/weekly/2026-w06/index": "/weekly/2026-W06", "/elsewhere/index": "/notes/other" }
  expect(trailingSlashRedirects(["/weekly/2026-W06", "/Elsewhere"], redirects)).toEqual({
    "/weekly/2026-W06/index": "/weekly/2026-W06",
  })
})

// The site's own notes are the fixture vault's (vitest.config.ts).

test("the site's trailing-slash redirects cover its notes' pages, its tags' pages and its other pages", () => {
  const redirects = getTrailingSlashRedirects(["/graph"], { "/archive/old-name": "/aliases/renamed" })
  expect(redirects).toMatchObject({
    "/aliases/renamed/index": "/aliases/renamed",
    "/archive/old-name/index": "/aliases/renamed",
    "/graph/index": "/graph",
  })
  expect(Object.keys(redirects).some((route) => route.startsWith("/tags/"))).toBe(true)
})
