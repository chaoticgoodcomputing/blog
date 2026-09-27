// Consumers declare an engine by its plugin name (ADR-0002's plugin-name amendment, #40): one
// string that holds at every site. Since the engines became packages (#95) that name is the engine's
// package name, `dependencies: ["@chaoticgoodcomputing/quartz-styles"]`, which is also its `source:`
// at every site, so Quartz matches it as it matches any package source: by the whole package name.
// A local source differs by where the site runs, so a dependency on a plugin listed by one rests on a
// vendored change to the loader (#47, VENDORED.md): a dependency resolves by exact source first, then
// by plugin name, and the presence, order and cycle checks all use the entry it resolves to. The
// scratch plugins below, loaded by local path, prove that half.
//
// The consumer is a fixture plugin, `fixture-consumer`: it writes into `cgc.fixture-consumer` from
// `externalResources()`. Its default order, 20, sits above quartz-styles' 15 and below the loader's
// fallback of 50, so a build that reads the engine's order anywhere but its own manifest refuses it.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { test, expect, layerOrder, routeSite } from "../harness/test.mjs"
import { buildScratchSite, fixtureConfig, pluginSources, siteConfig, testsRoot, withPlugins } from "../harness/site.mjs"

const CONSUMER_DIR = path.join(testsRoot, "fixture-plugins/fixture-consumer")
const CONSUMER = "../fixture-plugins/fixture-consumer"
const ENGINE = "@chaoticgoodcomputing/quartz-styles"
const HOME = { "index.md": "# Home\n" }

test("the consumer names the engine by its package name, the source both sites list it by", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(CONSUMER_DIR, "package.json"), "utf8")).quartz
  expect(manifest.dependencies).toEqual([ENGINE])
  expect(pluginSources(fixtureConfig())).toContain(ENGINE)
  expect(pluginSources(siteConfig())).toContain(ENGINE)
})

test("the consumer's dependency resolves by name at the fixture root", async ({ page }) => {
  await page.goto("/plain-note")
  expect((await layerOrder(page)).cgc).toContain("fixture-consumer")
})

// The real site runs from Quartz Core's root, `quartz-v5/core/`. Every source in its config is a
// package name (#96), which resolves the same from any root, so a scratch site built from the site
// config resolves them exactly as the real site does. The consumer is added to it.
test("the consumer's dependency resolves by name at the real site root", async ({ page }) => {
  const config = siteConfig()
  const site = await buildScratchSite("site-root", HOME, {
    config: withPlugins(config, [{ source: CONSUMER, enabled: true }]),
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

test("a consumer ordered before the styles engine is refused", async () => {
  const { code, output } = await buildScratchSite("consumer-first", HOME, {
    config: withPlugins(fixtureConfig(), [{ source: CONSUMER, enabled: true, order: 10 }]),
  })
  expect(code).not.toBe(0)
  // The engine's order is its own default, read through the entry its name resolved to.
  expect(output).toContain(`(order: 10) depends on "${ENGINE}" (order: 15)`)
})

test("a consumer whose engine is not enabled is refused", async () => {
  const { code, output } = await buildScratchSite("engine-missing", HOME, {
    config: withPlugins(fixtureConfig(), [{ source: ENGINE, enabled: false }]),
  })
  expect(code).not.toBe(0)
  expect(output).toContain(`requires "${ENGINE}"`)
})

// Throwaway plugins for the cases no real package has: CSS-less transformers, written outside the
// repo and loaded by absolute source, whose name is their directory's. `manifests` may be a function
// of the directory they are written to, for a manifest that names another by its exact source.
function scratchPlugins(manifests) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-scratch-plugins-"))
  if (typeof manifests === "function") manifests = manifests(dir)
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
// behave as before. For a package the exact source is its package name; for a local source it is the
// path, which name-only resolution would miss, refusing the build as missing its engine.
test("a dependency written as the engine's exact source resolves to it", async () => {
  const plugins = scratchPlugins({ "source-consumer": { defaultOrder: 20, dependencies: [ENGINE] } })
  try {
    const { code, output } = await buildScratchSite("exact-source", HOME, { config: withPlugins(fixtureConfig(), plugins.entries) })
    expect(code, output).toBe(0)
  } finally {
    plugins.remove()
  }
})

// The same for an engine listed by a local source: its exact path, which is not its name.
test("a dependency written as a local engine's exact path resolves to it", async () => {
  const plugins = scratchPlugins((dir) => ({
    "local-engine": { defaultOrder: 15 },
    "path-consumer": { defaultOrder: 20, dependencies: [path.join(dir, "local-engine")] },
  }))
  try {
    const { code, output } = await buildScratchSite("exact-path", HOME, { config: withPlugins(fixtureConfig(), plugins.entries) })
    expect(code, output).toBe(0)
  } finally {
    plugins.remove()
  }
})

// And the order check reads the engine's manifest through that exact-source key, not the fallback.
test("a consumer ordered before the engine it names by exact source is refused", async () => {
  const plugins = scratchPlugins({ "source-consumer": { defaultOrder: 10, dependencies: [ENGINE] } })
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
