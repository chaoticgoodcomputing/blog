/**
 * Load PDF.js library from CDN (idempotent)
 */
export async function loadPDFLib(): Promise<void> {
  // Return early if PDF.js is already loaded
  if (window.pdfjsLib) {
    return
  }

  // Load PDF.js viewer CSS from CDN and scope it to .annotation-viewer
  // This prevents PDF.js's bare selectors from affecting the rest of the page
  if (!document.querySelector('style[data-annotation-viewer-scoped-css]')) {
    try {
      const response = await fetch("https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/web/pdf_viewer.min.css")
      const originalCss = await response.text()
      
      // Use @layer + @scope to properly isolate PDF.js CSS to .annotation-viewer.
      // @scope correctly handles complex selectors like :is(), :not(), and
      // nested pseudo-classes that naive regex-based scoping breaks.
      const scopedCss = `@layer pdfjs-viewer {\n@scope (.annotation-viewer) {\n${originalCss}\n}\n}`
      
      const styleTag = document.createElement("style")
      styleTag.setAttribute("data-annotation-viewer-scoped-css", "true")
      styleTag.textContent = scopedCss
      document.head.appendChild(styleTag)
    } catch (error) {
      console.error("Failed to load and scope PDF.js CSS:", error)
      // Fallback to unscoped CSS if scoping fails
      const viewerCss = document.createElement("link")
      viewerCss.rel = "stylesheet"
      viewerCss.href = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/web/pdf_viewer.min.css"
      document.head.appendChild(viewerCss)
    }
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.min.mjs"
    script.type = "module"
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs"
      resolve()
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

/**
 * Load annotations data from embedded script tag
 */
export function loadAnnotationsData(): void {
  const annotationsScript = document.getElementById("annotations-data")
  if (annotationsScript) {
    try {
      window.annotationsData = JSON.parse(annotationsScript.textContent || "[]")
      console.log("[Annotations] Loaded", window.annotationsData.length, "annotations")
    } catch (e) {
      console.error("[Annotations] Failed to parse annotations data:", e)
    }
  }
}
