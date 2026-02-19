import { loadPDFLib, loadAnnotationsData } from "./ui/loader"
import { initPDFViewer } from "./adapters/lifecycle"
import { renderHighlights, renderAllHighlights, setActiveHighlight } from "./core/highlighting"

// Wrap in IIFE and handle multiple initialization scenarios
;(async () => {
  // Check if annotation viewer exists on the page before loading resources
  const viewer = document.querySelector(".annotation-viewer")
  if (!viewer) return

  // Load PDF.js library and CSS
  await loadPDFLib()

  /**
   * Initialize annotation viewer (with duplicate check)
   */
  async function initAnnotationViewer(): Promise<void> {
    const viewer = document.querySelector(".annotation-viewer")
    if (!viewer) return

    // Check if already initialized
    if (viewer.getAttribute("data-initialized") === "true") return
    viewer.setAttribute("data-initialized", "true")

    // Load annotations data and initialize viewer
    loadAnnotationsData()
    await initPDFViewer()
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
