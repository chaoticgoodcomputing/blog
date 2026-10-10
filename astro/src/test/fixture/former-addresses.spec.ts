import { githubPages } from "../github-pages.ts"
import { expect, test } from "../site.ts"

// Each address the Quartz site served a page or an attachment at, where this site serves it at
// another, forwards the reader there (src/lib/former-addresses.ts, docs/adr/2901). Whether GitHub
// Pages reaches a former address's redirect is read from the build's file names (../github-pages.ts).

test("each former address is where GitHub Pages finds a redirect to the page or the attachment, in one step", () => {
  const pages = githubPages("fixture")
  const moved = {
    // An MDX note's address on the Quartz site, with `.mdx` after it.
    "/former-addresses/moved.mdx": "/former-addresses/moved",
    // A note's address in lower case, which differs from its page's only in case: the folder's index.
    "/former-addresses/weekly-note": "/former-addresses/Weekly-Note",
    // An alias's address in lower case: to the alias's note, not by way of the alias.
    "/former-addresses/old-name": "/former-addresses/renamed",
    // An attachment's path as the Quartz site slugged it.
    "/former-addresses/field-notes.txt": "/former-addresses/Field%20Notes.txt",
  }
  for (const [from, to] of Object.entries(moved)) {
    expect(pages.serve(from)?.forwardsTo, from).toBe(to)
    expect(pages.landing(from)?.forwardsTo, `${from} forwards only once`).toBeUndefined()
  }
  expect(pages.serve("/former-addresses/weekly-note")?.file).toBe("former-addresses/weekly-note/index.html")
  expect(pages.serve("/former-addresses/old-name")?.file).toBe("former-addresses/old-name/index.html")
  expect(pages.landing("/former-addresses/field-notes.txt")?.contents.toString("utf8")).toContain(
    "An attachment whose name has capitals and a space",
  )
})

test("the pages and the attachment at their own addresses stay what they are", () => {
  const pages = githubPages("fixture")
  for (const address of [
    "/former-addresses/moved",
    "/former-addresses/Weekly-Note",
    "/former-addresses/renamed",
    "/former-addresses/Field%20Notes.txt",
  ]) {
    expect(pages.serve(address), address).toMatchObject({ forwardsTo: undefined })
  }
  // The alias's own address forwards as it did.
  expect(pages.serve("/former-addresses/Old-Name")?.forwardsTo).toBe("/former-addresses/renamed")
})

test("a reader at an MDX note's former address is taken to its page", async ({ page }) => {
  await page.goto("/former-addresses/moved.mdx")
  await expect(page).toHaveURL("/former-addresses/moved")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Moved MDX")
})
