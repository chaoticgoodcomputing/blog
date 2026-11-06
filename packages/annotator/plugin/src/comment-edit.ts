// A card's comment, edited in Obsidian: the comment alone, never the block that keeps it. The new
// comment is written back as the fake service writes any change, through the format, which writes
// the whole block again, record and view; and wikilinks are typed with Obsidian's names for notes.

import { parseNote, upsertAnnotation, type WriteOptions } from "@chaoticgoodcomputing/annotator-format"

/**
 * The note with its annotation `id`'s comment made `comment`, and its time of change `now`: its
 * block written again by the format, the rest of the note as it was. The note as it is, when it has
 * no such annotation, or one whose record doesn't parse.
 */
export function withComment(note: string, id: string, comment: string, now: string, options: WriteOptions = {}): string {
  const annotation = parseNote(note).blocks.find((block) => block.id === id)?.annotation
  if (!annotation) return note
  return upsertAnnotation(note, { ...annotation, text: comment, updated: now }, options).note
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
