// cgc-backlinks' options, on scratch sites: the content fixture keeps the site's own settings. The
// private tags are the plugin's own option, as cgc-seo's are, so it needs no tag engine (#44, #53
// story 39), and so is the icon it marks them with.
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, fixtureConfig, withPlugins } from "../../../tests/harness/site.mjs"

const ORIGIN = "https://cgc-backlinks.test"

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nHome.\n",
  "target.md": "---\ntitle: Target\n---\nLinked from the pages below.\n",
  "secret.md": "---\ntitle: Secret source\ntags: [secret]\n---\nLinks to [[target]].\n",
  "secret-child.md":
    "---\ntitle: Secret child source\ntags: [secret/deeper]\n---\nLinks to [[target]].\n",
  "private.md": "---\ntitle: Private source\ntags: [private]\n---\nLinks to [[target]].\n",
}

const backlinksWith = (options) =>
  withPlugins(fixtureConfig(), [
    {
      source: "../../plugins/cgc-backlinks",
      enabled: true,
      options,
      layout: { position: "right", priority: 50 },
    },
  ])

test.describe("with its own private tags and icon, shown on every page", () => {
  // One build per colour-scheme project, shared by that project's tests.
  test.describe.configure({ mode: "serial" })

  let site
  test.beforeAll(async () => {
    test.setTimeout(180_000)
    site = await buildScratchSite("backlinks-options", CONTENT, {
      config: backlinksWith({
        privateTags: ["secret"],
        privateIcon: "custom:diamond",
        // The fixture's own collection, resolved against the scratch root as a local `source:` is.
        iconCollections: { custom: "../fixture-icons" },
        hideWhenEmpty: false,
      }),
      keep: true,
    })
    expect(site.code, site.output).toBe(0)
  })
  test.afterAll(() => site?.remove())

  const link = (page, name) => page.locator(".cgc-backlinks__link", { hasText: name })

  test("marks the pages carrying the tags it is given, and their descendants, and no others", async ({
    page,
  }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/target`)
    for (const name of ["Secret source", "Secret child source"])
      await expect(link(page, name), name).toHaveClass(/\bcgc-backlinks__link--private\b/)
    // `private` is only the default.
    await expect(link(page, "Private source")).not.toHaveClass(/--private/)
    await expect(link(page, "Private source").locator("svg")).toHaveCount(0)
  })

  test("marks them with the icon it is given, from the site's own collection", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/target`)
    // The fixture's diamond, 20px square in a 24px box.
    const box = await link(page, "Secret source")
      .locator("svg")
      .evaluate((svg) => {
        const { x, y, width, height } = svg.getBBox()
        return { x, y, width, height }
      })
    expect(box).toEqual({ x: 2, y: 2, width: 20, height: 20 })
  })

  test("says so on a page no page links to, when it is not to leave the section out", async ({
    page,
  }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/secret`)
    await expect(page.locator(".cgc-backlinks__heading")).toHaveText("Backlinks")
    await expect(page.locator(".cgc-backlinks__list")).toHaveText("No backlinks found")
    await expect(page.locator(".cgc-backlinks__link")).toHaveCount(0)
  })
})

// A misspelt icon id fails the build, where v4 logged a warning in the reader's console (#53 story
// 34), whether or not any page has a private backlink to mark: here, none has.
test("fails the build on a private icon no collection has", async () => {
  const { "private.md": _, ...publicOnly } = CONTENT
  const { code, output } = await buildScratchSite("backlinks-icon", publicOnly, {
    config: backlinksWith({ privateIcon: "mdi:no-such-lock" }),
  })
  expect(code).not.toBe(0)
  expect(output).toContain(
    'cgc-backlinks: privateIcon: unknown icon "mdi:no-such-lock": the "mdi" collection has no icon "no-such-lock"',
  )
})
