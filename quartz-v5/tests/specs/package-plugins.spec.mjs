// Our plugins load by npm package name, exactly as `@quartz-community/*` do (#89, #93, ADR-0005): a
// site lists `source: "@chaoticgoodcomputing/quartz-<name>"`, and Quartz imports the package by name,
// never copying or linking it into `.quartz/plugins/`, where a local or git source goes. In this repo
// the name resolves through the repo-only site package, `quartz-v5/package.json`, which depends on
// each converted plugin by `workspace:*`: its `node_modules` is on Node's upward walk from Core
// source. What a downstream site sees of a package is proven here: that it loads by name on build
// and on serve, that Quartz's generated plugin index takes it in, and that a TypeScript site can
// read its types. Its own specs prove what it renders.
//
// Every plugin of ours is a package now (#93-#96), the site plugins too, as repo-only ones; only the
// fixture's own plugins still load by local path.
import fs from "node:fs"
import path from "node:path"
import { execFile } from "node:child_process"
import { createRequire } from "node:module"
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

const run = promisify(execFile)
const GRAPH = "@chaoticgoodcomputing/quartz-graph"
// Every plugin that is a package so far (#93, #94), by package name.
const PACKAGES = [
  GRAPH,
  ...["mdx", "annotator", "seo", "og-image", "page-source", "email-subscribe", "social", "posthog"].map(
    (name) => `@chaoticgoodcomputing/quartz-${name}`,
  ),
]
const dirName = (pkg) => pkg.split("/")[1]
const HOME = { "index.md": "---\ntitle: Home\n---\nLinks to [[other]].\n", "other.md": "# Other\n" }

test("the fixture and the real site list every package by its package name", () => {
  for (const config of [fixtureConfig(), fs.readFileSync(siteConfigFile, "utf8")]) {
    const sources = pluginSources(config)
    expect(sources).toEqual(expect.arrayContaining(PACKAGES))
    // Nothing lists one by path any more, by its old directory or its new one.
    const paths = sources.map((source) => String(source?.repo ?? source)).filter((source) => source.startsWith("."))
    for (const pkg of PACKAGES) {
      const name = dirName(pkg).replace(/^quartz-/, "")
      expect(paths.filter((source) => new RegExp(`/(cgc|quartz)-${name}$`).test(source)), pkg).toEqual([])
    }
  }
})

test("the fixture site loads every package by name: none is put in .quartz/plugins/", async ({
  page,
}) => {
  const installed = fs.readdirSync(path.join(fixtureRoot("main"), ".quartz", "plugins"))
  for (const pkg of PACKAGES) {
    expect(installed).not.toContain(dirName(pkg))
    expect(installed).not.toContain(dirName(pkg).replace(/^quartz-/, "cgc-"))
  }
  // A local source, such as the fixture's own consumer, is what Quartz links in there.
  expect(installed).toContain("fixture-consumer")
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
test("Quartz's generated plugin index takes every package in", async ({ scratch }) => {
  const site = await scratch.site("package-index", HOME)
  expect(site.code, site.output).toBe(0)
  const root = path.dirname(site.public)
  const tsx = path.join(core, "node_modules", ".bin", "tsx")
  const { stdout, stderr } = await run(tsx, ["./quartz/plugins/loader/install-plugins.ts"], {
    cwd: root,
  })
  for (const pkg of PACKAGES) expect(`${stdout}${stderr}`).not.toContain(`Skipping npm package ${pkg}`)
  const index = fs.readFileSync(path.join(root, ".quartz", "plugins", "index.ts"), "utf8")
  // Each package is in it: its options' types, and its named exports. A default export, the
  // factory of most, is left out, as the index leaves out every package's.
  for (const pkg of PACKAGES) expect(index, pkg).toMatch(new RegExp(`export (type )?\\{ [^}]+ \\} from "${pkg}"`))
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

// From each package's real path, as Node loads it through the site package's link, Preact resolves
// to Quartz Core's copy: one Preact per page (#89). A package's own node_modules holds none.
test("every package resolves Preact to Quartz Core's copy", () => {
  const corePreact = fs.realpathSync(createRequire(path.join(core, "package.json")).resolve("preact"))
  for (const pkg of PACKAGES) {
    const entry = fs.realpathSync(path.join(testsRoot, "..", "node_modules", pkg, "package.json"))
    expect(fs.realpathSync(createRequire(entry).resolve("preact")), pkg).toBe(corePreact)
    expect(fs.existsSync(path.join(path.dirname(entry), "node_modules", "preact")), pkg).toBe(false)
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

// The tag family and the styles engine (#95): the two engines, `quartz-styles` and `quartz-tags`, and the
// plugins that consume them, each a package under its `quartz-<name>` name that keeps its manifest
// name, `cgc-<name>`, for its CSS.
const FAMILY = {
  "@chaoticgoodcomputing/quartz-styles": "cgc-styles",
  "@chaoticgoodcomputing/quartz-tags": "cgc-tags",
  "@chaoticgoodcomputing/quartz-tag-list": "cgc-tag-list",
  "@chaoticgoodcomputing/quartz-tag-page": "cgc-tag-page",
  "@chaoticgoodcomputing/quartz-tag-explorer": "cgc-tag-explorer",
  "@chaoticgoodcomputing/quartz-post-listing": "cgc-post-listing",
  "@chaoticgoodcomputing/quartz-backlinks": "cgc-backlinks",
}

test("the fixture and the real site list the tag family and the styles engine by package name", () => {
  for (const config of [fixtureConfig(), fs.readFileSync(siteConfigFile, "utf8")]) {
    const sources = pluginSources(config).map(String)
    for (const [name, manifest] of Object.entries(FAMILY)) {
      expect(sources).toContain(name)
      const dir = name.split("/")[1]
      expect(sources.filter((s) => s.startsWith(".") && [manifest, dir].includes(path.basename(s)))).toEqual([])
    }
  }
})

test("the fixture site never puts the tag family in .quartz/plugins/", async ({ page }) => {
  const installed = fs.readdirSync(path.join(fixtureRoot("main"), ".quartz", "plugins"))
  for (const [name, manifest] of Object.entries(FAMILY)) {
    expect(installed).not.toContain(manifest)
    expect(installed).not.toContain(name.split("/")[1])
  }
  // The engines' consumers render on the fixture, so the dependencies by package name resolved.
  await page.goto("/tags/articles")
  await expect(page.locator(".cgc-tag-page")).toHaveCount(1)
})

test("every manifest dependency on an engine is its package name", () => {
  const roots = ["../plugins", "../site-plugins", "fixture-plugins"].map((d) => path.join(testsRoot, d))
  const engines = new Set(Object.values(FAMILY).filter((m) => m === "cgc-styles" || m === "cgc-tags"))
  const found = []
  for (const root of roots) {
    for (const dir of fs.readdirSync(root)) {
      const file = path.join(root, dir, "package.json")
      if (!fs.existsSync(file)) continue
      const deps = JSON.parse(fs.readFileSync(file, "utf8")).quartz?.dependencies ?? []
      for (const dep of deps) if (engines.has(dep) || dep.startsWith(".")) found.push(`${dir}: ${dep}`)
    }
  }
  expect(found).toEqual([])
})

test("Quartz's generated plugin index takes in the tag family", async ({ scratch }) => {
  const site = await scratch.site("package-index-family", HOME)
  expect(site.code, site.output).toBe(0)
  const root = path.dirname(site.public)
  const tsx = path.join(core, "node_modules", ".bin", "tsx")
  const { stdout, stderr } = await run(tsx, ["./quartz/plugins/loader/install-plugins.ts"], {
    cwd: root,
  })
  const index = fs.readFileSync(path.join(root, ".quartz", "plugins", "index.ts"), "utf8")
  for (const name of Object.keys(FAMILY)) {
    expect(`${stdout}${stderr}`).not.toContain(`Skipping npm package ${name}`)
    expect(index).toContain(`from "${name}"`)
  }
})

// The site plugins (#96): repo-only packages, `"private": true`, named `@chaoticgoodcomputing/site-<name>`
// and loaded by that name like every other plugin of ours, through the site package. Their
// directories and manifest names are unchanged.
const SITE_PLUGINS = {
  "@chaoticgoodcomputing/site-styles": "site-styles",
  "@chaoticgoodcomputing/site-components": "site-components",
}
const sitePackage = () => JSON.parse(fs.readFileSync(path.join(testsRoot, "..", "package.json"), "utf8"))
const localSources = (config) =>
  pluginSources(config)
    .map((source) => (typeof source === "string" ? source : source?.repo))
    .filter((source) => typeof source === "string" && (source.startsWith(".") || path.isAbsolute(source)))

// Every plugin of ours loads by package name. The one exception is the fixture's own plugins, which
// exist only for the suite and stay local sources (tests/CONTEXT.md, "Fixture plugin").
test("no config lists a plugin by local path but the fixture's own plugins", () => {
  expect(localSources(fs.readFileSync(siteConfigFile, "utf8"))).toEqual([])
  const fixturePlugins = path.join(testsRoot, "fixture-plugins")
  const outside = localSources(fixtureConfig()).filter(
    (source) => !path.resolve(fixtureRoot("main"), source).startsWith(`${fixturePlugins}${path.sep}`),
  )
  expect(outside).toEqual([])
})

test("the site plugins are repo-only packages the site lists by name", () => {
  const sources = pluginSources(fs.readFileSync(siteConfigFile, "utf8"))
  const deps = sitePackage().dependencies
  for (const [name, dir] of Object.entries(SITE_PLUGINS)) {
    const manifest = JSON.parse(fs.readFileSync(path.join(testsRoot, "..", "site-plugins", dir, "package.json"), "utf8"))
    expect(manifest.name).toBe(name)
    expect(manifest.private, name).toBe(true)
    expect(manifest.quartz.name, name).toBe(dir)
    expect(deps[name], name).toBe("workspace:*")
    expect(sources.some((source) => source === name || source?.repo === name), name).toBe(true)
  }
  // site-components places one component per entry, each named for it, so the site package depends
  // on it under each placement name too, as Quartz imports an object source by its `name`.
  for (const placement of ["site-page-title", "site-footer"]) {
    const entry = sources.find((source) => source?.name === placement)
    expect(entry?.repo, placement).toBe("@chaoticgoodcomputing/site-components")
    expect(deps[placement], placement).toBe("workspace:@chaoticgoodcomputing/site-components@*")
  }
})

// pnpm refuses to publish a repo-only package (`"private": true`): a workspace publish, the way every package would be
// published (#90), leaves each site plugin out, where a publishable package would be packed and
// listed. (A single-package `pnpm publish --dry-run` stops before the check, which lives in the
// registry step, so it cannot show the refusal.) Nothing here reaches the registry: a repo-only
// package is dropped before pnpm asks whether it is already published.
test("a workspace publish leaves the site plugins out", async () => {
  const repo = path.resolve(testsRoot, "..", "..")
  for (const name of Object.keys(SITE_PLUGINS)) {
    const { stdout, stderr } = await run("pnpm", ["-r", "--filter", name, "publish", "--dry-run", "--no-git-checks"], { cwd: repo })
    const output = `${stdout}${stderr}`
    expect(output, name).toContain("There are no new packages that should be published")
    expect(output, name).not.toContain(name)
  }
})
