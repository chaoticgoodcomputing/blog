// A card's comment, edited: the comment alone, as the block's Markdown, written back by
// web-annotations; and wikilinks typed in it.

import assert from "node:assert/strict"
import { test } from "node:test"
import { readNote } from "@chaoticgoodcomputing/web-annotations"
import { completeWikilink, wikilinkQuery, withComment } from "../src/comment-edit.ts"
import { annotate } from "./notes.ts"

const PAGE = "https://example.org/page"
const FRONTMATTER = `---\nannotation-target: "${PAGE}"\nannotation-target-type: web\n---\n`
const NOW = "2026-11-11T09:00:00.000Z"

function note() {
  let text = `${FRONTMATTER}\nThe preface.\n`
  text = annotate(text, "aaa", PAGE, "passage aaa", "First.", ["food"])
  text = annotate(text, "bbb", PAGE, "passage bbb", "Second.")
  return `${text}\nThe epilogue.\n`
}

test("a comment edited is the block's comment, as Markdown, and nothing else changes", () => {
  const before = note()
  const after = withComment(before, "aaa", "First, and [[flatland]].", NOW)
  const [first, second] = readNote(after).annotations
  assert.equal(first!.comment, "First, and [[flatland]].")
  assert.ok(after.includes("> First, and [[flatland]].\n^aaa"))
  assert.equal(first!.record.modified, NOW)
  assert.ok(JSON.stringify(first!.record.body).includes('"food"'))
  assert.deepEqual([second!.record, second!.comment], [readNote(before).annotations[1]!.record, "Second."])
  assert.equal(after.slice(0, readNote(after).annotations[0]!.span.start), before.slice(0, readNote(before).annotations[0]!.span.start))
  assert.ok(after.endsWith("The epilogue.\n"))
})

test("a comment over lines, with a callout of its own, still makes a block that reads back", () => {
  const comment = "> [!NOTE]\n> Quoted.\n\nAnd %%COMMENT%% said, \"too\"."
  const after = withComment(note(), "bbb", comment, NOW)
  assert.equal(readNote(after).annotations[1]!.comment, comment)
  assert.equal(readNote(after).annotations.length, 2)
  assert.deepEqual(readNote(after).errors, [])
})

test("an emptied comment leaves a highlight; the same comment changes nothing", () => {
  const emptied = withComment(note(), "aaa", "", NOW)
  assert.equal(readNote(emptied).annotations[0]!.comment, "")
  assert.equal(withComment(note(), "aaa", "First.", NOW), note())
})

test("a comment of an annotation the note doesn't have changes nothing", () => {
  assert.equal(withComment(note(), "nope", "x", NOW), note())
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
