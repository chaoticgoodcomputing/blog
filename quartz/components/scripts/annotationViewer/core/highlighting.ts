import { Annotation } from "./types"

/**
 * Render highlights for an annotation's quoted text using TextLayer positioning
 */
export function renderHighlights(annotation: Annotation): void {
  // Clear existing highlights
  document.querySelectorAll(".pdf-text-highlight").forEach((el) => el.remove())

  if (!annotation.target || annotation.target.length === 0) return

  // Find TextPositionSelector
  const positionSelector = annotation.target.find((t) =>
    t.selector?.some((s) => s.type === "TextPositionSelector"),
  )
  if (!positionSelector) return

  const textPositionSelector = positionSelector.selector?.find(
    (s) => s.type === "TextPositionSelector",
  )
  if (!textPositionSelector) return

  const startOffset = textPositionSelector.start!
  const endOffset = textPositionSelector.end!
  const pdfTextData = window.pdfTextData

  if (!pdfTextData) return

  // Find the page where the annotation starts
  const pageData = pdfTextData.find(
    (p) => startOffset >= p.startOffset && startOffset < p.endOffset,
  )
  if (!pageData) return

  // Get the text layer for this page
  const container = document.querySelector("#pdf-viewer")
  const pageWrapper = container?.querySelector(
    `.pdf-page-wrapper[data-page-num="${pageData.pageNum}"]`,
  )
  const textLayerDiv = pageWrapper?.querySelector(".textLayer") as HTMLElement
  const highlightLayer = pageWrapper?.querySelector(".pdf-highlight-layer") as HTMLElement

  if (!textLayerDiv || !highlightLayer) return

  // Get all text spans from the TextLayer
  const textSpans = Array.from(textLayerDiv.querySelectorAll("span"))
  
  // Calculate which characters in the page correspond to the annotation
  const pageStartChar = startOffset - pageData.startOffset
  const pageEndChar = Math.min(endOffset - pageData.startOffset, pageData.text.length)

  // Find text spans that overlap with the annotation range
  let currentChar = 0
  const overlappingSpans: HTMLElement[] = []

  for (const span of textSpans) {
    const spanText = span.textContent || ""
    const spanStart = currentChar
    const spanEnd = currentChar + spanText.length

    // Check if this span overlaps with the annotation range
    if (spanStart < pageEndChar && spanEnd > pageStartChar) {
      overlappingSpans.push(span)
    }

    currentChar = spanEnd
  }

  // Create highlights from the bounding boxes of overlapping spans
  for (const span of overlappingSpans) {
    // Use offsetLeft/Top for position within the parent (textLayer)
    // PDF.js applies transforms to text spans, so we use offset properties instead of getBoundingClientRect
    const textLayerRect = textLayerDiv.getBoundingClientRect()
    
    // Position highlight relative to the text layer (which shares parent with highlight layer)
    const highlight = document.createElement("div")
    highlight.className = "pdf-text-highlight"
    highlight.style.position = "absolute"
    // Use offsetLeft/offsetTop for position (relative to offsetParent)
    highlight.style.left = `${span.offsetLeft}px`
    highlight.style.top = `${span.offsetTop}px`
    // Use offsetWidth/offsetHeight to get dimensions without transform scaling
    highlight.style.width = `${span.offsetWidth}px`
    highlight.style.height = `${span.offsetHeight}px`
    highlightLayer.appendChild(highlight)
  }
}
