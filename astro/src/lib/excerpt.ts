// A note's excerpt: its first paragraph, as a reader reads it, which stands in for a description
// the note's frontmatter doesn't write (`summary`, ./notes.ts). Its first paragraph of its own, at
// the note's top: not a heading, a list's item, a callout, a footnote or a code block, and not a
// paragraph of nothing but embeds and images.

import type { TextBlock } from "@chaoticgoodcomputing/obsidian-markdown"

/** The most characters an excerpt holds before it is cut, its ellipsis aside. */
export const EXCERPT_LENGTH = 160

// A paragraph of nothing but embeds, `![[…]]`, and images, `![…](…)`, in its source.
const ONLY_EMBEDS = /^(?:\s*(?:!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)))+\s*$/

/**
 * The excerpt of a note, from its text blocks and its source (`Vault.readTextBlocks`,
 * `Vault.read`): its first paragraph's text with each run of space one space, cut at the last word
 * that fits in `EXCERPT_LENGTH`, with an ellipsis. None where the note has no such paragraph.
 */
export function excerptOf(blocks: TextBlock[], source: string): string | undefined {
  const paragraph = blocks.find((block) => {
    if (block.type !== "paragraph" || block.within.length > 0 || block.text.trim() === "") return false
    const { position } = block
    return !position || !ONLY_EMBEDS.test(source.slice(position.start.offset, position.end.offset))
  })
  if (!paragraph) return undefined
  const text = paragraph.text.replace(/\s+/g, " ").trim()
  if (text.length <= EXCERPT_LENGTH) return text
  const cut = text.slice(0, EXCERPT_LENGTH + 1)
  const end = cut.lastIndexOf(" ")
  // One word longer than the whole excerpt is cut where it must be.
  const kept = end > 0 ? cut.slice(0, end) : cut.slice(0, EXCERPT_LENGTH)
  return `${kept.replace(/[\s,;:.—–-]+$/, "")}…`
}
