// The part of pdf-viewer that runs PDF.js. The component imports it dynamically, so PDF.js and its
// worker load only once an island hydrates, never at build time, and in a chunk of their own.
import {
  getDocument,
  GlobalWorkerOptions,
  TextLayer,
  VerbosityLevel,
  type PDFPageProxy,
} from "pdfjs-dist"
import workerSource from "pdfjs-dist/build/pdf.worker.min.mjs" with { type: "text" }

// PDF.js runs its parser in a worker, which needs a script URL. A library emits no files of its
// own (the page's bundler does), so the worker ships in this chunk as text and starts from a blob:
// URL on the page's own origin. Once per document: SPA navigation keeps the URL alive.
GlobalWorkerOptions.workerSrc ||= URL.createObjectURL(
  new Blob([workerSource], { type: "text/javascript" }),
)

export interface Shown {
  /** Stops loading and drawing, and ends the document's worker. */
  destroy(): void
}

export interface Callbacks {
  /** The document opened, with this many pages. */
  loaded(pages: number): void
  /** It could not be opened or drawn. */
  failed(error: Error): void
}

/** Draws every page of the PDF at `src` into `into`, each fitted to its width. */
export function show(src: string, into: HTMLElement, on: Callbacks): Shown {
  const task = getDocument({
    url: new URL(src, document.baseURI).href,
    verbosity: VerbosityLevel.ERRORS,
  })
  let destroyed = false

  const draw = async () => {
    const pdf = await task.promise
    if (destroyed) return
    on.loaded(pdf.numPages)
    // Read once, so every page gets the same width. The viewport reserves its scrollbar's gutter
    // from the start, so the scrollbar the first pages bring doesn't clip them.
    const width = into.clientWidth
    for (let n = 1; n <= pdf.numPages && !destroyed; n++) {
      await drawPage(await pdf.getPage(n), into, width)
    }
  }
  draw().catch((error) => {
    if (!destroyed) on.failed(error instanceof Error ? error : new Error(String(error)))
  })

  return {
    destroy() {
      destroyed = true
      // Destroying the task destroys its document and terminates its worker.
      task.destroy()
    },
  }
}

async function drawPage(page: PDFPageProxy, into: HTMLElement, width: number) {
  // Fitted to the column. An island laid out with no width (in a closed <details>, say) is drawn
  // at the PDF's own size instead of at none.
  const scale = width > 0 ? width / page.getViewport({ scale: 1 }).width : 1
  const viewport = page.getViewport({ scale })

  const el = document.createElement("div")
  el.className = "cgc-pdf-viewer__page"
  el.style.width = `${viewport.width}px`
  el.style.height = `${viewport.height}px`
  // The text layer's sizes are written in terms of PDF.js's own custom properties.
  el.style.setProperty("--total-scale-factor", String(scale))
  el.style.setProperty("--scale-round-x", "1px")
  el.style.setProperty("--scale-round-y", "1px")

  // Drawn at the screen's pixel density, so text stays sharp. v4's `dpi` prop did this by hand.
  const ratio = window.devicePixelRatio || 1
  const canvas = document.createElement("canvas")
  canvas.className = "cgc-pdf-viewer__canvas"
  canvas.width = Math.floor(viewport.width * ratio)
  canvas.height = Math.floor(viewport.height * ratio)

  const text = document.createElement("div")
  text.className = "cgc-pdf-viewer__text-layer"

  el.append(canvas, text)
  into.append(el)

  await page.render({
    canvas,
    viewport,
    transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
  }).promise
  await new TextLayer({
    textContentSource: page.streamTextContent(),
    container: text,
    viewport,
  }).render()
  // TextLayer measures text on a canvas it appends to <body>, which only PDF.js's own stylesheet
  // hides. This widget doesn't ship that stylesheet, so the canvas goes as soon as the text is laid
  // out. A no-op while another viewer's text layer is still drawing; that one removes it.
  TextLayer.cleanup()

  // Links in the PDF stay clickable, as in v4. Only web links: in-document destinations need a
  // viewer that can scroll to a page, which this isn't.
  for (const annotation of await page.getAnnotations()) {
    if (annotation.subtype !== "Link" || !annotation.url) continue
    const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(annotation.rect)
    const link = document.createElement("a")
    link.className = "cgc-pdf-viewer__link"
    link.href = annotation.url
    link.target = "_blank"
    link.rel = "noopener noreferrer nofollow"
    link.title = annotation.url
    Object.assign(link.style, {
      left: `${Math.min(x1, x2)}px`,
      top: `${Math.min(y1, y2)}px`,
      width: `${Math.abs(x2 - x1)}px`,
      height: `${Math.abs(y2 - y1)}px`,
    })
    el.append(link)
  }
}
