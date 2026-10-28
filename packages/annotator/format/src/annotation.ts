// An annotation as the Hypothesis client and the fake service deal in it, and the defaults the
// Annotator fills in for what a note leaves out of its record.
//
// Upstream keeps out of each record whatever it can fill in again on reading (the user, the
// permissions, an empty comment, the block's own id), and keeps the comment and the tags in the
// view, where they can be edited. Reading and writing here do the same, so that a note this package
// writes is one upstream reads, and the other way round. Upstream's code for it is
// `makeDefaultAnnotationObject` and `stripDefaultValues`:
// https://github.com/elias-sundqvist/obsidian-annotator/blob/3647dd92d0d803bae9a3f34a1aac19eacb2fd52d/src/annotationUtils.tsx

/** Hypothesis's way of finding a passage again: by its quote, by its place, or by its elements. */
export type Selector =
  | { type: "TextQuoteSelector"; exact?: string; prefix?: string; suffix?: string }
  | { type: "TextPositionSelector"; start: number; end: number }
  | { type: string; [field: string]: unknown }

/**
 * An annotation, as Hypothesis's API has it. Only the fields the format reads are typed; the rest
 * of the record is kept as it is, whatever is in it.
 */
export interface Annotation {
  /** Its block id, without the `^`. */
  id: string
  /** The comment, in Markdown. */
  text?: string
  tags?: string[]
  /** The annotated document and the passage in it; empty for a page note or a reply. */
  target?: { source?: string; selector?: Selector[]; [field: string]: unknown }[]
  /** The ids of what a reply answers, from the root of its thread down. */
  references?: string[]
  [field: string]: unknown
}

/** The fields Upstream fills in on reading, and so leaves out of a record when they are these. */
export function defaultFields(id: string, tags: string[]): Record<string, unknown> {
  return {
    group: "__world__",
    permissions: { read: ["Obsidian User"], update: ["Obsidian User"], delete: ["Obsidian User"] },
    tags,
    text: "",
    user: "Obsidian User",
    user_info: { display_name: "Obsidian User" },
    hidden: false,
    target: [],
    links: {},
    flagged: false,
    id,
  }
}

// Fields never kept in a record, whatever they are: they are the same for every annotation of a
// vault, and filled in again on reading.
const UNKEPT = ["group", "permissions", "user", "user_info"]

/** What of an annotation its record keeps: every field but those reading fills in again. */
export function recordOf(annotation: Annotation): Record<string, unknown> {
  const defaults = defaultFields(annotation.id, annotation.tags ?? [])
  const record: Record<string, unknown> = {}
  for (const [field, value] of Object.entries(annotation)) {
    if (UNKEPT.includes(field)) continue
    // Compared as JSON, as Upstream does: a field that is the default, or undefined, is left out.
    if (JSON.stringify(value) === JSON.stringify(defaults[field])) continue
    record[field] = value
  }
  return record
}

/** The quote of an annotation's passage, from its last quote selector: empty when it has none. */
export function quoteOf(annotation: Annotation): { prefix: string; exact: string; suffix: string } {
  let quote = { prefix: "", exact: "", suffix: "" }
  for (const selector of annotation.target?.[0]?.selector ?? []) {
    if (selector?.type !== "TextQuoteSelector") continue
    const { prefix, exact, suffix } = selector as Record<string, unknown>
    quote = { prefix: stringOr(prefix), exact: stringOr(exact), suffix: stringOr(suffix) }
  }
  return quote
}

const stringOr = (value: unknown) => (typeof value === "string" && value ? value : "")
