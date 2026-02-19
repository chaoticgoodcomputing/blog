/**
 * Create a canvas wrapper with text layer and highlight layer for a PDF page
 */
export function createPageWrapper(pageNum: number, viewport: any): HTMLDivElement {
  const pageWrapper = document.createElement("div")
  pageWrapper.className = "pdf-page-wrapper"
  pageWrapper.setAttribute("data-page-num", pageNum.toString())
  pageWrapper.style.position = "relative"
  pageWrapper.style.width = `${viewport.width}px`
  pageWrapper.style.height = `${viewport.height}px`

  const canvas = document.createElement("canvas")
  canvas.className = "pdf-page"
  canvas.setAttribute("data-page-num", pageNum.toString())
  canvas.height = viewport.height
  canvas.width = viewport.width
  canvas.style.display = "block"

  // Create text layer for accurate text positioning (same as PDFViewer)
  const textLayerDiv = document.createElement("div")
  textLayerDiv.className = "textLayer"
  textLayerDiv.setAttribute("data-page-num", pageNum.toString())

  // Create highlight overlay (positioned above text layer)
  const highlightLayer = document.createElement("div")
  highlightLayer.className = "pdf-highlight-layer"
  highlightLayer.style.width = viewport.width + "px"
  highlightLayer.style.height = viewport.height + "px"

  pageWrapper.appendChild(canvas)
  pageWrapper.appendChild(textLayerDiv)
  pageWrapper.appendChild(highlightLayer)

  return pageWrapper
}

/**
 * Render a PDF page to canvas and text layer
 */
export async function renderPageToCanvas(
  page: any,
  canvas: HTMLCanvasElement,
  viewport: any,
): Promise<void> {
  const context = canvas.getContext("2d")
  if (!context) return

  // Render the page canvas
  await page.render({ canvasContext: context, viewport: viewport }).promise

  // Render the text layer for accurate text positioning
  const pageWrapper = canvas.parentElement
  const textLayerDiv = pageWrapper?.querySelector(".textLayer") as HTMLElement
  if (textLayerDiv) {
    try {
      const textContent = await page.getTextContent()

      // Check if TextLayer is available (PDF.js 5.x core build)
      if (window.pdfjsLib.TextLayer) {
        const textLayer = new window.pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
        })
        await textLayer.render()

        // PDF.js's official CSS (pdf_viewer.css) uses --total-scale-factor to
        // calculate font-size and dimensions. The full viewer (PDFPageView) sets
        // this automatically, but since we use the core TextLayer directly, we
        // must set it ourselves. Without it, font-size falls back to inherited
        // values and horizontal scaling breaks.
        textLayerDiv.style.setProperty("--total-scale-factor", String(viewport.scale))
      }
    } catch (textError) {
      console.warn("Could not render text layer:", textError)
    }
  }
}
