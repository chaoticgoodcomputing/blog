// A public note's annotations, published to Hypothesis as well as kept in the note. The note is
// what is true: Hypothesis is told of what it says, and nothing comes back from Hypothesis but each
// copy's id. Each record keeps its copies' ids, and a digest of what was sent to each, in its
// `hypothesis` field (web-annotations' `setRecordFields`), so a copy is sent again only when what
// would be sent changes. A ledger outside the note remembers every copy made from a note, so that
// one whose block is gone, removed by any means, is removed from Hypothesis too.
//
// An annotation has up to two copies:
// - its **source copy**, on the annotated document at its own address: a web page's, or a PDF's on
//   the web. A PDF's ends with a link to the annotation's card on the note's page, and is not made
//   when the PDF's text was recognized by the plugin, which Hypothesis wouldn't find its passage in.
//   The PDF's fingerprint is never sent: the site's own copy of the PDF has it too.
// - its **page copy**, for a PDF's note only: on the note's page on the site, on the passage its
//   card quotes.
// Only a note whose `annotation-public` property says so is published. Highlights are not:
// Hypothesis keeps them private. A reply is published beside its parent's copy, once there is one.
// Nothing here reaches Obsidian or the network: Hypothesis's API and the ledger are ports.

import { readNote, toHypothesis, AnnotationPropertyError, type HypothesisAnnotation, type NoteAnnotation } from "@chaoticgoodcomputing/web-annotations"

/** The record's field the copies on Hypothesis are kept in. */
export const MIRROR_FIELD = "hypothesis"
/** The property of a note that publishes its annotations. */
export const PUBLIC_PROPERTY = "annotation-public"

/** Where one copy is, and a digest of what was sent to it. */
export interface Mirrored {
  id: string
  digest: string
}

/** An annotation's copies, by kind. */
export interface Copies {
  source?: Mirrored
  page?: Mirrored
}

type Kind = keyof Copies
const KINDS: Kind[] = ["source", "page"]

/** An annotation as Hypothesis's API takes it (`POST /api/annotations`). */
export interface HypothesisPayload {
  uri: string
  document: { title: string[] }
  text: string
  tags: string[]
  target: { source: string; selector?: readonly unknown[] }[]
  references?: string[]
  group: string
  permissions: { read: string[] }
}

/** Hypothesis's API, as far as the mirror uses it. Each throws when Hypothesis can't be reached or refuses. */
export interface HypothesisApi {
  /** Makes an annotation; its id. */
  create(payload: HypothesisPayload): Promise<string>
  /** Changes one; false when Hypothesis has no such annotation. */
  update(id: string, payload: HypothesisPayload): Promise<boolean>
  /** Removes one; one already gone is removed. */
  remove(id: string): Promise<void>
}

/** Every copy made from a note, by the note's path. */
export interface Ledger {
  ids(path: string): readonly string[]
  add(path: string, id: string): Promise<void>
  remove(path: string, id: string): Promise<void>
}

export interface MirrorOptions {
  api: HypothesisApi
  ledger: Ledger
  /** The Hypothesis group published to: `__world__`, its public one. */
  group: string
  /** A comment as published: its wikilinks made links (./public-markdown.ts). */
  toPublic: (comment: string) => string
  /** The note's page on the site; none when it has none there. */
  pageUrl?: string
  /** Whether the PDF's text was recognized by the plugin: its passages are in text Hypothesis doesn't have. */
  recognized?: boolean
  /** Send every copy again, whatever was sent before. */
  force?: boolean
}

export interface MirrorResult {
  /** The `hypothesis` fields to write into the note's records, by block id: set, or cleared. */
  fields: Map<string, Copies | undefined>
  created: number
  updated: number
  removed: number
  /** What failed, to be tried again on the note's next change. */
  errors: unknown[]
}

const isMirrored = (value: unknown): value is Mirrored =>
  typeof (value as Partial<Mirrored> | undefined)?.id === "string" && typeof (value as Partial<Mirrored>).digest === "string"

/**
 * An annotation's copies, from its `hypothesis` field: the source copy's id and digest at the
 * field's top, as they were before there were page copies, and the page copy under `page`.
 */
export function copiesOf(annotation: NoteAnnotation): Copies {
  const field = annotation.record[MIRROR_FIELD] as (Partial<Mirrored> & { page?: unknown }) | undefined
  const copies: Copies = {}
  if (isMirrored(field)) copies.source = { id: field.id, digest: field.digest }
  if (isMirrored(field?.page)) copies.page = { id: field.page.id, digest: field.page.digest }
  return copies
}

/** The `hypothesis` field for an annotation's copies, as `copiesOf` reads it; none for none. */
export function fieldOf(copies: Copies): Record<string, unknown> | undefined {
  if (!copies.source && !copies.page) return undefined
  return { ...(copies.source ? { id: copies.source.id, digest: copies.source.digest } : {}), ...(copies.page ? { page: copies.page } : {}) }
}

/** Whether a note's frontmatter publishes its annotations: `annotation-public: true`. */
export function isPublic(frontmatter: Record<string, unknown> | undefined): boolean {
  const value = frontmatter?.[PUBLIC_PROPERTY]
  return value === true || (typeof value === "string" && value.trim().toLowerCase() === "true")
}

/** A short digest of a payload: cyrb53, in hex. */
export function digestOf(value: unknown): string {
  const text = JSON.stringify(value)
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
}

const isWebAddress = (address: string | undefined): address is string => address !== undefined && /^https?:\/\//i.test(address)

/** The quote of a passage's `TextQuoteSelector`, as a card shows it. */
function quoteOf(shown: HypothesisAnnotation): string | undefined {
  for (const target of shown.target ?? []) {
    for (const selector of target.selector ?? []) {
      if (selector.type === "TextQuoteSelector" && typeof selector.exact === "string" && selector.exact.trim()) return selector.exact.trim()
    }
  }
  return undefined
}

/** A link to an annotation's card on the note's page, at the end of a PDF's source copy. */
function backlink(pageUrl: string, blockId: string): string {
  const host = new URL(pageUrl).host
  return `\n\n[Read on ${host}](${pageUrl}#^${blockId})`
}

/**
 * Brings Hypothesis up to what a note at `path` says: publishes what it publishes, removes what it
 * no longer does. Gives back the fields to write into its records; what failed is left as it was,
 * for the next time.
 */
export async function mirrorNote(path: string, text: string, title: string, published: boolean, options: MirrorOptions): Promise<MirrorResult> {
  const { api, ledger, group, toPublic, force = false, recognized = false } = options
  const result: MirrorResult = { fields: new Map(), created: 0, updated: 0, removed: 0, errors: [] }
  const note = readNote(text)
  const properties = note.properties instanceof AnnotationPropertyError ? undefined : note.properties
  const web = properties?.targetType === "web"
  const pdf = properties !== undefined && !web
  const pageUrl = pdf && isWebAddress(options.pageUrl) ? options.pageUrl : undefined
  /** Which copies the note makes at all. */
  const makes: Record<Kind, boolean> = {
    source: published && properties !== undefined && isWebAddress(properties.target) && !(pdf && recognized),
    page: published && pageUrl !== undefined,
  }

  /** Each kind's copies the note still has, after this: by block id. */
  const kept: Record<Kind, Map<string, string>> = { source: new Map(), page: new Map() }

  const remove = async (id: string) => {
    try {
      await api.remove(id)
      await ledger.remove(path, id)
      result.removed++
      return true
    } catch (error) {
      result.errors.push(error)
      return false
    }
  }

  /** What a copy of an annotation says, of a kind; none when it has no copy of that kind. */
  const payloadOf = (kind: Kind, annotation: NoteAnnotation, shown: HypothesisAnnotation | undefined): HypothesisPayload | undefined => {
    if (!makes[kind] || !shown) return undefined
    const reply = annotation.record.motivation === "replying"
    const tags = [...(shown.tags ?? [])]
    if (reply ? annotation.comment === "" : annotation.comment === "" && tags.length === 0) return undefined
    const references = reply ? shown.references?.map((blockId) => kept[kind].get(blockId)) : undefined
    if (reply && (!references?.length || references.some((id) => id === undefined))) return undefined

    let uri: string
    let target: HypothesisPayload["target"]
    let comment = toPublic(annotation.comment)
    if (kind === "source") {
      if (!isWebAddress(shown.uri)) return undefined
      uri = shown.uri
      target = (shown.target ?? []).map((each) => ({ ...each }))
      if (pageUrl) comment += backlink(pageUrl, annotation.blockId)
    } else {
      uri = pageUrl!
      const quote = reply ? undefined : quoteOf(shown)
      target = [quote ? { source: uri, selector: [{ type: "TextQuoteSelector", exact: quote }] } : { source: uri }]
    }
    return {
      uri,
      document: { title: [title] },
      text: comment,
      tags,
      target,
      ...(reply ? { references: references as string[] } : {}),
      group,
      permissions: { read: [`group:${group}`] },
    }
  }

  const shownAs = new Map(toHypothesis(note, title).map((annotation) => [annotation.id!, annotation]))
  for (const annotation of note.annotations) {
    const before = copiesOf(annotation)
    const after: Copies = {}
    for (const kind of KINDS) {
      const mirrored = before[kind]
      const payload = payloadOf(kind, annotation, shownAs.get(annotation.blockId))
      if (!payload) {
        // Its copy goes; a reply whose parent failed to publish is published again with it, next time.
        if (mirrored && !(await remove(mirrored.id))) {
          after[kind] = mirrored
          kept[kind].set(annotation.blockId, mirrored.id)
        }
        continue
      }
      const digest = digestOf(payload)
      if (mirrored && mirrored.digest === digest && !force) {
        after[kind] = mirrored
        kept[kind].set(annotation.blockId, mirrored.id)
        continue
      }
      try {
        if (mirrored && (await api.update(mirrored.id, payload))) {
          result.updated++
          after[kind] = { id: mirrored.id, digest }
        } else {
          const id = await api.create(payload)
          await ledger.add(path, id)
          result.created++
          after[kind] = { id, digest }
        }
        kept[kind].set(annotation.blockId, after[kind]!.id)
      } catch (error) {
        result.errors.push(error)
        if (mirrored) {
          after[kind] = mirrored
          kept[kind].set(annotation.blockId, mirrored.id)
        }
      }
    }
    if (digestOf(fieldOf(after) ?? null) !== digestOf(fieldOf(before) ?? null)) result.fields.set(annotation.blockId, fieldOf(after) && after)
  }

  // Copies made from the note that it no longer has: their blocks were removed, or written over.
  const still = new Set(KINDS.flatMap((kind) => [...kept[kind].values()]))
  for (const id of ledger.ids(path)) if (!still.has(id)) await remove(id)
  return result
}
