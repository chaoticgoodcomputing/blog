// A PDF's text file: the text of its scanned pages, as recognized once, kept beside the PDF as
// `<document>.text.json`, and given to PDF.js in place of the text the pages don't have. Whoever
// shows the document makes its text from this file with `textContentOf`, so every viewer has the
// same text, character for character: what annotations are found in.

import { type Box, ENGINE, type RecognizedLine } from "./engine.ts"
import { apply, type Scan } from "./scans.ts"

export const FORMAT = "pdf-ocr/1"

/** The name of a document's text file, beside it. */
export const textFileName = (documentName: string) => `${documentName}.text.json`

/** A word: its text, and where it is on the page, in the page's space (PDF points, y up). */
export interface Word {
  text: string
  /** Its left edge. */
  x: number
  /** Its baseline. */
  y: number
  width: number
  /** Its font size: the em the line's letters are drawn in. */
  size: number
}

export interface PageText {
  /** Lines, in reading order, each its words. */
  lines: Word[][]
}

export interface TextFile {
  format: typeof FORMAT
  /** The PDF it is the text of: its SHA-256, in hex, and its number of pages. */
  source: { sha256: string; pages: number }
  /** What recognized it. */
  engine: typeof ENGINE
  /** Each recognized page's text, by its number, from 1. Pages with text of their own aren't here. */
  pages: Record<string, PageText>
}

/** A PDF's SHA-256, in hex. */
export async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>))
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

/** Whether a text file is a PDF's, by its hash, and in a format this reads. */
export const isTextFileOf = (file: unknown, hash: string): file is TextFile =>
  typeof file === "object" && file !== null && (file as TextFile).format === FORMAT && (file as TextFile).source?.sha256 === hash

const round = (value: number) => Math.round(value * 100) / 100
// Not Math.hypot, whose rounding V8 doesn't promise to keep: sqrt's is exact, everywhere.
const length = (x: number, y: number) => Math.sqrt(x * x + y * y)

/** A page's recognized lines, from the scan's pixels to the page's space. */
export function pageTextOf(lines: RecognizedLine[], scan: Scan): PageText {
  const { width, height, transform } = scan
  // A pixel of the scan (from its top left) on the page: through the image's unit square, whose
  // y runs up, as PDF draws an image.
  const onPage = (x: number, y: number) => apply(transform, x / width, 1 - y / height)
  // A length up the scan, in points.
  const pointsPerPixel = length(transform[2], transform[3]) / height
  return {
    lines: lines.map((line) => {
      const { baseline } = line
      const slope = baseline.x1 === baseline.x0 ? 0 : (baseline.y1 - baseline.y0) / (baseline.x1 - baseline.x0)
      const baselineAt = (x: number) => baseline.y0 + slope * (x - baseline.x0)
      // The line's letters reach from its top to its baseline: about 0.8 of their em.
      const ascent = Math.max(1, baselineAt((line.box.x0 + line.box.x1) / 2) - line.box.y0)
      const size = round((ascent / 0.8) * pointsPerPixel)
      return line.words.map(({ text, box }) => {
        const [left, right] = horizontalExtent(box, onPage)
        const [, y] = onPage((box.x0 + box.x1) / 2, baselineAt((box.x0 + box.x1) / 2))
        return { text, x: round(left), y: round(y), width: round(right - left), size }
      })
    }),
  }
}

function horizontalExtent(box: Box, onPage: (x: number, y: number) => [number, number]): [number, number] {
  const xs = [onPage(box.x0, box.y0), onPage(box.x1, box.y0), onPage(box.x0, box.y1), onPage(box.x1, box.y1)].map(([x]) => x)
  return [Math.min(...xs), Math.max(...xs)]
}

/** A text file, from each recognized page's text. */
export function textFileOf(hash: string, pageCount: number, pages: Iterable<[number, PageText]>): TextFile {
  const sorted = [...pages].sort(([a], [b]) => a - b)
  return { format: FORMAT, source: { sha256: hash, pages: pageCount }, engine: ENGINE, pages: Object.fromEntries(sorted.map(([n, text]) => [String(n), text])) }
}

/** The style the text is drawn in: one, as no font is known. */
export const FONT_NAME = "pdf-ocr"

/** A run of text, as PDF.js's TextContent has one. */
export interface TextItem {
  str: string
  dir: "ltr"
  transform: [number, number, number, number, number, number]
  width: number
  height: number
  fontName: string
  hasEOL: boolean
}

/** A page's text as PDF.js gives it (`getTextContent()`), for its text layer and for finding passages. */
export interface OcrTextContent {
  items: TextItem[]
  styles: Record<string, { fontFamily: string; ascent: number; descent: number; vertical: boolean }>
  lang: null
}

/**
 * A page's text, as PDF.js's TextContent: each word a run, a space between words, and the end of
 * each line marked, as PDF.js marks it in a PDF's own text.
 */
export function textContentOf(page: PageText): OcrTextContent {
  const items: TextItem[] = []
  const item = (str: string, x: number, y: number, width: number, size: number, hasEOL: boolean): TextItem => ({
    str,
    dir: "ltr",
    transform: [size, 0, 0, size, x, y],
    width,
    height: size,
    fontName: FONT_NAME,
    hasEOL,
  })
  for (const line of page.lines) {
    line.forEach((word, i) => {
      const next = line[i + 1]
      items.push(item(word.text, word.x, word.y, word.width, word.size, !next))
      if (next) items.push(item(" ", word.x + word.width, word.y, Math.max(0, next.x - word.x - word.width), word.size, false))
    })
  }
  return { items, styles: { [FONT_NAME]: { fontFamily: "sans-serif", ascent: 0.8, descent: -0.2, vertical: false } }, lang: null }
}
