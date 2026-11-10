import { isRecord } from "./properties.ts"

export const ANNOTATION_CONTEXT = "http://www.w3.org/ns/anno.jsonld"

export type Motivation = "commenting" | "highlighting" | "tagging" | "replying"

/** A W3C selector, kept exactly as the client sent it. */
export interface Selector {
  readonly type: string
  readonly [key: string]: unknown
}

/** The annotated passage: a document's address and the selectors that find the passage in it. */
export interface PassageTarget {
  readonly source: string
  readonly selector?: readonly Selector[]
  readonly [key: string]: unknown
}

/** Points the record's comment at its block: `#^<blockid>`, relative to the note. */
export interface CommentReference {
  readonly id: string
  readonly type: "Text"
  readonly format: "text/markdown"
  readonly purpose?: "commenting"
}

export interface TaggingBody {
  readonly type: "TextualBody"
  readonly value: string
  readonly purpose: "tagging"
}

export type Body = CommentReference | TaggingBody | { readonly [key: string]: unknown }

/** The record: a W3C annotation, as the note stores it. Unknown fields are kept. */
export interface WebAnnotation {
  readonly "@context": string
  /** `urn:uuid:` and a v4 UUID. */
  readonly id: string
  readonly type: "Annotation"
  readonly motivation: Motivation
  readonly body?: Body | readonly Body[]
  /** The passage, or for a reply its parent's `id`. */
  readonly target: PassageTarget | string
  readonly created: string
  readonly modified: string
  readonly [key: string]: unknown
}

/** What a caller says about an annotation; the package works out the rest of the record. */
export interface AnnotationContent {
  /** Markdown. Empty, or only blank lines, means no comment. */
  readonly comment?: string
  readonly tags?: readonly string[]
  /** The passage. Give this or `replyTo`. */
  readonly target?: PassageTarget
  /** For a reply: its parent's block id. */
  readonly replyTo?: string
}

/** Settled content: a passage, or a parent record's id for a reply. */
export interface Settled {
  readonly comment: string
  readonly tags: readonly string[]
  readonly target: PassageTarget | string
}

const ORDER = ["@context", "id", "type", "motivation", "body", "target", "created", "modified"]

/** The record before a write: the previous one, or for a new annotation just its id and times. */
export interface Prior {
  readonly id: string
  readonly created: string
  readonly modified: string
  readonly body?: unknown
  readonly target?: unknown
  readonly [key: string]: unknown
}

/**
 * Builds the record for some content on top of the prior one, keeping its id, its times and its
 * unknown fields. The caller sets `modified`.
 */
export function composeRecord(content: Settled, blockId: string, prior: Prior): WebAnnotation {
  const reply = typeof content.target === "string"

  const bodies: unknown[] = []
  if (content.comment !== "") {
    const reference = { id: `#^${blockId}`, type: "Text", format: "text/markdown" }
    bodies.push(reply ? reference : { ...reference, purpose: "commenting" })
  }
  for (const value of content.tags) bodies.push({ type: "TextualBody", value, purpose: "tagging" })
  bodies.push(...asList(prior.body).filter((body) => !isCommentReference(body) && !isTagging(body)))

  const motivation: Motivation = reply
    ? "replying"
    : content.comment !== ""
      ? "commenting"
      : content.tags.length > 0
        ? "tagging"
        : "highlighting"

  let target: PassageTarget | string = content.target
  if (typeof content.target !== "string") {
    // Keep whatever else the previous target said; take the source and selectors as given.
    const merged: Record<string, unknown> = isRecord(prior.target) ? { ...prior.target } : {}
    merged.source = content.target.source
    if (content.target.selector) merged.selector = content.target.selector
    else delete merged.selector
    target = merged as PassageTarget
  }

  const known: Record<string, unknown> = {
    "@context": ANNOTATION_CONTEXT,
    id: prior.id,
    type: "Annotation",
    motivation,
    body: bodies.length === 0 ? undefined : bodies.length === 1 ? bodies[0] : bodies,
    target,
    created: prior.created,
    modified: prior.modified,
  }
  const record: Record<string, unknown> = {}
  for (const key of ORDER) if (known[key] !== undefined) record[key] = known[key]
  for (const key of Object.keys(prior)) if (!ORDER.includes(key)) record[key] = prior[key]
  return record as WebAnnotation
}

/** The tags of a record's tagging bodies, in order. */
export function tagsOf(record: WebAnnotation): string[] {
  return asList(record.body)
    .filter(isTagging)
    .map((body) => body.value)
}

export function isCommentReference(body: unknown): body is CommentReference {
  return isRecord(body) && body.type === "Text" && typeof body.id === "string" && body.id.startsWith("#^")
}

function isTagging(body: unknown): body is TaggingBody {
  return isRecord(body) && body.purpose === "tagging" && typeof body.value === "string"
}

function asList(body: unknown): unknown[] {
  return body === undefined ? [] : Array.isArray(body) ? body : [body]
}

/** Deep equality of JSON values, ignoring the order of keys. */
export function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => sameJson(x, b[i]))
  }
  if (!isRecord(a) || !isRecord(b)) return false
  const keys = Object.keys(a).filter((key) => a[key] !== undefined)
  if (keys.length !== Object.keys(b).filter((key) => b[key] !== undefined).length) return false
  return keys.every((key) => sameJson(a[key], b[key]))
}
