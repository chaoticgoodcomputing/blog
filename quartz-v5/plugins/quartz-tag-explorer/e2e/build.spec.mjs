// Builds that must fail (#53 story 34): the explorer draws every tag's icon when the site builds, so
// an icon id that no collection has fails the build, in this plugin's words, whichever pages show the
// tag; and so does a mistake in its own options. Scratch sites: the content fixture must build.
import { test, expect } from "../../../tests/harness/test.mjs"
import { buildScratchSite, fixtureConfig, othersOff, withPlugins } from "../../../tests/harness/site.mjs"

const HOME = { "index.md": "---\ntitle: Home\ntags: [fixture]\n---\nHome.\n" }
const EXPLORER = {
  source: "@chaoticgoodcomputing/quartz-tag-explorer",
  enabled: true,
  layout: { position: "left", priority: 55 },
}
// Every other plugin of ours is off, so no other that draws icons fails the build first. The
// explorer's entry is replaced whole, since the one that anchors `&iconCollections` is off.
const OTHERS = othersOff(fixtureConfig(), ["quartz-styles", "quartz-tags", "quartz-tag-explorer"])

const build = (tags, options = {}) =>
  buildScratchSite("tag-explorer-build", HOME, {
    config: withPlugins(fixtureConfig(), [
      { source: "@chaoticgoodcomputing/quartz-tags", enabled: true, options: { tags } },
      { ...EXPLORER, options: { iconCollections: { custom: "../fixture-icons" }, ...options } },
      ...OTHERS,
    ]),
  })

test("fails the build on an icon id no collection has", async () => {
  const { code, output } = await build({ fixture: { icon: "mdi:no-such-icon" } })
  expect(code).not.toBe(0)
  expect(output).toContain(
    'cgc-tag-explorer: tag "fixture": unknown icon "mdi:no-such-icon": the "mdi" collection has no icon "no-such-icon"',
  )
})

test("fails the build on an option it doesn't have", async () => {
  const { code, output } = await build({}, { excludeTag: ["private"] })
  expect(code).not.toBe(0)
  expect(output).toContain('cgc-tag-explorer: unknown option "excludeTag"')
})
