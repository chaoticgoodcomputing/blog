import { parse as parseYaml } from "yaml"
import { isBlank, lineEndingOf, splitLines, type Line, type LineEnding } from "./lines.ts"
import {
  AnnotationPropertyError,
  isRecord,
  readAnnotationProperties,
  type AnnotationProperties,
} from "./properties.ts"
import type { WebAnnotation } from "./record.ts"

/** Offsets into the note: `end` is exclusive, and a block's includes its block id line's ending. */
export interface Span {
  readonly start: number
  readonly end: number
}

export interface NoteAnnotation {
  readonly blockId: string
  readonly record: WebAnnotation
  /** The comment's Markdown, which the record's comment reference names; empty when it has none. */
  readonly comment: string
  readonly span: Span
}

/** An annotation block that can't be read. It stays in the note as it is. */
export interface AnnotationBlockError {
  readonly message: string
  readonly span: Span
  readonly blockId?: string
}

export interface AnnotationNote {
  /** Undefined when the note has no `annotation-target`. */
  readonly properties: AnnotationProperties | AnnotationPropertyError | undefined
  /** The body before the first annotation block (or the whole body, when it has none). */
  readonly preface: string
  /** In source order. */
  readonly annotations: readonly NoteAnnotation[]
  /** The body after the last annotation block. */
  readonly epilogue: string
  readonly errors: readonly AnnotationBlockError[]
}

/** A block as the writer needs it: where it is, and where its block id line starts. */
export interface Block {
  readonly span: Span
  readonly idLineStart: number
  readonly annotation?: NoteAnnotation
}

export interface ParsedNote {
  readonly text: string
  readonly eol: LineEnding
  readonly blocks: readonly Block[]
  /** Every `^id` anywhere in the note, so a new one can't clash. */
  readonly blockIds: ReadonlySet<string>
  readonly note: AnnotationNote
}

const CALLOUT = /^>\s*\[!annotation\][-+]?(?:\s.*)?$/i
const QUOTED = /^>/
const BLOCK_ID_LINE = /^\^([A-Za-z0-9-]+)[ \t]*$/
const ANY_BLOCK_ID = /(?:^|\s)\^([A-Za-z0-9-]+)[ \t]*$/
const FENCE = /^(`{3,})\s*annotation\s*$/

/** Reads an annotation note: its properties, preface, annotations, epilogue and unreadable blocks. */
export function readNote(text: string): AnnotationNote {
  return parseNote(text).note
}

export function parseNote(text: string): ParsedNote {
  const lines = splitLines(text)
  const { properties, bodyLine } = readFrontmatter(lines)
  const bodyStart = lines[bodyLine]?.start ?? text.length

  const blocks: Block[] = []
  const annotations: NoteAnnotation[] = []
  const errors: AnnotationBlockError[] = []
  const blockIds = new Set<string>()
  const seen = new Set<string>()

  for (const line of lines) {
    const match = ANY_BLOCK_ID.exec(line.text)
    if (match) blockIds.add(match[1]!)
  }

  let i = bodyLine
  while (i < lines.length) {
    if (!CALLOUT.test(lines[i]!.text)) {
      i++
      continue
    }
    const first = i
    i++
    while (i < lines.length && QUOTED.test(lines[i]!.text)) i++
    const callout = lines.slice(first, i)
    const idLine = lines[i]
    const idMatch = idLine ? BLOCK_ID_LINE.exec(idLine.text) : null
    if (!idLine || !idMatch) {
      const span = spanOf(callout)
      errors.push({ message: "annotation callout has no block id line", span })
      blocks.push({ span, idLineStart: span.end })
      continue
    }
    i++
    const span: Span = { start: callout[0]!.start, end: idLine.next }
    const blockId = idMatch[1]!
    const read = readBlock(callout)
    if (typeof read === "string") {
      errors.push({ message: read, span, blockId })
      blocks.push({ span, idLineStart: idLine.start })
    } else if (seen.has(blockId)) {
      errors.push({ message: `block id ^${blockId} is used twice`, span, blockId })
      blocks.push({ span, idLineStart: idLine.start })
    } else {
      seen.add(blockId)
      const annotation: NoteAnnotation = { blockId, record: read.record, comment: read.comment, span }
      annotations.push(annotation)
      blocks.push({ span, idLineStart: idLine.start, annotation })
    }
  }

  const preface = text.slice(bodyStart, blocks[0]?.span.start ?? text.length)
  const epilogue = blocks.length === 0 ? "" : text.slice(blocks.at(-1)!.span.end)
  return {
    text,
    eol: lineEndingOf(text),
    blocks,
    blockIds,
    note: { properties, preface, annotations, epilogue, errors },
  }
}

function readFrontmatter(lines: Line[]): {
  properties: AnnotationNote["properties"]
  bodyLine: number
} {
  if (lines[0]?.text.trimEnd() !== "---") return { properties: undefined, bodyLine: 0 }
  const close = lines.findIndex((line, i) => i > 0 && /^(---|\.\.\.)\s*$/.test(line.text))
  if (close === -1) return { properties: undefined, bodyLine: 0 }
  const yaml = lines
    .slice(1, close)
    .map((line) => line.text)
    .join("\n")
  let frontmatter: unknown
  try {
    frontmatter = parseYaml(yaml)
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n")[0]! : String(error)
    return {
      properties: new AnnotationPropertyError("frontmatter", reason, "not valid YAML"),
      bodyLine: close + 1,
    }
  }
  return { properties: readAnnotationProperties(frontmatter), bodyLine: close + 1 }
}

/** The record and comment of a callout, or why it can't be read. */
function readBlock(callout: Line[]): { record: WebAnnotation; comment: string } | string {
  const inner = callout.slice(1).map((line) => line.text.replace(/^> ?/, ""))
  let i = 0
  if (inner[i]?.trim() !== "%%") return "annotation block has no hidden record (%%)"
  i++
  const fence = FENCE.exec(inner[i]?.trim() ?? "")
  if (!fence) return "annotation block has no ```annotation code block"
  i++
  const json: string[] = []
  while (i < inner.length && inner[i]!.trim() !== fence[1]) json.push(inner[i++]!)
  if (i === inner.length) return "annotation block's code block is never closed"
  i++
  if (inner[i]?.trim() !== "%%") return "annotation block's record is not closed with %%"
  i++

  let record: unknown
  try {
    record = JSON.parse(json.join("\n"))
  } catch {
    return "annotation block's record is not valid JSON"
  }
  if (!isRecord(record) || typeof record.id !== "string" || record.id === "") {
    return "annotation block's record has no id"
  }

  const comment = inner.slice(i)
  while (comment.length > 0 && isBlank(comment[0]!)) comment.shift()
  while (comment.length > 0 && isBlank(comment.at(-1)!)) comment.pop()
  return { record: record as WebAnnotation, comment: comment.join("\n") }
}

function spanOf(lines: Line[]): Span {
  return { start: lines[0]!.start, end: lines.at(-1)!.next }
}
