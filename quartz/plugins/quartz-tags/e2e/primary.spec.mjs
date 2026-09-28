// The tag that stands for a page (#20): the first in its `tags` frontmatter, however deep the
// others, as in v4, with nothing to override it. It is published on
// each page's `fileData.cgcTags`, beside the page's own tags and its expanded ancestor set; the
// fixture's `fixture-tag-reader` writes what each page received to one file.
import { test, expect } from "../../../tests/harness/test.mjs"

const received = (emitted) => JSON.parse(emitted.read("static/fixture-tag-reader.json"))

test("the first tag stands for the page", ({ emitted }) => {
  // tags: [fixture, markdown]
  expect(received(emitted)["plain-note"].primary).toEqual({
    tag: "fixture",
    color: "--cgc-tag-fixture",
    icon: null,
  })
})

// Written out of A→Z order, so an engine that sorted a page's tags, or read them from its expanded
// ancestor set, would pick the other.
test("the first tag in frontmatter order, not A→Z, stands for the page", ({ emitted }) => {
  // tags: [markdown, fixture]
  const page = received(emitted)["tag-engine/first-tag"]
  expect(page.primary.tag).toBe("markdown")
  expect(Object.keys(page.tags)).toEqual(["markdown", "fixture"])
})

test("a deeper tag later on does not take over from the first", ({ emitted }) => {
  // tags: [fixture, writing/essays]
  expect(received(emitted)["tag-engine/deeper-later"].primary).toEqual({
    tag: "fixture",
    color: "--cgc-tag-fixture",
    icon: null,
  })
})

test("publishes the page's own tags and every tag it is under", ({ emitted }) => {
  const page = received(emitted)["tag-engine/deeper-later"]
  expect(Object.keys(page.tags)).toEqual(["fixture", "writing/essays"])
  expect(page.tags["writing/essays"]).toEqual({
    color: "--cgc-tag-writing--essays",
    icon: "mdi:feather",
  })
  expect(page.ancestors).toEqual({
    fixture: { color: "--cgc-tag-fixture", icon: null },
    writing: { color: "--cgc-tag-writing", icon: "mdi:pencil" },
    "writing/essays": { color: "--cgc-tag-writing--essays", icon: "mdi:feather" },
  })
})

test("publishes an empty record for a page with no tags", ({ emitted }) => {
  expect(received(emitted)["tags/fixture"]).toEqual({ tags: {}, primary: null, ancestors: {} })
})
