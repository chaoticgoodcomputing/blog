// Annotation notes for the tests, written by web-annotations with block ids, ids and times fixed.

import { addAnnotation, type Mint } from "@chaoticgoodcomputing/web-annotations"

export const TIME = "2026-11-10T12:00:00.000Z"

/** Times and ids that don't change from run to run: the block id given, and a UUID made of it. */
export const mint = (blockId: string): Mint => ({
  now: () => TIME,
  blockId: () => blockId,
  uuid: () => `00000000-0000-4000-8000-${Buffer.from(blockId).toString("hex").padStart(12, "0").slice(-12)}`,
})

/** A passage of `source`, as the client names one. */
export const passage = (source: string, exact: string, extra: { prefix?: string; suffix?: string } = {}) => ({
  source,
  selector: [{ type: "TextPositionSelector", start: 10, end: 10 + exact.length }, { type: "TextQuoteSelector", exact, ...extra }],
})

/** `text` with an annotation on `exact` added, its block id `id`. */
export function annotate(text: string, id: string, source: string, exact: string, comment: string, tags: string[] = []): string {
  return addAnnotation(text, { comment, tags, target: passage(source, exact) }, mint(id)).text
}

/** `text` with a reply to `parent` added, its block id `id`. */
export function reply(text: string, id: string, parent: string, comment: string): string {
  return addAnnotation(text, { comment, replyTo: parent }, mint(id)).text
}
