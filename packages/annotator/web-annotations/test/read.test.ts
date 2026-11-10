import { describe, expect, it } from "vitest"
import { readNote } from "../src/index.ts"
import {
  BARE_NOTE,
  BETWEEN_NOTE,
  BLOCK,
  COMMENT,
  CRLF_NOTE,
  EPILOGUE,
  FRONTMATTER,
  HIGHLIGHT_BLOCK,
  NESTED_BLOCK,
  NESTED_COMMENT,
  NO_BLOCKS_NOTE,
  NOTE,
  PREFACE,
  RECORD_JSON,
  REPLY_BLOCK,
  REPLY_COMMENT,
  START_NOTE,
} from "./fixtures.ts"

describe("reading a note", () => {
  const note = readNote(NOTE)

  it("gives its annotations in source order, with block ids and comments", () => {
    expect(note.errors).toEqual([])
    expect(note.annotations.map((a) => [a.blockId, a.comment])).toEqual([
      ["wbgdzlqm9dm", COMMENT],
      ["k2r8vq0xj4n", REPLY_COMMENT],
      ["h1ghl1ght00", ""],
      ["n3stedc4llo", NESTED_COMMENT],
    ])
  })

  it("gives the record as written", () => {
    expect(note.annotations[0]!.record).toEqual(JSON.parse(RECORD_JSON))
    expect(note.annotations[1]!.record).toMatchObject({
      motivation: "replying",
      target: "urn:uuid:3f1c9a52-8e0b-4d17-9a6e-2b4f7c0d915e",
    })
    expect(note.annotations[2]!.record).not.toHaveProperty("body")
  })

  it("gives each annotation's span: its block, through the block id line's ending", () => {
    const blocks = [BLOCK, REPLY_BLOCK, HIGHLIGHT_BLOCK, NESTED_BLOCK]
    note.annotations.forEach((annotation, i) => {
      expect(NOTE.slice(annotation.span.start, annotation.span.end)).toBe(blocks[i] + "\n")
    })
  })

  it("gives the preface (the body before the first block) and the epilogue", () => {
    expect(note.preface).toBe(PREFACE)
    expect(note.epilogue).toBe(EPILOGUE)
  })

  it("reads CRLF notes the same, comments without carriage returns", () => {
    const crlf = readNote(CRLF_NOTE)
    expect(crlf.errors).toEqual([])
    expect(crlf.annotations.map((a) => [a.blockId, a.comment, a.record])).toEqual(
      note.annotations.map((a) => [a.blockId, a.comment, a.record]),
    )
    expect(crlf.preface).toBe(PREFACE.replaceAll("\n", "\r\n"))
    expect(crlf.epilogue).toBe(EPILOGUE.replaceAll("\n", "\r\n"))
  })

  it("leaves text between blocks to neither preface nor epilogue", () => {
    const between = readNote(BETWEEN_NOTE)
    expect(between.annotations.map((a) => a.blockId)).toEqual(["wbgdzlqm9dm", "h1ghl1ght00"])
    expect(between.preface).toBe(PREFACE)
    expect(between.epilogue).toBe("")
  })

  it("reads a note with no blocks as all preface", () => {
    const empty = readNote(NO_BLOCKS_NOTE)
    expect(empty.annotations).toEqual([])
    expect(empty.preface).toBe(PREFACE + "Nothing annotated yet.\n")
    expect(empty.epilogue).toBe("")
  })

  it("reads a block at the very start of the body", () => {
    const start = readNote(START_NOTE)
    expect(start.preface).toBe("")
    expect(start.annotations[0]!.span.start).toBe(FRONTMATTER.length + 1)
    const bare = readNote(BARE_NOTE)
    expect(bare.properties).toBeUndefined()
    expect(bare.annotations[0]!.span).toEqual({ start: 0, end: BARE_NOTE.length })
    expect(bare.annotations[0]!.comment).toBe(COMMENT)
  })

  it("accepts a fold marker and a title on the callout line", () => {
    for (const callout of ["> [!annotation]-", "> [!annotation]+ A title", "> [!ANNOTATION]"]) {
      const folded = readNote(BLOCK.replace("> [!annotation]", callout))
      expect(folded.annotations.map((a) => a.comment)).toEqual([COMMENT])
    }
  })

  it("drops leading and trailing blank comment lines, but keeps blank lines inside", () => {
    const padded = BLOCK.replace(`> ${COMMENT}`, `>\n> \n> one\n>\n> two\n>`)
    expect(readNote(padded).annotations[0]!.comment).toBe("one\n\ntwo")
  })

  it("takes one level of `>` off comment lines, with or without its space", () => {
    const tight = BLOCK.replace(`> ${COMMENT}`, `>tight\n>  indented`)
    expect(readNote(tight).annotations[0]!.comment).toBe("tight\n indented")
  })
})

describe("unreadable blocks", () => {
  it.each([
    ["a record that isn't JSON", BLOCK.replace(RECORD_JSON, "{not json"), "not valid JSON"],
    ["a record with no id", BLOCK.replace('"id":"urn:uuid:3f1c9a52-8e0b-4d17-9a6e-2b4f7c0d915e",', ""), "no id"],
    ["no hidden record", BLOCK.replace("> %%\n> ```annotation", "> ```annotation"), "%%"],
  ])("reports %s as an error with its span, never dropping it silently", (_, block, message) => {
    const text = `Before\n\n${block}\n\n${HIGHLIGHT_BLOCK}\n`
    const note = readNote(text)
    expect(note.errors).toHaveLength(1)
    const [error] = note.errors
    expect(error!.message).toContain(message)
    expect(error!.blockId).toBe("wbgdzlqm9dm")
    expect(text.slice(error!.span.start, error!.span.end)).toBe(block + "\n")
    expect(note.annotations.map((a) => a.blockId)).toEqual(["h1ghl1ght00"])
    expect(note.preface).toBe("Before\n\n")
  })

  it("reports a callout with no block id line", () => {
    const block = BLOCK.replace("\n^wbgdzlqm9dm", "")
    const note = readNote(`${block}\n\nAfter\n`)
    expect(note.errors).toMatchObject([{ message: expect.stringContaining("block id"), span: { start: 0 } }])
  })

  it("reports a block id used twice", () => {
    const note = readNote(`${BLOCK}\n\n${HIGHLIGHT_BLOCK.replace("^h1ghl1ght00", "^wbgdzlqm9dm")}\n`)
    expect(note.annotations).toHaveLength(1)
    expect(note.errors).toMatchObject([{ blockId: "wbgdzlqm9dm", message: expect.stringContaining("twice") }])
  })
})
