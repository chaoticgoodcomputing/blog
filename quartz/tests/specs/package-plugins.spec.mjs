// Our plugins load by npm package name, exactly as `@quartz-community/*` do (#89, #93, ADR-0005): a
// site lists `source: "@chaoticgoodcomputing/quartz-<name>"`, and Quartz imports the package by name,
// never copying or linking it into `.quartz/plugins/`, where a local or git source goes. In this repo
// the name resolves through the repo-only site package, `quartz/package.json`, which depends on
// each plugin by `workspace:*`: its `node_modules` is on Node's upward walk from Core source. What a
// downstream site sees of a package is proven here: that it loads by name on build and on serve, and
// that a TypeScript site can read its types. Its own specs prove what it renders.
//
// Every plugin of ours is a package now (#93-#96), the site plugins too, as repo-only ones; only the
// fixture's own plugins still load by local path. The rules on the packages and the configs that list
// them (package-name sources, the package contract, one Preact, clean packs, the generated plugin
// index) are repo guards (utils/guards/, VENDORED.md "Repo guards"), not specs.
import fs from "node:fs"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { test, expect } from "../harness/test.mjs"
import {
  core,
  fixtureConfig,
  fixtureRoot,
  pluginSources,
  siteConfigFile,
  testsRoot,
  withPlugins,
} from "../harness/site.mjs"
import { PLUGIN_ROOTS, pluginPackages } from "../../utils/plugin-packages.mjs"

const run = promisify(execFile)
const GRAPH = "@chaoticgoodcomputing/quartz-graph"
// Every shareable plugin of ours, `plugins/`, by package name: its directory and its manifest name
// (`cgc-<name>`), either of which Quartz would name a link in `.quartz/plugins/` by.
const PACKAGES = [...pluginPackages()]
  .filter(([, dir]) => path.dirname(dir) === PLUGIN_ROOTS[0])
  .map(([name, dir]) => ({
    name,
    dir: path.basename(dir),
    manifest: JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).quartz.name,
  }))
const HOME = { "index.md": "---\ntitle: Home\n---\nLinks to [[other]].\n", "other.md": "# Other\n" }

test("the fixture site loads every package by name: none is put in .quartz/plugins/", async ({
  page,
}) => {
  expect(PACKAGES.length).toBeGreaterThan(0)
  const installed = fs.readdirSync(path.join(fixtureRoot("main"), ".quartz", "plugins"))
  for (const { name, dir, manifest } of PACKAGES) {
    expect(installed, name).not.toContain(dir)
    expect(installed, name).not.toContain(manifest)
  }
  // A local source, such as the fixture's own consumer, is what Quartz links in there.
  expect(installed).toContain("fixture-consumer")
  await page.goto("/plain-note")
  await expect(page.locator(".cgc-graph__canvas")).toHaveCount(1)
  // The engines' consumers render on the fixture, so their dependencies by package name resolved.
  await page.goto("/tags/articles")
  await expect(page.locator(".cgc-tag-page")).toHaveCount(1)
})

test("a serve run loads the graph by name", async ({ scratch }) => {
  test.setTimeout(180_000)
  const site = await scratch.site("package-serve", HOME, { serve: true })
  expect(site.code, site.output).toBe(0)
  expect(fs.readFileSync(path.join(site.public, "index.html"), "utf8")).toContain(
    "cgc-graph__local",
  )
  expect(fs.readdirSync(path.join(path.dirname(site.public), ".quartz", "plugins"))).not.toContain(
    "quartz-graph",
  )
})

// A TypeScript site imports the plugin and its component by name and reads their types: every type in
// them resolves at the site, with the libraries the plugin inlines inlined into its declarations too.
test("a TypeScript site reads the graph's types from its package", async () => {
  const dir = fs.mkdtempSync(path.join(testsRoot, ".site-scratch-types-"))
  try {
    fs.writeFileSync(
      path.join(dir, "site.ts"),
      [
        `import CgcGraph, { GRAPH_INDEX, graphIndexOf, type GraphIndex, type GraphOptions } from "${GRAPH}"`,
        `import { Graph } from "${GRAPH}/components"`,
        `const options: GraphOptions = { privateTags: ["private"] }`,
        `const name: string = CgcGraph(options).name`,
        `const index: GraphIndex = graphIndexOf([], options)`,
        `const file: "static/cgcGraph.json" = GRAPH_INDEX`,
        `export const used = [name, index, file, Graph(options)]`,
        // Wrong on purpose, so the check is known to read the types rather than take them as `any`.
        `// @ts-expect-error: privateTags is a list of tags`,
        `export const wrong: GraphOptions = { privateTags: "private" }`,
        "",
      ].join("\n"),
    )
    fs.writeFileSync(
      path.join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "es2022",
          module: "esnext",
          moduleResolution: "bundler",
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          noImplicitAny: true,
          types: [],
        },
        files: ["site.ts"],
      }),
    )
    const tsc = path.join(core, "node_modules", ".bin", "tsc")
    const result = await run(tsc, ["-p", dir]).then(
      () => "",
      (err) => `${err.stdout}${err.stderr}`,
    )
    expect(result).toBe("")
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

// Quartz places one component per entry, so a site that places a package's component twice lists
// it again, as an object source named for the placement, which Quartz imports by that name: the
// site package depends on the plugin under it too, an alias (VENDORED.md). The real site places the
// subscribe box so, after the body and in the sidebar.
test("a package listed a second time loads under its placement name", async ({ scratch }) => {
  const SUBSCRIBE = "@chaoticgoodcomputing/quartz-email-subscribe"
  const second = pluginSources(fs.readFileSync(siteConfigFile, "utf8")).find((source) => source?.repo === SUBSCRIBE)
  expect(second?.name).toBe("email-subscribe-sidebar")
  const config = withPlugins(fixtureConfig(), [
    {
      source: second,
      enabled: true,
      options: { buttondownUsername: "cgc-fixture" },
      layout: { position: "right", priority: 30 },
    },
  ])
  const site = await scratch.site("package-twice", HOME, { config })
  expect(site.code, site.output).toBe(0)
  const html = fs.readFileSync(path.join(site.public, "index.html"), "utf8")
  expect(html.match(/<div class="cgc-email-subscribe"/g) ?? []).toHaveLength(2)
  expect(fs.readdirSync(path.join(path.dirname(site.public), ".quartz", "plugins"))).not.toContain("email-subscribe-sidebar")
})
