// The editor's annotator region and its protection, against editor states, as Obsidian's editor
// would change them.

import assert from "node:assert/strict"
import { test } from "node:test"
import { updateAnnotation } from "@chaoticgoodcomputing/web-annotations"
import { EditorState } from "@codemirror/state"
import { annotatorWrite, blockAtLine, changeBetween, isAnnotationNoteText, isWebNoteText, protectBlocks, regionField, regionOf, webPageOf } from "../src/editor/region.ts"
import { annotate } from "./notes.ts"

const PDF = "https://example.org/paper.pdf"
const FRONTMATTER = `---\ntitle: A paper\nannotation-target: ${PDF}\n---\n`

/** A note: frontmatter, a preface, two annotations, an epilogue. */
function note(frontmatter = FRONTMATTER) {
  let text = `${frontmatter}\nThe preface.\n`
  text = annotate(text, "aaa", PDF, "passage aaa", "First.")
  text = annotate(text, "bbb", PDF, "passage bbb", "Second.")
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

test("a note whose target is a Dataview inline field has a region too", () => {
  const text = note(`---\ntitle: A paper\n---\nannotation-target:: ${PDF}\n`)
  assert.equal(isAnnotationNoteText(text), true)
  const region = regionOf(text)!
  assert.ok(text.slice(region.from).startsWith("> [!annotation]"))
  assert.ok(text.slice(0, region.to).endsWith("^bbb"))
})

test("a note with a malformed page range is an annotation note, with its region", () => {
  const text = note(`---\nannotation-target: ${PDF}\nannotation-pages: 5-3\n---\n`)
  assert.equal(isAnnotationNoteText(text), true)
  assert.ok(regionOf(text)!.to > regionOf(text)!.from)
})

test("the region runs from the first block's first line to the last block's id line", () => {
  const text = note()
  const region = regionOf(text)!
  assert.ok(text.slice(region.from).startsWith("> [!annotation]"))
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
  const after = updateAnnotation(before, "aaa", { comment: "First, edited." }).text
  const change = changeBetween(before, after)!
  const written = state.update({ changes: change, filter: false, annotations: annotatorWrite.of(true) }).state
  assert.equal(written.doc.toString(), after)
  assert.equal(changeBetween(after, after), null)
})

test("a web page's note has a region as a PDF's does, between its preface and its epilogue", () => {
  const web = note().replace(`annotation-target: ${PDF}\n`, "annotation-target: \"https://example.org/page\"\nannotation-target-type: web\n")
  const region = regionOf(web)!
  const [preface, blocks, epilogue] = [web.slice(0, region.from), web.slice(region.from, region.to), web.slice(region.to)]
  assert.ok(preface.includes("The preface.") && !preface.includes("[!annotation]"))
  assert.ok(epilogue.includes("The epilogue.") && !epilogue.includes("[!annotation]"))
  assert.equal(blocks.match(/\[!annotation\]/g)?.length, 2)
  assert.equal(isWebNoteText(web), true)
  assert.equal(isWebNoteText(note()), false)
  assert.deepEqual(webPageOf(web), { url: "https://example.org/page", end: web.indexOf("---\n", 4) + 4 })
  assert.equal(webPageOf(note()), null)
  // An inline field's web page, under no frontmatter: its bar goes at the top.
  assert.deepEqual(webPageOf("annotation-target:: https://example.org/page\nannotation-target-type:: web\n"), { url: "https://example.org/page", end: 0 })
})

test("a line of a block is known as its block's, with the line the block starts on", () => {
  const text = note()
  const lines = text.split("\n")
  const first = lines.findIndex((line) => line === "> [!annotation]")
  const id = lines.findIndex((line) => line === "^aaa")
  assert.deepEqual([blockAtLine(text, first)?.annotation?.blockId, blockAtLine(text, first)?.firstLine], ["aaa", first])
  assert.equal(blockAtLine(text, id)?.annotation?.blockId, "aaa")
  assert.equal(blockAtLine(text, id)?.firstLine, first)
  assert.equal(blockAtLine(text, lines.findIndex((line) => line === "^bbb"))?.annotation?.blockId, "bbb")
  assert.equal(blockAtLine(text, lines.indexOf("The preface.")), undefined)
  assert.equal(blockAtLine(text, lines.indexOf("The epilogue.")), undefined)
})
