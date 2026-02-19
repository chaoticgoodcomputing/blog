import { findPageForOffset } from "../core/textExtraction"

/**
 * Find the scroll position of text using TextLayer spans
 */
function findTextScrollPosition(startOffset: number, endOffset: number): number | null {
  if (!window.pdfTextData) return null

  // Find which page contains this text
  const pageData = window.pdfTextData.find(
    (p) => startOffset >= p.startOffset && startOffset < p.endOffset,
  )

  if (!pageData) return null

  const container = document.querySelector("#pdf-viewer")
  const pageWrapper = container?.querySelector(
    `.pdf-page-wrapper[data-page-num="${pageData.pageNum}"]`,
  ) as HTMLElement
  const textLayerDiv = pageWrapper?.querySelector(".textLayer") as HTMLElement

  if (!textLayerDiv) return null

  // Get all text spans from the TextLayer
  const textSpans = Array.from(textLayerDiv.querySelectorAll("span"))

  // Calculate which character in the page corresponds to the start
  const pageStartChar = startOffset - pageData.startOffset

  // Find the span containing the start position
  let currentChar = 0
  let targetSpan: HTMLElement | null = null

  for (const span of textSpans) {
    const spanText = span.textContent || ""
    const spanStart = currentChar
    const spanEnd = currentChar + spanText.length

    if (pageStartChar >= spanStart && pageStartChar < spanEnd) {
      targetSpan = span
      break
    }

    currentChar = spanEnd
  }

  if (!targetSpan) return null

  // Get the span's position relative to the PDF container
  const pdfContainer = document.querySelector(".annotation-pdf-container") as HTMLElement
  if (!pdfContainer) return null

  const spanRect = targetSpan.getBoundingClientRect()
  const containerRect = pdfContainer.getBoundingClientRect()

  // Calculate scroll position (accounting for current scroll offset)
  const scrollPosition = pdfContainer.scrollTop + (spanRect.top - containerRect.top)

  return scrollPosition
}

/**
 * Set up click-based navigation between PDF and annotations
 */
export function setupScrollSync(viewer: Element): void {
  const pdfContainer = viewer.querySelector(".annotation-pdf-container") as HTMLElement
  const sidebar = viewer.querySelector(".annotation-sidebar") as HTMLElement
  const annotationItems = Array.from(
    sidebar?.querySelectorAll(".annotation-item") || [],
  ) as HTMLElement[]

  if (annotationItems.length === 0 || !pdfContainer || !sidebar) return

  // Position annotations based on PDF text positions using TextLayer
  annotationItems.forEach((annotation) => {
    const start = parseInt(annotation.getAttribute("data-start") || "0")
    const end = parseInt(annotation.getAttribute("data-end") || "0")

    if (start && end && window.pdfTextData) {
      const scrollY = findTextScrollPosition(start, end)
      const pageNum = findPageForOffset(start)
      
      if (scrollY !== null && pageNum !== null) {
        annotation.setAttribute("data-pdf-y", scrollY.toString())
        annotation.setAttribute("data-pdf-page", pageNum.toString())
        console.log(
          "[Annotation]",
          annotation.getAttribute("data-annotation-id"),
          "at page",
          pageNum,
          "scroll y:",
          scrollY,
        )
      }
    }
  })

  /**
   * Update which annotation is marked as active and highlight accordingly
   */
  function updateActiveAnnotation(activeAnnotation: HTMLElement): void {
    // Mark as active
    annotationItems.forEach((ann) => {
      if (ann === activeAnnotation) {
        ann.classList.add("active")
      } else {
        ann.classList.remove("active")
      }
    })

    // Update active highlights
    const annotationId = activeAnnotation.getAttribute("data-annotation-id")
    if (annotationId && window.setActiveHighlight) {
      window.setActiveHighlight(annotationId)
    }
  }

  // Click annotation to scroll to its position in PDF
  annotationItems.forEach((annotation) => {
    annotation.addEventListener("click", () => {
      const pdfY = parseFloat(annotation.getAttribute("data-pdf-y") || "0")
      if (pdfY > 0) {
        // Scroll to top of highlight with small offset for better visibility
        const scrollTarget = pdfY - 16
        pdfContainer.scrollTo({ top: scrollTarget, behavior: "smooth" })

        updateActiveAnnotation(annotation)
      }
    })
  })

  // Click highlight to scroll to its annotation in sidebar
  // Use event delegation on the PDF container since highlights are created dynamically
  pdfContainer.addEventListener("click", (event) => {
    const target = event.target as HTMLElement
    if (target.classList.contains("pdf-text-highlight")) {
      const annotationId = target.getAttribute("data-annotation-id")
      const annotation = annotationItems.find(
        (ann) => ann.getAttribute("data-annotation-id") === annotationId,
      )
      
      if (annotation) {
        const annotationTop = annotation.offsetTop
        // Scroll to top of annotation with small offset for better visibility
        const targetScroll = annotationTop - 16
        sidebar.scrollTo({ top: targetScroll, behavior: "smooth" })

        updateActiveAnnotation(annotation)
      }
    }
  })

  // Render all highlights initially (after text layers are ready)
  // Use setTimeout to ensure functions are exposed on window
  setTimeout(() => {
    if (window.renderAllHighlights) {
      console.log("[ScrollSync] Rendering all highlights")
      window.renderAllHighlights()
    } else {
      console.warn("[ScrollSync] window.renderAllHighlights not available")
    }
  }, 100)
}
