// The fixtures of SPEC §8, as strings so their bytes (CRLF included) are exactly what the tests say.
import { expect } from "vitest"
import { ANNOTATION_CONTEXT, type Mint, type WebAnnotation } from "../src/index.ts"

export const SOURCE = "https://www.nature.com/articles/s41592-022-01488-1.pdf"

// SPEC §5, verbatim.
export const RECORD_JSON =
  '{"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:3f1c9a52-8e0b-4d17-9a6e-2b4f7c0d915e","type":"Annotation","motivation":"commenting","body":{"id":"#^wbgdzlqm9dm","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":13312,"end":13357},{"type":"TextQuoteSelector","exact":"Fig. 1 | Schematic diagram of ColabFold. a,b,","prefix":"el 1Model 2Model 3Model 4Model 5","suffix":" ColabFold has a web and a comma"}]},"created":"2026-02-28T19:24:01.448Z","modified":"2026-02-28T19:24:01.448Z"}'

export const COMMENT =
  "Ah, this is the good stuff — in the proof-of-concept, I wasn't quite sure what any of these visualizations represented. I did appreciate how pretty they were, though."

export const BLOCK = [
  "> [!annotation]",
  "> %%",
  "> ```annotation",
  `> ${RECORD_JSON}`,
  "> ```",
  "> %%",
  `> ${COMMENT}`,
  "^wbgdzlqm9dm",
].join("\n")

export const REPLY_JSON =
  '{"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:9d4a0c27-61f3-4b8e-a5c9-0e7d2b6f1a38","type":"Annotation","motivation":"replying","body":{"id":"#^k2r8vq0xj4n","type":"Text","format":"text/markdown"},"target":"urn:uuid:3f1c9a52-8e0b-4d17-9a6e-2b4f7c0d915e","created":"2026-03-01T08:10:42.017Z","modified":"2026-03-01T08:10:42.017Z"}'

export const REPLY_COMMENT = "Pretty enough to file under [[public/tags/horticulture|horticulture.]]"

export const REPLY_BLOCK = [
  "> [!annotation]",
  "> %%",
  "> ```annotation",
  `> ${REPLY_JSON}`,
  "> ```",
  "> %%",
  `> ${REPLY_COMMENT}`,
  "^k2r8vq0xj4n",
].join("\n")

export const HIGHLIGHT_JSON =
  '{"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7b2e4d10-5c3a-4f8e-b1d2-6a9c0e3f4b57","type":"Annotation","motivation":"highlighting","target":{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":20480,"end":20531},{"type":"TextQuoteSelector","exact":"MMseqs2 makes the search 40-60 times faster","prefix":"the multiple sequence alignment. ","suffix":", without losing accuracy."}]},"created":"2026-03-02T12:00:00.000Z","modified":"2026-03-02T12:00:00.000Z"}'

export const HIGHLIGHT_BLOCK = [
  "> [!annotation]",
  "> %%",
  "> ```annotation",
  `> ${HIGHLIGHT_JSON}`,
  "> ```",
  "> %%",
  "^h1ghl1ght00",
].join("\n")

export const NESTED_JSON =
  '{"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:c0ffee00-1234-4abc-9def-0123456789ab","type":"Annotation","motivation":"commenting","body":{"id":"#^n3stedc4llo","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextQuoteSelector","exact":"Fig. 2","prefix":"see ","suffix":" for"}]},"created":"2026-03-03T09:30:00.000Z","modified":"2026-03-03T09:30:00.000Z"}'

export const NESTED_COMMENT = [
  "See the figure:",
  "",
  "> [!NOTE]",
  "> The colours mark the model's confidence.",
  "",
  "![[public/assets/x.png]]",
].join("\n")

export const NESTED_BLOCK = [
  "> [!annotation]",
  "> %%",
  "> ```annotation",
  `> ${NESTED_JSON}`,
  "> ```",
  "> %%",
  "> See the figure:",
  ">",
  "> > [!NOTE]",
  "> > The colours mark the model's confidence.",
  ">",
  "> ![[public/assets/x.png]]",
  "^n3stedc4llo",
].join("\n")

export const FRONTMATTER = ["---", `annotation-target: ${SOURCE}`, "annotation-pages: 3-5, 9", "---"].join("\n")

export const PREFACE = "\n# ColabFold\n\nNotes on the paper.\n\n"
export const EPILOGUE = "\n## Afterwards\n\nMore to read.\n"

/** Every kind of block, one blank line apart, between a preface and an epilogue. */
export const NOTE =
  FRONTMATTER +
  "\n" +
  PREFACE +
  [BLOCK, REPLY_BLOCK, HIGHLIGHT_BLOCK, NESTED_BLOCK].join("\n\n") +
  "\n" +
  EPILOGUE

export const CRLF_NOTE = NOTE.replaceAll("\n", "\r\n")

export const BETWEEN_NOTE =
  FRONTMATTER + "\n" + PREFACE + BLOCK + "\n\nA thought between the two.\n\n" + HIGHLIGHT_BLOCK + "\n"

export const NO_BLOCKS_NOTE = FRONTMATTER + "\n" + PREFACE + "Nothing annotated yet.\n"

export const START_NOTE = FRONTMATTER + "\n" + BLOCK + "\n\n" + HIGHLIGHT_BLOCK + "\n"

/** No frontmatter, no final line ending: the block is the very first and last thing in the note. */
export const BARE_NOTE = BLOCK

export const ALL_NOTES: Record<string, string> = {
  NOTE,
  CRLF_NOTE,
  BETWEEN_NOTE,
  NO_BLOCKS_NOTE,
  START_NOTE,
  BARE_NOTE,
}

/** A mint that counts: block ids `newblock001`…, v4 UUIDs ending in the count, and fixed times. */
export function countingMint(now = "2026-11-10T12:00:00.000Z"): Mint {
  let blocks = 0
  let uuids = 0
  return {
    now: () => now,
    blockId: () => `newblock${String(++blocks).padStart(3, "0")}`,
    uuid: () => `00000000-0000-4000-8000-${String(++uuids).padStart(12, "0")}`,
  }
}

const UUID = /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

/** SPEC §5: a complete, standalone W3C annotation, with nothing of Hypothesis's in it. */
export function expectValidRecord(record: WebAnnotation, blockId: string): void {
  expect(record["@context"]).toBe(ANNOTATION_CONTEXT)
  expect(record.id).toMatch(UUID)
  expect(record.type).toBe("Annotation")
  expect(record.created).toMatch(DATE_TIME)
  expect(record.modified).toMatch(DATE_TIME)
  for (const field of ["creator", "document", "uri", "user", "text", "tags", "references"]) {
    expect(record).not.toHaveProperty(field)
  }

  const bodies = record.body === undefined ? [] : Array.isArray(record.body) ? record.body : [record.body]
  if (!Array.isArray(record.body) && record.body !== undefined) expect(bodies).toHaveLength(1)
  const comment = bodies.find((body) => body.type === "Text")
  const tags = bodies.filter((body) => body.purpose === "tagging")
  if (comment) {
    expect(comment.id).toBe(`#^${blockId}`)
    expect(comment.format).toBe("text/markdown")
  }
  for (const tag of tags) expect(tag).toEqual({ type: "TextualBody", value: tag.value, purpose: "tagging" })

  switch (record.motivation) {
    case "replying":
      expect(typeof record.target).toBe("string")
      expect(record.target).toMatch(UUID)
      if (comment) expect(comment).not.toHaveProperty("purpose")
      break
    case "commenting":
      expect(comment?.purpose).toBe("commenting")
      break
    case "tagging":
      expect(comment).toBeUndefined()
      expect(tags.length).toBeGreaterThan(0)
      break
    case "highlighting":
      expect(record).not.toHaveProperty("body")
      break
    default:
      throw new Error(`unexpected motivation ${String(record.motivation)}`)
  }
  if (typeof record.target !== "string") expect(typeof record.target.source).toBe("string")
}
