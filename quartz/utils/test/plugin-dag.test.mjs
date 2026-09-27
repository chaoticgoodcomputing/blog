// `utils/plugin-dag.mjs` (#86): the dependency DAG on the plugins' tag page, a Mermaid flowchart it
// generates from the packages' manifests. What it reads from the real packages, and the exact shape it
// writes and the dependencies it refuses, against small trees of its own. That the note carries what
// it would write is the `plugin-dag` repo guard's to say.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { flowchart, quartzRoot, readPackages } from "../plugin-dag.mjs"

/** A scratch tree of `{ "<group>/<dir>": manifest }`, removed after the test. */
function tree(t, packages) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-dag-"))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  for (const [dir, manifest] of Object.entries(packages)) {
    fs.mkdirSync(path.join(root, dir), { recursive: true })
    fs.writeFileSync(path.join(root, dir, "package.json"), JSON.stringify(manifest))
  }
  return root
}

const pluginDirs = () =>
  fs
    .readdirSync(path.join(quartzRoot, "plugins"))
    .filter((dir) => fs.existsSync(path.join(quartzRoot, "plugins", dir, "package.json")))
    .sort()

test("draws every package in its group: plugins, libraries and site plugins", () => {
  const packages = readPackages()
  const byKind = (kind) => packages.filter((p) => p.kind === kind).map((p) => p.dir).sort()
  assert.deepEqual(byKind("plugin"), pluginDirs())
  for (const library of ["css-check", "declarations", "icons", "island-runtime", "pipeline", "tags-core", "widgets"]) {
    assert.ok(byKind("library").includes(library), library)
  }
  for (const sitePlugin of ["site-components", "site-styles"]) assert.ok(byKind("site-plugin").includes(sitePlugin), sitePlugin)
})

test("reads engine edges from manifest dependencies, and library edges from the libraries a package builds with", () => {
  const packages = readPackages()
  const of = (dir) => packages.find((p) => p.dir === dir)
  assert.deepEqual(of("quartz-graph").engines, ["quartz-styles", "quartz-tags"])
  assert.deepEqual(of("quartz-tags").engines, ["quartz-styles"])
  assert.deepEqual(of("quartz-styles").engines, [])
  assert.deepEqual(of("quartz-tags").libraries, ["declarations", "tags-core"])
  // A plugin's `workspace:*` devDependency, and a library's `workspace:` dependency on another.
  assert.deepEqual(of("quartz-annotator").libraries, ["css-check", "declarations", "island-runtime", "pipeline"])
  assert.deepEqual(of("widgets").libraries, ["css-check", "icons"])
  // A plugin that is a package names the library its build emits declarations with (#93).
  assert.deepEqual(of("quartz-graph").libraries, ["css-check", "declarations", "icons", "tags-core"])
})

// A plugin that is a package (#89) is drawn by its directory, which its plugin note is named for,
// and a consumer names it as an engine by its package name, the name Quartz takes from a package
// source (#95), whether the consumer is a package itself or loads by local path.
test("draws a plugin that is a package by its directory, and an engine edge from its package name", (t) => {
  const root = tree(t, {
    "plugins/quartz-engine": { name: "@chaoticgoodcomputing/quartz-engine", quartz: { name: "cgc-engine", dependencies: [] } },
    "plugins/quartz-reader": {
      name: "@chaoticgoodcomputing/quartz-reader",
      quartz: { name: "cgc-reader", dependencies: ["@chaoticgoodcomputing/quartz-engine"] },
    },
    "plugins/cgc-local": { name: "cgc-local", quartz: { name: "cgc-local", dependencies: ["@chaoticgoodcomputing/quartz-engine"] } },
  })
  assert.equal(
    flowchart(readPackages(root)),
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
test("writes a flowchart with each group drawn apart, and the two kinds of edge too", (t) => {
  const root = tree(t, {
    "plugins/cgc-engine": { name: "cgc-engine", quartz: { name: "cgc-engine", dependencies: [] } },
    "plugins/cgc-reader": {
      name: "cgc-reader",
      quartz: { name: "cgc-reader", dependencies: ["cgc-engine"] },
      devDependencies: { "@chaoticgoodcomputing/core": "file:../../libs/core", esbuild: "^0.28.2" },
    },
    "libs/core": { name: "@chaoticgoodcomputing/core" },
    "libs/extra": { name: "@chaoticgoodcomputing/extra", dependencies: { "@chaoticgoodcomputing/core": "workspace:*" } },
    "site-plugins/site-look": { name: "site-look", quartz: { name: "site-look", dependencies: ["cgc-engine"] } },
  })
  assert.equal(
    flowchart(readPackages(root)),
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

// Quartz names a package source by its whole package name, so a dependency on a package's manifest
// name finds nothing at a site, and the loader refuses the build: the DAG refuses it too (#95).
test("refuses an engine dependency on a package's manifest name", (t) => {
  const root = tree(t, {
    "plugins/quartz-engine": { name: "@chaoticgoodcomputing/quartz-engine", quartz: { name: "cgc-engine", dependencies: [] } },
    "plugins/quartz-reader": { name: "@chaoticgoodcomputing/quartz-reader", quartz: { name: "cgc-reader", dependencies: ["cgc-engine"] } },
  })
  assert.throws(() => readPackages(root), /quartz-reader.*cgc-engine/)
})

test("refuses an engine dependency that names no package, rather than drawing the DAG without it", (t) => {
  const root = tree(t, { "plugins/cgc-lonely": { name: "cgc-lonely", quartz: { name: "cgc-lonely", dependencies: ["cgc-missing"] } } })
  assert.throws(() => readPackages(root), /cgc-lonely.*cgc-missing/)
})
