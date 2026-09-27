// The family layer's position (ADR-0003's family-layer amendment, #30). quartz-styles emits
// `@layer cgc;` and nothing else, so the first place the name `cgc` appears on a page, and with it
// the family's rank, is wherever this plugin's `order` puts its stylesheet.
import { test, expect, layerOrder, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, fixtureConfig, withPlugins } from "../../../tests/harness/site.mjs"

// The stylesheets on the page that say nothing but `@layer cgc;`, as the browser parsed them.
const familyStatements = (page) =>
  page.evaluate(() =>
    [...document.styleSheets]
      .filter((sheet) => {
        let rules
        try {
          rules = [...sheet.cssRules]
        } catch {
          return false // cross-origin, such as a font CDN's
        }
        return rules.length === 1 && rules[0] instanceof CSSLayerStatementRule && rules[0].nameList.join() === "cgc"
      })
      .map((sheet) => sheet.href),
  )

test("emits `@layer cgc;` and nothing else, on every page", async ({ page }) => {
  for (const url of ["/", "/plain-note", "/tags/fixture"]) {
    await page.goto(url)
    expect(await familyStatements(page), url).toHaveLength(1)
  }
})

test("the family layer ranks above core's quartz-base", async ({ page }) => {
  await page.goto("/plain-note")
  const top = (await layerOrder(page))[""]
  expect(top).toContain("quartz-base")
  expect(top.indexOf("cgc")).toBeGreaterThan(top.indexOf("quartz-base"))
})

// A theme ranks wherever its `order` puts its first layer statement. The fixture carries no theme,
// and the real `@quartz-themes/core` must never run in one (it installs into Quartz Core), so
// a stand-in emits the real theme's statement at the real theme's default order, 10. It is listed
// after quartz-styles in the YAML, which changes nothing: position follows `order`.
const THEME = "../fixture-plugins/fixture-theme"
const THEME_LAYERS = ["obsidian-theme", "quartz-themes-base", "obsidian-theme-overrides"]

test("the family layer ranks above a theme's layers", async ({ page }) => {
  const site = await buildScratchSite("family-over-theme", { "index.md": "# Home\n" }, {
    config: withPlugins(fixtureConfig(), [{ source: THEME, enabled: true }]),
    keep: true,
  })
  try {
    expect(site.code, site.output).toBe(0)
    await routeSite(page, site.public, "https://fixture.invalid")
    await page.goto("https://fixture.invalid/")
    const top = (await layerOrder(page))[""]
    for (const layer of THEME_LAYERS) {
      expect(top, layer).toContain(layer)
      expect(top.indexOf("cgc"), `cgc above ${layer}`).toBeGreaterThan(top.indexOf(layer))
    }
  } finally {
    site.remove()
  }
})
