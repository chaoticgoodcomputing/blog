// Slices: a mirror cut down to the pages of a note's page range (`annotation-pages`), made by
// `astro:mirrors` (scripts/pin-mirrors.ts) from the mirror already saved, with no download of its
// own. Only the script imports this, so pdf-lib never reaches the build.

import type { PageRange } from "@chaoticgoodcomputing/obsidian-markdown"
import { PDFDocument } from "pdf-lib"

export interface Slice {
  bytes: Uint8Array
  /** How many pages it has. */
  pages: number
  /** How many of the range's pages the document doesn't have, past its last. */
  missing: number
}

/**
 * The pages of `range` of the PDF `bytes`, in order, as a PDF of their own: the same bytes every
 * time, with no date of making in it. A range running past the document's end stops there.
 * Undefined when the document has none of the range's pages. Throws for a PDF pdf-lib can't read.
 */
export async function slicePdf(bytes: Uint8Array, range: PageRange): Promise<Slice | undefined> {
  const source = await PDFDocument.load(bytes, { updateMetadata: false })
  const count = source.getPageCount()
  const wanted = range.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, i) => first + i - 1))
  const indices = wanted.filter((index) => index < count)
  if (!indices.length) return undefined
  const slice = await PDFDocument.create({ updateMetadata: false })
  for (const page of await slice.copyPages(source, indices)) slice.addPage(page)
  return { bytes: await slice.save(), pages: indices.length, missing: wanted.length - indices.length }
}
