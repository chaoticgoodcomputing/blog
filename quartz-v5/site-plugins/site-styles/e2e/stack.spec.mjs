// The guard on the site's cascade (ADR-0003's site-plugin amendment, #39): site-styles emits the
// stack declaration ahead of every other named layer, so the page's layers rank exactly as the
// stack lists them, with the site's five ITCSS tiers last of all. No fixture config loads the
// plugin, so it is proven on a scratch site: the fixture's config plus site-styles, and a probe
// standing in for a family plugin, whose `cgc` sublayer would rank below `quartz-fonts` if the
// stack were not declared first.
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test, expect, layerOrder, routeSite, stackDeclaration } from "../../../tests/harness/test.mjs"
import { buildScratchSite, fixtureConfig, withPlugins } from "../../../tests/harness/site.mjs"
import { buildProbePlugin } from "../../../tests/harness/probe.mjs"

// The stack the site's config loads (#39): core, the fonts plugin, the family, the site.
const STACK = ["quartz-base", "quartz-fonts", "cgc", "site"]
// v4's ITCSS tiers, every one kept even where the port leaves it empty.
const TIERS = ["generic", "elements", "objects", "components", "utilities"]

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome.\n",
  "a-note.md": "---\ntitle: A note\ntags: [topic]\n---\n## A heading\n\nA paragraph with **strong** text.\n",
}

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

const probeSource = path.join(path.dirname(fileURLToPath(import.meta.url)), "probe")

let site, probe
test.beforeAll(async () => {
  probe = await buildProbePlugin(probeSource, "cgc-probe", { category: "transformer", defaultOrder: 50 })
  site = await buildScratchSite("site-styles", CONTENT, {
    config: withPlugins(fixtureConfig(), [
      { source: "../../site-plugins/site-styles", enabled: true },
      { source: probe.path, enabled: true },
    ]),
    keep: true,
  })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => {
  site?.remove()
  probe?.remove()
})

// The scratch site is served from disk at an origin of its own.
const ORIGIN = "https://site-styles.invalid"
async function open(page, url) {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}${url}`)
}

test("ranks every layer on the page in the stack's order, with the site's tiers last", async ({ page }) => {
  await open(page, "/a-note")
  expect(await stackDeclaration(page)).toEqual(STACK)
  const order = await layerOrder(page)
  // Exact: a layer the stack doesn't list, or one out of place, fails here.
  expect(order[""]).toEqual(STACK)
  expect(order.site).toEqual(TIERS)
})

test("a site rule beats a more specific family rule on the same element", async ({ page }) => {
  await open(page, "/a-note")
  const quartzRoot = page.locator("#quartz-root")
  // The family probe's rule reaches the element…
  await expect(quartzRoot).toHaveCSS("--cgc-probe", "applied")
  // …and the site's page width, v4's 1300px desktop breakpoint plus 300px, still wins over it.
  await expect(quartzRoot).toHaveCSS("max-width", "1600px")
})

test("fails on a layer the stack doesn't list, wherever it first appears", async ({ page }) => {
  await open(page, "/a-note")
  // A stylesheet late in the page, as a theme's or a stray plugin's would be.
  await page.addStyleTag({ content: "@layer rogue { #quartz-root { outline: none } }" })
  expect((await layerOrder(page))[""]).toEqual([...STACK, "rogue"])
})

// The fixture sites stay stock by construction (#39): a plugin that looks right only because the
// site's CSS covers for it must not pass its specs, nor the no-bleed check.
test("leaves the fixture and baseline sites without the site's CSS", async ({ page, baselinePage }) => {
  for (const fixture of [page, baselinePage]) {
    await fixture.goto("/")
    const order = await layerOrder(fixture)
    expect(order[""]).not.toContain("site")
    expect(order.site).toBeUndefined()
  }
})
