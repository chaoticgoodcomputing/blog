// A note's page range: which of its PDF's pages the annotator shows, from the note's
// `annotation-pages` property, as web-annotations reads it (src/annotation-properties.ts). The PDF
// is opened whole and only those pages are shown, so the annotations made on them name their
// passages in the whole document, as every other annotation does.

import { type PageRange, parsePageRange } from "@chaoticgoodcomputing/web-annotations"

/**
 * The page range the viewer page's address names, as text (`3-5,9`), or none: every page. The
 * plugin doesn't open the annotator on a malformed one, so none here is never a malformed note's.
 */
export function pageRangeOfAddress(text: string | null | undefined): PageRange | undefined {
  if (!text) return undefined
  const range = parsePageRange(text)
  return Array.isArray(range) ? range : undefined
}
