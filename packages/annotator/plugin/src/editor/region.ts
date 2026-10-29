// Where an annotation note's annotator goes in its editor, and what of the note the editor may not
// touch: as editor state, so it follows every change, and needs no Obsidian or DOM.
//
// The annotator's region is the run of the note's annotation blocks, from the first to the last
// (annotator-format's layout), which the editor shows the annotator in place of. A note with no
// blocks yet has an empty region at its end, where its first will go.

import { parseNote } from "@chaoticgoodcomputing/annotator-format"
import { Annotation, EditorState, StateField, type Transaction } from "@codemirror/state"

export interface Region {
  /** The start of the first block's first line; the end of the note, with no blocks. */
  from: number
  /** The end of the last block's `^id` line, before its line break; `from`, with no blocks. */
  to: number
}

// An annotation target in the frontmatter: `annotation-target: <address>`, or a list's first item.
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/
const TARGET = /^annotation-target:[ \t]*(?:\S|\r?\n[ \t]+-[ \t]*\S)/m

/** Whether a note's text is an annotation note's: its frontmatter names an annotation target. */
export const isAnnotationNoteText = (text: string) => TARGET.test(FRONTMATTER.exec(text)?.[1] ?? "")

/** A note's annotator region, or none for a note that is no annotation note. */
export function regionOf(text: string): Region | null {
  if (!isAnnotationNoteText(text)) return null
  const { blocks } = parseNote(text)
  const first = blocks[0]
  const last = blocks.at(-1)
  if (!first || !last) return { from: text.length, to: text.length }
  const end = last.span.end
  // The `^id` line's own end, before its line break, if it has one.
  const to = text[end - 1] === "\n" ? (text[end - 2] === "\r" ? end - 2 : end - 1) : end
  return { from: first.span.start, to }
}

/** The editor's annotator region, kept up to date with its text. */
export const regionField = StateField.define<Region | null>({
  create: (state) => regionOf(state.doc.toString()),
  update: (region, transaction) => (transaction.docChanged ? regionOf(transaction.state.doc.toString()) : region),
})

/**
 * No edit may touch the blocks, or the line breaks just before and after them, which would join a
 * line to a block's: changes there are dropped. Typing on the line above the blocks, or the line
 * below, is an edit beside them. The plugin's own writes pass (`annotatorWrite`).
 */
export const protectBlocks = EditorState.changeFilter.of((transaction) => {
  const region = transaction.startState.field(regionField, false)
  if (!region || region.from === region.to) return true
  return [Math.max(0, region.from - 1), Math.min(transaction.startState.doc.length, region.to + 1)]
})

/** Marks a transaction as the plugin's own write of the note. */
export const annotatorWrite = Annotation.define<boolean>()

/** A note's change, as the fewest characters to replace: what the plugin writes through the editor. */
export function changeBetween(before: string, after: string): { from: number; to: number; insert: string } | null {
  if (before === after) return null
  let start = 0
  const shorter = Math.min(before.length, after.length)
  while (start < shorter && before[start] === after[start]) start++
  let end = 0
  while (end < shorter - start && before[before.length - 1 - end] === after[after.length - 1 - end]) end++
  return { from: start, to: before.length - end, insert: after.slice(start, after.length - end) }
}

/** Whether a transaction is the plugin's own write. */
export const isAnnotatorWrite = (transaction: Transaction) => transaction.annotation(annotatorWrite) === true
