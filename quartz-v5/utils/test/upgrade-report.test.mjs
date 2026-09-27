// The upgrade's API-surface report (#100): what changed between the pinned ref and the target in
// every upstream API the site depends on, printed before the tree is touched, and runnable alone
// (`--report-only`, the `site-v5:upgrade-report` target). Tested at the command line against the
// synthetic Quartz-shaped fixture (fixtures/quartz-repo.mjs), whose target commit changes the
// default config, the schema, the template, the exported APIs and package.json.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { DEFAULT_CONFIG, PINNED, SCHEMA, lines, makeFixture } from "./fixtures/quartz-repo.mjs"

const MANIFEST = "quartz-v5/upstream.json"

/** The report's section titled `title`: its lines, up to the next section. */
function section(output, title) {
  const start = output.indexOf(`\n  ${title}`)
  assert.notEqual(start, -1, `no section "${title}" in:\n${output}`)
  const rest = output.slice(start + 1)
  const end = rest.slice(1).search(/\n {2}\S/)
  return end === -1 ? rest : rest.slice(0, end + 1)
}

const TARGET_SCHEMA = structuredClone(SCHEMA)
// The target renames configuration.pageTitle to title, closes configuration to other keys, and
// makes every plugin entry say whether it is enabled.
TARGET_SCHEMA.properties.configuration = {
  type: "object",
  additionalProperties: false,
  properties: { title: { type: "string" }, enableSPA: { type: "boolean" } },
}
TARGET_SCHEMA.properties.plugins.items.required = ["source", "enabled"]

const TARGET = {
  "quartz.config.default.yaml": lines(
    "configuration:",
    "  pageTitle: Quartz",
    "  spa: true",
    "  locale: en-US",
    "plugins:",
    '  - source: "@quartz-community/explorer"',
    "    enabled: true",
    "    options:",
    "      defaultFolderState: collapsed",
    "      sortFn: alpha",
    '  - source: "@quartz-community/search"',
    "    enabled: true",
    '  - source: "@quartz-community/backlinks"',
    "    enabled: true",
    '  - source: "@quartz-community/graph"',
    "    enabled: true",
    "    options:",
    "      depth: 1",
  ),
  "quartz/plugins/quartz-plugins.schema.json": JSON.stringify(TARGET_SCHEMA, null, 2) + "\n",
  "quartz.ts": lines(
    'import { loadQuartzLayout, registerCondition } from "./quartz/plugins/loader"',
    "export default loadQuartzLayout()",
  ),
  // Plugin API: a new export.
  "quartz/plugins/types.ts":
    PINNED["quartz/plugins/types.ts"] +
    lines("", "export interface Filter {", "  name: string", "}"),
  // Loader API: loadQuartzLayout's signature changes.
  "quartz/plugins/loader/config-loader.ts": PINNED[
    "quartz/plugins/loader/config-loader.ts"
  ].replace(
    "  byPageType?: Record<string, string>",
    "  byPageType?: Record<string, PageTypeLayout>",
  ),
  // Condition API: registerCondition's signature changes, a built-in condition goes and one comes.
  "quartz/plugins/loader/conditions.ts": PINNED["quartz/plugins/loader/conditions.ts"]
    .replace(
      '  "has-tags": (props) => props.tags.length > 0,',
      '  "has-toc": (props) => props.toc.length > 0,',
    )
    .replace(
      "predicate: ConditionPredicate): void {",
      "predicate: ConditionPredicate, options?: { override?: boolean }): void {",
    ),
  // Frame API: a built-in frame goes, one comes, and an export is added.
  "quartz/components/frames/index.ts": PINNED["quartz/components/frames/index.ts"]
    .replace("  minimal: MinimalFrame,", "  wide: WideFrame,")
    .concat(
      lines(
        "",
        "export function defineFrame(frame: PageFrame): PageFrame {",
        "  return frame",
        "}",
      ),
    ),
  // package.json: a dependency moves, one is added, and the engines change.
  "package.json": PINNED["package.json"]
    .replace('"is-number": "^7.0.0"', '"is-number": "^8.0.0",\n    "yaml": "^2.8.0"')
    .replace('"node": ">=22"', '"node": ">=24"'),
  "package-lock.json": PINNED["package-lock.json"]
    .replace('"version": "7.0.0"', '"version": "8.0.0"')
    .replace("is-number-7.0.0.tgz", "is-number-8.0.0.tgz"),
}

const SITE = {
  "pnpm-workspace.yaml": lines("packages:", "  - quartz-v5/plugins/*"),
  // A peer range the target's is-number 8.0.0 breaks, and one it keeps.
  "quartz-v5/plugins/quartz-broken/package.json": JSON.stringify({
    name: "@chaoticgoodcomputing/quartz-broken",
    peerDependencies: { "is-number": "^7.0.0" },
  }),
  "quartz-v5/plugins/quartz-fine/package.json": JSON.stringify({
    name: "@chaoticgoodcomputing/quartz-fine",
    peerDependencies: { "is-number": ">=7.0.0 <9" },
  }),
}

describe("the report-only target, against a target that changes every category", () => {
  let fx, res
  before(() => {
    fx = makeFixture({ targetChanges: TARGET, siteChanges: SITE })
    res = fx.upgrade(["--report-only", `--ref=${fx.target}`])
  })
  after(() => fx.cleanup())

  test("succeeds, and touches nothing: not Core, not the pinned ref", () => {
    assert.equal(res.code, 0, res.output)
    assert.match(res.output, /API-surface report/)
    assert.equal(fx.status(), "")
    assert.equal(JSON.parse(fx.read(MANIFEST)).commit, fx.pinned)
    assert.doesNotMatch(res.output, /re-apply vendored changes/)
  })

  test("lists the default config's plugins and option keys added, removed or renamed", () => {
    const out = section(res.output, "The default config")
    assert.match(out, /configuration\.enablePopovers: removed/)
    assert.match(out, /configuration\.locale: added/)
    assert.match(out, /configuration\.enableSPA → configuration\.spa: renamed/)
    assert.match(out, /plugin @quartz-community\/darkmode: removed/)
    assert.match(out, /plugin @quartz-community\/backlinks: added/)
    assert.match(out, /plugin github:quartz-community\/graph → @quartz-community\/graph: renamed/)
    assert.match(out, /plugin @quartz-community\/explorer: options\.useSavedState removed/)
    assert.match(out, /plugin @quartz-community\/explorer: options\.sortFn added/)
    assert.match(
      out,
      /plugin @quartz-community\/explorer: options\.folderDefaultState → options\.defaultFolderState renamed/,
    )
    assert.match(out, /plugin @quartz-community\/graph: enabled false → true/)
    assert.doesNotMatch(out, /search/)
  })

  test("lists the schema's changes, and every error of our site config against it", () => {
    const out = section(res.output, "The plugin config schema")
    assert.match(out, /configuration\.title: added/)
    assert.match(out, /configuration\.pageTitle: removed/)
    assert.match(out, /plugins\[\]: required \["source"\] → \["source","enabled"\]/)
    assert.match(out, /2 error\(s\)/)
    assert.match(out, /configuration\.pageTitle: is not allowed here/)
    assert.match(out, /plugins\[0\]\.enabled: is required/)
  })

  test("shows the quartz.ts template's diff", () => {
    const out = section(res.output, "The quartz.ts template")
    assert.match(out, /\+import \{ loadQuartzLayout, registerCondition \} from/)
  })

  test("lists the exported APIs by kind, and says so for a kind with nothing to report", () => {
    const out = section(res.output, "Exported APIs")
    assert.match(out, /Plugin API[^\n]*\n\s+Filter \(quartz\/plugins\/types\.ts\): added/)
    assert.match(out, /Component API: nothing to report/)
    assert.match(out, /loadQuartzLayout \(quartz\/plugins\/loader\/config-loader\.ts\): changed/)
    assert.match(out, /- .*byPageType\?: Record<string, string>/)
    assert.match(out, /\+ .*byPageType\?: Record<string, PageTypeLayout>/)
    assert.match(out, /registerCondition \(quartz\/plugins\/loader\/conditions\.ts\): changed/)
    assert.match(out, /built-in condition has-tags: removed/)
    assert.match(out, /built-in condition has-toc: added/)
    assert.match(out, /built-in frame minimal: removed/)
    assert.match(out, /built-in frame wide: added/)
    assert.match(out, /defineFrame \(quartz\/components\/frames\/index\.ts\): added/)
  })

  test("says which changed APIs the site's steering files use", () => {
    const out = section(res.output, "Exported APIs")
    assert.match(out, /loadQuartzLayout: changed, and quartz\.ts uses it/)
    assert.match(out, /registerCondition: changed/)
  })

  test("lists Core's package.json dependencies and engines", () => {
    const out = section(res.output, "Core's package.json")
    assert.match(out, /dependencies\.is-number: \^7\.0\.0 → \^8\.0\.0/)
    assert.match(out, /dependencies\.yaml: added \(\^2\.8\.0\)/)
    assert.match(out, /engines\.node: >=22 → >=24/)
  })

  test("names each of our packages whose peer range the target's Core breaks, and the dependency", () => {
    const out = section(res.output, "Our packages' peer ranges")
    assert.match(
      out,
      /@chaoticgoodcomputing\/quartz-broken: is-number \^7\.0\.0 is not satisfied by Core's 8\.0\.0/,
    )
    assert.doesNotMatch(out, /quartz-fine/)
  })
})

describe("the report against the pinned ref", () => {
  let fx, res
  before(() => {
    fx = makeFixture()
    res = fx.upgrade(["--report-only", `--ref=${fx.pinned}`])
  })
  after(() => fx.cleanup())

  test("says so in every category that has nothing to report", () => {
    assert.equal(res.code, 0, res.output)
    for (const title of [
      "The default config",
      "The plugin config schema",
      "The quartz.ts template",
      "Core's package.json",
      "Our packages' peer ranges",
    ])
      assert.match(section(res.output, title), /[Nn]othing to report/, title)
    for (const kind of ["Plugin", "Component", "Loader", "Condition", "Frame"])
      assert.match(
        section(res.output, "Exported APIs"),
        new RegExp(`${kind} API: nothing to report`),
      )
    assert.match(
      section(res.output, "The plugin config schema"),
      /site config validates against the target's schema/,
    )
  })
})

describe("an upgrade", () => {
  let fx, res
  before(() => {
    fx = makeFixture({
      targetChanges: {
        "quartz.config.default.yaml": DEFAULT_CONFIG.replace(
          "enablePopovers: false",
          "popovers: false",
        ),
      },
    })
    res = fx.upgrade([`--ref=${fx.target}`])
  })
  after(() => fx.cleanup())

  test("prints the report before it touches the tree", () => {
    assert.equal(res.code, 0, res.output)
    const report = res.output.indexOf("API-surface report")
    assert.notEqual(report, -1)
    assert.ok(report < res.output.indexOf("▸ re-apply vendored changes"), res.output)
    assert.match(res.output, /configuration\.enablePopovers → configuration\.popovers: renamed/)
  })
})

describe("a site config that does not parse", () => {
  let fx, res
  before(() => {
    fx = makeFixture({ coreChanges: { "quartz.config.yaml": "plugins: [\n" } })
    res = fx.upgrade(["--report-only", `--ref=${fx.pinned}`])
  })
  after(() => fx.cleanup())

  test("is reported as an error of the site config, and the report goes on", () => {
    assert.equal(res.code, 0, res.output)
    assert.match(
      section(res.output, "The plugin config schema"),
      /1 error\(s\)[\s\S]*is not valid YAML/,
    )
    assert.match(res.output, /Our packages' peer ranges/)
    assert.equal(fs.existsSync(fx.root), true)
  })
})
