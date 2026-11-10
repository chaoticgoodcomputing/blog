import { describe, expect, it } from "vitest"
import {
  AnnotationWriteError,
  fromHypothesis,
  readNote,
  removeAnnotation,
  toHypothesis,
  type HypothesisAnnotation,
} from "../src/index.ts"
import { ALL_NOTES, COMMENT, CRLF_NOTE, NESTED_COMMENT, NOTE, REPLY_COMMENT, SOURCE, countingMint, expectValidRecord } from "./fixtures.ts"

const TITLE = "ColabFold"
const hypothesis = (text: string) => toHypothesis(readNote(text), TITLE)
const byId = (text: string, id: string) => hypothesis(text).find((annotation) => annotation.id === id)!

describe("note to Hypothesis", () => {
  it("maps an annotation: block id, comment, target, uri, times and title", () => {
    const record = readNote(NOTE).annotations[0]!.record
    expect(byId(NOTE, "wbgdzlqm9dm")).toEqual({
      id: "wbgdzlqm9dm",
      text: COMMENT,
      tags: [],
      target: [record.target],
      uri: SOURCE,
      created: "2026-02-28T19:24:01.448Z",
      updated: "2026-02-28T19:24:01.448Z",
      document: { title: TITLE },
    })
  })

  it("maps a reply: references root first, and its thread's source with no selector", () => {
    expect(byId(NOTE, "k2r8vq0xj4n")).toMatchObject({
      text: REPLY_COMMENT,
      references: ["wbgdzlqm9dm"],
      target: [{ source: SOURCE }],
      uri: SOURCE,
    })
    expect(byId(NOTE, "k2r8vq0xj4n").target![0]).not.toHaveProperty("selector")
  })

  it("walks a reply to a reply up to the root", () => {
    const { text } = fromHypothesis(NOTE, { text: "Deeper.", references: ["wbgdzlqm9dm", "k2r8vq0xj4n"] }, countingMint())
    expect(byId(text, "newblock001").references).toEqual(["wbgdzlqm9dm", "k2r8vq0xj4n"])
  })

  it("gives a reply whose parent is gone the note's target", () => {
    const orphan = removeAnnotation(NOTE, "wbgdzlqm9dm")
    expect(byId(orphan, "k2r8vq0xj4n")).toMatchObject({ references: [], target: [{ source: SOURCE }], uri: SOURCE })
  })

  it("maps a highlight to empty text, and the nested callout comment as it is", () => {
    expect(byId(NOTE, "h1ghl1ght00").text).toBe("")
    expect(byId(NOTE, "n3stedc4llo").text).toBe(NESTED_COMMENT)
  })

  it("maps tagging bodies to tags", () => {
    const { text } = fromHypothesis(NOTE, { text: "", tags: ["a", "b"], target: [{ source: SOURCE }] }, countingMint())
    expect(byId(text, "newblock001").tags).toEqual(["a", "b"])
  })
})

describe("Hypothesis to note", () => {
  it.each(Object.entries(ALL_NOTES))("leaves %s's records unchanged on a round trip", (_, text) => {
    let written = text
    for (const annotation of hypothesis(text)) written = fromHypothesis(written, annotation, countingMint()).text
    expect(written).toBe(text)
  })

  it("changes only the comment and `modified` when the text changed", () => {
    const sent = { ...byId(NOTE, "wbgdzlqm9dm"), text: "Changed my mind." }
    const { text, record } = fromHypothesis(NOTE, sent, countingMint())
    const before = readNote(NOTE).annotations[0]!.record
    expect(record).toEqual({ ...before, modified: "2026-11-10T12:00:00.000Z" })
    expect(readNote(text).annotations[0]!.comment).toBe("Changed my mind.")
    expect(byId(text, "wbgdzlqm9dm").updated).toBe("2026-11-10T12:00:00.000Z")
  })

  it("keeps the note's CRLF line endings", () => {
    const sent = { ...byId(CRLF_NOTE, "k2r8vq0xj4n"), text: "Edited." }
    const { text } = fromHypothesis(CRLF_NOTE, sent, countingMint())
    expect(text.replace(/\r\n/g, "")).not.toContain("\n")
  })

  it("creates a new annotation, with a new block id and urn:uuid, dropping what Hypothesis keeps itself", () => {
    const sent: HypothesisAnnotation = {
      text: "New, from the client.",
      tags: ["fold"],
      target: [{ source: SOURCE, selector: [{ type: "TextQuoteSelector", exact: "x", prefix: "", suffix: "" }] }],
      uri: SOURCE,
      document: { title: "Whatever the page said" },
      user: "acct:me@localhost",
      user_info: { display_name: "Me" },
      group: "__world__",
      permissions: { read: ["group:__world__"] },
      flagged: false,
      hidden: false,
      links: {},
      moderation: {},
    }
    const { text, blockId, record } = fromHypothesis(NOTE, sent, countingMint())
    expect(blockId).toBe("newblock001")
    expectValidRecord(record, blockId)
    expect(record).toEqual({
      "@context": "http://www.w3.org/ns/anno.jsonld",
      id: "urn:uuid:00000000-0000-4000-8000-000000000001",
      type: "Annotation",
      motivation: "commenting",
      body: [
        { id: "#^newblock001", type: "Text", format: "text/markdown", purpose: "commenting" },
        { type: "TextualBody", value: "fold", purpose: "tagging" },
      ],
      target: sent.target![0],
      created: "2026-11-10T12:00:00.000Z",
      modified: "2026-11-10T12:00:00.000Z",
    })
    expect(byId(text, blockId)).toMatchObject({ text: "New, from the client.", tags: ["fold"], document: { title: TITLE } })
  })

  it("creates a reply that targets its parent's record id", () => {
    const { record } = fromHypothesis(
      NOTE,
      { text: "Agreed.", references: ["wbgdzlqm9dm"], target: [{ source: SOURCE }] },
      countingMint(),
    )
    expectValidRecord(record, "newblock001")
    expect(record.target).toBe("urn:uuid:3f1c9a52-8e0b-4d17-9a6e-2b4f7c0d915e")
  })

  it("refuses an id the note doesn't have", () => {
    expect(() => fromHypothesis(NOTE, { id: "nosuchblock", text: "x" })).toThrow(AnnotationWriteError)
  })
})
