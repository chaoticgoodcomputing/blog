// Highlights: where each annotation's passage is in the annotated document, and the boxes the
// annotation viewer marks it with (src/components/AnnotationViewer.astro). Nothing here draws: it is
// given the document's text and the geometry of its text, as PDF.js reads them, and answers with
// numbers, so it is the same in a test as in the browser.
//
// A passage is found the way Hypothesis anchors a `TextQuoteSelector`, since Annotator is built on
// Hypothesis and records its selectors (hypothesis/client's `src/annotator/anchoring/match-quote.ts`
// and `pdf.ts`, as Quartz's annotation viewer ported them): whitespace is ignored, since one reader's text extraction differs from another's in it; the quote
// is matched approximately, scored by the text either side of it and by how near it is to where its
// `TextPositionSelector` says it starts; and the search stops at a page where the quote and the
// text on one side of it match exactly.
import approxSearch, { type Match } from "approx-string-match"

/** A passage to find, as an annotation records it. */
export interface Passage {
  /** The passage, as its `TextQuoteSelector` quotes it. */
  exact: string
  /** A little of the text before and after it, which tells one place it is written from another. */
  prefix?: string | undefined
  suffix?: string | undefined
  /** Where it starts in the whole document's text, in characters: which page to look on first. */
  start?: number | undefined
}

/** A passage, with the block id of the annotation written on it, without its `^`. */
export interface AnnotatedPassage extends Passage {
  id: string
}

/** Where a passage is: its page, from 0, and its `[start, end)` in that page's text. */
export interface Found {
  page: number
  start: number
  end: number
}

const isSpace = (character: string | undefined) => character !== undefined && /\s/.test(character)

const withoutSpaces = (text: string) => text.replace(/\s+/g, "")

function nonSpaces(text: string, start: number, end: number): number {
  let count = 0
  for (let i = start; i < end; i++) if (!isSpace(text[i])) count++
  return count
}

// The offset in `text` just past `count` characters that are not whitespace, from `from`.
function past(text: string, count: number, from = 0): number {
  let i = from
  while (i < text.length && count > 0) {
    if (!isSpace(text[i])) count--
    i++
  }
  return i
}

// `[start, end)` of the text with its whitespace taken out, as offsets in the text itself.
function withSpaces(text: string, start: number, end: number): [number, number] {
  let from = past(text, start)
  while (from < text.length && isSpace(text[from])) from++
  return [from, past(text, end - start, from)]
}

function search(text: string, quote: string, maxErrors: number): Match[] {
  const exact: Match[] = []
  for (let at = text.indexOf(quote); at !== -1; at = text.indexOf(quote, at + 1)) {
    exact.push({ start: at, end: at + quote.length, errors: 0 })
  }
  return exact.length ? exact : approxSearch(text, quote, maxErrors)
}

// How alike `text` is to `written`, from 0 to 1.
function likeness(text: string, written: string): number {
  if (!written.length || !text.length) return 0
  const matches = search(text, written, written.length)
  return matches.length ? 1 - Math.min(...matches.map((match) => match.errors)) / written.length : 0
}

interface Context {
  prefix?: string | undefined
  suffix?: string | undefined
  /** Where in this text the passage is expected to start. */
  hint?: number | undefined
}

// The best place for `quote` in `text`, scored as Hypothesis scores it: the quote counts most, the
// text either side of it next, and its position least.
function bestMatch(text: string, quote: string, context: Context): (Match & { score: number }) | undefined {
  const matches = search(text, quote, Math.min(256, Math.floor(quote.length / 2)))
  const scored = matches.map((match) => {
    const quoteScore = 1 - match.errors / quote.length
    const prefixScore = context.prefix ? likeness(text.slice(Math.max(0, match.start - context.prefix.length), match.start), context.prefix) : 1
    const suffixScore = context.suffix ? likeness(text.slice(match.end, match.end + context.suffix.length), context.suffix) : 1
    const placeScore = context.hint === undefined ? 1 : 1 - Math.abs(match.start - context.hint) / text.length
    return { ...match, score: (50 * quoteScore + 20 * prefixScore + 20 * suffixScore + 2 * placeScore) / 92 }
  })
  return scored.sort((a, b) => b.score - a.score)[0]
}

/** Where a passage is in a document whose pages have the text `pages`, or undefined if it is in none. */
export function findPassage(pages: string[], passage: Passage): Found | undefined {
  const quote = withoutSpaces(passage.exact)
  if (!pages.length || !quote) return undefined
  const prefix = passage.prefix === undefined ? undefined : withoutSpaces(passage.prefix)
  const suffix = passage.suffix === undefined ? undefined : withoutSpaces(passage.suffix)

  // The page the passage's position falls on, and how far into it; the pages are searched from it
  // outwards.
  let hintPage = 0
  let hintOffset = 0
  if (passage.start !== undefined) {
    let before = 0
    hintPage = pages.length - 1
    for (const [i, page] of pages.entries()) {
      if (passage.start < before + page.length) {
        hintPage = i
        break
      }
      before += page.length
    }
    hintOffset = passage.start - pages.slice(0, hintPage).reduce((sum, page) => sum + page.length, 0)
  }
  const order = pages.map((_, i) => i).sort((a, b) => Math.abs(a - hintPage) - Math.abs(b - hintPage))

  let best: { score: number; found: Found } | undefined
  for (const i of order) {
    const text = pages[i]!
    const stripped = withoutSpaces(text)
    // On a page before the one the position falls on the passage is expected at the end, and after
    // it at the start.
    const hint =
      passage.start === undefined ? undefined : i < hintPage ? stripped.length : i > hintPage ? 0 : nonSpaces(text, 0, hintOffset)
    const match = bestMatch(stripped, quote, { prefix, suffix, hint })
    if (!match || (best && match.score <= best.score)) continue
    const [start, end] = withSpaces(text, match.start, match.end)
    best = { score: match.score, found: { page: i, start, end } }
    const exactQuote = stripped.slice(match.start, match.end) === quote
    const exactPrefix = prefix !== undefined && stripped.slice(Math.max(0, match.start - prefix.length), match.start) === prefix
    const exactSuffix = suffix !== undefined && stripped.slice(match.end, match.end + suffix.length) === suffix
    if (exactQuote && (exactPrefix || exactSuffix || (prefix === undefined && suffix === undefined))) break
  }
  return best?.found
}

/** A run of text on a page, as PDF.js's `getTextContent()` gives it. A marker of its holds no `str`. */
export interface TextRun {
  str?: string
  /** Where the run is set: its text matrix, the last two its baseline's start in the PDF's space. */
  transform?: number[]
  /** How far the run reaches along its baseline, and how tall it is, in the PDF's space. */
  width?: number
  height?: number
}

/** A page at scale 1, as PDF.js's `PageViewport` has it: its size, and where a point of the PDF falls on it. */
export interface PageGeometry {
  width: number
  height: number
  convertToViewportPoint(x: number, y: number): number[]
}

/** A box over a line of a passage, each side a share of its page's width or height. */
export interface Box {
  left: number
  top: number
  width: number
  height: number
}

const isText = (run: TextRun): run is Required<TextRun> => typeof run.str === "string" && Array.isArray(run.transform)

/** A page's text, in which a passage's offsets count: its runs, end to end. */
export const pageText = (runs: TextRun[]): string => runs.map((run) => (isText(run) ? run.str : "")).join("")

// How far under its baseline a line's box reaches, as a share of the line's height: a run's
// height is its font's size, and a letter's descender falls about a fifth of it under the line.
const DESCENT = 0.2

interface Edges {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * The boxes a found passage is highlighted with: one over each line it is on, as shares of its
 * page, so a highlight stays where it is at any size the page is drawn. A run part of which is in
 * the passage is covered in proportion to its characters.
 */
export function highlightBoxes(runs: TextRun[], found: Found, page: PageGeometry): Box[] {
  const pieces: Edges[] = []
  let offset = 0
  for (const run of runs) {
    if (!isText(run)) continue
    const from = Math.max(found.start, offset) - offset
    const to = Math.min(found.end, offset + run.str.length) - offset
    offset += run.str.length
    if (to <= from) continue

    // The run's baseline, along its own direction, and the line's height across it.
    const [a = 1, b = 0, , , x = 0, y = 0] = run.transform
    const size = Math.hypot(a, b) || 1
    const along = [a / size, b / size] as const
    const across = [-along[1], along[0]] as const
    const height = run.height || size
    const start = (run.width * from) / run.str.length
    const end = (run.width * to) / run.str.length
    const corners = [
      [start, -DESCENT * height],
      [end, -DESCENT * height],
      [start, height],
      [end, height],
    ].map(([u = 0, v = 0]) => page.convertToViewportPoint(x + along[0] * u + across[0] * v, y + along[1] * u + across[1] * v))
    const xs = corners.map(([cx = 0]) => cx)
    const ys = corners.map(([, cy = 0]) => cy)
    pieces.push({ left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) })
  }

  // The pieces of one line are joined: those that share most of their height, with no more than a
  // line's height between them, so a passage running on in the next column stays apart.
  const lines: Edges[] = []
  for (const piece of pieces.sort((p, q) => p.top - q.top || p.left - q.left)) {
    const height = piece.bottom - piece.top
    const line = lines.find((each) => {
      const shared = Math.min(each.bottom, piece.bottom) - Math.max(each.top, piece.top)
      const gap = Math.max(each.left, piece.left) - Math.min(each.right, piece.right)
      return shared >= Math.min(each.bottom - each.top, height) / 2 && gap <= height
    })
    if (!line) lines.push({ ...piece })
    else {
      line.left = Math.min(line.left, piece.left)
      line.top = Math.min(line.top, piece.top)
      line.right = Math.max(line.right, piece.right)
      line.bottom = Math.max(line.bottom, piece.bottom)
    }
  }
  return lines.map((line) => ({
    left: line.left / page.width,
    top: line.top / page.height,
    width: (line.right - line.left) / page.width,
    height: (line.bottom - line.top) / page.height,
  }))
}
