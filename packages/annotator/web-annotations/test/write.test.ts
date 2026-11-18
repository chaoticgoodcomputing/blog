import { describe, expect, it } from "vitest"
import {
  addAnnotation,
  AnnotationWriteError,
  readNote,
  removeAnnotation,
  setRecordFields,
  updateAnnotation,
  type PassageTarget,
  type WebAnnotation,
} from "../src/index.ts"
import {
  ALL_NOTES,
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
  REPLY_BLOCK,
  REPLY_COMMENT,
  SOURCE,
  START_NOTE,
  countingMint,
  expectValidRecord,
} from "./fixtures.ts"

const passage = (record: WebAnnotation) => record.target as PassageTarget

describe("round trips", () => {
  it.each(Object.entries(ALL_NOTES))("writing %s back unchanged leaves it byte for byte", (_, text) => {
    const mint = countingMint()
    for (const annotation of readNote(text).annotations) {
      const same = {
        comment: annotation.comment,
        tags: [],
        ...(typeof annotation.record.target === "string" ? {} : { target: annotation.record.target }),
      }
      expect(updateAnnotation(text, annotation.blockId, same, mint).text).toBe(text)
      expect(updateAnnotation(text, annotation.blockId, {}, mint).text).toBe(text)
    }
  })

  it.each(Object.entries(ALL_NOTES))("rewriting every block of %s renders it byte for byte", (_, text) => {
    // Change each comment, then change it back at the time it was last modified: the block is rendered afresh.
    let written = text
    for (const annotation of readNote(text).annotations) {
      written = updateAnnotation(written, annotation.blockId, { comment: "changed" }).text
      expect(written).not.toBe(text)
      written = updateAnnotation(
        written,
        annotation.blockId,
        { comment: annotation.comment },
        { now: () => annotation.record.modified },
      ).text
    }
    expect(written).toBe(text)
  })

  it("builds the fixture note by adding its annotations to its preface", () => {
    const mint = (blockId: string, uuid: string, now: string) => ({ blockId: () => blockId, uuid: () => uuid, now: () => now })
    const records = readNote(NOTE).annotations.map((a) => a.record)
    let text = FRONTMATTER + "\n" + PREFACE
    const add = (index: number, blockId: string, content: Parameters<typeof addAnnotation>[1]) => {
      const record = records[index]!
      text = addAnnotation(text, content, mint(blockId, record.id.slice("urn:uuid:".length), record.created)).text
    }
    add(0, "wbgdzlqm9dm", { comment: COMMENT, target: passage(records[0]!) })
    add(1, "k2r8vq0xj4n", { comment: REPLY_COMMENT, replyTo: "wbgdzlqm9dm" })
    add(2, "h1ghl1ght00", { target: passage(records[2]!) })
    add(3, "n3stedc4llo", { comment: NESTED_COMMENT, target: passage(records[3]!) })
    expect(text + EPILOGUE).toBe(NOTE)
  })
})

describe("adding", () => {
  const target: PassageTarget = {
    source: SOURCE,
    selector: [{ type: "TextQuoteSelector", exact: "new passage", prefix: "a ", suffix: " b" }],
  }

  it("goes after the last block, before the epilogue", () => {
    const { text, blockId, record } = addAnnotation(NOTE, { comment: "New.", target }, countingMint())
    expect(blockId).toBe("newblock001")
    expectValidRecord(record, blockId)
    expect(record).toMatchObject({ id: "urn:uuid:00000000-0000-4000-8000-000000000001", motivation: "commenting" })
    expect(text).toBe(NOTE.replace(EPILOGUE, "") + "\n" + newBlock(record, ["New."], blockId) + EPILOGUE)
  })

  it("goes at the end of a note with no blocks, after one blank line", () => {
    const { text, record } = addAnnotation(NO_BLOCKS_NOTE, { target }, countingMint())
    expectValidRecord(record, "newblock001")
    expect(record.motivation).toBe("highlighting")
    expect(text).toBe(NO_BLOCKS_NOTE + "\n" + newBlock(record, [], "newblock001"))
    expect(addAnnotation("text", { target }, countingMint()).text.startsWith("text\n\n> [!annotation]\n")).toBe(true)
    expect(addAnnotation("", { target }, countingMint()).text.startsWith("> [!annotation]\n")).toBe(true)
  })

  it("adds the missing line ending after a last block at the very end of the note", () => {
    const { text, record } = addAnnotation(BLOCK, { target }, countingMint())
    expect(text).toBe(BLOCK + "\n\n" + newBlock(record, [], "newblock001"))
  })

  it("keeps the note's CRLF line endings", () => {
    const { text, record } = addAnnotation(CRLF_NOTE, { comment: "One\n\nTwo", target }, countingMint())
    const block = newBlock(record, ["One", "", "Two"], "newblock001").replaceAll("\n", "\r\n")
    expect(text).toBe(CRLF_NOTE.replace(EPILOGUE.replaceAll("\n", "\r\n"), "") + "\r\n" + block + EPILOGUE.replaceAll("\n", "\r\n"))
    expect(readNote(text).annotations.at(-1)!.comment).toBe("One\n\nTwo")
  })

  it("puts a reply after its thread, targeting its parent's id", () => {
    const { text, record } = addAnnotation(NOTE, { comment: "Me too.", replyTo: "wbgdzlqm9dm" }, countingMint())
    expectValidRecord(record, "newblock001")
    expect(record.target).toBe("urn:uuid:3f1c9a52-8e0b-4d17-9a6e-2b4f7c0d915e")
    expect(record.body).toEqual({ id: "#^newblock001", type: "Text", format: "text/markdown" })
    expect(text).toBe(NOTE.replace(REPLY_BLOCK + "\n", REPLY_BLOCK + "\n\n" + newBlock(record, ["Me too."], "newblock001")))
  })

  it("puts a reply to a reply after that thread, targeting the reply", () => {
    const { text, record } = addAnnotation(NOTE, { replyTo: "k2r8vq0xj4n", comment: "Deeper." }, countingMint())
    expect(record.target).toBe("urn:uuid:9d4a0c27-61f3-4b8e-a5c9-0e7d2b6f1a38")
    expect(readNote(text).annotations.map((a) => a.blockId)).toEqual([
      "wbgdzlqm9dm",
      "k2r8vq0xj4n",
      "newblock001",
      "h1ghl1ght00",
      "n3stedc4llo",
    ])
    // A later reply to the root goes after the whole thread, the nested reply included.
    const again = addAnnotation(text, { replyTo: "wbgdzlqm9dm", comment: "Late." }, { ...countingMint(), blockId: () => "newblock002" })
    expect(readNote(again.text).annotations.map((a) => a.blockId).slice(0, 4)).toEqual([
      "wbgdzlqm9dm",
      "k2r8vq0xj4n",
      "newblock001",
      "newblock002",
    ])
  })

  it("writes tags as tagging bodies, and motivation `tagging` when there is no comment", () => {
    const tagged = addAnnotation(NOTE, { tags: ["fold", "colab"], target }, countingMint()).record
    expectValidRecord(tagged, "newblock001")
    expect(tagged.motivation).toBe("tagging")
    expect(tagged.body).toEqual([
      { type: "TextualBody", value: "fold", purpose: "tagging" },
      { type: "TextualBody", value: "colab", purpose: "tagging" },
    ])
    const both = addAnnotation(NOTE, { comment: "Hm.", tags: ["fold"], target }, countingMint()).record
    expectValidRecord(both, "newblock001")
    expect(both.motivation).toBe("commenting")
    expect(both.body).toHaveLength(2)
  })

  it("writes a whole-page annotation with no selector", () => {
    const { record } = addAnnotation(NOTE, { comment: "The whole thing.", target: { source: SOURCE } }, countingMint())
    expect(record.target).toEqual({ source: SOURCE })
  })

  it("draws block ids again until one is unused in the note", () => {
    const ids = ["wbgdzlqm9dm", "h1ghl1ght00", "fresh000001"]
    const { blockId } = addAnnotation(NOTE, { target }, { ...countingMint(), blockId: () => ids.shift()! })
    expect(blockId).toBe("fresh000001")
  })

  it("draws 11-character block ids from [a-z0-9] and v4 UUIDs by default", () => {
    const { blockId, record } = addAnnotation(NOTE, { comment: "x", target })
    expect(blockId).toMatch(/^[a-z0-9]{11}$/)
    expectValidRecord(record, blockId)
  })

  it("refuses content with no target, or with both a target and a parent", () => {
    expect(() => addAnnotation(NOTE, { comment: "x" })).toThrow(AnnotationWriteError)
    expect(() => addAnnotation(NOTE, { target, replyTo: "wbgdzlqm9dm" })).toThrow(AnnotationWriteError)
    expect(() => addAnnotation(NOTE, { replyTo: "nope" })).toThrow(AnnotationWriteError)
  })
})

describe("updating", () => {
  const later = { now: () => "2026-11-10T12:00:00.000Z" }

  it("rewrites the block's record, comment and `modified`, and nothing else", () => {
    const { text, record } = updateAnnotation(NOTE, "wbgdzlqm9dm", { comment: "Rethought.\n\nTwice." }, later)
    expectValidRecord(record, "wbgdzlqm9dm")
    const before = readNote(NOTE).annotations[0]!.record
    expect(record).toEqual({ ...before, modified: "2026-11-10T12:00:00.000Z" })
    expect(text).toBe(NOTE.replace(BLOCK, newBlock(record, ["Rethought.", "", "Twice."], "wbgdzlqm9dm").trimEnd()))
  })

  it("keeps CRLF in a rewritten block", () => {
    const { text } = updateAnnotation(CRLF_NOTE, "n3stedc4llo", { comment: "Short now." }, later)
    expect(text.replace(/\r\n/g, "")).not.toContain("\n")
    expect(text.startsWith(CRLF_NOTE.slice(0, CRLF_NOTE.indexOf(NESTED_BLOCK.replaceAll("\n", "\r\n"))))).toBe(true)
    expect(text.endsWith(EPILOGUE.replaceAll("\n", "\r\n"))).toBe(true)
  })

  it("turns a comment taken away into a highlight", () => {
    const { record } = updateAnnotation(NOTE, "wbgdzlqm9dm", { comment: "" }, later)
    expectValidRecord(record, "wbgdzlqm9dm")
    expect(record.motivation).toBe("highlighting")
    expect(record).not.toHaveProperty("body")
  })

  it("turns a comment added to a highlight into a commenting annotation", () => {
    const { text, record } = updateAnnotation(NOTE, "h1ghl1ght00", { comment: "Now it says something." }, later)
    expectValidRecord(record, "h1ghl1ght00")
    expect(Object.keys(record)).toEqual(["@context", "id", "type", "motivation", "body", "target", "created", "modified"])
    expect(readNote(text).annotations[2]!.comment).toBe("Now it says something.")
  })

  it("keeps unknown fields of the record, and unknown fields of its target", () => {
    const extra = BLOCK.replace('"modified":"2026-02-28T19:24:01.448Z"}', '"modified":"2026-02-28T19:24:01.448Z","rights":"CC-BY"}')
      .replace('"target":{"source"', '"target":{"type":"SpecificResource","source"')
    const { record } = updateAnnotation(extra, "wbgdzlqm9dm", { comment: "x" }, later)
    expect(record.rights).toBe("CC-BY")
    expect(passage(record).type).toBe("SpecificResource")
    expect(updateAnnotation(extra, "wbgdzlqm9dm", {}).text).toBe(extra)
  })

  it("keeps a reply a reply", () => {
    const { record } = updateAnnotation(NOTE, "k2r8vq0xj4n", { comment: "Edited." }, later)
    expectValidRecord(record, "k2r8vq0xj4n")
    expect(record.target).toBe("urn:uuid:3f1c9a52-8e0b-4d17-9a6e-2b4f7c0d915e")
  })

  it("refuses a block id the note doesn't have", () => {
    expect(() => updateAnnotation(NOTE, "missing", { comment: "x" })).toThrow(AnnotationWriteError)
  })
})

describe("removing", () => {
  const ids = (text: string) => readNote(text).annotations.map((a) => a.blockId)

  it("deletes a middle block and the blank line after it", () => {
    expect(removeAnnotation(NOTE, "h1ghl1ght00")).toBe(NOTE.replace(HIGHLIGHT_BLOCK + "\n\n", ""))
  })

  it("deletes the first block and the blank line after it", () => {
    expect(removeAnnotation(NOTE, "wbgdzlqm9dm")).toBe(NOTE.replace(BLOCK + "\n\n", ""))
  })

  it("deletes the last block and the blank line before it", () => {
    expect(removeAnnotation(NOTE, "n3stedc4llo")).toBe(NOTE.replace("\n" + NESTED_BLOCK + "\n", ""))
  })

  it("leaves the preface and epilogue as they were when it removes a note's only block", () => {
    const only = FRONTMATTER + "\n" + PREFACE + BLOCK + "\n" + EPILOGUE
    expect(removeAnnotation(only, "wbgdzlqm9dm")).toBe(FRONTMATTER + "\n" + PREFACE + EPILOGUE)
  })

  it("leaves text between blocks", () => {
    const text = removeAnnotation(BETWEEN_NOTE, "h1ghl1ght00")
    // The last block goes with the blank line before it, which separated it from the text.
    expect(text).toBe(BETWEEN_NOTE.replace("\n" + HIGHLIGHT_BLOCK + "\n", ""))
    expect(text).toContain("A thought between the two.")
  })

  it("keeps CRLF line endings", () => {
    const text = removeAnnotation(CRLF_NOTE, "h1ghl1ght00")
    expect(text).toBe(CRLF_NOTE.replace((HIGHLIGHT_BLOCK + "\n\n").replaceAll("\n", "\r\n"), ""))
  })

  it("adding then removing an annotation gives the note back", () => {
    for (const note of [NOTE, CRLF_NOTE, BETWEEN_NOTE, START_NOTE]) {
      const { text, blockId } = addAnnotation(note, { comment: "x", target: { source: SOURCE } }, countingMint())
      expect(ids(text)).toContain(blockId)
      expect(removeAnnotation(text, blockId)).toBe(note)
    }
  })
})

describe("setRecordFields", () => {
  it("sets a field beside the record's own, and leaves the comment and modified alone", () => {
    const before = readNote(NOTE).annotations.find((a) => a.blockId === "wbgdzlqm9dm")!
    const { text, record } = setRecordFields(NOTE, "wbgdzlqm9dm", { mirror: { id: "abc" } })
    const after = readNote(text).annotations.find((a) => a.blockId === "wbgdzlqm9dm")!
    expect(after.record.mirror).toEqual({ id: "abc" })
    expect(record.modified).toBe(before.record.modified)
    expect(after.comment).toBe(before.comment)
    expect(updateAnnotation(text, "wbgdzlqm9dm", { comment: "changed" }).record.mirror).toEqual({ id: "abc" })
  })

  it("removes a field given as undefined, giving back the note as it was", () => {
    const set = setRecordFields(NOTE, "wbgdzlqm9dm", { mirror: "x" }).text
    expect(setRecordFields(set, "wbgdzlqm9dm", { mirror: undefined }).text).toBe(NOTE)
  })

  it("changes nothing when the fields are as they were", () => {
    expect(setRecordFields(NOTE, "wbgdzlqm9dm", {}).text).toBe(NOTE)
  })

  it("refuses the record's own fields, and an unknown block", () => {
    expect(() => setRecordFields(NOTE, "wbgdzlqm9dm", { modified: "now" })).toThrow(AnnotationWriteError)
    expect(() => setRecordFields(NOTE, "nosuchblock", { mirror: 1 })).toThrow(AnnotationWriteError)
  })
})

describe("unreadable blocks", () => {
  it("stay as they are when others are written", () => {
    const broken = BLOCK.replace('"id":"urn:uuid:3f1c9a52-8e0b-4d17-9a6e-2b4f7c0d915e",', "")
    const note = `${broken}\n\n${HIGHLIGHT_BLOCK}\n`
    const updated = updateAnnotation(note, "h1ghl1ght00", { comment: "x" }).text
    expect(updated.startsWith(broken + "\n\n")).toBe(true)
    const added = addAnnotation(note, { target: { source: SOURCE } }, countingMint()).text
    expect(added.startsWith(note)).toBe(true)
    expect(() => updateAnnotation(note, "wbgdzlqm9dm", { comment: "x" })).toThrow(AnnotationWriteError)
  })
})

/** A block as the writer renders it, for the record given; ends with a line ending. */
function newBlock(record: WebAnnotation, comment: string[], blockId: string): string {
  const lines = ["> [!annotation]", "> %%", "> ```annotation", `> ${JSON.stringify(record)}`, "> ```", "> %%"]
  for (const line of comment) lines.push(line === "" ? ">" : `> ${line}`)
  return [...lines, `^${blockId}`, ""].join("\n")
}
