// The format against every annotation note of the vault: the notes this package has to go on
// reading and writing as Upstream wrote them. The notes are only ever read.

import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { parseNote, removeAnnotation, serializeBlock, upsertAnnotation } from "../src/index.ts"

const ANNOTATIONS = path.resolve(import.meta.dirname, "../../../../content/public/content/annotations")

function notesIn(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const at = path.join(dir, entry.name)
    if (entry.isDirectory()) return notesIn(at)
    return entry.name.endsWith(".md") ? [at] : []
  })
}

const notes = notesIn(ANNOTATIONS).map((file) => ({
  name: path.relative(ANNOTATIONS, file),
  source: fs.readFileSync(file, "utf8"),
}))
const crlf = (text: string) => text.replace(/\r?\n/g, "\r\n")

// Blocks that are known not to come back exactly as they are, each with the reason. A block that
// does not round-trip and is not here fails the test; so does one here that does.
//
// Each of these had its comment edited in its view, in Obsidian, after the Annotator wrote it, and
// its record still has the comment as it was. The view's comment is the one read, as Upstream reads
// it, so writing the block back puts that comment in its record too.
const KNOWN: Record<string, string> = {
  // college-admissions-and-the-stability-of-marriage.md: a link in the comment, which Obsidian
  // rewrote to the note's full path when the note it links to moved, in the view and not the record.
  "18iax7g01jo": "a link in the view's comment rewritten by Obsidian",
  // The same note: "Benefits Group A" corrected to "Benefit to Group A" in the view.
  qrpzbdvom6: "a typo corrected in the view's comment",
}

/** A note with each of its known blocks written back, which is what rewriting it gives. */
function rewritten(text: string): string {
  let written = text
  for (const block of parseNote(text).blocks.reverse()) {
    if (!KNOWN[block.id]) continue
    const lineEnding = text.includes("\r\n") ? "\r\n" : "\n"
    const again = serializeBlock(block.annotation!, { ...block.view, lineEnding })
    written = written.slice(0, block.span.start) + again + written.slice(block.span.end)
  }
  return written
}

test("the vault has annotation notes with blocks in them", () => {
  const blocks = notes.flatMap((note) => parseNote(note.source).blocks)
  assert.ok(notes.length > 0, `no notes under ${ANNOTATIONS}`)
  assert.ok(blocks.length > 0)
  // Every quoted record of the vault is found as a block.
  const records = notes.reduce((count, n) => count + n.source.split(">```annotation-json").length - 1, 0)
  assert.equal(blocks.length, records)
  const withBlocks = notes.filter((n) => parseNote(n.source).blocks.length).length
  console.log(`${notes.length} notes, ${withBlocks} with blocks, ${blocks.length} blocks`)
})

for (const { name, source } of notes) {
  test(`${name}: every block reads, and is written back exactly as it is`, () => {
    for (const eol of ["\n", "\r\n"] as const) {
      const text = eol === "\n" ? source : crlf(source)
      const note = parseNote(text)
      for (const block of note.blocks) {
        assert.equal(block.problem, undefined, `^${block.id}: ${block.problem}`)
        const written = serializeBlock(block.annotation!, { ...block.view, lineEnding: eol })
        const original = text.slice(block.span.start, block.span.end)
        if (KNOWN[block.id]) assert.notEqual(written, original, `^${block.id} round-trips now`)
        else assert.equal(written, original, `^${block.id}`)
      }
    }
  })

  test(`${name}: rewriting every block unchanged leaves the note as it was`, () => {
    for (const text of [source, crlf(source)]) {
      let written = text
      for (const annotation of parseNote(text).annotations) {
        written = upsertAnnotation(written, annotation).note
      }
      // Byte for byte, but for the known blocks, whose records take their views' comments.
      assert.equal(written, rewritten(text))
      // And once those are written back, rewriting changes nothing more.
      let again = written
      for (const annotation of parseNote(written).annotations) {
        again = upsertAnnotation(again, annotation).note
      }
      assert.equal(again, written)
    }
  })

  test(`${name}: removing a block and writing it again leaves the preface and the epilogue`, () => {
    for (const text of [source, crlf(source)]) {
      const eol = text.includes("\r\n") ? "\r\n" : "\n"
      const note = parseNote(text)
      const preface = text.slice(note.preface.start, note.preface.end)
      const epilogue = text.slice(note.epilogue.start, note.epilogue.end)
      for (const block of note.blocks) {
        const removed = removeAnnotation(text, block.id)
        assert.equal(parseNote(removed).blocks.length, note.blocks.length - 1)
        const again = upsertAnnotation(removed, block.annotation!, block.view).note
        const after = parseNote(again)
        assert.equal(after.blocks.at(-1)!.id, block.id)
        if (note.blocks.length > 1) {
          assert.equal(again.slice(after.preface.start, after.preface.end), preface)
          assert.equal(again.slice(after.epilogue.start, after.epilogue.end), epilogue)
        }
        // The last block, removed and written again, is where it was, when it was as far from the
        // block before as the Annotator writes blocks. Some are further, where Upstream removed a
        // block between them and left its blank lines; it is written back the usual distance.
        const previous = note.blocks.at(-2)
        const usual = previous && text.slice(previous.span.end, block.span.start) === eol + eol
        if (block === note.blocks.at(-1) && usual && !KNOWN[block.id]) assert.equal(again, text)
      }
    }
  })
}
