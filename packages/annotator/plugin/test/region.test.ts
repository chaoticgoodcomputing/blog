// The editor's annotator region and its protection, against editor states, as Obsidian's editor
// would change them.

import assert from "node:assert/strict"
import { test } from "node:test"
import { upsertAnnotation } from "@chaoticgoodcomputing/annotator-format"
import { EditorState } from "@codemirror/state"
import { annotatorWrite, changeBetween, isAnnotationNoteText, protectBlocks, regionField, regionOf } from "../src/editor/region.ts"

const FRONTMATTER = "---\ntitle: A paper\nannotation-target: https://example.org/paper.pdf\n---\n"
const annotation = (id: string, text: string) => ({ id, text, target: [{ source: "https://example.org/paper.pdf", selector: [{ type: "TextQuoteSelector", exact: `passage ${id}` }] }] })

/** A note: frontmatter, a preface, two annotations, an epilogue. */
function note() {
  let text = `${FRONTMATTER}\nThe preface.\n`
  text = upsertAnnotation(text, annotation("aaa", "First.")).note
  text = upsertAnnotation(text, annotation("bbb", "Second.")).note
  return `${text}\nThe epilogue.\n`
}

const stateOf = (doc: string) => EditorState.create({ doc, extensions: [regionField, protectBlocks] })

test("an annotation note is known by its frontmatter's annotation target", () => {
  assert.equal(isAnnotationNoteText(FRONTMATTER), true)
  assert.equal(isAnnotationNoteText("---\nannotation-target:\n  - https://example.org/a.pdf\n---\n"), true)
  assert.equal(isAnnotationNoteText("---\ntitle: x\n---\nannotation-target: https://example.org/a.pdf\n"), false)
  assert.equal(isAnnotationNoteText("---\nannotation-target: \n---\n"), false)
  assert.equal(isAnnotationNoteText("No frontmatter."), false)
  assert.equal(regionOf("A plain note."), null)
})

test("the region runs from the first block's first line to the last block's id line", () => {
  const text = note()
  const region = regionOf(text)!
  assert.ok(text.slice(region.from).startsWith(">%%"))
  assert.ok(text.slice(0, region.to).endsWith("^bbb"))
  assert.equal(text.slice(region.to), "\n\nThe epilogue.\n")
  // No blocks: an empty region at the end, where the first will go.
  const empty = `${FRONTMATTER}\nThe preface.\n`
  assert.deepEqual(regionOf(empty), { from: empty.length, to: empty.length })
})

test("the region follows the note's changes", () => {
  const state = stateOf(note())
  const before = state.field(regionField)!
  const after = state.update({ changes: { from: state.doc.toString().indexOf("The preface."), insert: "More. " } }).state
  assert.equal(after.field(regionField)!.from, before.from + "More. ".length)
})

test("no edit reaches into the blocks", () => {
  const state = stateOf(note())
  const text = state.doc.toString()
  const { from, to } = state.field(regionField)!
  const edited = (changes: { from: number; to?: number; insert?: string }) => state.update({ changes }).state.doc.toString()
  // Typing inside a block, or at its first line's start or its id line's end, is dropped.
  assert.equal(edited({ from: from + 5, insert: "x" }), text)
  assert.equal(edited({ from, insert: "x" }), text)
  assert.equal(edited({ from: to, insert: "x" }), text)
  // Joining the line above or below to a block is dropped too.
  assert.equal(edited({ from: from - 1, to: from }), text)
  assert.equal(edited({ from: to, to: to + 1 }), text)
  // A selection across the blocks deletes what is outside them, and leaves the blocks.
  const across = edited({ from: from - 3, to: to + 3 })
  assert.equal(regionOf(across)!.to - regionOf(across)!.from, to - from)
})

test("editing beside the blocks is editing the preface or the epilogue", () => {
  const state = stateOf(note())
  const text = state.doc.toString()
  const { from, to } = state.field(regionField)!
  // On the blank line above the blocks, and on the line below them.
  assert.equal(state.update({ changes: { from: from - 1, insert: "Above." } }).state.doc.toString(), text.slice(0, from - 1) + "Above." + text.slice(from - 1))
  assert.equal(state.update({ changes: { from: to + 1, insert: "Below." } }).state.doc.toString(), text.slice(0, to + 1) + "Below." + text.slice(to + 1))
})

test("the plugin's own writes reach the blocks", () => {
  const state = stateOf(note())
  const before = state.doc.toString()
  const after = upsertAnnotation(before, annotation("aaa", "First, edited.")).note
  const change = changeBetween(before, after)!
  const written = state.update({ changes: change, filter: false, annotations: annotatorWrite.of(true) }).state
  assert.equal(written.doc.toString(), after)
  assert.equal(changeBetween(after, after), null)
})
