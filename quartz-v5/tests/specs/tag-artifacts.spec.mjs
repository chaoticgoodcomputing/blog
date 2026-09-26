// The tag engine's consumers receive its artifacts wherever a site runs (ADR-0002, #69). Each
// consumer names the engine by plugin name, `dependencies: ["cgc-tags"]`, one string that holds at
// the fixture root, where the engine's source is `../../plugins/cgc-tags`, and at the real site's,
// where it is `../plugins/cgc-tags` (#40). The consumers read the two kinds of artifact:
//
// - cgc-tag-list paints its badges with the engine's `--cgc-tag-*` properties, from its stylesheet;
// - the fixture's `fixture-tag-reader` writes out the `fileData.cgcTags` each page received;
// - cgc-graph (#74) publishes each page's tags from its `fileData.cgcTags` in its own index.
import fs from "node:fs"
import path from "node:path"
import { test, expect, routeSite } from "../harness/test.mjs"
import {
  buildScratchSite,
  fixtureConfig,
  pluginSources,
  siteConfig,
  testsRoot,
  withPlugins,
} from "../harness/site.mjs"

const ENGINE = "cgc-tags"
const CONSUMERS = [
  path.resolve(testsRoot, "../plugins/cgc-tag-list"),
  path.resolve(testsRoot, "../plugins/cgc-graph"),
  path.join(testsRoot, "fixture-plugins/fixture-tag-reader"),
]
const ring = (page, tag) =>
  page.locator(`.cgc-tag-list__item[data-tag="${tag}"] .cgc-tag-list__ring`)

test("each consumer names the engine by plugin name", () => {
  for (const dir of CONSUMERS) {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).quartz
    expect(manifest.dependencies, dir).toContain(ENGINE)
  }
})

test("the consumers receive the engine's artifacts at the fixture root", async ({
  page,
  emitted,
}) => {
  expect(pluginSources(fixtureConfig())).toContain(`../../plugins/${ENGINE}`)
  await page.goto("/plain-note")
  // `fixture: { color: "#0a7d32" }`
  await expect(ring(page, "fixture")).toHaveCSS("border-top-color", "rgb(10, 125, 50)")
  const received = JSON.parse(emitted.read("static/fixture-tag-reader.json"))
  expect(received["plain-note"].primary.tag).toBe("fixture")
  // cgc-graph's index carries each page's tags as the engine published them.
  const graph = JSON.parse(emitted.read("static/cgcGraph.json"))
  expect(graph.pages["tag-engine/most-specific"].tags).toEqual(["fixture", "writing/essays"])
})

// The real site's tag table, where `engineering` is `light-dark(#0070cc, #008CFF)`: v4's blue as
// the dark half. `engineering/ai` has no colour of its own.
const ENGINEERING = { light: "rgb(0, 112, 204)", dark: "rgb(0, 140, 255)" }

// The real site runs from the vendored root, `quartz-v5/quartz/`. A scratch root made beside the
// vendored copy resolves the site config's sources exactly as the real site does.
test("the consumers receive the engine's artifacts at the real site root", async ({
  page,
  colorScheme,
}) => {
  const config = siteConfig({ at: "site" })
  expect(pluginSources(config)).toContain(`../plugins/${ENGINE}`)
  expect(pluginSources(config)).toContain("../plugins/cgc-tag-list")
  const site = await buildScratchSite(
    "tags-site-root",
    {
      "index.md": "---\ntitle: Home\n---\nHome.\n",
      "content/notes/a-note.md": "---\ntitle: A note\ntags: [engineering/ai]\n---\nA note.\n",
    },
    {
      at: "site",
      config: withPlugins(config, [
        { source: "../tests/fixture-plugins/fixture-tag-reader", enabled: true },
      ]),
      keep: true,
    },
  )
  try {
    expect(site.code, site.output).toBe(0)
    const origin = "https://blog.chaoticgood.computer"
    await routeSite(page, site.public, origin)
    await page.goto(`${origin}/content/notes/a-note`)
    await expect(ring(page, "engineering/ai")).toHaveCSS(
      "border-top-color",
      ENGINEERING[colorScheme],
    )
    const received = JSON.parse(
      fs.readFileSync(path.join(site.public, "static/fixture-tag-reader.json"), "utf8"),
    )
    expect(received["content/notes/a-note"].primary).toEqual({
      tag: "engineering/ai",
      color: "--cgc-tag-engineering--ai",
      icon: "mdi:robot",
    })
    const index = JSON.parse(fs.readFileSync(path.join(site.public, "static/cgcTags.json"), "utf8"))
    expect(index["engineering/ai"]).toEqual({
      color: "--cgc-tag-engineering--ai",
      icon: "mdi:robot",
    })
    const graph = JSON.parse(fs.readFileSync(path.join(site.public, "static/cgcGraph.json"), "utf8"))
    expect(graph.pages["content/notes/a-note"].tags).toEqual(["engineering/ai"])
  } finally {
    site.remove()
  }
})
