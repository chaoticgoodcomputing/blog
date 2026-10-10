// The part of the annotation viewer that runs PDF.js (./AnnotationViewer.astro). The viewer imports
// it once the page has loaded, so PDF.js and its worker are loaded only on an annotation page, in a
// chunk of their own. Its worker is set up as the PDF viewer widget's is
// (src/components/widgets/pdf-viewer/document.ts).
//
// Every page's box is laid out as soon as the document opens, with each passage's highlights in it,
// so the document has its whole height at once and any passage can be gone to. A page is drawn,
// its picture and the text over it that a reader can select, only as it comes near the screen, and
// let go once it is well away, so a long document fits in a phone's memory for canvases.
import {
  getDocument,
  GlobalWorkerOptions,
  RenderingCancelledException,
  TextLayer,
  VerbosityLevel,
  type PDFDocumentProxy,
} from "pdfjs-dist"
import type { TextContent } from "pdfjs-dist/types/src/display/api"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { findPassage, highlightBoxes, pageText, type AnnotatedPassage, type TextRun } from "../../lib/highlights.ts"

GlobalWorkerOptions.workerSrc ||= workerUrl

/** Where a found passage starts: its page, from 0, and the top of its first line on it, as a share of the page's height. */
export interface Place {
  page: number
  top: number
}

export interface Callbacks {
  /** The document opened, every page's box laid out, and these annotations' passages found in it. */
  opened(places: Map<string, Place>): void
  /** It could not be opened or drawn. */
  failed(error: Error): void
}

export interface Shown {
  /** Stops loading and drawing, and ends the document's worker. */
  destroy(): void
}

// Drawn at the screen's pixel density up to this, so a page's canvas is never more than twice its
// size each way: at a density of 3, a long document's canvases outgrow what a phone allows.
const MAX_RATIO = 2
// A page is drawn once it is within a screen of the window, and let go once two away.
const NEAR = "100% 0px"
const FAR = "200% 0px"

interface Page {
  el: HTMLElement
  /** Its width at scale 1, in CSS pixels. */
  width: number
  /** The width it is drawn at, or 0 while it is not. */
  drawnAt: number
  /** Bumped by every drawing and letting go, so a drawing overtaken by either stops. */
  generation: number
  task?: { cancel(): void }
}

/**
 * Shows the PDF at `src` in `into`, with each passage of `passages` that is found in it highlighted
 * by a link to its annotation, `#^id`. The page is the one scroll: the pages are drawn as they come
 * near the window.
 */
export function show(src: string, into: HTMLElement, passages: AnnotatedPassage[], on: Callbacks): Shown {
  const task = getDocument({ url: new URL(src, document.baseURI).href, verbosity: VerbosityLevel.ERRORS })
  let destroyed = false
  let pdf: PDFDocumentProxy | undefined
  const pages: Page[] = []
  const texts: TextContent[] = []

  const fail = (error: unknown) => {
    if (destroyed) return
    on.failed(error instanceof Error ? error : new Error(String(error)))
    shown.destroy()
  }

  const pageOf = (el: Element) => Number((el as HTMLElement).dataset.page)
  const near = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) draw(pageOf(entry.target)).catch(fail)
    },
    { rootMargin: NEAR },
  )
  const far = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (!entry.isIntersecting) release(pageOf(entry.target))
    },
    { rootMargin: FAR },
  )
  // A page drawn at one width is drawn again at the next, once the resizing (or zooming) has
  // settled. Until then its canvas is stretched, and its highlights, placed as shares of the page,
  // stay on their passages.
  let resizing: ReturnType<typeof setTimeout> | undefined
  const resized = new ResizeObserver(() => {
    clearTimeout(resizing)
    resizing = setTimeout(() => {
      for (const [i, page] of pages.entries()) if (page.drawnAt) draw(i + 1).catch(fail)
    }, 150)
  })

  // Lets go of a page's drawing and keeps its box and its highlights. A canvas sized to nothing
  // gives its memory back at once, where a removed one waits for the garbage collector.
  function release(n: number) {
    const page = pages[n - 1]
    if (!page) return
    page.generation++
    page.task?.cancel()
    page.drawnAt = 0
    for (const canvas of page.el.querySelectorAll("canvas")) canvas.width = canvas.height = 0
    for (const drawn of page.el.querySelectorAll("canvas, .text-layer")) drawn.remove()
  }

  // Draws a page at the width its box has, unless it is drawn at it already. The new drawing takes
  // the old one's place only once it is done, so a page drawn again never goes blank.
  async function draw(n: number) {
    const page = pages[n - 1]
    const width = page?.el.clientWidth ?? 0
    if (destroyed || !pdf || !page || width === 0 || page.drawnAt === width) return
    const mine = ++page.generation
    const current = () => !destroyed && mine === page.generation
    page.task?.cancel()
    const proxy = await pdf.getPage(n)
    if (!current()) return
    const scale = width / page.width
    const viewport = proxy.getViewport({ scale })
    const ratio = Math.min(MAX_RATIO, window.devicePixelRatio || 1)
    const canvas = document.createElement("canvas")
    canvas.width = Math.floor(viewport.width * ratio)
    canvas.height = Math.floor(viewport.height * ratio)
    const text = document.createElement("div")
    text.className = "text-layer"
    const rendering = proxy.render({ canvas, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] })
    page.task = rendering
    try {
      await rendering.promise
      if (!current()) return
      await new TextLayer({ textContentSource: texts[n - 1]!, container: text, viewport }).render()
    } catch (error) {
      if (error instanceof RenderingCancelledException || !current()) return
      throw error
    } finally {
      // TextLayer measures text on a canvas it appends to <body>, which only PDF.js's own stylesheet
      // hides, and the site doesn't ship it: the canvas goes once the text is laid out.
      TextLayer.cleanup()
    }
    if (!current()) return
    page.drawnAt = width
    // The text layer's sizes are written in PDF.js's own custom properties, as the PDF viewer
    // widget's are.
    page.el.style.setProperty("--total-scale-factor", String(scale))
    for (const old of page.el.querySelectorAll("canvas")) old.width = old.height = 0
    for (const old of page.el.querySelectorAll("canvas, .text-layer")) old.remove()
    // Under the highlights, which are the page's other children.
    page.el.prepend(canvas, text)
  }

  const open = async () => {
    pdf = await task.promise
    if (destroyed) return
    // Every page's size and text, once: neither changes with the size it is drawn at. The text is
    // what the passages are found in, where on its page each one is, and what the text layer sets.
    const sizes = []
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n)
      sizes.push(page.getViewport({ scale: 1 }))
      texts.push(await page.getTextContent())
      if (destroyed) return
    }
    const runs = texts.map((text) => text.items as TextRun[])
    const pageTexts = runs.map(pageText)
    const widest = Math.max(...sizes.map((size) => size.width))

    for (const [i, size] of sizes.entries()) {
      const el = document.createElement("div")
      el.className = "document-page"
      el.dataset.page = String(i + 1)
      el.style.setProperty("--scale-round-x", "1px")
      el.style.setProperty("--scale-round-y", "1px")
      // Each page as wide as the document for the widest, and as tall as its own shape makes it.
      el.style.width = `${(100 * size.width) / widest}%`
      el.style.aspectRatio = `${size.width} / ${size.height}`
      pages.push({ el, width: size.width, drawnAt: 0, generation: 0 })
    }

    const places = new Map<string, Place>()
    for (const passage of passages) {
      const at = findPassage(pageTexts, passage)
      if (!at) continue
      const boxes = highlightBoxes(runs[at.page]!, at, sizes[at.page]!)
      if (!boxes.length) continue
      places.set(passage.id, { page: at.page, top: Math.min(...boxes.map((box) => box.top)) })
      for (const [i, box] of boxes.entries()) {
        const link = document.createElement("a")
        link.className = "highlight"
        link.href = `#^${passage.id}`
        link.dataset.annotation = passage.id
        // One link per passage for a reader with a keyboard or a screen reader; a passage's other
        // lines are the same link again, for a pointer.
        if (i === 0) link.setAttribute("aria-label", `Go to the annotation on “${passage.exact}”`)
        else {
          link.tabIndex = -1
          link.setAttribute("aria-hidden", "true")
        }
        Object.assign(link.style, {
          left: `${box.left * 100}%`,
          top: `${box.top * 100}%`,
          width: `${box.width * 100}%`,
          height: `${box.height * 100}%`,
        })
        pages[at.page]!.el.append(link)
      }
    }

    into.replaceChildren(...pages.map((page) => page.el))
    on.opened(places)
    resized.observe(into)
    for (const page of pages) {
      near.observe(page.el)
      far.observe(page.el)
    }
  }
  open().catch(fail)

  const shown: Shown = {
    destroy() {
      destroyed = true
      clearTimeout(resizing)
      near.disconnect()
      far.disconnect()
      resized.disconnect()
      for (const page of pages) page.task?.cancel()
      // Destroying the task destroys its document and terminates its worker.
      void task.destroy()
    },
  }
  return shown
}
