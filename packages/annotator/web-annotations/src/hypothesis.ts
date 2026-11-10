import type { Mint } from "./mint.ts"
import type { AnnotationNote, NoteAnnotation } from "./note.ts"
import { AnnotationPropertyError } from "./properties.ts"
import { tagsOf, type AnnotationContent, type Selector } from "./record.ts"
import { addAnnotation, updateAnnotation, type WriteResult } from "./write.ts"

export interface HypothesisTarget {
  readonly source: string
  readonly selector?: readonly Selector[]
}

/**
 * The part of the Hypothesis client's annotation JSON the note keeps. The service fills `user`,
 * `group`, `permissions` and the rest; on writing they are dropped.
 */
export interface HypothesisAnnotation {
  /** The block id. Absent for an annotation the client is creating. */
  readonly id?: string
  readonly text?: string
  readonly tags?: readonly string[]
  /** Block ids of the thread above, root first; the last is the parent. */
  readonly references?: readonly string[]
  readonly target?: readonly HypothesisTarget[]
  readonly uri?: string
  readonly created?: string
  readonly updated?: string
  readonly document?: { readonly title?: string }
  readonly [key: string]: unknown
}

/** Every readable annotation of a note, as the Hypothesis client would have it. */
export function toHypothesis(note: AnnotationNote, title: string): HypothesisAnnotation[] {
  const byRecordId = new Map(note.annotations.map((annotation) => [annotation.record.id, annotation]))
  const noteTarget = note.properties instanceof AnnotationPropertyError ? undefined : note.properties?.target

  return note.annotations.map((annotation) => {
    // Walk the replying targets up to the root; a missing parent ends the walk there.
    const references: string[] = []
    let root: NoteAnnotation = annotation
    const visited = new Set([annotation.record.id])
    while (typeof root.record.target === "string") {
      const parent = byRecordId.get(root.record.target)
      if (!parent || visited.has(parent.record.id)) break
      visited.add(parent.record.id)
      references.unshift(parent.blockId)
      root = parent
    }
    const passage = typeof root.record.target === "string" ? undefined : root.record.target
    const source = passage?.source ?? noteTarget
    const reply = typeof annotation.record.target === "string"
    const target: HypothesisTarget[] =
      source === undefined
        ? []
        : [!reply && passage?.selector ? { source, selector: passage.selector } : { source }]

    return {
      id: annotation.blockId,
      text: annotation.comment,
      tags: tagsOf(annotation.record),
      ...(reply ? { references } : {}),
      target,
      ...(source === undefined ? {} : { uri: source }),
      created: annotation.record.created,
      updated: annotation.record.modified,
      document: { title },
    }
  })
}

/**
 * Writes an annotation from the Hypothesis client into the note: an update when its id is a block
 * id of the note, otherwise a new annotation with a new block id and `urn:uuid`.
 */
export function fromHypothesis(text: string, annotation: HypothesisAnnotation, mint: Partial<Mint> = {}): WriteResult {
  const parent = annotation.references?.at(-1)
  const first = annotation.target?.[0]
  let content: AnnotationContent = { comment: annotation.text ?? "", tags: annotation.tags ?? [] }
  if (parent !== undefined) content = { ...content, replyTo: parent }
  else if (first) content = { ...content, target: first.selector ? { source: first.source, selector: first.selector } : { source: first.source } }

  // An unknown id is an error (updateAnnotation throws), not a new annotation.
  return annotation.id === undefined
    ? addAnnotation(text, content, mint)
    : updateAnnotation(text, annotation.id, content, mint)
}
