import assert from "node:assert/strict"
import { test } from "node:test"
import { parseAnnotations } from "../src/index.ts"

// A reply, as Annotator writes one from Hypothesis: a record with no passage of its own, whose
// `references` name the annotations it answers, the one it answers directly last. Annotator gives
// each annotation its Hypothesis id as its block id.

function block(id: string, record: object): string {
  return [">%%", ">```annotation-json", `>${JSON.stringify(record)}`, ">```", ">%%", ">%%COMMENT%%", ">A comment.", `^${id}`, ""].join(
    "\n",
  )
}

const passage = (start: number, exact: string) => ({
  target: [
    {
      source: "https://example.com/handbook.pdf",
      selector: [
        { type: "TextPositionSelector", start, end: start + exact.length },
        { type: "TextQuoteSelector", exact, prefix: "", suffix: "" },
      ],
    },
  ],
})

const ADVENTURE = block("adventure", { text: "On the adventure.", ...passage(162, "A fearless adventure"), tags: [] })
const FLATLAND = block("flatland", { text: "On Flatland.", ...passage(40, "Welcome to Flatland"), tags: [] })
const REPLY = block("reply", {
  text: "Thinking about it more.",
  references: ["flatland"],
  target: [{ source: "https://example.com/handbook.pdf" }],
  tags: [],
})
const REPLY_TO_REPLY = block("again", {
  text: "And again.",
  references: ["flatland", "reply"],
  target: [{ source: "https://example.com/handbook.pdf" }],
  tags: [],
})

test("a reply comes directly after the annotation it answers, not after every passage", () => {
  // Written in this order; the document has Flatland first, and the reply answers it.
  const { annotations } = parseAnnotations(`${ADVENTURE}\n${FLATLAND}\n${REPLY}`)
  assert.deepEqual(
    annotations.map((annotation) => annotation.id),
    ["flatland", "reply", "adventure"],
  )
})

test("a reply to a reply follows the reply it answers", () => {
  const { annotations } = parseAnnotations(`${REPLY_TO_REPLY}\n${ADVENTURE}\n${FLATLAND}\n${REPLY}`)
  assert.deepEqual(
    annotations.map((annotation) => annotation.id),
    ["flatland", "reply", "again", "adventure"],
  )
})

test("a reply to an annotation the note does not have comes last, as an annotation of no passage does", () => {
  const orphan = block("orphan", { text: "To nothing here.", references: ["elsewhere"], tags: [] })
  const { annotations } = parseAnnotations(`${orphan}\n${ADVENTURE}\n${FLATLAND}`)
  assert.deepEqual(
    annotations.map((annotation) => annotation.id),
    ["flatland", "adventure", "orphan"],
  )
})
