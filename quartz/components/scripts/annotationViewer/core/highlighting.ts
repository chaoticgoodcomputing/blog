import approxSearch from "approx-string-match"
import type { Match as StringMatch } from "approx-string-match"
import { Annotation } from "./types"

// ── matchQuote ── ported from hypothesis-client src/annotator/anchoring/match-quote.ts

type QuoteMatch = { start: number; end: number; score: number }

function search(text: string, str: string, maxErrors: number): StringMatch[] {
  let pos = 0
  const exactMatches: StringMatch[] = []
  while (pos !== -1) {
    pos = text.indexOf(str, pos)
    if (pos !== -1) {
      exactMatches.push({ start: pos, end: pos + str.length, errors: 0 })
      pos += 1
    }
  }
  if (exactMatches.length > 0) return exactMatches
  return approxSearch(text, str, maxErrors)
}

function textMatchScore(text: string, str: string): number {
  if (str.length === 0 || text.length === 0) return 0.0
  const matches = search(text, str, str.length)
  return 1 - matches[0].errors / str.length
}

function matchQuote(
  text: string,
  quote: string,
  context: { prefix?: string; suffix?: string; hint?: number } = {},
): QuoteMatch | null {
  if (quote.length === 0) return null

  const maxErrors = Math.min(256, quote.length / 2)
  const matches = search(text, quote, maxErrors)
  if (matches.length === 0) return null

  const score = (m: StringMatch): number => {
    const quoteWeight = 50
    const prefixWeight = 20
    const suffixWeight = 20
    const posWeight = 2

    const quoteScore = 1 - m.errors / quote.length
    const prefixScore = context.prefix
      ? textMatchScore(text.slice(Math.max(0, m.start - context.prefix.length), m.start), context.prefix)
      : 1.0
    const suffixScore = context.suffix
      ? textMatchScore(text.slice(m.end, m.end + context.suffix.length), context.suffix)
      : 1.0
    const posScore =
      typeof context.hint === "number" ? 1.0 - Math.abs(m.start - context.hint) / text.length : 1.0

    const raw = quoteWeight * quoteScore + prefixWeight * prefixScore + suffixWeight * suffixScore + posWeight * posScore
    return raw / (quoteWeight + prefixWeight + suffixWeight + posWeight)
  }

  const scored = matches.map((m) => ({ ...m, score: score(m) }))
  scored.sort((a, b) => b.score - a.score)
  return scored[0]
}

function isSpace(ch: string): boolean {
  return ch === ' ' || ch === '\f' || ch === '\n' || ch === '\r' ||
         ch === '\t' || ch === '\v' || ch === '\u00a0'
}

/** Strip all whitespace from a string (for whitespace-tolerant matching). */
function stripSpaces(str: string): string {
  let out = ''
  for (let i = 0; i < str.length; i++) {
    if (!isSpace(str[i])) out += str[i]
  }
  return out
}

/**
 * Count non-space characters in `str` from `start` (inclusive) to `end` (exclusive).
 */
function countNonSpace(str: string, start: number, end: number): number {
  let count = 0
  for (let i = start; i < end; i++) {
    if (!isSpace(str[i])) count++
  }
  return count
}

/**
 * Advance through `str` from `startPos`, counting characters matching `filter`,
 * until `count` matching characters have been seen. Returns the resulting index.
 */
function advance(str: string, count: number, startPos = 0): number {
  let pos = startPos
  while (pos < str.length && count > 0) {
    if (!isSpace(str[pos])) count--
    pos++
  }
  return pos
}

/**
 * Translate (start, end) offsets from `source` into corresponding offsets in
 * `target` by counting only non-whitespace characters — matching the approach
 * Hypothesis uses in translateOffsets() to bridge getTextContent() strings to
 * DOM textLayer.textContent strings, which differ in whitespace.
 */
function translateOffsets(
  source: string,
  target: string,
  start: number,
  end: number,
): [number, number] {
  const beforeStart = countNonSpace(source, 0, start)
  const inRange = countNonSpace(source, start, end)

  let targetStart = advance(target, beforeStart)
  // Trim leading whitespace from result
  while (targetStart < target.length && isSpace(target[targetStart])) targetStart++

  const targetEnd = advance(target, inRange, targetStart)

  return [targetStart, targetEnd]
}

type PageAnchor = {
  pageNum: number
  domStart: number
  domEnd: number
}

/**
 * Find the best match for a TextQuoteSelector across all PDF pages.
 *
 * Mirrors Hypothesis's anchorQuote() strategy:
 * 1. Strip whitespace from quote, prefix, suffix, and each page's text.
 * 2. Use approx-string-match to score candidates on every page, ordered by
 *    proximity to the TextPositionSelector hint.
 * 3. Translate the whitespace-stripped match offset back into the DOM string
 *    so span-walking aligns with the rendered text layer.
 */
function findQuoteAnchor(
  exact: string,
  prefix: string | undefined,
  suffix: string | undefined,
  positionHint: number | undefined,
): PageAnchor | null {
  const pdfTextData = window.pdfTextData
  if (!pdfTextData || pdfTextData.length === 0) return null

  const strippedQuote = stripSpaces(exact)
  const strippedPrefix = prefix !== undefined ? stripSpaces(prefix) : undefined
  const strippedSuffix = suffix !== undefined ? stripSpaces(suffix) : undefined

  // Order pages by distance from the position hint, exactly as Hypothesis does.
  let expectedPageIndex = 0
  let expectedOffsetInPage = 0
  if (positionHint !== undefined) {
    const hintPage = pdfTextData.find(
      (p) => positionHint >= p.startOffset && positionHint < p.endOffset,
    ) ?? pdfTextData[pdfTextData.length - 1]
    expectedPageIndex = hintPage.pageNum - 1 // pageNum is 1-based
    expectedOffsetInPage = positionHint - hintPage.startOffset
  }

  const pageIndexes = pdfTextData.map((_, i) => i)
  pageIndexes.sort((a, b) => Math.abs(a - expectedPageIndex) - Math.abs(b - expectedPageIndex))

  let bestResult: { score: number; anchor: PageAnchor } | null = null

  for (const pageIdx of pageIndexes) {
    const page = pdfTextData[pageIdx]
    const strippedText = stripSpaces(page.text)

    // Compute a stripped-space hint offset for this page
    let strippedHint: number | undefined
    if (positionHint !== undefined) {
      if (pageIdx < expectedPageIndex) {
        strippedHint = strippedText.length
      } else if (pageIdx === expectedPageIndex) {
        strippedHint = countNonSpace(page.text, 0, expectedOffsetInPage)
      } else {
        strippedHint = 0
      }
    }

    const match = matchQuote(strippedText, strippedQuote, {
      prefix: strippedPrefix,
      suffix: strippedSuffix,
      hint: strippedHint,
    })

    if (!match) continue

    if (!bestResult || match.score > bestResult.score) {
      // Translate the stripped-text match back into the page's full text
      const [pageStart, pageEnd] = translateOffsets(
        strippedText,
        page.text,
        match.start,
        match.end,
      )

      // Then translate those page-text offsets into the DOM text layer string
      const container = document.querySelector("#pdf-viewer")
      const pageWrapper = container?.querySelector(
        `.pdf-page-wrapper[data-page-num="${page.pageNum}"]`,
      )
      const textLayerDiv = pageWrapper?.querySelector(".textLayer") as HTMLElement | null
      const domText = textLayerDiv?.textContent ?? ""

      const [domStart, domEnd] = translateOffsets(page.text, domText, pageStart, pageEnd)

      bestResult = {
        score: match.score,
        anchor: { pageNum: page.pageNum, domStart, domEnd },
      }

      // Hypothesis's early-exit heuristic: stop if quote + one context side
      // are exact matches — good enough, no need to search all pages.
      const exactQuoteMatch = strippedText.slice(match.start, match.end) === strippedQuote
      const exactPrefixMatch =
        strippedPrefix !== undefined &&
        strippedText.slice(Math.max(0, match.start - strippedPrefix.length), match.start) === strippedPrefix
      const exactSuffixMatch =
        strippedSuffix !== undefined &&
        strippedText.slice(match.end, match.end + strippedSuffix.length) === strippedSuffix
      const hasContext = strippedPrefix !== undefined || strippedSuffix !== undefined

      if (exactQuoteMatch && (exactPrefixMatch || exactSuffixMatch || !hasContext)) {
        break
      }
    }
  }

  return bestResult?.anchor ?? null
}

/**
 * Render highlights for a single annotation
 */
function renderAnnotationHighlights(
  annotation: Annotation,
  isActive: boolean = false,
): void {
  if (!annotation.target || annotation.target.length === 0) return

  const selectors = annotation.target[0]?.selector ?? []

  const quoteSelector = selectors.find((s) => s.type === "TextQuoteSelector")
  const positionSelector = selectors.find((s) => s.type === "TextPositionSelector")

  if (!quoteSelector?.exact) return

  const pdfTextData = window.pdfTextData
  if (!pdfTextData) return

  // Use TextQuoteSelector as the primary anchor (with approx matching).
  // TextPositionSelector is used only as a page-ordering hint, matching the
  // Hypothesis anchorQuote() strategy.
  const anchor = findQuoteAnchor(
    quoteSelector.exact,
    quoteSelector.prefix,
    quoteSelector.suffix,
    positionSelector?.start,
  )

  if (!anchor) return

  const container = document.querySelector("#pdf-viewer")
  const pageWrapper = container?.querySelector(
    `.pdf-page-wrapper[data-page-num="${anchor.pageNum}"]`,
  )
  const textLayerDiv = pageWrapper?.querySelector(".textLayer") as HTMLElement
  const highlightLayer = pageWrapper?.querySelector(".pdf-highlight-layer") as HTMLElement

  if (!textLayerDiv || !highlightLayer) return

  const { domStart, domEnd } = anchor

  // Walk spans, accumulating their DOM-text positions, and collect those that
  // overlap with [domStart, domEnd].
  const textSpans = Array.from(textLayerDiv.querySelectorAll("span"))
  let currentChar = 0
  const overlappingSpans: HTMLElement[] = []

  for (const span of textSpans) {
    const spanText = span.textContent || ""
    const spanStart = currentChar
    const spanEnd = currentChar + spanText.length

    if (spanStart < domEnd && spanEnd > domStart) {
      overlappingSpans.push(span)
    }

    currentChar = spanEnd
  }

  // Create highlights from the bounding boxes of overlapping spans
  for (const span of overlappingSpans) {
    // Position highlight relative to the text layer (which shares parent with highlight layer)
    const highlight = document.createElement("div")
    highlight.className = isActive ? "pdf-text-highlight active" : "pdf-text-highlight"
    highlight.setAttribute("data-annotation-id", annotation.id)
    highlight.style.position = "absolute"
    highlight.style.left = `${span.offsetLeft}px`
    highlight.style.top = `${span.offsetTop}px`
    // PDF.js sets --scale-x on each span and applies transform: scaleX(var(--scale-x)).
    // offsetWidth is the pre-transform box width; multiply by --scale-x to get the
    // visual rendered width that matches the actual highlighted text.
    const scaleX = parseFloat(getComputedStyle(span).getPropertyValue('--scale-x')) || 1
    highlight.style.width = `${span.offsetWidth * scaleX}px`
    highlight.style.height = `${span.offsetHeight}px`
    highlightLayer.appendChild(highlight)
  }
}

/**
 * Render highlights for all annotations at once
 */
export function renderAllHighlights(activeAnnotationId?: string): void {
  // Clear existing highlights
  document.querySelectorAll(".pdf-text-highlight").forEach((el) => el.remove())

  const annotations = window.annotationsData
  if (!annotations) return

  // Render each annotation's highlights
  annotations.forEach((annotation) => {
    const isActive = annotation.id === activeAnnotationId
    renderAnnotationHighlights(annotation, isActive)
  })
}

/**
 * Toggle which highlights are marked as active
 */
export function setActiveHighlight(annotationId: string): void {
  const highlights = document.querySelectorAll(".pdf-text-highlight")
  
  highlights.forEach((highlight) => {
    const highlightAnnotationId = highlight.getAttribute("data-annotation-id")
    if (highlightAnnotationId === annotationId) {
      highlight.classList.add("active")
    } else {
      highlight.classList.remove("active")
    }
  })
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use renderAllHighlights() and setActiveHighlight() instead
 */
export function renderHighlights(annotation: Annotation): void {
  renderAllHighlights(annotation.id)
}
