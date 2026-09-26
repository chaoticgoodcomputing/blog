// cgc-graph's options are checked when the site builds, and a mistake fails the build (ADR-0003's
// colour-value amendment): a colour option must be a CSS colour, whether a hex, a theme reference or
// a `light-dark()` pair, and an option must be one the plugin has.
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, editConfig, fixtureConfig } from "../../../tests/harness/site.mjs"
import { drawnGraph, localGraph } from "./graph.mjs"

const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nSee [[secret]].\n",
  "secret.md": "---\ntitle: Secret\ntags: [private]\n---\nA private page.\n",
}

// The fixture's config, with cgc-graph's options replaced.
const withOptions = (options) =>
  editConfig(fixtureConfig(), (doc, entry) => entry("../../plugins/cgc-graph").set("options", doc.createNode(options)))

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
    entry("../../plugins/cgc-tags").setIn(["options", "tags"], doc.createNode({ private: { icon: "mdi:no-such-icon" } }))
    entry("../../plugins/cgc-tag-list").set("enabled", false)
    entry("../../plugins/cgc-post-listing").set("enabled", false)
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

// A colour value in each form a site can write it: a theme's reference, which follows the theme, and
// a `light-dark()` pair, which follows the scheme. Nothing else in the graph is drawn in either: the
// `private` tag, whose default colour is the theme's `darkgray`, is left out, as the real site leaves
// it out.
const PRIVATE = {
  "var(--darkgray)": { light: [78, 78, 78], dark: [212, 212, 212] },
  "light-dark(#b83232, #e06060)": { light: [184, 50, 50], dark: [224, 96, 96] },
}

for (const [value, rgb] of Object.entries(PRIVATE)) {
  test(`draws private pages in ${value}`, async ({ page, colorScheme }) => {
    const site = await buildScratchSite("graph-private-colour", CONTENT, {
      config: withOptions({
        privateTags: ["private"],
        localGraph: { nodeColors: { private: value }, removeTags: ["private"] },
      }),
      keep: true,
    })
    try {
      expect(site.code, site.output).toBe(0)
      await routeSite(page, site.public, "https://localhost")
      await page.goto("https://localhost/")
      expect((await drawnGraph(localGraph(page))).secret.private).toBe(true)
      const count = () =>
        localGraph(page)
          .locator(".cgc-graph__canvas")
          .evaluate((canvas, [r, g, b]) => {
            const data = canvas
              .getContext("2d")
              .getImageData(0, 0, canvas.width, canvas.height).data
            let n = 0
            for (let i = 0; i < data.length; i += 4)
              if (data[i] === r && data[i + 1] === g && data[i + 2] === b && data[i + 3] === 255)
                n++
            return n
          }, rgb[colorScheme])
      await expect.poll(count).toBeGreaterThan(10)
    } finally {
      site.remove()
    }
  })
}
