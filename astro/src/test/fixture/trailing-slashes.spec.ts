import { githubPages } from "../github-pages.ts"
import { expect, expectAt, test } from "../site.ts"

// Each page is a file of the build, `a.html`, and GitHub Pages answers `/a/` only from `a/index.html`,
// so each address with a trailing slash has a redirect there of its own (src/lib/trailing-slashes.ts).
// Whether Pages reaches it is read from the build's file names (../github-pages.ts).
//
// Not checked here: a page whose former address differs from its own only in case, as
// /former-addresses/Weekly-Note's does. Its former address's redirect is its lower-case folder's
// index, and on a disk that ignores case, as a Mac's does, that is the file the trailing slash's
// redirect would be, so the build writes one folder. The deploy builds on Linux, which writes both.

test("a page's address with a trailing slash is where GitHub Pages finds a redirect to the page, in one step", () => {
  const pages = githubPages("fixture")
  const slashed = {
    "/aliases/renamed/": "/aliases/renamed",
    "/former-addresses/moved/": "/former-addresses/moved",
    "/tags/rosarian/": "/tags/rosarian",
    "/tags/rosarian/climbers/": "/tags/rosarian/climbers",
    "/graph/": "/graph",
    // An alias's, straight to the alias's note.
    "/archive/old-name/": "/aliases/renamed",
  }
  for (const [from, to] of Object.entries(slashed)) {
    expect(pages.serve(from)?.forwardsTo, from).toBe(to)
    expect(pages.landing(from)?.forwardsTo, `${from} forwards only once`).toBeUndefined()
  }
})

test("the pages at their own addresses stay what they are", () => {
  const pages = githubPages("fixture")
  for (const address of ["/aliases/renamed", "/tags/rosarian", "/graph"]) {
    expect(pages.serve(address), address).toMatchObject({ forwardsTo: undefined })
  }
})

test("a reader at a page's address with a trailing slash is taken to the page", async ({ page }) => {
  await page.goto("/aliases/renamed/")
  await expectAt(page, "/aliases/renamed")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Renamed")
})
