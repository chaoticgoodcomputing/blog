// cgc-tags checks the site's tag dictionary when it builds, and a mistake fails the build, so a typo
// never ships (#31, #53 story 34). Each case is a scratch site: the content fixture must build.
import { test, expect } from "../../../tests/harness/test.mjs"
import { buildScratchSite, fixtureConfig, withPlugins } from "../../../tests/harness/site.mjs"

const HOME = { "index.md": "---\ntitle: Home\ntags: [fixture]\n---\nHome.\n" }
const withOptions = (options) =>
  withPlugins(fixtureConfig(), [{ source: "../../plugins/cgc-tags", enabled: true, options }])
const build = (name, options, files = HOME) =>
  buildScratchSite(name, files, { config: withOptions(options) })

// A value CSS can't read as a colour, a reference that hides one it can't, and one that would end
// its declaration in the engine's stylesheet and write rules of its own.
for (const color of ["#GGG", "light-dark(var(--secondary), junk)", "red; } body { display: none"]) {
  test(`fails the build on a colour CSS can't read: ${color}`, async () => {
    const { code, output } = await build("tags-bad-colour", { tags: { fixture: { color } } })
    expect(code).not.toBe(0)
    expect(output).toContain(
      `cgc-tags: the colour of tag "fixture" is not a CSS colour: ${JSON.stringify(color)}`,
    )
  })
}

test("builds with any colour CSS can read, references included", async () => {
  const { code, output } = await build("tags-good-colours", {
    tags: {
      fixture: { color: "color-mix(in srgb, var(--secondary), #fff 20%)" },
      a: { color: "oklch(70% 0.1 200)" },
      b: { color: "rgb(var(--channels, 0 0 0) / 50%)" },
      c: { color: "currentcolor" },
    },
    defaultColor: "var(--gray, gray)",
  })
  expect(code, output).toBe(0)
})

test("fails the build on a field a tag doesn't have", async () => {
  const { code, output } = await build("tags-bad-field", {
    tags: { fixture: { colour: "#0a7d32" } },
  })
  expect(code).not.toBe(0)
  expect(output).toContain(
    `cgc-tags: tag "fixture" has "colour", which is not a tag's field. A tag has "color" and "icon".`,
  )
})

test("fails the build on a primaryTag that isn't one of the page's tags", async () => {
  const files = {
    "index.md": "---\ntitle: Home\ntags: [fixture, markdown]\nprimaryTag: writing\n---\nHome.\n",
  }
  const { code, output } = await build("tags-bad-primary", { tags: {} }, files)
  expect(code).not.toBe(0)
  expect(output).toContain(
    `cgc-tags: index.md: primaryTag "writing" is not one of the page's tags (fixture, markdown)`,
  )
})
