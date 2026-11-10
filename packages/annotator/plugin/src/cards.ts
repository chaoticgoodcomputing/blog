// What a web page's note's cards show of its annotations (src/web-cards.ts draws them): the passage,
// from the record's quote selector, the comment, as the note's Markdown, and the tags. Nothing here
// reaches Obsidian, so the tests run it as it is.

import { type NoteAnnotation, readNote } from "@chaoticgoodcomputing/web-annotations"
import { webPageOf } from "./editor/region.ts"
import { passageAddress, passageOf } from "./passage.ts"

/** What a card shows of an annotation, and the address of its passage in the page. */
export interface Card {
  /** The annotation's block id. */
  id: string
  /** Markdown; empty for none. */
  comment: string
  tags: string[]
  exact?: string
  address?: string
}

export function cardOf({ blockId, record, comment }: NoteAnnotation, page: string | undefined): Card {
  const bodies = record.body === undefined ? [] : Array.isArray(record.body) ? record.body : [record.body]
  const tags = bodies.flatMap((body) => (body.purpose === "tagging" && typeof body.value === "string" ? [body.value] : []))
  const passage = passageOf(record)
  const exact = passage?.exact?.trim() || undefined
  return { id: blockId, comment, tags, exact, address: page && exact ? passageAddress(page, passage!) : undefined }
}

/** The cards of a note's annotations that read, among `annotations` (all of them, by default). */
export function cardsOf(text: string, annotations: readonly NoteAnnotation[] = readNote(text).annotations): Card[] {
  const page = webPageOf(text)?.url
  return annotations.map((annotation) => cardOf(annotation, page))
}
