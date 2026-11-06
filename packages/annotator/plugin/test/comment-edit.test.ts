// A card's comment, edited: the comment alone, written back by the format; and wikilinks typed in it.

import assert from "node:assert/strict"
import { test } from "node:test"
import { parseNote, upsertAnnotation } from "@chaoticgoodcomputing/annotator-format"
import { completeWikilink, wikilinkQuery, withComment } from "../src/comment-edit.ts"

const FRONTMATTER = "---\nannotation-target: \"https://example.org/page\"\nannotation-target-type: web\n---\n"
const annotation = (id: string, text: string) => ({ id, text, tags: ["food"], target: [{ source: "https://example.org/page", selector: [{ type: "TextQuoteSelector", exact: `passage ${id}` }] }] })

function note() {
  let text = `${FRONTMATTER}\nThe preface.\n`
  text = upsertAnnotation(text, annotation("aaa", "First.")).note
  text = upsertAnnotation(text, annotation("bbb", "Second.")).note
  return `${text}\nThe epilogue.\n`
}

test("a comment edited is written into its record and its view, and nothing else changes", () => {
  const before = note()
  const after = withComment(before, "aaa", "First, and [[flatland]].", "2026-11-06T12:00:00.000Z")
  const blocks = parseNote(after).blocks
  assert.equal(blocks[0]!.annotation!.text, "First, and [[flatland]].")
  assert.equal((blocks[0]!.record as { text?: string }).text, "First, and [[flatland]].")
  assert.equal(blocks[0]!.annotation!.updated, "2026-11-06T12:00:00.000Z")
  assert.deepEqual(blocks[0]!.annotation!.tags, ["food"])
  assert.equal(blocks[1]!.annotation!.text, "Second.")
  assert.ok(after.includes("The preface.") && after.endsWith("The epilogue.\n"))
})

test("a comment over lines, or with quote marks of its own, still makes a block that reads back", () => {
  const comment = "> Quoted.\n\nAnd %%COMMENT%% said, \"too\"."
  const after = withComment(note(), "bbb", comment, "2026-11-06T12:00:00.000Z")
  assert.equal(parseNote(after).blocks[1]!.annotation!.text, comment)
  assert.equal(parseNote(after).blocks.length, 2)
})

test("a comment of an annotation the note doesn't have changes nothing", () => {
  assert.equal(withComment(note(), "nope", "x", "2026-11-06T12:00:00.000Z"), note())
})

test("the note name typed after [[ is the query; none outside a link", () => {
  assert.equal(wikilinkQuery("See [[flat"), "flat")
  assert.equal(wikilinkQuery("See [["), "")
  assert.equal(wikilinkQuery("See [[flatland]] and"), null)
  assert.equal(wikilinkQuery("See [[flatland|the"), null)
  assert.equal(wikilinkQuery("No link"), null)
})

test("a wikilink completes in place, taking a ]] already after the caret", () => {
  assert.deepEqual(completeWikilink("See [[fla and on", 9, "flatland"), { text: "See [[flatland]] and on", caret: 16 })
  assert.deepEqual(completeWikilink("See [[fla]]", 9, "flatland"), { text: "See [[flatland]]", caret: 16 })
})
