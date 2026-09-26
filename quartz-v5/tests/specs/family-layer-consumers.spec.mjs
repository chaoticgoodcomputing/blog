// Every package that writes into the family layer depends on cgc-styles, the engine that owns the
// family's position (ADR-0003's family-layer amendment; a **Consumer** in cgc-styles' CONTEXT.md).
// The loader holds a package to the engine's presence and order only if the package depends on it,
// and a package that forgets renders just the same on a site that enables the engine anyway, as the
// fixture and the real site both do. So nothing else in the suite notices one that forgets.
//
// Each config is built again with the engine switched off, and with it every plugin that depends on
// it, by name or through another plugin switched off, since the loader refuses to build a plugin
// whose dependency is missing. Any sublayer of `cgc` still on the page was opened by a package that
// doesn't depend on the engine, and rule 11's `cgc.<package>` names it. The page is a plain one:
// cgc-mdx's widget CSS reaches a page through `additionalHead`, and only a page that imports a
// widget, so it needs no engine (ADR-0003's #45 narrowing, cgc-mdx ADR-0003).
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { test, expect, routeSite } from "../harness/test.mjs"
import { layerOrder } from "../harness/layers.mjs"
import { buildScratchSite, fixtureConfig, siteConfig, testsRoot, vendored } from "../harness/site.mjs"

const YAML = createRequire(path.join(vendored, "package.json"))("yaml")
const ENGINE = "cgc-styles"
const HOME = { "index.md": "---\ntitle: Home\n---\nHome.\n" }

// A plugin entry's name, as the loader takes it: an object source's `name`, or the last segment of
// its path.
const nameOf = (source) => (typeof source === "string" ? path.basename(source) : (source.name ?? path.basename(source.repo)))
const localPath = (source) => (typeof source === "string" ? source : source.repo)

// `config` (YAML text) with the engine off, and every enabled local plugin that depends on it,
// directly or through a plugin already off. A dependency is a plugin name or an exact source, as
// the loader matches it. Both configs' local sources resolve from a scratch root beside the fixture
// roots (harness/site.mjs), and no stock plugin declares a dependency.
function withoutEngine(config) {
  const doc = YAML.parseDocument(config)
  const sourceOf = (item) => (YAML.isMap(item.get("source")) ? item.get("source").toJSON() : item.get("source"))
  const plugins = doc.get("plugins").items.flatMap((item) => {
    const source = sourceOf(item)
    if (!item.get("enabled") || !localPath(source).startsWith(".")) return []
    const manifest = path.resolve(testsRoot, ".site-scratch", localPath(source), "package.json")
    const { dependencies = [] } = JSON.parse(fs.readFileSync(manifest, "utf8")).quartz
    return [{ item, source, name: nameOf(source), dependencies }]
  })
  const named = (dep) => plugins.find(({ source }) => source === dep)?.name ?? dep
  const off = new Set([ENGINE])
  for (let grew = true; grew; ) {
    grew = false
    for (const { name, dependencies } of plugins) {
      if (off.has(name) || !dependencies.some((dep) => off.has(named(dep)))) continue
      off.add(name)
      grew = true
    }
  }
  for (const { item, name } of plugins) if (off.has(name)) item.set("enabled", false)
  return { config: String(doc), off: [...off], baseUrl: doc.getIn(["configuration", "baseUrl"]) }
}

const CONFIGS = {
  fixture: fixtureConfig,
  // Offline: nothing here depends on the typeface.
  site: () => siteConfig({ offline: true }),
}

for (const [label, configOf] of Object.entries(CONFIGS)) {
  test(`every package the ${label} config enables that writes into the family layer depends on ${ENGINE}`, async ({ page }) => {
    const { config, off, baseUrl } = withoutEngine(configOf())
    const site = await buildScratchSite(`family-layer-${label}`, HOME, { config, keep: true })
    try {
      expect(site.code, site.output).toBe(0)
      const origin = `https://${baseUrl}`
      await routeSite(page, site.public, origin)
      await page.goto(`${origin}/`)
      const layers = await layerOrder(page)
      // The page's plugin stylesheets are read: stock quartz-fonts opens its layer from one.
      expect(layers[""]).toContain("quartz-fonts")
      expect(
        layers.cgc ?? [],
        `sublayers of cgc opened with ${off.join(", ")} off: each package they name must list "${ENGINE}" in manifest.dependencies`,
      ).toEqual([])
    } finally {
      site.remove()
    }
  })
}
