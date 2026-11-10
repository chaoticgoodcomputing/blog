// Where an annotation note's annotator goes in its editor, and what of the note the editor may not
// touch: as editor state, so it follows every change, and needs no Obsidian or DOM.
//
// The annotator's region is the run of the note's annotation blocks, from the first to the last
// (web-annotations' layout), which the editor shows the annotator in place of. A note with no
// blocks yet has an empty region at its end, where its first will go.

import { type NoteAnnotation, readNote } from "@chaoticgoodcomputing/web-annotations"
import { Annotation, EditorState, StateField, type Transaction } from "@codemirror/state"
import { frontmatterOfText, readProperties } from "../annotation-properties.ts"

export interface Region {
  /** The start of the first block's first line; the end of the note, with no blocks. */
  from: number
  /** The end of the last block's `^id` line, before its line break; `from`, with no blocks. */
  to: number
}

/**
 * Whether a note's text is an annotation note's: it names an annotation target, in its frontmatter
 * or a Dataview inline field, read as the vault's index reads it (src/annotation-properties.ts).
 */
export const isAnnotationNoteText = (text: string) => readProperties(frontmatterOfText(text).properties) !== undefined

/**
 * Whether a note's text is a web page's annotation note's: one made in the browser, whose page
 * Obsidian doesn't show, so its region shows its annotations as cards (src/editor/annotator.ts), in
 * place of the annotator.
 */
export const isWebNoteText = (text: string) => readProperties(frontmatterOfText(text).properties)?.web === true

/** A web page's note's page, and where its frontmatter ends (0 with none); none for any other note. */
export function webPageOf(text: string): { url: string; end: number } | null {
  const { properties, end } = frontmatterOfText(text)
  const read = readProperties(properties)
  return read?.web && read.target ? { url: read.target, end } : null
}

/** Every block of a note, read or not, in the note's order. */
function blockSpans(text: string) {
  const { annotations, errors } = readNote(text)
  return [...annotations.map((annotation) => ({ span: annotation.span, annotation })), ...errors.map((error) => ({ span: error.span, annotation: undefined }))].sort(
    (a, b) => a.span.start - b.span.start,
  )
}

/**
 * A note's annotator region, or none for a note that is no annotation note. A web page's note has
 * one as a PDF's does: its preface above, its epilogue below, its blocks between, kept from the editor.
 */
export function regionOf(text: string): Region | null {
  if (!isAnnotationNoteText(text)) return null
  const blocks = blockSpans(text)
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
 * below, is an edit beside them. The plugin's own writes pass (`annotatorWrite`): a card's comment,
 * edited, is one (src/editor/annotator.ts).
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

/**
 * The block of a note's text that holds line `line`, numbered from 0, as reading view numbers a
 * section's lines, with the line it starts on, and its annotation, when it reads; none when no
 * block holds the line.
 */
export function blockAtLine(text: string, line: number): { annotation?: NoteAnnotation; firstLine: number } | undefined {
  const lineOf = (offset: number) => {
    let count = 0
    for (let at = text.indexOf("\n"); at >= 0 && at < offset; at = text.indexOf("\n", at + 1)) count++
    return count
  }
  for (const { span, annotation } of blockSpans(text)) {
    const firstLine = lineOf(span.start)
    if (firstLine <= line && line <= lineOf(Math.max(span.start, span.end - 1))) return { annotation, firstLine }
  }
  return undefined
}
