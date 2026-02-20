import { extractPageText } from "../core/textExtraction"
import { createPageWrapper, renderPageToCanvas } from "../ui/pdfRenderer"
import { setupScrollSync } from "./scrollSync"

// Store current PDF document for cleanup
let currentPdfDocument: any = null

/**
 * Clean up PDF.js resources before navigation
 */
export function cleanupPDFViewer(): void {
  // Destroy PDF.js document instance
  if (currentPdfDocument) {
    currentPdfDocument.destroy()
    currentPdfDocument = null
  }
  
  // Clear global state
  delete window.pdfTextData
  delete window.pdfScale
  delete window.annotationsData
  
  // Clear initialization flag
  const viewer = document.querySelector(".annotation-viewer")
  if (viewer) {
    viewer.removeAttribute("data-initialized")
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

  const container = viewer.querySelector("#pdf-viewer")
  if (!container) return
  
  // Wait for container to have valid dimensions
  await waitForLayout(container.parentElement || container)

  try {
    const loadingTask = window.pdfjsLib.getDocument(pdfUrl)
    const pdf = await loadingTask.promise
    
    // Store for cleanup
    currentPdfDocument = pdf

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
