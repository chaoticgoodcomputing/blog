import { loadPDFLib, loadAnnotationsData } from "./ui/loader"
import { initPDFViewer, cleanupPDFViewer } from "./adapters/lifecycle"
import { renderHighlights, renderAllHighlights, setActiveHighlight } from "./core/highlighting"

// Wrap in IIFE and handle multiple initialization scenarios
;(async () => {
  /**
   * Initialize annotation viewer (with duplicate check)
   */
  async function initAnnotationViewer(): Promise<void> {
    const viewer = document.querySelector(".annotation-viewer")
    if (!viewer) return

    // Check if already initialized
    if (viewer.getAttribute("data-initialized") === "true") {
      console.log("[AnnotationViewer] Already initialized, skipping")
      return
    }
    viewer.setAttribute("data-initialized", "true")

    // Load PDF.js library on first encounter
    await loadPDFLib()

    // Load annotations data and initialize viewer
    loadAnnotationsData()
    await initPDFViewer()
    
    // Register cleanup for SPA navigation
    if (window.addCleanup) {
      window.addCleanup(() => {
        console.log("[AnnotationViewer] Cleaning up for navigation")
        cleanupPDFViewer()
      })
    }
  }

  // Initialize on page load
  document.addEventListener("DOMContentLoaded", initAnnotationViewer)

  // Re-initialize on SPA navigation if enabled
  document.addEventListener("nav", initAnnotationViewer)

  // If DOM is already loaded (script loaded after DOMContentLoaded), initialize immediately
  if (document.readyState === "complete" || document.readyState === "interactive") {
    await initAnnotationViewer()
  }

  // Expose highlighting functions globally for interactive use
  window.renderHighlights = renderHighlights
  window.renderAllHighlights = renderAllHighlights
  window.setActiveHighlight = setActiveHighlight
})()

export default ""
