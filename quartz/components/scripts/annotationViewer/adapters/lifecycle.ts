import { extractPageText } from "../core/textExtraction"
import { createPageWrapper, renderPageToCanvas } from "../ui/pdfRenderer"
import { setupScrollSync } from "./scrollSync"

/**
 * Clean up PDF.js resources before navigation
 */
export function cleanupPDFViewer(): void {
  // Destroy PDF.js document instance
  if (window.currentPdfDocument) {
    window.currentPdfDocument.destroy()
    window.currentPdfDocument = null
  }
  
  // Clear global state
  delete window.pdfTextData
  delete window.pdfScale
  delete window.annotationsData
  
  // Clear stored URL
  window.currentPdfUrl = null
  
  // Clear initialization flag
  const viewer = document.querySelector(".annotation-viewer")
  if (viewer) {
    viewer.removeAttribute("data-initialized")
  }
}

/**
 * Re-render PDF at new scale after container resize
 */
export async function rerenderPDF(): Promise<void> {
  if (!window.currentPdfDocument || !window.currentPdfUrl) {
    console.warn("[PDF] No document loaded, skipping re-render")
    return
  }

  const viewer = document.querySelector(".annotation-viewer")
  if (!viewer) return

  const container = viewer.querySelector("#pdf-viewer")
  if (!container) return

  console.log("[PDF] Re-rendering after resize")

  try {
    container.innerHTML = ""

    // Recalculate scale based on new container width
    const containerWidth = (container.parentElement?.clientWidth || 800) - 32
    
    let maxPageWidth = 0
    for (let i = 1; i <= window.currentPdfDocument.numPages; i++) {
      const page = await window.currentPdfDocument.getPage(i)
      const viewport = page.getViewport({ scale: 1.0 })
      maxPageWidth = Math.max(maxPageWidth, viewport.width)
    }
    
    const scale = containerWidth / maxPageWidth
    console.log("[PDF] New scale:", scale, "Container width:", containerWidth)

    // Re-extract text and re-render pages
    const pdfTextData = []
    let cumulativeOffset = 0

    for (let pageNum = 1; pageNum <= window.currentPdfDocument.numPages; pageNum++) {
      const page = await window.currentPdfDocument.getPage(pageNum)

      const pageData = await extractPageText(page, pageNum, scale, cumulativeOffset)
      pdfTextData.push(pageData)
      cumulativeOffset = pageData.endOffset

      const pageWrapper = createPageWrapper(pageNum, pageData.viewport)
      container.appendChild(pageWrapper)

      const canvas = pageWrapper.querySelector("canvas")
      if (canvas) {
        await renderPageToCanvas(page, canvas, pageData.viewport)
      }
    }

    // Update global state
    window.pdfTextData = pdfTextData
    window.pdfScale = scale

    // Re-render highlights with new positions
    if (window.renderAllHighlights) {
      window.renderAllHighlights()
    }

    console.log("[PDF] Re-render complete")
  } catch (error) {
    console.error("[PDF] Error during re-render:", error)
  }
}

/**
 * Wait for element to have valid dimensions
 */
async function waitForLayout(element: Element): Promise<void> {
  return new Promise((resolve) => {
    // Check if dimensions are already valid
    if (element.clientWidth > 0) {
      resolve()
      return
    }
    
    // Wait for next frame and check again
    requestAnimationFrame(() => {
      if (element.clientWidth > 0) {
        resolve()
      } else {
        // If still no dimensions, wait one more frame
        requestAnimationFrame(() => resolve())
      }
    })
  })
}

/**
 * Initialize the PDF viewer and set up annotation highlighting
 */
export async function initPDFViewer(): Promise<void> {
  const viewer = document.querySelector(".annotation-viewer")
  if (!viewer) return

  const pdfUrl = viewer.getAttribute("data-pdf-url")
  if (!pdfUrl) return
  
  // Store URL for re-rendering
  window.currentPdfUrl = pdfUrl

  const container = viewer.querySelector("#pdf-viewer")
  if (!container) return
  
  // Wait for container to have valid dimensions
  await waitForLayout(container.parentElement || container)

  try {
    const loadingTask = window.pdfjsLib.getDocument(pdfUrl)
    const pdf = await loadingTask.promise
    
    // Store for cleanup and re-rendering
    window.currentPdfDocument = pdf

    container.innerHTML = ""

    // Calculate scale to fit container width based on widest page
    // This ensures mixed portrait/landscape pages all fit the same container
    const containerWidth = (container.parentElement?.clientWidth || 800) - 32 // Account for padding
    
    // Find the maximum page width across all pages
    let maxPageWidth = 0
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 1.0 })
      maxPageWidth = Math.max(maxPageWidth, viewport.width)
    }
    
    const scale = containerWidth / maxPageWidth

    console.log(
      "[PDF] Container width:",
      containerWidth,
      "Max page width:",
      maxPageWidth,
      "Scale:",
      scale,
    )

    // Extract text content for annotation positioning
    const pdfTextData = []
    let cumulativeOffset = 0

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)

      // Extract text with positions
      const pageData = await extractPageText(page, pageNum, scale, cumulativeOffset)
      pdfTextData.push(pageData)
      cumulativeOffset = pageData.endOffset

      // Render page
      const pageWrapper = createPageWrapper(pageNum, pageData.viewport)
      container.appendChild(pageWrapper)

      const canvas = pageWrapper.querySelector("canvas")
      if (canvas) {
        await renderPageToCanvas(page, canvas, pageData.viewport)
      }
    }

    console.log("[PDF] Extracted text length:", cumulativeOffset)
    console.log("[PDF] Pages:", pdfTextData.length)

    // Store for annotation positioning
    window.pdfTextData = pdfTextData
    window.pdfScale = scale

    setupScrollSync(viewer)
  } catch (error) {
    console.error("Error loading PDF:", error)
    container.innerHTML = `<div class="pdf-error">Failed to load PDF: ${(error as Error).message}</div>`
  }
}
