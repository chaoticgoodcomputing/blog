import { isBlank, splitLines, type LineEnding } from "./lines.ts"
import { defaultMint, type Mint } from "./mint.ts"
import { parseNote, type Block, type NoteAnnotation, type ParsedNote } from "./note.ts"
import {
  composeRecord,
  ORDER,
  sameJson,
  tagsOf,
  type AnnotationContent,
  type Settled,
  type WebAnnotation,
} from "./record.ts"

export interface WriteResult {
  /** The whole note, changed only inside the annotation's block. */
  readonly text: string
  readonly blockId: string
  readonly record: WebAnnotation
}

/** A write the note can't take: an unknown block id, or content that names no target. */
export class AnnotationWriteError extends Error {
  override readonly name = "AnnotationWriteError"
}

/**
 * Adds an annotation after the last block (a reply, after its thread), with a new block id and a
 * new `urn:uuid`.
 */
export function addAnnotation(text: string, content: AnnotationContent, mint: Partial<Mint> = {}): WriteResult {
  const parsed = parseNote(text)
  const { now, blockId: drawBlockId, uuid } = { ...defaultMint, ...mint }
  const settled = settle(parsed, content, undefined)
  const blockId = freshBlockId(parsed, drawBlockId)
  const time = now()
  const record = composeRecord(settled, blockId, { id: `urn:uuid:${uuid()}`, created: time, modified: time })
  const block = renderCallout(record, settled.comment, parsed.eol) + `^${blockId}` + parsed.eol

  const after = content.replyTo === undefined ? parsed.blocks.at(-1) : threadEnd(parsed, content.replyTo)
  if (after) {
    const at = after.span.end
    const endsLine = text.slice(after.idLineStart, at).endsWith("\n")
    const separator = endsLine ? parsed.eol : parsed.eol + parsed.eol
    return { text: text.slice(0, at) + separator + block + text.slice(at), blockId, record }
  }
  return { text: text + separatorAtEnd(text, parsed.eol) + block, blockId, record }
}

/**
 * Rewrites an annotation's block from new content; what the content leaves out stays as it was.
 * When nothing changes, the note comes back as it was, `modified` and all.
 */
export function updateAnnotation(
  text: string,
  blockId: string,
  content: AnnotationContent,
  mint: Partial<Mint> = {},
): WriteResult {
  const parsed = parseNote(text)
  const block = blockOf(parsed, blockId)
  const previous = block.annotation!
  const settled = settle(parsed, content, previous)
  const composed = composeRecord(settled, blockId, previous.record)
  if (sameJson(composed, previous.record) && settled.comment === previous.comment) {
    return { text, blockId, record: previous.record }
  }
  const record = { ...composed, modified: (mint.now ?? defaultMint.now)() }
  const callout = renderCallout(record, settled.comment, parsed.eol)
  return { text: text.slice(0, block.span.start) + callout + text.slice(block.idLineStart), blockId, record }
}

/**
 * Sets fields of an annotation's record other than its own (`ORDER`): what a caller keeps beside
 * the annotation, such as where else it is published. A field given as `undefined` is removed. The
 * comment and `modified` stay as they were: the annotation itself hasn't changed. When nothing
 * changes, the note comes back as it was.
 */
export function setRecordFields(text: string, blockId: string, fields: Readonly<Record<string, unknown>>): WriteResult {
  const own = Object.keys(fields).filter((key) => ORDER.includes(key))
  if (own.length > 0) throw new AnnotationWriteError(`the record's own fields can't be set this way: ${own.join(", ")}`)
  const parsed = parseNote(text)
  const block = blockOf(parsed, blockId)
  const previous = block.annotation!
  const record: Record<string, unknown> = { ...previous.record }
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) delete record[key]
    else record[key] = value
  }
  if (sameJson(record, previous.record)) return { text, blockId, record: previous.record }
  const written = record as WebAnnotation
  const callout = renderCallout(written, previous.comment, parsed.eol)
  return { text: text.slice(0, block.span.start) + callout + text.slice(block.idLineStart), blockId, record: written }
}

/**
 * Deletes an annotation's block and one blank line that separated it from its neighbour. Replies
 * to it stay; the caller removes them too if it wants.
 */
export function removeAnnotation(text: string, blockId: string): string {
  const parsed = parseNote(text)
  const block = blockOf(parsed, blockId)
  const index = parsed.blocks.indexOf(block)
  const next = parsed.blocks[index + 1]
  const previous = parsed.blocks[index - 1]
  const lines = splitLines(text)
  let { start, end } = block.span

  if (next) {
    const after = lines.find((line) => line.start === end)
    if (after && isBlank(after.text) && after.next <= next.span.start) end = after.next
  } else if (previous) {
    const before = lines.find((line) => line.next === start)
    if (before && isBlank(before.text) && before.start >= previous.span.end) start = before.start
  }
  return text.slice(0, start) + text.slice(end)
}

/** The callout lines of a block, each ending with the note's line ending; the block id line is the caller's. */
function renderCallout(record: WebAnnotation, comment: string, eol: LineEnding): string {
  const lines = ["> [!annotation]", "> %%", "> ```annotation", `> ${JSON.stringify(record)}`, "> ```", "> %%"]
  if (comment !== "") for (const line of comment.split("\n")) lines.push(line === "" ? ">" : `> ${line}`)
  return lines.map((line) => line + eol).join("")
}

function settle(parsed: ParsedNote, content: AnnotationContent, previous: NoteAnnotation | undefined): Settled {
  if (content.target !== undefined && content.replyTo !== undefined) {
    throw new AnnotationWriteError("an annotation has a target or a parent to reply to, not both")
  }
  let target: Settled["target"]
  if (content.replyTo !== undefined) target = blockOf(parsed, content.replyTo).annotation!.record.id
  else if (content.target !== undefined) target = content.target
  else if (previous) target = previous.record.target
  else throw new AnnotationWriteError("a new annotation needs a target or a parent to reply to")

  return {
    comment: normalizeComment(content.comment ?? previous?.comment ?? ""),
    tags: content.tags ?? (previous ? tagsOf(previous.record) : []),
    target,
  }
}

/** Drops leading and trailing blank lines, as reading does, so what is written reads back the same. */
function normalizeComment(comment: string): string {
  const lines = comment.split(/\r\n|\n|\r/)
  while (lines.length > 0 && isBlank(lines[0]!)) lines.shift()
  while (lines.length > 0 && isBlank(lines.at(-1)!)) lines.pop()
  return lines.join("\n")
}

function blockOf(parsed: ParsedNote, blockId: string): Block {
  const block = parsed.blocks.find((candidate) => candidate.annotation?.blockId === blockId)
  if (!block) throw new AnnotationWriteError(`no readable annotation with block id ^${blockId}`)
  return block
}

/** The last block of a parent's thread: the parent, then every reply under it, however deep. */
function threadEnd(parsed: ParsedNote, parentBlockId: string): Block {
  const parent = blockOf(parsed, parentBlockId)
  const thread = new Set([parent.annotation!.record.id])
  let last = parent
  for (const block of parsed.blocks.slice(parsed.blocks.indexOf(parent) + 1)) {
    const record = block.annotation?.record
    if (record && typeof record.target === "string" && thread.has(record.target)) {
      thread.add(record.id)
      last = block
    }
  }
  return last
}

function freshBlockId(parsed: ParsedNote, draw: () => string): string {
  for (let attempt = 0; attempt < 100; attempt++) {
    const id = draw()
    if (!parsed.blockIds.has(id)) return id
  }
  throw new AnnotationWriteError("could not draw a block id the note doesn't already use")
}

/** What goes before a block appended to a note with none: enough to leave one blank line. */
function separatorAtEnd(text: string, eol: LineEnding): string {
  if (text === "" || /\n[ \t]*\r?\n$/.test(text)) return ""
  return text.endsWith("\n") ? eol : eol + eol
}
