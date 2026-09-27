// Our plugins load by npm package name, exactly as `@quartz-community/*` do (#89, #93, ADR-0005): a
// site lists `source: "@chaoticgoodcomputing/quartz-<name>"`, and Quartz imports the package by name,
// never copying or linking it into `.quartz/plugins/`, where a local or git source goes. In this repo
// the name resolves through the repo-only site package, `quartz-v5/package.json`, which depends on
// each converted plugin by `workspace:*`: its `node_modules` is on Node's upward walk from Core
// source. What a downstream site sees of a package is proven here: that it loads by name on build
// and on serve, that Quartz's generated plugin index takes it in, and that a TypeScript site can
// read its types. Its own specs prove what it renders.
//
// Every plugin not yet converted still loads by local path, beside them (#94, #95).
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
} from "../harness/site.mjs"

const run = promisify(execFile)
const GRAPH = "@chaoticgoodcomputing/quartz-graph"
const HOME = { "index.md": "---\ntitle: Home\n---\nLinks to [[other]].\n", "other.md": "# Other\n" }

test("the fixture and the real site list the graph by its package name", () => {
  expect(pluginSources(fixtureConfig())).toContain(GRAPH)
  expect(pluginSources(fs.readFileSync(siteConfigFile, "utf8"))).toContain(GRAPH)
  // Nothing lists it by path any more, at either site.
  for (const config of [fixtureConfig(), fs.readFileSync(siteConfigFile, "utf8")]) {
    expect(
      pluginSources(config).filter(
        (source) => /graph$/.test(String(source)) && String(source).startsWith("."),
      ),
    ).toEqual([])
  }
})

test("the fixture site loads the graph by name: it is never put in .quartz/plugins/", async ({
  page,
}) => {
  const installed = fs.readdirSync(path.join(fixtureRoot("main"), ".quartz", "plugins"))
  expect(installed).not.toContain("quartz-graph")
  expect(installed).not.toContain("cgc-graph")
  // Every other plugin of ours is still a local source, which Quartz links in there.
  expect(installed).toContain("cgc-tags")
  await page.goto("/plain-note")
  await expect(page.locator(".cgc-graph__canvas")).toHaveCount(1)
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

// Quartz's own plugin install step (Core's `install-plugins` script) regenerates the plugin index,
// `.quartz/plugins/index.ts`, from which a TypeScript layout override imports a plugin's exports. It
// reads a package's exports from its `dist/index.d.ts` and skips a package without one.
test("Quartz's generated plugin index takes the graph in", async ({ scratch }) => {
  const site = await scratch.site("package-index", HOME)
  expect(site.code, site.output).toBe(0)
  const root = path.dirname(site.public)
  const tsx = path.join(core, "node_modules", ".bin", "tsx")
  const { stdout, stderr } = await run(tsx, ["./quartz/plugins/loader/install-plugins.ts"], {
    cwd: root,
  })
  expect(`${stdout}${stderr}`).not.toContain(`Skipping npm package ${GRAPH}`)
  const index = fs.readFileSync(path.join(root, ".quartz", "plugins", "index.ts"), "utf8")
  expect(index).toMatch(
    new RegExp(`export type \\{ [^}]*\\bGraphOptions\\b[^}]* \\} from "${GRAPH}"`),
  )
  expect(index).toMatch(new RegExp(`export \\{ [^}]*\\bgraphIndexOf\\b[^}]* \\} from "${GRAPH}"`))
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
