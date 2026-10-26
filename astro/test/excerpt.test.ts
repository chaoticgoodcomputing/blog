import type { TextBlock } from "@chaoticgoodcomputing/obsidian-markdown"
import { expect, test } from "vitest"
import { excerptOf, EXCERPT_LENGTH } from "../src/lib/excerpt.ts"

// A note's source, and its text blocks with where each is in it, as the vault reads them.
function note(...blocks: { type?: string; source: string; text?: string; within?: string[] }[]) {
  let source = ""
  const read: TextBlock[] = []
  for (const block of blocks) {
    const start = source.length
    source += block.source
    read.push({
      type: block.type ?? "paragraph",
      text: block.text ?? block.source,
      within: block.within ?? [],
      position: { start: { line: 0, column: 0, offset: start }, end: { line: 0, column: 0, offset: source.length } },
    })
    source += "\n\n"
  }
  return { blocks: read, source }
}

test("a note's excerpt is its first paragraph's text, as a reader reads it", () => {
  const { blocks, source } = note(
    { type: "heading", source: "# A heading" },
    { source: "See [[Other|the other]] and **this**.", text: "See the other and this." },
    { source: "A second paragraph." },
  )
  expect(excerptOf(blocks, source)).toBe("See the other and this.")
})

test("a paragraph inside another block, a list's, a callout's or a footnote's, is passed over", () => {
  const { blocks, source } = note(
    { source: "- An item", text: "An item", within: ["list", "listItem"] },
    { type: "calloutTitle", source: "> [!note] Title", text: "Title", within: ["callout"] },
    { source: "> Its body.", text: "Its body.", within: ["callout", "calloutContent"] },
    { source: "The prose." },
  )
  expect(excerptOf(blocks, source)).toBe("The prose.")
})

test("a paragraph of nothing but embeds and images is passed over", () => {
  const { blocks, source } = note(
    { source: "![[picture.png]]", text: "picture.png" },
    { source: "![alt](a.png) ![[drawing.excalidraw|300]]", text: "alt drawing.excalidraw" },
    { source: "![[picture.png]] with words after it", text: "picture.png with words after it" },
  )
  expect(excerptOf(blocks, source)).toBe("picture.png with words after it")
})

test("a long paragraph is cut at the last word that fits, with an ellipsis", () => {
  const words = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ")
  const excerpt = excerptOf(...Object.values(note({ source: words })) as [TextBlock[], string])!
  expect(excerpt.length).toBeLessThanOrEqual(EXCERPT_LENGTH + 1)
  expect(excerpt.endsWith("…")).toBe(true)
  expect(words.startsWith(excerpt.slice(0, -1))).toBe(true)
  expect(words[excerpt.length - 1]).toBe(" ")
})

test("a cut paragraph loses the punctuation before its ellipsis, and its runs of space are one", () => {
  // 154 characters of "a ", then "stop," to 159: the last word that fits.
  const text = `${"a  ".repeat(77)}stop,\nand then some more`
  const { blocks, source } = note({ source: text })
  expect(excerptOf(blocks, source)).toBe(`${"a ".repeat(77)}stop…`)
})

test("a note with no paragraph of its own words has no excerpt", () => {
  const { blocks, source } = note({ type: "heading", source: "# Only a heading" }, { type: "code", source: "```\ncode\n```", text: "code" })
  expect(excerptOf(blocks, source)).toBeUndefined()
  expect(excerptOf([], "")).toBeUndefined()
})
