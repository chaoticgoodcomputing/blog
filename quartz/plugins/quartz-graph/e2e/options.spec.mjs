// quartz-graph's options are checked when the site builds, and a mistake fails the build (ADR-0003's
// colour-value amendment): a colour option must be a CSS colour, whether a hex, a theme reference or
// a `light-dark()` pair, and an option must be one the plugin has.
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, editConfig, fixtureConfig } from "../../../tests/harness/site.mjs"
import { bubblePaint, drawnGraph, localGraph } from "./graph.mjs"

// A sharper canvas, so a bubble's rim is whole pixels.
test.use({ deviceScaleFactor: 2 })

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nSee [[secret]].\n",
  "secret.md": "---\ntitle: Secret\ntags: [private]\n---\nA private page.\n",
}

// The fixture's config, with quartz-graph's options replaced.
const withOptions = (options) =>
  editConfig(fixtureConfig(), (doc, entry) => entry("@chaoticgoodcomputing/quartz-graph").set("options", doc.createNode(options)))

test("fails the build on a colour CSS can't read", async () => {
  const { code, output } = await buildScratchSite("graph-bad-colour", CONTENT, {
    config: withOptions({ localGraph: { nodeColors: { private: "not-a-colour" } } }),
  })
  expect(code).not.toBe(0)
  expect(output).toContain("cgc-graph")
  expect(output).toContain("localGraph.nodeColors.private")
})

test("fails the build on an option it doesn't have", async () => {
  const { code, output } = await buildScratchSite("graph-bad-option", CONTENT, {
    config: withOptions({ privateTag: ["private"] }),
  })
  expect(code).not.toBe(0)
  expect(output).toContain('unknown option "privateTag"')
})

test("fails the build on icon collections that aren't directories by prefix", async () => {
  const { code, output } = await buildScratchSite("graph-bad-collections", CONTENT, {
    config: withOptions({ iconCollections: ["../fixture-icons"] }),
  })
  expect(code).not.toBe(0)
  expect(output).toContain("cgc-graph: iconCollections must map each prefix to a directory")
})

// An icon id the tag dictionary names and no collection has: the graph draws every icon a tag in the
// site carries when it builds, and fails rather than draw a node without one (#29). The tag list and
// the post listing, which fail the same way, are off, so the failure is the graph's own.
test("fails the build on an icon no collection has", async () => {
  const config = editConfig(withOptions({ privateTags: ["private"] }), (doc, entry) => {
    entry("@chaoticgoodcomputing/quartz-tags").setIn(["options", "tags"], doc.createNode({ private: { icon: "mdi:no-such-icon" } }))
    entry("@chaoticgoodcomputing/quartz-tag-list").set("enabled", false)
    entry("@chaoticgoodcomputing/quartz-post-listing").set("enabled", false)
  })
  const { code, output } = await buildScratchSite("graph-unknown-icon", CONTENT, { config })
  expect(code).not.toBe(0)
  expect(output).toContain(
    'cgc-graph: tag "private": unknown icon "mdi:no-such-icon": the "mdi" collection has no icon "no-such-icon"',
  )
})

// Inside each graph's settings too: v4's leftovers, which the plugin dropped, a layout it doesn't
// have, and a mistyped ring setting all fail the build, naming the setting.
const BAD_SETTINGS = {
  "localGraph.labelAnchor": { localGraph: { labelAnchor: { baseY: 0.5 } } },
  "globalGraph.graphStyle": { globalGraph: { graphStyle: "shell" } },
  "globalGraph.pseudoShellConfig.shellStyle.colour": {
    globalGraph: { pseudoShellConfig: { shellStyle: { colour: "red" } } },
  },
}

for (const [where, options] of Object.entries(BAD_SETTINGS)) {
  test(`fails the build on a graph setting it doesn't have: ${where}`, async () => {
    const { code, output } = await buildScratchSite("graph-bad-setting", CONTENT, {
      config: withOptions(options),
    })
    expect(code).not.toBe(0)
    expect(output).toContain("cgc-graph")
    expect(output).toContain(where)
  })
}

// A per-kind map the site writes in part keeps the defaults for the kinds it leaves out.
test("fills a per-kind setting's missing kinds from the defaults", async ({ page }) => {
  const site = await buildScratchSite("graph-partial-map", CONTENT, {
    config: withOptions({
      localGraph: { linkDistance: { tagTag: 10 }, baseSize: { posts: 7 } },
    }),
    keep: true,
  })
  try {
    expect(site.code, site.output).toBe(0)
    await routeSite(page, site.public, "https://localhost")
    await page.goto("https://localhost/")
    const cfg = await localGraph(page).evaluate((el) => JSON.parse(el.dataset.cfg))
    expect(cfg.linkDistance).toEqual({ tagTag: 10, tagPost: 30, postPost: 50 })
    expect(cfg.baseSize).toEqual({ tags: 4, posts: 7 })
  } finally {
    site.remove()
  }
})

// A colour value in each form a site can write it: a theme's reference, which follows the theme; a
// `light-dark()` pair, which follows the scheme; and a `color()`, whose computed value isn't `rgb()`,
// which the colour resolver takes through its normalising path and the reader still sees painted in
// that colour. (Chromium's canvas takes `color()` as it is, so this proves the paint, not the
// resolver's `rgba()` return shape, which is internal to the runtime.) The private page is a bubble
// (#83), so the site's colour rims it in place of its tag's: the `private` tag's, the theme's
// `darkgray` by default, which none of them is. The tag's own node is left out, as the real site
// leaves it out.
const PRIVATE = {
  "var(--dark)": { light: [43, 43, 43], dark: [235, 235, 236] },
  "light-dark(#b83232, #e06060)": { light: [184, 50, 50], dark: [224, 96, 96] },
  "color(srgb 0 0.5 1)": { light: [0, 128, 255], dark: [0, 128, 255] },
}

for (const [value, rgb] of Object.entries(PRIVATE)) {
  test(`rims private pages in ${value}`, async ({ page, colorScheme }) => {
    const site = await buildScratchSite("graph-private-colour", CONTENT, {
      config: withOptions({
        privateTags: ["private"],
        localGraph: {
          nodeColors: { private: value },
          removeTags: ["private"],
          // Nodes big enough to read a rim from.
          baseSize: { tags: 10, posts: 10 },
        },
      }),
      keep: true,
    })
    try {
      expect(site.code, site.output).toBe(0)
      await routeSite(page, site.public, "https://localhost")
      await page.goto("https://localhost/")
      expect((await drawnGraph(localGraph(page))).secret.private).toBe(true)
      await expect
        .poll(async () => (await bubblePaint(localGraph(page), "Secret")).rim)
        .toEqual(rgb[colorScheme])
    } finally {
      site.remove()
    }
  })
}
