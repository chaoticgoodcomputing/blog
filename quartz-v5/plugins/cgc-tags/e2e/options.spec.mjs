// cgc-tags checks the site's tag dictionary when it builds, and a mistake fails the build, so a typo
// never ships (#31, #53 story 34). Each case is a scratch site: the content fixture must build.
import { test, expect } from "../../../tests/harness/test.mjs"
import { buildScratchSite, fixtureConfig, withPlugins } from "../../../tests/harness/site.mjs"

const HOME = { "index.md": "---\ntitle: Home\ntags: [fixture]\n---\nHome.\n" }
const withOptions = (options) =>
  withPlugins(fixtureConfig(), [{ source: "../../plugins/cgc-tags", enabled: true, options }])
const build = (name, options, files = HOME) =>
  buildScratchSite(name, files, { config: withOptions(options) })

// A value CSS can't read as a colour; a reference that hides one it can't, on either side of
// `light-dark()` or among a colour function's other arguments; one that would end its declaration in
// the engine's stylesheet and write rules of its own; and one marked important, which would outrank
// a site's own override of the tag's colour property from inside the engine's layer.
for (const color of [
  "#GGG",
  "light-dark(var(--secondary), junk)",
  "color-mix(in srgb, var(--secondary), junk)",
  "rgb(var(--r), junk, 3)",
  "red; } body { display: none",
  "red !important",
  "var(--secondary) !important",
]) {
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
      d: { color: "color-mix(in srgb, var(--secondary) 40%, var(--tertiary))" },
      e: { color: "hsl(var(--hue) 50% 50%)" },
      f: { color: "light-dark(var(--secondary), var(--tertiary, rgb(0 0 0)))" },
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

// Two keys the engine would read as one tag, once each is normalised.
test("fails the build on two keys that are the same tag", async () => {
  const { code, output } = await build("tags-same-tag", { tags: { "a b": {}, "a-b": {} } })
  expect(code).not.toBe(0)
  expect(output).toContain(`cgc-tags: "a b" and "a-b" are the same tag, "a-b"`)
})

test("fails the build on an option the engine doesn't have", async () => {
  const { code, output } = await build("tags-bad-option", { tags: {}, colours: {} })
  expect(code).not.toBe(0)
  expect(output).toContain(`cgc-tags: unknown option "colours".`)
})

test("fails the build on an icon that isn't prefix:name", async () => {
  const { code, output } = await build("tags-bad-icon", { tags: { fixture: { icon: "pencil" } } })
  expect(code).not.toBe(0)
  expect(output).toContain(
    `cgc-tags: the icon of tag "fixture" is not an icon id, prefix:name: "pencil"`,
  )
})

// A level of the hierarchy is written `--` in a colour property (#31), so `a/b` and a tag spelt
// `a--b` would set the same one. The corpus's tags are read in order, and `-` sorts before `/`.
test("fails the build on two tags that would share a colour property", async () => {
  const files = { "index.md": "---\ntitle: Home\ntags: [fixture, a/b, a--b]\n---\nHome.\n" }
  const { code, output } = await build("tags-collision", { tags: {} }, files)
  expect(code).not.toBe(0)
  expect(output).toContain(
    `cgc-tags: tags "a--b" and "a/b" would share the custom property --cgc-tag-a--b. Rename one.`,
  )
})
