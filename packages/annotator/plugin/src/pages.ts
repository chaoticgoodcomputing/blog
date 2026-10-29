// A note's page range: which of its PDF's pages the annotator shows, from the note's
// `annotation-pages` property. The PDF is opened whole and only those pages are shown, so the
// annotations made on them name their passages in the whole document, as every other annotation
// does.

export const PAGES_PROPERTY = "annotation-pages"

/** Pages, numbered from 1 as a PDF reader numbers them: each `[first, last]`, both included. */
export type PageRange = [number, number][]

/**
 * A page range, from `12-40`, `3-5, 9`, `7` or a list of those. Undefined for anything else, and
 * for nothing at all, which shows every page.
 */
export function parsePageRange(value: unknown): PageRange | undefined {
  const parts = (Array.isArray(value) ? value : [value]).flatMap((item) => (typeof item === "number" ? [String(item)] : typeof item === "string" ? item.split(",") : []))
  const range: PageRange = []
  for (const part of parts) {
    const match = /^\s*(\d+)\s*(?:[-–]\s*(\d+)\s*)?$/.exec(part)
    if (!match) return undefined
    const first = Number(match[1])
    const last = match[2] === undefined ? first : Number(match[2])
    if (first < 1 || last < first) return undefined
    range.push([first, last])
  }
  return range.length ? range : undefined
}

/** A page range as text, for the viewer page's address: `3-5,9`. */
export const formatPageRange = (range: PageRange) => range.map(([first, last]) => (first === last ? `${first}` : `${first}-${last}`)).join(",")

/** Whether a page, numbered from 1, is in a range. */
export const inPageRange = (range: PageRange, page: number) => range.some(([first, last]) => page >= first && page <= last)
