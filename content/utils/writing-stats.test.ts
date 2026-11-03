import assert from "node:assert/strict"
import { test } from "node:test"
import { corpus, pageUrlOf, dashesOf, eraOf, isTranscript, plainText, proseOf, sentencesOf, statsOf } from "./writing-stats.ts"

const none = { em: 0, en: 0, double: 0, single: 0 }

test("counts a dash with a space before it, after it, or both", () => {
  // The post's examples (content/public/content/notes/dashes.mdx).
  assert.deepEqual(dashesOf("I went - and then I left."), { ...none, single: 1 })
  assert.deepEqual(dashesOf("I went -- and then I left."), { ...none, double: 1 })
  assert.deepEqual(dashesOf("I went — and then I left."), { ...none, em: 1 })
  assert.deepEqual(dashesOf("I went – and then I left."), { ...none, en: 1 })
  assert.deepEqual(dashesOf("the message-- that"), { ...none, double: 1 })
  assert.deepEqual(dashesOf("the message —that"), { ...none, em: 1 })
})

test("leaves out a dash between two words, an arrow and a rule", () => {
  assert.deepEqual(dashesOf("a well-known word—with no space"), none)
  assert.deepEqual(dashesOf("from 2018–2024"), none)
  assert.deepEqual(dashesOf("a --> b <-- c -> d"), none)
  assert.deepEqual(dashesOf("a --- rule"), none)
  assert.deepEqual(dashesOf("super- and sub-structures, multi- (or cross-) session"), none)
})

test("reads links as their text, and code as a word", () => {
  assert.equal(plainText("See [[public/content/notes/a|this note]] and [that](https://x.y) or `d20`."), "See this note and that or code.")
  assert.equal(plainText("A **bold** *claim*."), "A bold claim.")
})

test("keeps paragraphs and list items; drops quotes, callouts, code, tables and widgets", () => {
  const body = [
    "import { W } from './w'",
    "",
    "# Heading",
    "",
    "First paragraph, one line",
    "and its second line.",
    "",
    "- an item",
    "",
    "> Someone else's words.",
    "",
    "> [!NOTE]",
    "> My aside.",
    "",
    "```ts",
    "const a = b -- c",
    "```",
    "",
    "| a | b |",
    "",
    "<W",
    "  prop={1}",
    "/>",
  ].join("\n")
  assert.deepEqual(proseOf(body), [
    { kind: "paragraph", text: "First paragraph, one line and its second line." },
    { kind: "list-item", text: "an item" },
  ])
})

test("splits sentences, but not at abbreviations or initials", () => {
  assert.deepEqual(sentencesOf("One two. Three? “Four,” she said. K. Pedram et al. Wrote it, e.g. Here."), [
    "One two.",
    "Three?",
    "“Four,” she said.",
    "K. Pedram et al. Wrote it, e.g. Here.",
  ])
})

test("counts sentences and paragraphs", () => {
  const stats = statsOf("One two three. Four — five.\n\nSix.\n\n- a list item")
  assert.equal(stats.words, 9)
  assert.deepEqual(stats.sentences, [3, 2, 1, 3])
  assert.deepEqual(stats.sentenceDashes, [0, 1, 0, 0])
  assert.deepEqual(stats.paragraphWords, [5, 1, 3])
  assert.deepEqual(stats.paragraphSentences, [2, 1, 1])
})

test("leaves out every callout, whatever its label", () => {
  const body = "> [!QUOTE]\n> Their words.\n\n> [!ASSISTANT]\n> An LLM's words.\n\n> [!NOTE]\n> - An aside.\n\nMine."
  assert.deepEqual(proseOf(body), [{ kind: "paragraph", text: "Mine." }])
})

test("puts a date in the last era that has started by then", () => {
  const eras = [{ id: "a", label: "A" }, { id: "b", label: "B", from: "2024-03-01" }, { id: "c", label: "C", from: "2026-11-02" }]
  assert.equal(eraOf("2024-02-29", eras), "a")
  assert.equal(eraOf("2024-03-01", eras), "b")
  assert.equal(eraOf("2026-11-01", eras), "b")
  assert.equal(eraOf("2026-11-02", eras), "c")
})

test("knows a transcript", () => {
  assert.ok(isTranscript(["writing/annotations/meetings"], ""))
  assert.ok(isTranscript([], "1\n00:00:05,922 --> 00:00:08,841 Hi\n".repeat(6)))
  assert.ok(!isTranscript(["writing/notes"], "a -- b"))
})

test("a private note's record has no path", () => {
  for (const note of corpus().notes.filter((note) => note.private)) assert.equal(note.path, undefined)
})

test("gives a public note the address the site gives its page", () => {
  assert.equal(pageUrlOf("public/content/notes/dashes.mdx"), "/content/notes/dashes")
  assert.equal(pageUrlOf("public/content/notes/A & B 100%?.md"), "/content/notes/A--and--B-100-percent")
  assert.equal(pageUrlOf("public/content/index.md"), "/content")
})

test("a private note's record has no address", () => {
  for (const note of corpus().notes.filter((note) => note.private)) assert.equal(note.url, undefined)
})
