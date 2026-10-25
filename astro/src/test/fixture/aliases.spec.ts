import { expect, expectAt, test } from "../site.ts"

// The fixture vault's aliases/renamed.md has the aliases `aliases/Old Name` and `archive/old-name`,
// and four that are taken: `content/notes/alpha`, a note's page, `404`, a page of the site,
// `drawings/drawings/single.svg`, a drawing's export, and `robots.txt`, a file of public/.

test("each alias of a note is an address that forwards the reader to the note", async ({ page, externalRequests }) => {
  for (const alias of ["/archive/old-name", "/aliases/Old-Name"]) {
    await page.goto(alias)
    await expectAt(page, /\/aliases\/renamed$/)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Renamed")
  }
  expect(externalRequests).toEqual([])
})

test("an alias redirect asks not to be indexed, and names the note as the page it stands for", async ({ request }) => {
  const html = await (await request.get("/archive/old-name")).text()
  expect(html).toContain('<meta name="robots" content="noindex">')
  expect(html).toContain('<link rel="canonical" href="https://blog.chaoticgood.computer/aliases/renamed">')
})

test("an alias that is the address of a page leaves the page where it is", async ({ page }) => {
  await page.goto("/content/notes/alpha")
  await expectAt(page, /\/content\/notes\/alpha$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Alpha")

  const response = await page.goto("/404")
  await expectAt(page, /\/404$/)
  expect(await response!.text()).not.toContain('http-equiv="refresh"')
})

test("an alias that is the address of a file the site publishes leaves the file where it is", async ({ request }) => {
  const drawing = await request.get("/drawings/drawings/single.svg")
  expect(drawing.status()).toBe(200)
  expect(drawing.headers()["content-type"]).toContain("image/svg+xml")
  expect(await drawing.text()).toMatch(/^<svg /)

  const robots = await request.get("/robots.txt")
  expect(await robots.text()).toContain("Sitemap: https://blog.chaoticgood.computer/sitemap.xml")
})

test("a wikilink written to an alias links to the note itself", async ({ page }) => {
  await page.goto("/aliases/links")
  const prose = page.locator(".prose")
  await expect(prose.getByRole("link", { name: "archive/old-name" })).toHaveAttribute("href", "/aliases/renamed")
  await expect(prose.getByRole("link", { name: "where it went" })).toHaveAttribute(
    "href",
    "/aliases/renamed#where-it-went",
  )

  await prose.getByRole("link", { name: "archive/old-name" }).click()
  await expectAt(page, /\/aliases\/renamed$/)
})

// The sitemap and the feed list what the notes query lists, which holds no alias redirect
// (test/aliases.test.ts).
test("no alias redirect is in the sitemap or the feed", async ({ request }) => {
  for (const file of ["/sitemap-0.xml", "/index.xml"]) {
    const response = await request.get(file)
    expect(response.status(), file).toBe(200)
    const body = await response.text()
    expect(body, file).not.toContain("/archive/old-name")
    expect(body, file).not.toContain("/aliases/Old-Name")
  }
})
