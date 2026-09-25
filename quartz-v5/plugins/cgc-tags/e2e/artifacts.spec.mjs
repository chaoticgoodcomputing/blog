// What cgc-tags publishes is a contract other plugins build on (ADR-0002, #20, #31), so its shape is
// pinned here, as a consumer or a downstream site sees it:
//
// - `static/cgcTags.json`: every tag in the corpus, each ancestor of one included, mapped to
//   `{ color, icon }`: its colour property's name and its icon id, its own or its nearest ancestor's;
// - a stylesheet in the family layer, `cgc.tags`, defining one `--cgc-tag-<tag>` per tag on `:root`,
//   `/` written `--`. A tag's own colour value; else `var()` of its parent's property; at the top,
//   `var(--cgc-tags-default)`, which is `var(--darkgray)`.
//
// The fixture's dictionary is in tests/quartz.config.yaml.
import { test, expect } from "../../../tests/harness/test.mjs"

test("maps every tag in the corpus to its colour property and icon id", ({ emitted }) => {
  const index = JSON.parse(emitted.read("static/cgcTags.json"))
  expect(index["fixture"]).toEqual({ color: "--cgc-tag-fixture", icon: null })
  // `writing: { color: "var(--secondary)", icon: "mdi:pencil" }`, which no page is tagged with alone.
  expect(index["writing"]).toEqual({ color: "--cgc-tag-writing", icon: "mdi:pencil" })
  // An icon of its own, and one inherited.
  expect(index["writing/essays"]).toEqual({
    color: "--cgc-tag-writing--essays",
    icon: "mdi:feather",
  })
  expect(index["writing/articles"]).toEqual({
    color: "--cgc-tag-writing--articles",
    icon: "mdi:pencil",
  })
  // Only `.mdx` pages carry `mdx`, and page types generate those.
  expect(index["mdx"]).toEqual({ color: "--cgc-tag-mdx", icon: null })
  for (const [tag, properties] of Object.entries(index)) {
    expect(Object.keys(properties).sort(), tag).toEqual(["color", "icon"])
  }
})

// Every declaration in the `:root` rules of the `cgc.tags` layer, as the page's browser parsed them.
const tagProperties = (page) =>
  page.evaluate(() => {
    const found = {}
    const visit = (rules, layer) => {
      for (const rule of rules) {
        if (rule instanceof CSSLayerBlockRule) visit(rule.cssRules, [...layer, rule.name])
        else if (
          rule instanceof CSSStyleRule &&
          layer.join(".") === "cgc.tags" &&
          rule.selectorText === ":root"
        ) {
          for (const name of rule.style) found[name] = rule.style.getPropertyValue(name).trim()
        } else if (rule.cssRules) visit(rule.cssRules, layer)
      }
    }
    for (const sheet of document.styleSheets) {
      try {
        visit(sheet.cssRules, [])
      } catch {
        // a cross-origin sheet, a font CDN's, is not ours
      }
    }
    return found
  })

test("defines one --cgc-tag-* property per tag, inheriting through var()", async ({
  page,
  emitted,
}) => {
  await page.goto("/plain-note")
  const properties = await tagProperties(page)
  expect(properties).toMatchObject({
    "--cgc-tags-default": "var(--darkgray)",
    "--cgc-tag-fixture": "#0a7d32",
    "--cgc-tag-markdown": "light-dark(#b35f00, #de8200)",
    "--cgc-tag-writing": "var(--secondary)",
    "--cgc-tag-writing--essays": "var(--cgc-tag-writing)",
    "--cgc-tag-mdx": "var(--cgc-tags-default)",
  })
  // One per tag in the index, and the default.
  const index = JSON.parse(emitted.read("static/cgcTags.json"))
  expect(Object.keys(properties).sort()).toEqual(
    ["--cgc-tags-default", ...Object.values(index).map((p) => p.color)].sort(),
  )
})
