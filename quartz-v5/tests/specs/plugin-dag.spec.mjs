// The plugins' tag, `projects/site/plugins`, and the DAG on its description note (#86, the owner's
// review notes of 2026-09-26). Every plugin note carries the tag, so the tag's page lists them all,
// and the description note draws how the packages depend on each other: a Mermaid flowchart that
// `utils/plugin-dag.mjs` generates from the packages' manifests (`pnpm nx run site-v5:plugin-dag`).
// The owner decided it is generated and guarded, so the note fails here the moment it drifts from
// what the packages declare.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { test, expect, routeSite } from "../harness/test.mjs"
import { buildScratchSite, siteConfig, core } from "../harness/site.mjs"
import {
  blockOf,
  flowchart,
  generatedBlock,
  notePath,
  quartzRoot,
  readPackages,
  vault,
} from "../../utils/plugin-dag.mjs"

const YAML = createRequire(path.join(core, "package.json"))("yaml")
const TAG = "projects/site/plugins"
const pluginDirs = () =>
  fs
    .readdirSync(path.join(quartzRoot, "plugins"))
    .filter((dir) => fs.existsSync(path.join(quartzRoot, "plugins", dir, "package.json")))
    .sort()
const frontmatterOf = (text) => YAML.parse(/^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "") ?? {}

test.describe("the generated DAG", () => {
  test("the description note carries the DAG the packages declare", () => {
    const note = fs.readFileSync(notePath(), "utf8")
    expect(blockOf(note), "regenerate it: pnpm nx run site-v5:plugin-dag").toBe(generatedBlock())
  })

  // At the vault's current convention, `tags/<t>/index.md`, until the cutover rename (#43) moves it
  // to `tags/<t>.md` with the others. Never both, or the script would write only the renamed one.
  test("the description note is in one shape, before the cutover rename or after it", () => {
    const shapes = [path.join("tags", TAG, "index.md"), path.join("tags", `${TAG}.md`)]
    const present = shapes.filter((shape) => fs.existsSync(path.join(vault, shape)))
    expect(present).toHaveLength(1)
    expect(path.relative(vault, notePath())).toBe(present[0])
  })

  test("draws every package in its group: plugins, libraries and site plugins", () => {
    const packages = readPackages()
    const byKind = (kind) => packages.filter((p) => p.kind === kind).map((p) => p.dir).sort()
    expect(byKind("plugin")).toEqual(pluginDirs())
    expect(byKind("library")).toEqual(
      expect.arrayContaining(["css-check", "declarations", "icons", "island-runtime", "pipeline", "tags-core", "widgets"]),
    )
    expect(byKind("site-plugin")).toEqual(expect.arrayContaining(["site-components", "site-styles"]))
  })

  test("reads engine edges from manifest dependencies, and library edges from the libraries a package builds with", () => {
    const packages = readPackages()
    const of = (dir) => packages.find((p) => p.dir === dir)
    expect(of("quartz-graph").engines).toEqual(["cgc-styles", "cgc-tags"])
    expect(of("cgc-tags").engines).toEqual(["cgc-styles"])
    expect(of("cgc-styles").engines).toEqual([])
    expect(of("cgc-tags").libraries).toEqual(["tags-core"])
    // A plugin's `file:` devDependency, and a library's `workspace:` dependency on another.
    expect(of("cgc-annotator").libraries).toEqual(["css-check", "island-runtime", "pipeline"])
    expect(of("widgets").libraries).toEqual(["css-check", "icons"])
    // A plugin that is a package names the library its build emits declarations with (#93).
    expect(of("quartz-graph").libraries).toEqual(["css-check", "declarations", "icons", "tags-core"])
  })

  // A plugin that is a package (#89) is drawn by its directory, which its plugin note is named for,
  // and a consumer may name it as an engine by its package name, as Quartz matches a dependency on a
  // package source, or by its manifest name, as it matches one on a local source.
  test("draws a plugin that is a package by its directory, whichever name a consumer depends on it by", ({ scratch }) => {
    const root = scratch.dir("plugin-dag-packages")
    const pkg = (dir, manifest) => {
      fs.mkdirSync(path.join(root, dir), { recursive: true })
      fs.writeFileSync(path.join(root, dir, "package.json"), JSON.stringify(manifest))
    }
    pkg("plugins/quartz-engine", { name: "@chaoticgoodcomputing/quartz-engine", quartz: { name: "cgc-engine", dependencies: [] } })
    pkg("plugins/quartz-reader", {
      name: "@chaoticgoodcomputing/quartz-reader",
      quartz: { name: "cgc-reader", dependencies: ["@chaoticgoodcomputing/quartz-engine"] },
    })
    pkg("plugins/cgc-local", { name: "cgc-local", quartz: { name: "cgc-local", dependencies: ["cgc-engine"] } })

    expect(flowchart(readPackages(root))).toBe(
      [
        "flowchart LR",
        '  plugin_cgc_local["cgc-local"]',
        '  plugin_quartz_engine["quartz-engine"]',
        '  plugin_quartz_reader["quartz-reader"]',
        "  plugin_cgc_local --> plugin_quartz_engine",
        "  plugin_quartz_reader --> plugin_quartz_engine",
        '  click plugin_cgc_local "/plugins/cgc-local"',
        '  click plugin_quartz_engine "/plugins/quartz-engine"',
        '  click plugin_quartz_reader "/plugins/quartz-reader"',
      ].join("\n"),
    )
  })

  // A small tree of its own, so the exact shape of what the script writes is pinned here.
  test("writes a flowchart with each group drawn apart, and the two kinds of edge too", ({ scratch }) => {
    const root = scratch.dir("plugin-dag")
    const pkg = (dir, manifest) => {
      fs.mkdirSync(path.join(root, dir), { recursive: true })
      fs.writeFileSync(path.join(root, dir, "package.json"), JSON.stringify(manifest))
    }
    pkg("plugins/cgc-engine", { name: "cgc-engine", quartz: { name: "cgc-engine", dependencies: [] } })
    pkg("plugins/cgc-reader", {
      name: "cgc-reader",
      quartz: { name: "cgc-reader", dependencies: ["cgc-engine"] },
      devDependencies: { "@chaoticgoodcomputing/core": "file:../../libs/core", esbuild: "^0.28.2" },
    })
    pkg("libs/core", { name: "@chaoticgoodcomputing/core" })
    pkg("libs/extra", { name: "@chaoticgoodcomputing/extra", dependencies: { "@chaoticgoodcomputing/core": "workspace:*" } })
    pkg("site-plugins/site-look", { name: "site-look", quartz: { name: "site-look", dependencies: ["cgc-engine"] } })

    expect(flowchart(readPackages(root))).toBe(
      [
        "flowchart LR",
        '  plugin_cgc_engine["cgc-engine"]',
        '  plugin_cgc_reader["cgc-reader"]',
        '  library_core(["core"])',
        '  library_extra(["extra"])',
        '  subgraph site_plugins["Site plugins"]',
        '    site_plugin_site_look{{"site-look"}}',
        "  end",
        "  plugin_cgc_reader --> plugin_cgc_engine",
        "  site_plugin_site_look --> plugin_cgc_engine",
        "  plugin_cgc_reader -.-> library_core",
        "  library_extra -.-> library_core",
        '  click plugin_cgc_engine "/plugins/cgc-engine"',
        '  click plugin_cgc_reader "/plugins/cgc-reader"',
      ].join("\n"),
    )
  })

  test("refuses an engine dependency that names no package, rather than drawing the DAG without it", ({ scratch }) => {
    const root = scratch.dir("plugin-dag-unknown")
    fs.mkdirSync(path.join(root, "plugins/cgc-lonely"), { recursive: true })
    fs.writeFileSync(
      path.join(root, "plugins/cgc-lonely/package.json"),
      JSON.stringify({ name: "cgc-lonely", quartz: { name: "cgc-lonely", dependencies: ["cgc-missing"] } }),
    )
    expect(() => readPackages(root)).toThrow(/cgc-lonely.*cgc-missing/)
  })
})

test.describe("the plugin notes", () => {
  test("every shareable plugin's README carries the plugins' tag", () => {
    for (const dir of pluginDirs()) {
      const { tags = [] } = frontmatterOf(fs.readFileSync(path.join(quartzRoot, "plugins", dir, "README.md"), "utf8"))
      expect(tags, dir).toContain(TAG)
    }
  })

  test("every shareable plugin's README is linked into the vault as its plugin note", () => {
    for (const dir of pluginDirs()) {
      const note = path.join(vault, "plugins", `${dir}.md`)
      expect(fs.existsSync(note) && fs.realpathSync(note), dir).toBe(
        fs.realpathSync(path.join(quartzRoot, "plugins", dir, "README.md")),
      )
    }
  })
})

// The tag's page on the site config, with the description note in the shape the cutover rename (#43)
// gives it, `tags/projects/site/plugins.md`, so it is the tag's page itself, and the plugin notes as
// the vault links them.
test.describe("on the site config", () => {
  test.describe.configure({ mode: "serial" })

  const ORIGIN = "https://blog.chaoticgood.computer"
  let site
  test.beforeAll(async () => {
    test.setTimeout(240_000)
    const content = {
      "index.md": "---\ntitle: Home\n---\nWelcome.\n",
      [`tags/${TAG}.md`]: fs.readFileSync(notePath(), "utf8"),
    }
    for (const dir of pluginDirs()) {
      content[`plugins/${dir}.md`] = fs.readFileSync(path.join(quartzRoot, "plugins", dir, "README.md"), "utf8")
    }
    // Offline: nothing here looks at type, so the site's Google Fonts needn't be fetched.
    site = await buildScratchSite("plugin-dag-site", content, { config: siteConfig({ offline: true }), keep: true })
    expect(site.code, site.output).toBe(0)
  })
  test.afterAll(() => site?.remove())

  test("the tag's page shows the description, with the DAG as a Mermaid diagram", async ({ page }) => {
    // Stock's Mermaid script loads Mermaid from a CDN, which no spec reaches: the block is checked
    // as the page serves it, before the script draws it.
    await page.route("https://cdnjs.cloudflare.com/**", (route) => route.abort())
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/tags/${TAG}`)
    const body = page.locator(".cgc-tag-page")
    await expect(body).toContainText("plugins this site is built with")
    // The generated markers are Obsidian comments, which the page leaves out.
    await expect(body).not.toContainText("plugin-dag")
    const diagram = body.locator("code.mermaid")
    await expect(diagram).toHaveCount(1)
    expect((await diagram.textContent()).trim()).toBe(flowchart(readPackages()))
  })

  test("the tag's page lists every plugin note", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/tags/${TAG}`)
    const links = page.locator(".cgc-post-listing__link")
    const listed = (await links.evaluateAll((as) => as.map((a) => new URL(a.href).pathname))).sort()
    expect(listed).toEqual(pluginDirs().map((dir) => `/plugins/${dir}`))
  })
})
