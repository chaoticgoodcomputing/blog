// The tag that stands for a page (#20): its most specific tag, where the first in frontmatter order
// breaks a tie, unless its `primaryTag` frontmatter names another of its tags. It is published on
// each page's `fileData.cgcTags`, beside the page's own tags and its expanded ancestor set; the
// fixture's `fixture-tag-reader` writes what each page received to one file.
import { test, expect } from "../../../tests/harness/test.mjs"

const received = (emitted) => JSON.parse(emitted.read("static/fixture-tag-reader.json"))

test("the first tag breaks a tie between equally specific tags", ({ emitted }) => {
  // tags: [fixture, markdown]
  expect(received(emitted)["plain-note"].primary).toEqual({
    tag: "fixture",
    color: "--cgc-tag-fixture",
    icon: null,
  })
})

test("the most specific tag wins over an earlier one", ({ emitted }) => {
  // tags: [fixture, writing/essays]
  expect(received(emitted)["tag-engine/most-specific"].primary).toEqual({
    tag: "writing/essays",
    color: "--cgc-tag-writing--essays",
    icon: "mdi:feather",
  })
})

test("primaryTag overrides the first-tag tie-break", ({ emitted }) => {
  // tags: [fixture, markdown], primaryTag: markdown
  expect(received(emitted)["tag-engine/primary-override"].primary).toEqual({
    tag: "markdown",
    color: "--cgc-tag-markdown",
    icon: null,
  })
})

test("publishes the page's own tags and every tag it is under", ({ emitted }) => {
  const page = received(emitted)["tag-engine/most-specific"]
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
