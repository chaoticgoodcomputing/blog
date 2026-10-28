import assert from "node:assert/strict"
import { test } from "node:test"
import {
  type Annotation,
  parseNote,
  removeAnnotation,
  serializeBlock,
  upsertAnnotation,
} from "../src/index.ts"

// A block as Upstream writes it, with every part of its view: written out by hand from Upstream's
// `makeAnnotationString`, so a test reads what a note holds.
const RECORD =
  '{"text":"Read this **twice**.\\n\\nSee [[flatland]].","target":[{"source":"https://example.com/h.pdf",' +
  '"selector":[{"type":"TextPositionSelector","start":40,"end":59},{"type":"TextQuoteSelector",' +
  '"exact":"Welcome to Flatland","prefix":"E M P L O Y E E S ","suffix":" FIRST EDITION"}]}],' +
  '"created":"2026-03-26T16:24:56.949Z","updated":"2026-03-26T16:24:56.949Z","uri":"https://example.com/h.pdf"}'
const block = (id: string, record = RECORD, tags = "#management, #flat orgs") =>
  ">%%\n" +
  ">```annotation-json\n" +
  `>${record}\n` +
  ">```\n" +
  ">%%\n" +
  ">*%%PREFIX%%E M P L O Y E E S%%HIGHLIGHT%% ==Welcome to Flatland== %%POSTFIX%%FIRST EDITION*\n" +
  `>%%LINK%%[[#^${id}|show annotation]]\n` +
  ">%%COMMENT%%\n" +
  ">Read this **twice**.\n" +
  ">\n" +
  ">See [[flatland]].\n" +
  ">%%TAGS%%\n" +
  `>${tags}\n` +
  `^${id}\n`

const FRONTMATTER = "---\nannotation-target: https://example.com/h.pdf\n---\n\n\n"
const A = block("aaa")
const B = block("bbb")
const C = block("ccc")

const slice = (text: string, span: { start: number; end: number }) => text.slice(span.start, span.end)
const crlf = (text: string) => text.replace(/\r?\n/g, "\r\n")

test("a note's layout: the preface before the first block, the blocks, the epilogue after the last", () => {
  const source = `${FRONTMATTER}Some words.\n\n\n${A}\n\nBetween.\n\n${B}\n\nAfterwards.\n`
  const note = parseNote(source)
  assert.equal(slice(source, note.preface), `${FRONTMATTER}Some words.\n\n\n`)
  assert.deepEqual(note.blocks.map((b) => [b.id, slice(source, b.span)]), [["aaa", A], ["bbb", B]])
  assert.equal(slice(source, note.epilogue), "\n\nAfterwards.\n")
  assert.deepEqual(note.annotations.map((a) => a.id), ["aaa", "bbb"])
})

test("a note with no blocks is all preface, with an empty epilogue at its end", () => {
  const note = parseNote(FRONTMATTER)
  assert.deepEqual(note.preface, { start: 0, end: FRONTMATTER.length })
  assert.deepEqual(note.epilogue, { start: FRONTMATTER.length, end: FRONTMATTER.length })
  assert.deepEqual(note.blocks, [])
})

test("an annotation is its record, with the fields the record leaves out filled in as Upstream does", () => {
  const [annotation] = parseNote(A).annotations as [Annotation]
  assert.equal(annotation.id, "aaa")
  assert.equal(annotation.text, "Read this **twice**.\n\nSee [[flatland]].")
  assert.deepEqual(annotation.tags, ["management", "flat orgs"])
  assert.equal(annotation.created, "2026-03-26T16:24:56.949Z")
  assert.equal(annotation.group, "__world__")
  assert.equal(annotation.user, "Obsidian User")
  assert.deepEqual(annotation.user_info, { display_name: "Obsidian User" })
  assert.equal(annotation.flagged, false)
  // The text either side of the passage is the record's, not the view's trimmed copy of it.
  assert.deepEqual(annotation.target![0]!.selector![1], {
    type: "TextQuoteSelector",
    exact: "Welcome to Flatland",
    prefix: "E M P L O Y E E S ",
    suffix: " FIRST EDITION",
  })
  // The record is there too, as the JSON has it.
  assert.deepEqual(parseNote(A).blocks[0]!.record, JSON.parse(RECORD))
})

test("a block is found at the very start of a note, with no blank line before it", () => {
  assert.deepEqual(parseNote(`${A}\n\n${B}`).blocks.map((b) => b.id), ["aaa", "bbb"])
})

test("a block is found with CRLF line breaks, and written back with them", () => {
  const source = crlf(`${FRONTMATTER}${A}\n\n${B}\n\nAfterwards.\n`)
  const note = parseNote(source)
  assert.deepEqual(note.blocks.map((b) => b.id), ["aaa", "bbb"])
  assert.equal(note.annotations[0]!.text, "Read this **twice**.\n\nSee [[flatland]].")
  assert.equal(slice(source, note.blocks[1]!.span), crlf(B))
  // Updated in place, and a new one after the last, each with the note's line breaks.
  const updated = upsertAnnotation(source, { ...note.annotations[0]!, text: "Changed.\nTwice." }).note
  assert.equal(updated, source.replace(crlf(A), crlf(A).replace(
    "Read this **twice**.\\n\\nSee [[flatland]].", "Changed.\\nTwice.").replace(
    ">Read this **twice**.\r\n>\r\n>See [[flatland]].", ">Changed.\r\n>Twice.")))
  const added = upsertAnnotation(source, { ...note.annotations[0]!, id: "ddd" }).note
  assert.equal(added, crlf(`${FRONTMATTER}${A}\n\n${B}\n\n${block("ddd")}\n\nAfterwards.\n`))
})

test("a block whose id line ends the note, with no line break, is found and kept without one", () => {
  const source = `${FRONTMATTER}${A.slice(0, -1)}`
  const note = parseNote(source)
  assert.equal(note.blocks[0]!.span.end, source.length)
  assert.equal(upsertAnnotation(source, note.annotations[0]!).note, source)
  // A block written after it starts on a line of its own.
  const added = upsertAnnotation(source, { ...note.annotations[0]!, id: "bbb" }).note
  assert.equal(added, `${FRONTMATTER}${A}\n\n${B}`)
})

test("what is not a block is not read as one", () => {
  // No `^id` line after it, a line that is not quoted inside it, an id that is not letters and digits.
  const noId = A.replace("^aaa\n", "")
  const broken = A.replace(">%%COMMENT%%\n", "%%COMMENT%%\n")
  const badId = A.replace("^aaa\n", "^aa-a\n")
  for (const source of [noId, broken, badId]) assert.deepEqual(parseNote(source).blocks, [])
})

test("a block whose record is not JSON is a block of the layout, with no annotation", () => {
  const source = `${A}\n\n${block("bbb", '{"text": oops')}\n\n${C}`
  const note = parseNote(source)
  assert.deepEqual(note.blocks.map((b) => b.id), ["aaa", "bbb", "ccc"])
  assert.equal(note.blocks[1]!.annotation, undefined)
  assert.match(note.blocks[1]!.problem!, /not JSON/)
  assert.deepEqual(note.annotations.map((a) => a.id), ["aaa", "ccc"])
})

test("a block whose view is not Upstream's shape is read from its record alone", () => {
  const source = A.replace(">%%LINK%%", ">%%LUNK%%")
  const [read] = parseNote(source).blocks
  assert.equal(read!.view, undefined)
  assert.match(read!.problem!, /view/)
  assert.equal(read!.annotation!.text, "Read this **twice**.\n\nSee [[flatland]].")
  assert.deepEqual(read!.annotation!.tags, [])
})

test("what was edited in a view is read from it, as Upstream reads it", () => {
  const edited = A.replace(">Read this **twice**.", ">Read this **three times**.")
    .replace("%%PREFIX%%E M P L O Y E E S%%", "%%PREFIX%%E M P L O Y E E%%")
    .replace(">#management, #flat orgs", ">#management")
  const [annotation] = parseNote(edited).annotations as [Annotation]
  assert.equal(annotation.text, "Read this **three times**.\n\nSee [[flatland]].")
  assert.deepEqual(annotation.tags, ["management"])
  const quote = annotation.target![0]!.selector![1] as { prefix: string; suffix: string }
  assert.equal(quote.prefix, "E M P L O Y E E")
  assert.equal(quote.suffix, " FIRST EDITION")
  // Written back, the record has what the view says.
  const written = upsertAnnotation(edited, annotation).note
  assert.ok(written.includes('"text":"Read this **three times**.\\n\\nSee [[flatland]]."'))
  assert.ok(written.includes('"prefix":"E M P L O Y E E"'))
})

test("a group the record names is dropped, and the block's own id is the annotation's", () => {
  const record = RECORD.replace('{"text"', '{"group":"abc","id":"other","text"')
  const [annotation] = parseNote(block("aaa", record)).annotations as [Annotation]
  assert.equal(annotation.group, "__world__")
  assert.equal(annotation.id, "aaa")
})

test("a block is written as Upstream writes it, and read back to the same annotation", () => {
  const [annotation] = parseNote(A).annotations as [Annotation]
  assert.equal(serializeBlock(annotation), A)
  assert.deepEqual(parseNote(serializeBlock(annotation)).annotations, [annotation])
})

test("the view is written with or without the text either side of the passage, and its highlight", () => {
  const [annotation] = parseNote(A).annotations as [Annotation]
  const passage = (options: Parameters<typeof serializeBlock>[1]) =>
    serializeBlock(annotation, options).split("\n")[5]
  assert.equal(
    passage({ prefix: false }),
    ">*%%HIGHLIGHT%% ==Welcome to Flatland== %%POSTFIX%%FIRST EDITION*",
  )
  assert.equal(
    passage({ suffix: false, highlight: false }),
    ">*%%PREFIX%%E M P L O Y E E S%%HIGHLIGHT%%Welcome to Flatland*",
  )
  assert.equal(passage({ prefix: false, suffix: false }), ">*%%HIGHLIGHT%% ==Welcome to Flatland== *")
  // And read back from a block as it was written.
  const both = [true, false]
  for (const prefix of both) for (const suffix of both) for (const highlight of both) {
    const written = serializeBlock(annotation, { prefix, suffix, highlight })
    assert.deepEqual(parseNote(written).blocks[0]!.view, { prefix, suffix, highlight })
  }
})

test("an annotation with no comment, tags or passage is written as Upstream writes a page note", () => {
  const written = serializeBlock({ id: "p4ge", tags: [], text: "", uri: "https://example.com/h.pdf" })
  assert.equal(
    written,
    ">%%\n>```annotation-json\n>{\"uri\":\"https://example.com/h.pdf\"}\n>```\n>%%\n" +
      ">*%%PREFIX%%%%HIGHLIGHT%% ==== %%POSTFIX%%*\n>%%LINK%%[[#^p4ge|show annotation]]\n" +
      ">%%COMMENT%%\n>\n>%%TAGS%%\n>\n^p4ge\n",
  )
  const [annotation] = parseNote(written).annotations as [Annotation]
  assert.equal(annotation.text, "")
  assert.deepEqual(annotation.tags, [])
  assert.equal(serializeBlock(annotation), written)
})

test("an annotation's id has to be letters and digits, so it can be found again", () => {
  assert.throws(() => serializeBlock({ id: "not-an-id" }), /letters and digits/)
  assert.throws(() => serializeBlock({ id: "" }), /letters and digits/)
})

test("updating an annotation replaces its block in place, and nothing else", () => {
  const source = `${FRONTMATTER}${A}\n\nBetween.\n\n${B}\n\nAfterwards.\n`
  const [, annotation] = parseNote(source).annotations as [Annotation, Annotation]
  const { note, annotation: stored } = upsertAnnotation(source, { ...annotation, tags: ["x"] })
  assert.equal(note, source.replace(B, block("bbb", RECORD, "#x")))
  assert.deepEqual(stored.tags, ["x"])
})

test("a new annotation goes after the last block, before the epilogue", () => {
  const source = `${FRONTMATTER}${A}\n\n${B}\n\n## Afterwards\n\nMore words.\n`
  const [annotation] = parseNote(source).annotations as [Annotation]
  const { note } = upsertAnnotation(source, { ...annotation, id: "ccc" })
  assert.equal(note, `${FRONTMATTER}${A}\n\n${B}\n\n${C}\n\n## Afterwards\n\nMore words.\n`)
  const after = parseNote(note)
  assert.equal(slice(note, after.epilogue), "\n\n## Afterwards\n\nMore words.\n")
})

test("a note's first annotation goes at the end of its preface, two blank lines after it", () => {
  const [annotation] = parseNote(A).annotations as [Annotation]
  const cases: [string, string][] = [
    ["", A],
    ["Words.", `Words.\n\n\n${A}`],
    ["Words.\n", `Words.\n\n\n${A}`],
    [FRONTMATTER, `${FRONTMATTER}${A}`],
    [`${FRONTMATTER}\n\n`, `${FRONTMATTER}\n\n${A}`],
  ]
  for (const [source, expected] of cases) assert.equal(upsertAnnotation(source, annotation).note, expected)
})

test("an annotation with no id is given a new one, and stored not flagged, as Upstream stores it", () => {
  const source = `${A}`
  const ids = ["aaa", "n3w"]
  const input = { text: "New.", tags: [], flagged: true }
  const { note, annotation } = upsertAnnotation(source, input, { newId: () => ids.shift()! })
  // The id a block of the note has already is passed over.
  assert.equal(annotation.id, "n3w")
  assert.equal(annotation.flagged, false)
  assert.deepEqual(input, { text: "New.", tags: [], flagged: true })
  assert.deepEqual(parseNote(note).blocks.map((b) => b.id), ["aaa", "n3w"])
  // By default, an id like Upstream's.
  assert.match(upsertAnnotation(source, { text: "" }).annotation.id, /^[a-z0-9]+$/)
})

test("options left out of an update are as the block being replaced wrote them", () => {
  const options = { prefix: false, suffix: false, highlight: false }
  const plain = serializeBlock(parseNote(A).annotations[0]!, options)
  const [annotation] = parseNote(plain).annotations as [Annotation]
  assert.equal(upsertAnnotation(plain, annotation).note, plain)
  assert.equal(upsertAnnotation(plain, annotation, { prefix: true, suffix: true, highlight: true }).note, A)
})

test("removing an annotation removes its block and the blank lines that set it apart", () => {
  const source = `${FRONTMATTER}${A}\n\n${B}\n\n${C}\n\nAfterwards.\n`
  assert.equal(removeAnnotation(source, "aaa"), `${FRONTMATTER}${B}\n\n${C}\n\nAfterwards.\n`)
  assert.equal(removeAnnotation(source, "bbb"), `${FRONTMATTER}${A}\n\n${C}\n\nAfterwards.\n`)
  assert.equal(removeAnnotation(source, "ccc"), `${FRONTMATTER}${A}\n\n${B}\n\nAfterwards.\n`)
  const sole = `${FRONTMATTER}${A}\n\nAfterwards.\n`
  assert.equal(removeAnnotation(sole, "aaa"), `${FRONTMATTER}\n\nAfterwards.\n`)
  assert.equal(removeAnnotation(source, "zzz"), source)
})

test("removing an annotation leaves what is written between blocks where it is", () => {
  const source = `${A}\n\nBetween.\n\n${B}\n\nAlso between.\n\n${C}`
  assert.equal(removeAnnotation(source, "bbb"), `${A}\n\nBetween.\n\n\n\nAlso between.\n\n${C}`)
})

test("removing an annotation and writing it again leaves the preface and the epilogue", () => {
  const source = `${FRONTMATTER}Words.\n\n\n${A}\n\n${B}\n\n${C}\n\n## Afterwards\n`
  for (const text of [source, crlf(source)]) {
    const before = parseNote(text)
    for (const { id, annotation, view } of before.blocks) {
      const again = upsertAnnotation(removeAnnotation(text, id), annotation!, view).note
      const after = parseNote(again)
      assert.equal(slice(again, after.preface), slice(text, before.preface))
      assert.equal(slice(again, after.epilogue), slice(text, before.epilogue))
      assert.equal(after.blocks.at(-1)!.id, id)
    }
    // The last, removed and written again, is the note as it was.
    assert.equal(upsertAnnotation(removeAnnotation(text, "ccc"), before.annotations[2]!).note, text)
  }
})
