// What a web page's note's cards show of its annotations: the passage, drawn from the record's
// quote selector, the comment as the note's Markdown, and the tags.

import assert from "node:assert/strict"
import { test } from "node:test"
import { cardsOf } from "../src/cards.ts"
import { annotate, reply } from "./notes.ts"

const PAGE = "https://example.org/pickle"
const WEB = `---\nannotation-target: "${PAGE}"\nannotation-target-type: web\n---\n\nThe preface.\n`

function note() {
  let text = annotate(WEB, "aaa", PAGE, "A pickle is a cucumber", "Brined, **mostly**.\n\n> [!NOTE]\n> And [[public/tags/food|food]].", ["food"])
  text = reply(text, "bbb", "aaa", "A reply.")
  return annotate(text, "ccc", PAGE, "kept in brine", "")
}

test("a card has its block id, its comment's Markdown, its tags, and its passage's quote and address", () => {
  const [first] = cardsOf(note())
  assert.deepEqual(first, {
    id: "aaa",
    comment: "Brined, **mostly**.\n\n> [!NOTE]\n> And [[public/tags/food|food]].",
    tags: ["food"],
    exact: "A pickle is a cucumber",
    address: `${PAGE}#:~:text=A%20pickle%20is%20a%20cucumber`,
  })
})

test("every annotation has a card, in the note's order: a reply has no passage, a highlight no comment", () => {
  const cards = cardsOf(note())
  assert.deepEqual(cards.map((card) => card.id), ["aaa", "bbb", "ccc"])
  assert.equal(cards[1]!.exact, undefined)
  assert.equal(cards[1]!.comment, "A reply.")
  assert.equal(cards[2]!.comment, "")
  assert.equal(cards[2]!.exact, "kept in brine")
})

test("a PDF's note's passages have no address in a page", () => {
  const pdf = annotate("---\nannotation-target: https://example.org/a.pdf\n---\n", "aaa", "https://example.org/a.pdf", "A passage", "A comment.")
  assert.equal(cardsOf(pdf)[0]!.address, undefined)
  assert.equal(cardsOf(pdf)[0]!.exact, "A passage")
})

test("a block whose record doesn't read has no card", () => {
  const broken = note().replace(/"id":"urn:uuid:[^"]+",/, "")
  assert.deepEqual(cardsOf(broken).map((card) => card.id), ["bbb", "ccc"])
})
