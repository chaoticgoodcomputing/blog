// A note's annotation properties, as the plugin reads them both ways: from Obsidian's index of the
// note (and Dataview's), and from the editor's text. One object goes to web-annotations either way,
// so a note is an annotation note, web or not, with the same target and pages, whichever way.

import assert from "node:assert/strict"
import { describe, test } from "node:test"
import {
  annotationFrontmatter,
  dataviewValue,
  frontmatterOfText,
  propertiesOfText,
  propertyProblem,
  readProperties,
} from "../src/annotation-properties.ts"

/** The metadata cache's way: each property looked up by name, as `propertyOf` looks it up. */
const fromIndex = (properties: Record<string, unknown>) => readProperties(annotationFrontmatter((name) => properties[name]))

describe("from Obsidian's index", () => {
  test("a note with an annotation target is an annotation note", () => {
    assert.deepEqual(fromIndex({ "annotation-target": "https://example.org/paper.pdf", title: "A paper" }), {
      target: "https://example.org/paper.pdf",
      web: false,
      pages: undefined,
      error: undefined,
    })
    assert.equal(fromIndex({ title: "A plain note" }), undefined)
    assert.equal(fromIndex({ "annotation-target": null }), undefined)
  })

  test("a list's first item is the target; `web` is a web page's", () => {
    const read = fromIndex({ "annotation-target": ["https://example.org/page", "https://example.org/other"], "annotation-target-type": "web" })
    assert.equal(read?.target, "https://example.org/page")
    assert.equal(read?.web, true)
  })

  test("pages are a set, sorted and merged", () => {
    assert.deepEqual(fromIndex({ "annotation-target": "a.pdf", "annotation-pages": "9, 3-5, 4-8" })?.pages, [[3, 9]])
    assert.deepEqual(fromIndex({ "annotation-target": "a.pdf", "annotation-pages": [7, "10-12"] })?.pages, [[7, 7], [10, 12]])
  })

  test("malformed pages are an error naming the property, and the target is still known", () => {
    const read = fromIndex({ "annotation-target": "https://example.org/paper.pdf", "annotation-pages": "5-3" })!
    assert.equal(read.error?.property, "annotation-pages")
    assert.equal(read.error?.part, "5-3")
    assert.equal(read.target, "https://example.org/paper.pdf")
    assert.equal(read.pages, undefined)
  })

  test("a target type other than `web` is an error, and the note is not a web page's", () => {
    const read = fromIndex({ "annotation-target": "https://example.org/a.epub", "annotation-target-type": "epub" })!
    assert.equal(read.error?.property, "annotation-target-type")
    assert.equal(read.web, false)
    assert.equal(read.target, "https://example.org/a.epub")
  })

  test("Dataview's values are made plain: its links, a Markdown link's address, its lists", () => {
    const resolve = (path: string) => (path === "papers/a" ? "papers/a.pdf" : undefined)
    assert.equal(dataviewValue({ path: "papers/a" }, resolve), "papers/a.pdf")
    assert.equal(dataviewValue("[the paper](https://example.org/a.pdf)", resolve), "https://example.org/a.pdf")
    assert.equal(dataviewValue("https://example.org/a.pdf", resolve), "https://example.org/a.pdf")
    const list = { values: ["3-5", 9], array: () => ["3-5", 9] }
    assert.deepEqual(dataviewValue(list, resolve), ["3-5", 9])
    assert.equal(dataviewValue(undefined, resolve), undefined)
  })
})

describe("from the editor's text", () => {
  test("the frontmatter's properties, and where the frontmatter ends", () => {
    const text = "---\ntitle: A paper\nannotation-target: \"https://example.org/paper.pdf\"\nannotation-pages:\n  - 3-5\n  - 9\n---\nThe preface.\n"
    const { properties, end } = frontmatterOfText(text)
    assert.equal(properties["annotation-target"], "https://example.org/paper.pdf")
    assert.equal(end, text.indexOf("The preface."))
    assert.deepEqual(propertiesOfText(text)?.pages, [[3, 5], [9, 9]])
  })

  test("a note without an annotation target in its frontmatter is no annotation note", () => {
    assert.equal(propertiesOfText("---\ntitle: x\n---\nannotation-target: https://example.org/a.pdf\n"), undefined)
    assert.equal(propertiesOfText("---\nannotation-target: \n---\n"), undefined)
    assert.equal(propertiesOfText("No frontmatter."), undefined)
    // Frontmatter that isn't YAML has no properties.
    assert.equal(propertiesOfText("---\nannotation-target: [unclosed\n---\n"), undefined)
  })

  test("a Dataview inline field names a target, as Dataview's index has it", () => {
    const text = "---\ntitle: A paper\n---\nannotation-target:: https://example.org/paper.pdf\n\nThe preface.\n"
    assert.equal(propertiesOfText(text)?.target, "https://example.org/paper.pdf")
    assert.equal(propertiesOfText("- annotation-target:: [the page](https://example.org/page)\n- annotation-target-type:: web\n")?.web, true)
    assert.equal(propertiesOfText("A note on [annotation-target:: \"https://example.org/a.pdf\"].")?.target, "https://example.org/a.pdf")
    assert.equal(propertiesOfText("annotation-target:: https://example.org/a.pdf\nannotation-pages:: 3-5, 9\n")?.pages?.length, 2)
    // Not in a code block, or a quote.
    assert.equal(propertiesOfText("```\nannotation-target:: https://example.org/a.pdf\n```\n"), undefined)
    assert.equal(propertiesOfText("> annotation-target:: https://example.org/a.pdf\n"), undefined)
  })

  test("malformed pages in the text are the same error as in the index", () => {
    const text = "---\nannotation-target: https://example.org/a.pdf\nannotation-pages: abc\n---\n"
    const fromText = propertiesOfText(text)!
    const indexed = fromIndex({ "annotation-target": "https://example.org/a.pdf", "annotation-pages": "abc" })!
    assert.equal(fromText.error?.message, indexed.error?.message)
    assert.equal(fromText.target, indexed.target)
  })
})

test("both ways, the same note reads the same", () => {
  const notes: [string, Record<string, unknown>][] = [
    ["---\nannotation-target: https://example.org/page\nannotation-target-type: web\n---\n", { "annotation-target": "https://example.org/page", "annotation-target-type": "web" }],
    ["annotation-target:: https://example.org/a.pdf\nannotation-pages:: 2-8\n", { "annotation-target": "https://example.org/a.pdf", "annotation-pages": "2-8" }],
    ["---\nannotation-target:\n  - papers/a.pdf\nannotation-pages: [3, \"5-6\"]\n---\n", { "annotation-target": ["papers/a.pdf"], "annotation-pages": [3, "5-6"] }],
  ]
  for (const [text, indexed] of notes) assert.deepEqual(propertiesOfText(text), fromIndex(indexed), text)
})

test("a malformed property's notice names the note and the property", () => {
  const error = fromIndex({ "annotation-target": "a.pdf", "annotation-pages": "0" })!.error!
  const message = propertyProblem("annotations/A paper.md", error)
  assert.match(message, /annotations\/A paper\.md/)
  assert.match(message, /annotation-pages/)
  assert.match(message, /"0"/)
})
