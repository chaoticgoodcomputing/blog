import assert from "node:assert/strict"
import { test } from "node:test"
import { asCodeBlock, findMdxBlocks } from "../src/mdx-blocks.ts"

/** The blocks of a document, as [kind, source] pairs. */
const blocks = (text: string) => findMdxBlocks(text).map((b) => [b.kind, text.slice(b.from, b.to)])

test("an import is a block, after the frontmatter", () => {
  const doc = "---\ntitle: x\nimport: no\n---\nimport { A } from './a'\nimport B from './b'\n\nText."
  assert.deepEqual(blocks(doc), [["esm", "import { A } from './a'\nimport B from './b'"]])
})

test("an export runs to the end of its paragraph", () => {
  assert.deepEqual(blocks("export const meta = {\n  a: 1,\n}\n\nText"), [["esm", "export const meta = {\n  a: 1,\n}"]])
})

test("import inside a paragraph is text", () => {
  assert.deepEqual(blocks("Some text\nimport this"), [])
})

test("a self-closing component, its props over several lines", () => {
  const doc = 'Intro\n\n<Graph\n  caption="a > b"\n  data={{ x: "}" }}\n/>\n\nOutro'
  assert.deepEqual(blocks(doc), [["jsx", '<Graph\n  caption="a > b"\n  data={{ x: "}" }}\n/>']])
})

test("one block per component, though no blank line is between them", () => {
  assert.deepEqual(blocks("<A />\n<B />"), [["jsx", "<A />"], ["jsx", "<B />"]])
})

test("a component with children runs to its closing tag, through blank lines and nesting", () => {
  const doc = "<Figure>\n\n  Some *markdown*, a < b\n\n  <Figure>inner</Figure>\n  <div>html</div>\n</Figure>\n\nAfter"
  assert.deepEqual(blocks(doc), [["jsx", doc.slice(0, doc.indexOf("\n\nAfter"))]])
})

test("fragments nest as components do", () => {
  assert.deepEqual(blocks("<>\n<A />\n</>\ntail"), [["jsx", "<>\n<A />\n</>"]])
})

test("an unclosed component runs to the end of its paragraph", () => {
  assert.deepEqual(blocks("<Broken attr\nmore\n\nText"), [["jsx", "<Broken attr\nmore"]])
})

test("lowercase HTML is left to Obsidian", () => {
  assert.deepEqual(blocks("<div>\nhi\n</div>"), [])
})

test("fenced code is skipped", () => {
  assert.deepEqual(blocks("```jsx\nimport A from 'a'\n<A />\n```\n<B />"), [["jsx", "<B />"]])
})

test("a component right after a heading is a block", () => {
  assert.deepEqual(blocks("## Title\n<A />"), [["jsx", "<A />"]])
})

test("the code block's fence outruns any backticks in the source", () => {
  assert.equal(asCodeBlock("<A x={`t`} />"), "```jsx\n<A x={`t`} />\n```")
  assert.equal(asCodeBlock("<A x='````' />"), "`````jsx\n<A x='````' />\n`````")
})
