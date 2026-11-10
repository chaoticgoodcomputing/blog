// A card's comment, edited in Obsidian: the comment alone, as the Markdown its block holds, never
// the block that keeps it. The new comment is written back through web-annotations, which writes the
// block again, record and comment; and wikilinks are typed with Obsidian's names for notes.

import { AnnotationWriteError, updateAnnotation } from "@chaoticgoodcomputing/web-annotations"

/**
 * The note with annotation `blockId`'s comment made `comment`, and its time of change `now`: its
 * block written again, the rest of the note as it was. The note as it is, when it has no such
 * annotation, or one whose record doesn't read.
 */
export function withComment(note: string, blockId: string, comment: string, now: string): string {
  try {
    return updateAnnotation(note, blockId, { comment }, { now: () => now }).text
  } catch (error) {
    if (error instanceof AnnotationWriteError) return note
    throw error
  }
}

/** The note name being typed in a wikilink that ends at the caret: what follows its `[[`, or none. */
export function wikilinkQuery(beforeCaret: string): string | null {
  return /\[\[([^[\]|#\n]*)$/.exec(beforeCaret)?.[1] ?? null
}

/**
 * The text with the wikilink being typed at `caret` completed as `[[linktext]]`, and the caret after
 * it. A `]]` already after the caret is the link's own, and is taken into it.
 */
export function completeWikilink(text: string, caret: number, linktext: string): { text: string; caret: number } {
  const start = text.lastIndexOf("[[", caret)
  if (start < 0) return { text, caret }
  const end = text.startsWith("]]", caret) ? caret + 2 : caret
  const link = `[[${linktext}]]`
  return { text: text.slice(0, start) + link + text.slice(end), caret: start + link.length }
}
