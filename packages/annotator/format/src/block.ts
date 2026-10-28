// One annotation's block in an annotation note: its record as JSON in a code block that a comment
// hides, then the view written from it for reading in Obsidian, every line quoted, and the block's
// id on the line after.
//
//   >%%
//   >```annotation-json
//   >{"text":"…","target":[{"source":"…","selector":[…]}],"created":"…",…}
//   >```
//   >%%
//   >*%%PREFIX%%…%%HIGHLIGHT%% ==…== %%POSTFIX%%…*
//   >%%LINK%%[[#^id|show annotation]]
//   >%%COMMENT%%
//   >…
//   >%%TAGS%%
//   >#tag, #tag
//   ^id
//
// The format is Upstream's, as it writes a block in `makeAnnotationString`, finds one with
// `makeAnnotationBlockRegex` and reads one in `getAnnotationFromAnnotationBlock`:
// https://github.com/elias-sundqvist/obsidian-annotator/blob/3647dd92d0d803bae9a3f34a1aac19eacb2fd52d/src/annotationUtils.tsx
//
// Upstream finds a block only after a blank line and only with `\n` line breaks. A block is found
// here at the start of a note too, with `\r\n` line breaks, and with spaces after its `^id`.

import { type Annotation, defaultFields, quoteOf, recordOf } from "./annotation.ts"

/** Where something is in a note's source: `[start, end)` offsets, in UTF-16 code units. */
export interface Span {
  start: number
  end: number
}

/** How a block's view writes its passage. Upstream's settings name them in its writer. */
export interface ViewOptions {
  /** Write the text just before the passage (Upstream's `includePrefix`). */
  prefix: boolean
  /** Write the text just after the passage (Upstream's `includePostfix`). */
  suffix: boolean
  /** Mark the passage as highlighted, in `==` (Upstream's `highlightHighlightedText`). */
  highlight: boolean
}

/** Upstream's own defaults: the whole passage, highlighted. */
export const DEFAULT_VIEW: ViewOptions = { prefix: true, suffix: true, highlight: true }

export interface Block {
  /** Its block id, without the `^`. */
  id: string
  /** From the start of its first quoted line to the end of its `^id` line, line break and all. */
  span: Span
  /** Its record, as the JSON has it; missing when the JSON does not parse. */
  record?: Record<string, unknown>
  /**
   * Its annotation as the Annotator reads it: the record, with what its view says of the passage,
   * the comment and the tags where the view was edited, and the fields the record leaves out
   * filled in again. Missing when the record is.
   */
  annotation?: Annotation
  /** How its view was written; missing when the view is not in the shape Upstream writes. */
  view?: ViewOptions
  /** Why its record, or its view, could not be read. */
  problem?: string
}

const OPENING = /^>%%[ \t]*$/
const RECORD_FENCE = /^>```annotation-json[ \t]*$/
const CLOSING_FENCE = /^>```[ \t]*$/
const ID_LINE = /^\^([a-zA-Z0-9]+)[ \t]*$/

interface Line {
  start: number
  /** Where its text ends, before its line break. */
  end: number
  /** Where the next line starts, after its line break. */
  next: number
}

function linesOf(source: string): Line[] {
  const lines: Line[] = []
  let start = 0
  while (start < source.length) {
    const lf = source.indexOf("\n", start)
    const next = lf === -1 ? source.length : lf + 1
    const end = lf === -1 ? next : lf > start && source[lf - 1] === "\r" ? lf - 1 : lf
    lines.push({ start, end, next })
    start = next
  }
  return lines
}

/** Every annotation block in a note's source, in source order. */
export function findBlocks(source: string): Block[] {
  const lines = linesOf(source)
  const text = (i: number) => source.slice(lines[i]!.start, lines[i]!.end)
  const blocks: Block[] = []
  for (let i = 0; i + 1 < lines.length; i++) {
    if (!OPENING.test(text(i)) || !RECORD_FENCE.test(text(i + 1))) continue
    // Quoted lines up to the `^id` line that closes the block; any other line means it is not one.
    let j = i + 2
    while (j < lines.length && text(j).startsWith(">")) j++
    const id = j < lines.length ? ID_LINE.exec(text(j))?.[1] : undefined
    if (id === undefined) continue
    const quoted: string[] = []
    for (let k = i; k < j; k++) quoted.push(text(k).slice(1))
    const span = { start: lines[i]!.start, end: lines[j]!.next }
    blocks.push({ id, span, ...readBlock(id, quoted) })
    i = j
  }
  return blocks
}

// The view, once the block's lines are unquoted and joined with `\n`: the passage, the link, the
// comment and the tags. Upstream's own expression for it is looser about where each part ends.
const VIEW =
  /^%%\n```annotation-json\n[^]*?\n```\n%%\n\*([^]*?)\*\n%%LINK%%.*\n%%COMMENT%%\n([^]*)\n%%TAGS%%\n([^]*)$/

interface View {
  options: ViewOptions
  prefix?: string
  exact: string
  suffix?: string
  comment: string
  tags: string[]
}

function readView(body: string): View | undefined {
  const match = VIEW.exec(body)
  if (!match) return undefined
  const [, passage, comment, tags] = match as unknown as [string, string, string, string]
  const highlightAt = passage.indexOf("%%HIGHLIGHT%%")
  if (highlightAt === -1) return undefined
  const hasPrefix = passage.startsWith("%%PREFIX%%")
  if (!hasPrefix && highlightAt !== 0) return undefined
  const rest = passage.slice(highlightAt + "%%HIGHLIGHT%%".length)
  const suffixAt = rest.indexOf("%%POSTFIX%%")
  let exact = suffixAt === -1 ? rest : rest.slice(0, suffixAt)
  const highlight = exact.startsWith(" ==") && exact.endsWith("== ") && exact.length >= 6
  if (highlight) exact = exact.slice(3, -3)
  const view: View = {
    options: { prefix: hasPrefix, suffix: suffixAt !== -1, highlight },
    exact,
    comment,
    // Upstream writes `#a, #b`, and reads each tag as what is after its `#`.
    tags: tags.split(",").map((tag) => tag.trim().replace(/^#/, "")).filter((tag) => tag),
  }
  if (hasPrefix) view.prefix = passage.slice("%%PREFIX%%".length, highlightAt)
  if (suffixAt !== -1) view.suffix = rest.slice(suffixAt + "%%POSTFIX%%".length)
  return view
}

/** The record and the view of a block, from its lines without their `>`. */
function readBlock(id: string, quoted: string[]): Omit<Block, "id" | "span"> {
  const closing = quoted.findIndex((line, i) => i > 1 && CLOSING_FENCE.test(`>${line}`))
  if (closing === -1) return { problem: "Its record has no closing fence." }
  let record: unknown
  try {
    record = JSON.parse(quoted.slice(2, closing).join("\n"))
  } catch (error) {
    return { problem: `Its record is not JSON: ${(error as Error).message}` }
  }
  if (typeof record !== "object" || record === null || Array.isArray(record)) {
    return { problem: "Its record is not a JSON object." }
  }
  const view = readView(quoted.join("\n"))
  const annotation = annotationOf(id, JSON.parse(JSON.stringify(record)), view)
  const read: Omit<Block, "id" | "span"> = { record: record as Record<string, unknown>, annotation }
  if (view) read.view = view.options
  else read.problem = "Its view is not in the shape Upstream writes, so only its record is read."
  return read
}

const lf = (text: string) => text.replace(/\r\n?/g, "\n")

/**
 * The annotation a record and its view make. Upstream takes the comment, the tags and the text
 * either side of the passage from the view, so that they can be edited there; but the view writes
 * the text either side trimmed, and reading that back would change the record of an annotation
 * nobody edited. So the view's word is taken only where it says something other than what would
 * be written from the record.
 */
function annotationOf(
  id: string,
  record: Record<string, unknown>,
  view: View | undefined,
): Annotation {
  const annotation = record as Annotation
  // Upstream drops the group a record names, and every annotation is in the default one.
  delete annotation.group
  if (view) {
    const target = annotation.target?.[0]
    if (target && Array.isArray(target.selector)) {
      target.selector = target.selector.map((selector) => {
        if (selector?.type !== "TextQuoteSelector") return selector
        const quote = { ...selector } as Record<string, unknown>
        const edited = (field: "prefix" | "suffix") => {
          const written = view[field]
          const recorded = typeof quote[field] === "string" ? (quote[field] as string) : ""
          if (written !== undefined && written !== recorded.trim()) quote[field] = written
        }
        edited("prefix")
        edited("suffix")
        quote.exact ??= view.exact
        return quote as typeof selector
      })
    }
    const recorded = typeof annotation.text === "string" ? annotation.text : ""
    annotation.text = lf(recorded) === view.comment ? recorded : view.comment
    const tags = annotation.tags
    const same = Array.isArray(tags) && tags.join("\u0000") === view.tags.join("\u0000")
    annotation.tags = same ? tags : view.tags
  }
  // The fields the record leaves out, after its own, so that it is written back in its own order.
  for (const [field, value] of Object.entries(defaultFields(id, annotation.tags ?? []))) {
    if (!(field in annotation)) annotation[field] = value
  }
  annotation.id = id
  return annotation
}

const ID = /^[a-zA-Z0-9]+$/

/**
 * An annotation's block, as Upstream writes it: from its first quoted line to its `^id` line, with
 * a line break after that. The annotation needs an id.
 */
export function serializeBlock(
  annotation: Annotation,
  options: Partial<ViewOptions> & { lineEnding?: "\n" | "\r\n" } = {},
): string {
  if (!ID.test(annotation.id ?? "")) {
    const id = JSON.stringify(annotation.id)
    throw new Error(`An annotation's id is letters and digits, not ${id}.`)
  }
  const prefix = options.prefix ?? DEFAULT_VIEW.prefix
  const suffix = options.suffix ?? DEFAULT_VIEW.suffix
  const highlight = options.highlight ?? DEFAULT_VIEW.highlight
  const eol = options.lineEnding ?? "\n"
  const quote = quoteOf(annotation)
  const passage =
    (prefix ? `%%PREFIX%%${quote.prefix.trim()}` : "") +
    `%%HIGHLIGHT%%${highlight ? ` ==${quote.exact.trim()}== ` : quote.exact.trim()}` +
    (suffix ? `%%POSTFIX%%${quote.suffix.trim()}` : "")
  const body = [
    "%%",
    "```annotation-json",
    JSON.stringify(recordOf(annotation)),
    "```",
    "%%",
    `*${passage}*`,
    `%%LINK%%[[#^${annotation.id}|show annotation]]`,
    "%%COMMENT%%",
    annotation.text || "",
    "%%TAGS%%",
    (annotation.tags ?? []).map((tag) => `#${tag}`).join(", "),
  ].join("\n")
  // Every line quoted, those of a passage or a comment with line breaks in it too.
  const quoted = body.split(/\r?\n/).map((line) => `>${line}`)
  return quoted.join(eol) + eol + `^${annotation.id}` + eol
}
