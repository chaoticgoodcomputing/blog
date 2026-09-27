// Repo guard `site-config` (#97): the site config validates against Core's plugin config schema
// (Core source's quartz/plugins/quartz-plugins.schema.json), and every error is listed. A missing,
// empty or plugin-less site config fails it too: upstream's default config is pruned, so Quartz has
// nothing to fall back on (#91's prebuild refuses those as well).
//
// To reproduce a failure by hand: in quartz-v5/core/quartz.config.yaml set `enableSPA: "yes"` and give
// one plugin `enabled: maybe`, then `node quartz-v5/utils/guards/site-config.guard.mjs` lists both and
// exits 1. `git checkout -- quartz-v5/core/quartz.config.yaml` undoes it.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { CORE_DIR } from "../core-tiers.mjs"
import { siteConfigSchema, validateSiteConfig } from "../site-config-schema.mjs"
import { runGuard, scratch, writeTree } from "./guard-helpers.mjs"

const valid = `
configuration:
  pageTitle: A site
  enableSPA: true
  locale: en-US
  theme:
    fontOrigin: googleFonts
    cdnCaching: true
    typography: { header: Inter, body: Inter, code: Mono }
    colors:
      lightMode: { light: "#fff" }
      darkMode: { light: "#000" }
  analytics: null
plugins:
  - source: github:quartz-community/explorer
    enabled: true
    layout: { position: left, priority: 10 }
  - source: { repo: https://example.com/p.git, subdir: plugins/x }
    enabled: false
`

// Nine errors, of seven kinds, at different places. `theme.typography` is missing.
const broken = `
configuration:
  pageTitle: A site
  enableSPA: "yes"
  locale: en-US
  pageTitel: typo
  theme:
    fontOrigin: somewhere
    cdnCaching: true
    colors:
      lightMode: {}
      darkMode: {}
plugins:
  - source: github:quartz-community/explorer
    enabled: maybe
    layout: { position: top }
  - source: 42
    enabled: true
  - source: { subdir: plugins/x }
    enabled: true
    order: -1
`

const guardOn = (contents) => {
  const dir = scratch()
  const config = path.join(dir, "quartz.config.yaml")
  if (contents !== undefined) fs.writeFileSync(config, contents)
  return runGuard("site-config", ["--config", config])
}

test("a valid site config passes", () => {
  const { code, out } = guardOn(valid)
  assert.equal(code, 0, out)
})

test("a broken site config: every error is listed, each at its path, and the guard fails", () => {
  const { code, out } = guardOn(broken)
  assert.equal(code, 1, out)
  const expected = [
    ["configuration.enableSPA", /must be boolean/],
    ["configuration.pageTitel", /not allowed/],
    ["configuration.theme.typography", /is required/],
    ["configuration.theme.fontOrigin", /one of "googleFonts", "local"/],
    ["plugins[0].enabled", /must be boolean/],
    ["plugins[0].layout.position", /one of "left"/],
    ["plugins[1].source", /must match one of/],
    ["plugins[2].source", /must match one of/],
    ["plugins[2].order", /must be >= 0/],
  ]
  for (const [at, message] of expected) {
    const line = out.split("\n").find((l) => l.trim().startsWith(`${at}:`))
    assert.ok(line, `${at} is listed:\n${out}`)
    assert.match(line, message)
  }
  assert.match(out, /9 violation\(s\)/)
  // A oneOf that nothing matches says why each alternative failed.
  assert.match(out, /plugins\[2\]\.source:.*repo.*is required/)
})

test("a missing site config fails it", () => {
  const { code, out } = guardOn(undefined)
  assert.equal(code, 1, out)
  assert.match(out, /no site config/i)
})

test("an empty site config fails it", () => {
  for (const empty of ["", "# only a comment\n"]) {
    const { code, out } = guardOn(empty)
    assert.equal(code, 1, out)
    assert.match(out, /empty/i)
  }
})

test("a site config with no plugins list fails it", () => {
  const { code, out } = guardOn(valid.slice(0, valid.indexOf("plugins:")))
  assert.equal(code, 1, out)
  assert.match(out, /plugins.*required/)
})

test("a site config that is not YAML fails it, with the parser's error", () => {
  const { code, out } = guardOn("configuration: [unclosed\n")
  assert.equal(code, 1, out)
  assert.match(out, /not valid YAML/)
})

test("a schema that cannot be read cannot be checked: exit 2", () => {
  const dir = writeTree(scratch(), { "quartz.config.yaml": valid })
  const { code, out } = runGuard("site-config", ["--config", path.join(dir, "quartz.config.yaml"), "--schema", path.join(dir, "none.json")])
  assert.equal(code, 2, out)
})

test("the validator takes its schema as input: a target ref's schema can reject what today's accepts", () => {
  const today = siteConfigSchema(CORE_DIR)
  assert.deepEqual(validateSiteConfig(valid, today), [])
  // A target ref that renamed `enableSPA` to `spa`, say.
  const target = structuredClone(today)
  const conf = target.properties.configuration
  conf.properties.spa = conf.properties.enableSPA
  delete conf.properties.enableSPA
  conf.required = conf.required.map((key) => (key === "enableSPA" ? "spa" : key))
  assert.deepEqual(
    validateSiteConfig(valid, target).map(({ path }) => path),
    ["configuration.spa", "configuration.enableSPA"],
  )
})

test("a schema keyword the validator does not know is an error, never silently passed", () => {
  const errors = validateSiteConfig(valid, { type: "object", patternProperties: { x: {} } })
  assert.equal(errors.length, 1)
  assert.match(errors[0].message, /patternProperties/)
})

// Core's schema lags Core's own loader (plugins/loader/types.ts): the loader takes `header` and
// `footer` positions and a page type's frame `template`, and the site uses them. The schema is
// amended for those, and only those (SCHEMA_AMENDMENTS in utils/site-config-schema.mjs).
const usesWhatTheSchemaLacks = `${valid}  - source: github:quartz-community/footer
    enabled: true
    layout: { position: footer }
  - source: github:quartz-community/header
    enabled: true
    layout: { position: header }
layout:
  byPageType:
    "404": { template: default, exclude: [x] }
`

test("what Core's loader takes but its schema lacks passes: header and footer positions, a page type's template", () => {
  const { code, out } = guardOn(usesWhatTheSchemaLacks)
  assert.equal(code, 0, out)
  const { out: stillBroken } = guardOn(usesWhatTheSchemaLacks.replace("template: default", "template: 3, frame: x"))
  assert.match(stillBroken, /byPageType\.404\.template: must be string/)
  assert.match(stillBroken, /byPageType\.404\.frame: is not allowed/)
})

test("an amendment the schema no longer needs is listed, so it can be retired", () => {
  const dir = scratch()
  const schema = JSON.parse(fs.readFileSync(path.join(CORE_DIR, "quartz/plugins/quartz-plugins.schema.json"), "utf-8"))
  schema.properties.plugins.items.properties.layout.properties.position.enum.push("header", "footer")
  fs.writeFileSync(path.join(dir, "schema.json"), JSON.stringify(schema))
  fs.writeFileSync(path.join(dir, "quartz.config.yaml"), usesWhatTheSchemaLacks)
  const { code, out } = runGuard("site-config", ["--config", path.join(dir, "quartz.config.yaml"), "--schema", path.join(dir, "schema.json")])
  assert.equal(code, 1, out)
  assert.match(out, /1 violation\(s\)/)
  assert.match(out, /already.*header.*footer.*retire/i)
})

test("the real site config passes", () => {
  const { code, out } = runGuard("site-config")
  assert.equal(code, 0, out)
})
