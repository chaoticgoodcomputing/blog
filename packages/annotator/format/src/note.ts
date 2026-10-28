// An annotation note as the format lays it out, and writing its annotations into it.
//
// The layout is by position alone. The preface is everything before the first block, the epilogue
// everything after the last, and whatever is written between two blocks stays between them. A note
// is only ever changed a block at a time: everything else in it is left as it is, byte for byte.

import type { Annotation } from "./annotation.ts"
import { type Block, type Span, type ViewOptions, findBlocks, serializeBlock } from "./block.ts"

export interface Note {
  /** Everything before the first block; the whole note when it has none. */
  preface: Span
  /** Its blocks, in source order. */
  blocks: Block[]
  /** Everything after the last block; empty, at the end of the note, when it has none. */
  epilogue: Span
  /** The annotation of every block whose record could be read, in source order. */
  annotations: Annotation[]
}

/** An annotation note's layout, and its annotations. */
export function parseNote(source: string): Note {
  const blocks = findBlocks(source)
  const first = blocks[0]?.span.start ?? source.length
  const last = blocks.at(-1)?.span.end ?? source.length
  return {
    preface: { start: 0, end: first },
    blocks,
    epilogue: { start: last, end: source.length },
    annotations: blocks.flatMap((block) => (block.annotation ? [block.annotation] : [])),
  }
}

/** An annotation not yet in a note, which may have no id yet. */
export type NewAnnotation = Omit<Annotation, "id"> & { id?: string }

export interface WriteOptions extends Partial<ViewOptions> {
  /**
   * The id to give an annotation that has none. Upstream's, a random base-36 string, by default;
   * an id a block of the note already has is never given.
   */
  newId?: () => string
}

const randomId = () => Math.random().toString(36).slice(2)

/**
 * Writes an annotation into a note: in place of its block when the note has one with its id, and
 * otherwise as a new block after the last, before the epilogue, or at the end of a note with none.
 * An annotation with no id is given one. The view is written with the options given; what they
 * leave out is as the block being replaced wrote it, or else Upstream's defaults.
 *
 * Returns the note and the annotation as it was stored, with its id, and not flagged, as Upstream
 * stores every annotation.
 */
export function upsertAnnotation(
  source: string,
  annotation: NewAnnotation,
  options: WriteOptions = {},
): { note: string; annotation: Annotation } {
  const { newId = randomId, prefix, suffix, highlight } = options
  const note = parseNote(source)
  const ids = new Set(note.blocks.map((block) => block.id))
  let id = annotation.id
  while (!id) {
    const candidate = newId()
    if (!ids.has(candidate)) id = candidate
  }
  const stored = { ...JSON.parse(JSON.stringify(annotation)), flagged: false, id } as Annotation

  const replaced = note.blocks.filter((block) => block.id === id)
  if (replaced.length) {
    // Every block with the id, as Upstream replaces them; from the last, so the spans hold.
    let written = source
    for (const block of replaced.reverse()) {
      const old = source.slice(block.span.start, block.span.end)
      const lineEnding = lineEndingOf(old)
      const view = {
        prefix: prefix ?? block.view?.prefix,
        suffix: suffix ?? block.view?.suffix,
        highlight: highlight ?? block.view?.highlight,
      }
      let text = serializeBlock(stored, { ...view, lineEnding })
      // A block that ends the note without a line break is left without one.
      if (!/\r?\n$/.test(old)) text = text.slice(0, -lineEnding.length)
      written = written.slice(0, block.span.start) + text + written.slice(block.span.end)
    }
    return { note: written, annotation: stored }
  }

  const lineEnding = lineEndingOf(source)
  const text = serializeBlock(stored, { prefix, suffix, highlight, lineEnding })
  const at = note.blocks.at(-1)?.span.end ?? source.length
  const before = source.slice(0, at)
  const written = before + separation(before, lineEnding) + text + source.slice(at)
  return { note: written, annotation: stored }
}

/**
 * What goes between what is before a new block and the block: a line break to end its last line,
 * then two blank lines, as Upstream leaves between blocks, less what is already there. Nothing,
 * when the block is the whole note.
 */
function separation(before: string, lineEnding: string): string {
  if (before === "") return ""
  const breaks = /(?:\r?\n)*$/.exec(before)![0].split("\n").length - 1
  return lineEnding.repeat(Math.max(0, 3 - breaks))
}

/**
 * Removes an annotation's block from a note, with the blank lines that separated it from the
 * blocks either side, so that a note it is written into again is laid out as it was. Text between
 * blocks, the preface and the epilogue are never removed. A note with no block of the id is
 * returned as it is.
 */
export function removeAnnotation(source: string, id: string): string {
  for (;;) {
    const { blocks } = parseNote(source)
    const at = blocks.findIndex((block) => block.id === id)
    if (at === -1) return source
    const { start, end } = blocks[at]!.span
    const previous = blocks[at - 1]?.span
    const next = blocks[at + 1]?.span
    const blank = (from: number, to: number) => /^[ \t\r\n]*$/.test(source.slice(from, to))
    // The separation before it, or for the first block the one after it, which a block written
    // after the last is given again.
    const removed: Span =
      previous && blank(previous.end, start)
        ? { start: previous.end, end }
        : next && blank(end, next.start)
          ? { start, end: next.start }
          : { start, end }
    source = source.slice(0, removed.start) + source.slice(removed.end)
  }
}

/** The line break a text uses: its first one, or `\n` when it has none. */
function lineEndingOf(text: string): "\n" | "\r\n" {
  const lf = text.indexOf("\n")
  return lf > 0 && text[lf - 1] === "\r" ? "\r\n" : "\n"
}
