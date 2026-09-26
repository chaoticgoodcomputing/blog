// Consumers declare an engine by its plugin name (ADR-0002's plugin-name amendment, #40): one
// string, `dependencies: ["cgc-styles"]`, that holds at every site, although the engine's `source:`
// differs by where the site runs. Stock Quartz matches a dependency only against the exact source
// string, so this rests on a vendored change to the loader (#47, VENDORED.md): a dependency resolves
// by exact source first, then by plugin name, and the presence, order and cycle checks all use the
// entry it resolves to.
//
// The consumer is a fixture plugin, `fixture-consumer`: it writes into `cgc.fixture-consumer` from
// `externalResources()`. Its default order, 20, sits above cgc-styles' 15 and below the loader's
// fallback of 50, so a build that reads the engine's order anywhere but its own manifest refuses it.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { test, expect, layerOrder, routeSite } from "../harness/test.mjs"
import { buildScratchSite, fixtureConfig, pluginSources, siteConfig, testsRoot, withPlugins } from "../harness/site.mjs"

const CONSUMER_DIR = path.join(testsRoot, "fixture-plugins/fixture-consumer")
const CONSUMER = "../fixture-plugins/fixture-consumer"
const ENGINE = "cgc-styles"
const HOME = { "index.md": "# Home\n" }

test("the consumer names the engine by plugin name, not by either site's source", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(CONSUMER_DIR, "package.json"), "utf8")).quartz
  expect(manifest.dependencies).toEqual([ENGINE])
  expect(pluginSources(fixtureConfig())).toContain(`../../plugins/${ENGINE}`)
})

test("the consumer's dependency resolves by name at the fixture root", async ({ page }) => {
  await page.goto("/plain-note")
  expect((await layerOrder(page)).cgc).toContain("fixture-consumer")
})

// The real site runs from the vendored root, `quartz-v5/quartz/`, so its config names the engine
// `../plugins/cgc-styles`. A scratch root made beside the vendored copy resolves the site config's
// sources exactly as the real site does, and the consumer is added to it there.
test("the consumer's dependency resolves by name at the real site root", async ({ page }) => {
  const config = siteConfig({ at: "site" })
  expect(pluginSources(config)).toContain(`../plugins/${ENGINE}`)
  const site = await buildScratchSite("site-root", HOME, {
    at: "site",
    config: withPlugins(config, [{ source: "../tests/fixture-plugins/fixture-consumer", enabled: true }]),
    keep: true,
  })
  try {
    expect(site.code, site.output).toBe(0)
    const origin = "https://blog.chaoticgood.computer"
    await routeSite(page, site.public, origin)
    await page.goto(`${origin}/`)
    expect((await layerOrder(page)).cgc).toContain("fixture-consumer")
  } finally {
    site.remove()
  }
})

// Builds that must be refused. Each fails while the loader validates the config, before any page.

test("a consumer ordered before cgc-styles is refused", async () => {
  const { code, output } = await buildScratchSite("consumer-first", HOME, {
    config: withPlugins(fixtureConfig(), [{ source: CONSUMER, enabled: true, order: 10 }]),
  })
  expect(code).not.toBe(0)
  // The engine's order is its own default, read through the entry its name resolved to.
  expect(output).toContain(`(order: 10) depends on "${ENGINE}" (order: 15)`)
})

test("a consumer whose engine is not enabled is refused", async () => {
  const { code, output } = await buildScratchSite("engine-missing", HOME, {
    config: withPlugins(fixtureConfig(), [{ source: `../../plugins/${ENGINE}`, enabled: false }]),
  })
  expect(code).not.toBe(0)
  expect(output).toContain(`requires "${ENGINE}"`)
})

// Throwaway plugins for the cases no real package has: CSS-less transformers, written outside the
// repo and loaded by absolute source, whose name is their directory's.
function scratchPlugins(manifests) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-scratch-plugins-"))
  const entries = Object.entries(manifests).map(([name, manifest]) => {
    fs.mkdirSync(path.join(dir, name))
    const quartz = { name, category: "transformer", dependencies: [], defaultEnabled: true, ...manifest }
    const pkg = { name, version: "0.0.0", type: "module", exports: { ".": "./index.js" }, quartz }
    fs.writeFileSync(path.join(dir, name, "package.json"), JSON.stringify(pkg))
    fs.writeFileSync(path.join(dir, name, "index.js"), "export default () => ({ name: 'Scratch', textTransform: (_ctx, src) => src })\n")
    return { source: path.join(dir, name), enabled: true }
  })
  return { entries, remove: () => fs.rmSync(dir, { recursive: true, force: true }) }
}

// #40's other requirement: resolving by name is additive. A dependency written as the engine's
// exact `source:` string still resolves to that entry first, as on stock Quartz, so upstream configs
// behave as before. Name-only resolution would miss it and refuse the build as missing its engine.
test("a dependency written as the engine's exact source resolves to it", async () => {
  const plugins = scratchPlugins({ "source-consumer": { defaultOrder: 20, dependencies: [`../../plugins/${ENGINE}`] } })
  try {
    const { code, output } = await buildScratchSite("exact-source", HOME, { config: withPlugins(fixtureConfig(), plugins.entries) })
    expect(code, output).toBe(0)
  } finally {
    plugins.remove()
  }
})

// And the order check reads the engine's manifest through that exact-source key, not the fallback.
test("a consumer ordered before the engine it names by exact source is refused", async () => {
  const plugins = scratchPlugins({ "source-consumer": { defaultOrder: 10, dependencies: [`../../plugins/${ENGINE}`] } })
  try {
    const { code, output } = await buildScratchSite("exact-source-first", HOME, { config: withPlugins(fixtureConfig(), plugins.entries) })
    expect(code).not.toBe(0)
    expect(output).toContain(`(order: 10) depends on "${ENGINE}" (order: 15)`)
  } finally {
    plugins.remove()
  }
})

// #40's warning: had only the presence check learned names, the order check would read the engine's
// manifest by the raw string, miss, and fall back to order 50. An engine whose own order is above
// 50 would then let a consumer run in front of it, silently.
test("a consumer ordered before an engine whose default order is above 50 is refused", async () => {
  const plugins = scratchPlugins({
    "late-engine": { defaultOrder: 60 },
    "early-consumer": { defaultOrder: 55, dependencies: ["late-engine"] },
  })
  try {
    const { code, output } = await buildScratchSite("late-engine", HOME, { config: withPlugins(fixtureConfig(), plugins.entries) })
    expect(code).not.toBe(0)
    expect(output).toContain('(order: 55) depends on "late-engine" (order: 60)')
  } finally {
    plugins.remove()
  }
})

// Equal orders pass the order check, so only the cycle check can catch this, and only if its graph
// follows names to the entries they resolve to.
test("two plugins that name each other as dependencies are refused", async () => {
  const plugins = scratchPlugins({
    "cycle-a": { defaultOrder: 50, dependencies: ["cycle-b"] },
    "cycle-b": { defaultOrder: 50, dependencies: ["cycle-a"] },
  })
  try {
    const { code, output } = await buildScratchSite("name-cycle", HOME, { config: withPlugins(fixtureConfig(), plugins.entries) })
    expect(code).not.toBe(0)
    expect(output).toContain("Circular dependency detected: cycle-a → cycle-b → cycle-a")
  } finally {
    plugins.remove()
  }
})
