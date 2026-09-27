// Finding a quoted passage in a document's text, the way Hypothesis anchors a `TextQuoteSelector`
// (Annotator is built on Hypothesis), ported from v4's annotation viewer, which ported it from
// hypothesis-client's `src/annotator/anchoring/match-quote.ts` and `pdf.ts`:
//   - whitespace is ignored, since PDF text extraction differs in it from one reader to the next;
//   - the quote is matched approximately, scored by its prefix and suffix and by how near it is to
//     its `TextPositionSelector`, which only orders the pages searched;
//   - the search stops at a page where the quote and one side of its context match exactly.
import approxSearch, { type Match } from "approx-string-match"

/** A passage to find, as an annotation records it. An `Annotation` is one, with its note. */
export interface Passage {
  /** Annotator's block id, unique within its page. */
  id: string
  /** The passage, as its `TextQuoteSelector` quotes it. Empty when it has none. */
  exact: string
  /** A little of the text before and after the passage, which tells repeats apart. */
  prefix?: string
  suffix?: string
  /** Where the passage starts in the whole document's text, from its `TextPositionSelector`: a hint. */
  start?: number
}

/** Where a passage is: a page (0-based), and its `[start, end)` in that page's text. */
export interface Anchor {
  page: number
  start: number
  end: number
}

const isSpace = (ch: string) => /\s/.test(ch)

const stripSpaces = (text: string) => text.replace(/\s+/g, "")

function countNonSpace(text: string, start: number, end: number) {
  let count = 0
  for (let i = start; i < end; i++) if (!isSpace(text[i])) count++
  return count
}

// The index in `text` just past `count` non-space characters from `from`.
function advance(text: string, count: number, from = 0) {
  let i = from
  while (i < text.length && count > 0) {
    if (!isSpace(text[i])) count--
    i++
  }
  return i
}

/**
 * `[start, end)` in `source` as offsets in `target`, which holds the same characters with
 * different whitespace: counted in non-space characters, as Hypothesis's `translateOffsets` does.
 */
export function translateOffsets(source: string, target: string, start: number, end: number): [number, number] {
  let from = advance(target, countNonSpace(source, 0, start))
  while (from < target.length && isSpace(target[from])) from++
  return [from, advance(target, countNonSpace(source, start, end), from)]
}

function search(text: string, quote: string, maxErrors: number): Match[] {
  const exact: Match[] = []
  for (let at = text.indexOf(quote); at !== -1; at = text.indexOf(quote, at + 1)) {
    exact.push({ start: at, end: at + quote.length, errors: 0 })
  }
  return exact.length ? exact : approxSearch(text, quote, maxErrors)
}

function similarity(text: string, str: string) {
  if (!str.length || !text.length) return 0
  const matches = search(text, str, str.length)
  return matches.length ? 1 - matches[0].errors / str.length : 0
}

function matchQuote(text: string, quote: string, context: { prefix?: string; suffix?: string; hint?: number }) {
  if (!quote.length) return null
  const matches = search(text, quote, Math.min(256, quote.length / 2))
  if (!matches.length) return null
  const score = (m: Match) => {
    const quoteScore = 1 - m.errors / quote.length
    const prefixScore = context.prefix ? similarity(text.slice(Math.max(0, m.start - context.prefix.length), m.start), context.prefix) : 1
    const suffixScore = context.suffix ? similarity(text.slice(m.end, m.end + context.suffix.length), context.suffix) : 1
    const posScore = context.hint !== undefined ? 1 - Math.abs(m.start - context.hint) / text.length : 1
    return (50 * quoteScore + 20 * prefixScore + 20 * suffixScore + 2 * posScore) / 92
  }
  return matches.map((m) => ({ ...m, score: score(m) })).sort((a, b) => b.score - a.score)[0]
}

/** Finds `passage` in a document whose pages hold `pages` of text, or null if it isn't there. */
export function anchor(pages: string[], passage: Passage): Anchor | null {
  if (!pages.length || !passage.exact.trim()) return null
  const quote = stripSpaces(passage.exact)
  const prefix = passage.prefix === undefined ? undefined : stripSpaces(passage.prefix)
  const suffix = passage.suffix === undefined ? undefined : stripSpaces(passage.suffix)

  // The page the position hint falls on, and how far into it.
  let hintPage = 0
  let hintOffset = 0
  if (passage.start !== undefined) {
    let offset = 0
    hintPage = pages.length - 1
    for (let i = 0; i < pages.length; i++) {
      if (passage.start < offset + pages[i].length) {
        hintPage = i
        break
      }
      offset += pages[i].length
    }
    hintOffset = passage.start - pages.slice(0, hintPage).reduce((sum, p) => sum + p.length, 0)
  }
  const order = pages.map((_, i) => i).sort((a, b) => Math.abs(a - hintPage) - Math.abs(b - hintPage))

  let best: { score: number; anchor: Anchor } | null = null
  for (const i of order) {
    const text = pages[i]
    const stripped = stripSpaces(text)
    const hint = passage.start === undefined ? undefined : i < hintPage ? stripped.length : i > hintPage ? 0 : countNonSpace(text, 0, hintOffset)
    const match = matchQuote(stripped, quote, { prefix, suffix, hint })
    if (!match || (best && match.score <= best.score)) continue
    const [start, end] = translateOffsets(stripped, text, match.start, match.end)
    best = { score: match.score, anchor: { page: i, start, end } }
    const exactQuote = stripped.slice(match.start, match.end) === quote
    const exactPrefix = prefix !== undefined && stripped.slice(Math.max(0, match.start - prefix.length), match.start) === prefix
    const exactSuffix = suffix !== undefined && stripped.slice(match.end, match.end + suffix.length) === suffix
    if (exactQuote && (exactPrefix || exactSuffix || (prefix === undefined && suffix === undefined))) break
  }
  return best?.anchor ?? null
}
