// The shape of the configs behind the site's `quartz.ts` rule (#70): v4's home page components, the
// post listing, the sidebar "Newsletter" box and the social cards, are kept to their pages by the
// site's steering file `quartz.ts`, not by the site config (VENDORED.md, "The site's quartz.ts").
// So the site config leaves the choice of pages to it: the plugins' own page filter is off, and no
// `byPageType` exclusion names one of them. And the rule applies only to a config that loads
// site-components, so no fixture config may load it, or fixture sites would stop being stock ones.
// What a reader sees is `tests/specs/site-index-only.spec.mjs`'s; these are config shape only.
//
// To reproduce a failure by hand: in quartz/core/quartz.config.yaml set quartz-social's
// `showOn: [index]`, then `node --test quartz/utils/test/site-home-page.test.mjs` names it.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { CORE_DIR } from "../core-tiers.mjs"

const YAML = createRequire(path.join(CORE_DIR, "package.json"))("yaml")
const TESTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../tests")
const SITE_CONFIG = path.join(CORE_DIR, "quartz.config.yaml")
const FIXTURE_CONFIG = path.join(TESTS_DIR, "quartz.config.yaml")

const SITE_LAYER = "@chaoticgoodcomputing/site-components"
// Each as `byPageType.exclude` names it: a package source by its package name, an object source by
// its `name`. The plugins with a `showOn` option of their own are marked.
const HOME_PAGE = [
  { name: "@chaoticgoodcomputing/quartz-post-listing", showOn: true },
  { name: "email-subscribe-sidebar", showOn: false },
  { name: "@chaoticgoodcomputing/quartz-social", showOn: true },
]

/** An entry's name as Core's loader and `byPageType.exclude` give it. */
const entryName = (source) => (typeof source === "object" && source ? (source.name ?? source.repo) : source)

/** Every way the site config `text` takes the choice of the home page components' pages from quartz.ts. */
function homePageViolations(text) {
  const config = YAML.parse(text) ?? {}
  const entries = config.plugins ?? []
  const violations = []
  for (const { name, showOn } of HOME_PAGE) {
    const entry = entries.find((e) => e.enabled && entryName(e.source) === name)
    if (!entry) {
      violations.push(`${name}: no enabled entry`)
      continue
    }
    if (showOn && entry.options?.showOn !== false)
      violations.push(`${name}: showOn is ${JSON.stringify(entry.options?.showOn)}, not false`)
    if (entry.layout?.condition)
      violations.push(`${name}: takes the condition "${entry.layout.condition}", which quartz.ts can't see through`)
  }
  for (const [pageType, override] of Object.entries(config.layout?.byPageType ?? {}))
    for (const excluded of override?.exclude ?? [])
      if (HOME_PAGE.some(({ name }) => name === excluded))
        violations.push(`byPageType.${pageType} excludes ${excluded}`)
  return violations
}

/** Every entry of the config `text` that loads site-components. */
const siteLayerEntries = (text) =>
  ((YAML.parse(text) ?? {}).plugins ?? []).filter(({ source }) =>
    [source, source?.repo].includes(SITE_LAYER),
  )

test("a site config that picks the home page components' pages itself is caught, every way at once", () => {
  const broken = `
plugins:
  - source: "@chaoticgoodcomputing/quartz-post-listing"
    enabled: true
    options: { showOn: [index] }
    layout: { position: afterBody, priority: 10 }
  - source: { repo: "@chaoticgoodcomputing/quartz-email-subscribe", name: email-subscribe-sidebar }
    enabled: true
    layout: { position: right, priority: 30, condition: not-index }
  - source: "@chaoticgoodcomputing/quartz-social"
    enabled: true
    layout: { position: right, priority: 40 }
layout:
  byPageType:
    content:
      exclude: [email-subscribe-sidebar]
`
  assert.deepEqual(homePageViolations(broken), [
    '@chaoticgoodcomputing/quartz-post-listing: showOn is ["index"], not false',
    'email-subscribe-sidebar: takes the condition "not-index", which quartz.ts can\'t see through',
    "@chaoticgoodcomputing/quartz-social: showOn is undefined, not false",
    "byPageType.content excludes email-subscribe-sidebar",
  ])
})

test("the site config leaves the home page components' pages to quartz.ts", () => {
  assert.deepEqual(homePageViolations(fs.readFileSync(SITE_CONFIG, "utf8")), [])
})

test("a fixture config that loads site-components is caught, by either source form", () => {
  const broken = `
plugins:
  - source: "@chaoticgoodcomputing/site-components"
    enabled: true
  - source: { repo: "@chaoticgoodcomputing/site-components", name: site-footer }
    enabled: false
`
  assert.equal(siteLayerEntries(broken).length, 2)
})

test("the site config loads site-components, and the fixture config doesn't", () => {
  assert.ok(siteLayerEntries(fs.readFileSync(SITE_CONFIG, "utf8")).length > 0)
  assert.deepEqual(siteLayerEntries(fs.readFileSync(FIXTURE_CONFIG, "utf8")), [])
})
