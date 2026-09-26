// cgc-tag-list on the real site (#69, #71), proven on a scratch site built from the site config, with
// pages carrying the vault's tags. The site's own icon collection, `custom:`, is its five SVG files in
// quartz-v5/icons/, which the site config names once and shares through a YAML anchor.
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig } from "../../../tests/harness/site.mjs"
import { ICON_REQUEST, ring as ringOf } from "./ring.mjs"

// The site is served at its own `baseUrl`, where Quartz points its absolute URLs.
const ORIGIN = "https://blog.chaoticgood.computer"

// Each tag the site's dictionary draws with one of its own icons, and one it draws from MDI.
const DRAWN = {
  "projects/games": "custom:d20",
  "projects/games/roblox": "custom:roblox",
  "projects/site": "custom:quartz-filled",
  "projects/undergrad": "custom:uofu",
  "engineering/ai": "mdi:robot",
}

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  "content/notes/tagged.md": `---\ntitle: Tagged\ntags: [${Object.keys(DRAWN).join(", ")}]\n---\nA note.\n`,
}

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  test.setTimeout(180_000)
  site = await buildScratchSite("tag-list-site", CONTENT, {
    config: siteConfig({ offline: true }),
    keep: true,
  })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

test("draws the site's own icons and MDI's, each in its tag's colour", async ({ page }) => {
  const requests = []
  page.on("request", (request) => requests.push(request.url()))
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/tagged`)
  for (const tag of Object.keys(DRAWN)) {
    const ring = ringOf(page, tag)
    const svg = ring.locator("svg")
    await expect(svg, tag).toHaveCount(1)
    const colour = await ring.evaluate((ring) => getComputedStyle(ring).color)
    const drawn = await svg.evaluate((svg) => {
      const { width, height } = svg.getBBox()
      const paints = [...svg.querySelectorAll("*")].flatMap((mark) => {
        const style = getComputedStyle(mark)
        return [style.fill, style.stroke].filter((paint) => paint !== "none")
      })
      return { width, height, paints: [...new Set(paints)] }
    })
    expect(drawn.width * drawn.height, `${tag} draws something`).toBeGreaterThan(0)
    expect(drawn.paints, `${tag} is painted in its tag's colour`).toEqual([colour])
  }
  // Every icon inline, as the site built the page: none fetched, even once the page has settled.
  await page.waitForLoadState("networkidle")
  expect(requests.filter((url) => ICON_REQUEST.test(url))).toEqual([])
})
