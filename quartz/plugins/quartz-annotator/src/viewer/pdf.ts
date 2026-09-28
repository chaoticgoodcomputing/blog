// The part of the Viewer that runs PDF.js. The Viewer imports it dynamically, so PDF.js loads only
// once the island hydrates, in a chunk of its own, and never at build time.
//
// PDF.js is bundled, never fetched from a CDN (#37). Its worker and wasm are files the plugin emits
// beside this chunk, found through `import.meta.url` (build.mjs copies them out of pdfjs-dist).
import {
  getDocument,
  GlobalWorkerOptions,
  RenderingCancelledException,
  TextLayer,
  VerbosityLevel,
  type PageViewport,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from "pdfjs-dist"
import type { TextContent, TextItem } from "pdfjs-dist/types/src/display/api"
import { anchor, translateOffsets, type Anchor, type Passage } from "./anchor"

// Renamed `.js` from pdfjs-dist's `.mjs`, so that any static host serves it as JavaScript, which a
// module worker needs.
GlobalWorkerOptions.workerSrc ||= new URL("./pdf.worker.min.js", import.meta.url).href
// JPEG 2000 images and ICC colour decode through wasm, which v4 fetched from a CDN. The worker
// fetches it itself: PDF.js only uses its colour engine then.
const WASM = new URL("./wasm/", import.meta.url).href

/** A page's size at scale 1, in CSS pixels: the PDF's own size. */
export interface PageSize {
  width: number
  height: number
}

/** Where a found passage starts: its page (0-based), and the top of its first line on that page. */
export interface Place {
  page: number
  /** The top of the passage's first line, as a fraction of its page's height. */
  top: number
}

/** The document's shape, known as soon as it opens and before any page is drawn. */
export interface Geometry {
  /** Every page's size at scale 1. */
  pages: PageSize[]
  /** Where each passage the Viewer found starts, by annotation id. */
  places: Map<string, Place>
  /** The widest page's width at scale 1, which the document's width fits. */
  widest: number
}

export interface Callbacks {
  /** The document opened: every page's box is laid out, none drawn yet. */
  opened(geometry: Geometry): void
  /** A page was drawn, with its highlights. Called again each time it is drawn afresh. */
  drawn(page: number): void
  /** It could not be opened or drawn. */
  failed(error: Error): void
}

export interface Shown {
  /** Stops loading and drawing, ends the document's worker, and stops watching. */
  destroy(): void
}

const CLASS = "cgc-annotator-viewer"
// Drawn at the screen's pixel density up to this, so a page's canvas is never more than twice its
// CSS size each way: at a density of 3, a long document's canvases outgrow what a phone allows.
const MAX_RATIO = 2
// A page is drawn once it is within a screen of the viewport, and let go once it is two away.
const NEAR = "100% 0px"
const FAR = "200% 0px"

// One page's box and what is drawn in it.
interface PageState {
  el: HTMLElement
  size: PageSize
  /** The width it was last drawn at, or 0 while nothing is drawn. */
  drawnAt: number
  /** The width it is being drawn at, or 0. */
  drawingAt: number
  /** Bumped on every draw and release, so a drawing overtaken by either stops. */
  generation: number
  task?: { cancel(): void }
}

/**
 * Shows the PDF at `url` in `into`, highlighting each passage it finds. Every page's box is laid out
 * as soon as the document opens, as wide as `into` for the widest page, so the document has its
 * whole height at once. A page is drawn as it comes near the viewport (`root`'s, when the document
 * scrolls in a box of its own), and its canvas is let go once it's well away. When `into` changes
 * width, every box is resized and only the pages near the viewport are drawn again. Anything left
 * over from a load that `destroy()` has ended is never drawn.
 */
export function show(url: string, into: HTMLElement, passages: Passage[], on: Callbacks, root: Element | null = null): Shown {
  const task = getDocument({ url, wasmUrl: WASM, useWorkerFetch: true, verbosity: VerbosityLevel.ERRORS })
  let destroyed = false
  let pdf: PDFDocumentProxy | undefined
  const texts: TextContent[] = []
  const anchors = new Map<string, Anchor>()
  const pages: PageState[] = []
  // The pages within a screen of the viewport, by number (1-based).
  const near = new Set<number>()
  let width = 0
  let widest = 0

  // A document that can't be shown lets go of PDF.js at once, worker and all.
  const fail = (error: unknown) => {
    if (destroyed) return
    on.failed(error instanceof Error ? error : new Error(String(error)))
    shown.destroy()
  }

  const pageOf = (el: Element) => Number((el as HTMLElement).dataset.page)
  const nearObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const n = pageOf(entry.target)
        if (entry.isIntersecting) {
          near.add(n)
          draw(n).catch(fail)
        } else near.delete(n)
      }
    },
    { root, rootMargin: NEAR },
  )
  const farObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (!entry.isIntersecting) release(pageOf(entry.target))
    },
    { root, rootMargin: FAR },
  )

  let resized: ReturnType<typeof setTimeout> | undefined
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resized)
    // The first width is laid out at once; later ones wait for the resizing to settle.
    if (width === 0) layout()
    else resized = setTimeout(layout, 150)
  })

  // Sizes every box for the width of `into`, then draws again the pages near the viewport and lets
  // go of the rest.
  function layout() {
    if (destroyed || !pdf) return
    const next = into.clientWidth
    if (next === 0 || Math.abs(next - width) <= 1) return
    width = next
    const scale = width / widest
    for (const page of pages) {
      page.el.style.width = `${page.size.width * scale}px`
      page.el.style.height = `${page.size.height * scale}px`
      // PDF.js's own properties, which its text layer is sized by.
      page.el.style.setProperty("--total-scale-factor", String(scale))
    }
    pages.forEach((page, i) => {
      if (near.has(i + 1)) draw(i + 1).catch(fail)
      else release(i + 1)
    })
  }

  // Lets go of a page's drawing, keeping its box.
  function release(n: number) {
    const page = pages[n - 1]
    if (!page || (page.drawnAt === 0 && page.drawingAt === 0)) return
    page.generation++
    page.task?.cancel()
    page.task = undefined
    page.drawnAt = page.drawingAt = 0
    empty(page.el)
  }

  // Draws a page at the current width, unless it is drawn or being drawn at it already. The new
  // drawing replaces the old one only once it's done, so a page being drawn again never goes blank.
  async function draw(n: number) {
    const page = pages[n - 1]
    if (destroyed || !pdf || !page || width === 0 || page.drawnAt === width || page.drawingAt === width) return
    const mine = ++page.generation
    const current = () => !destroyed && mine === page.generation
    page.task?.cancel()
    page.task = undefined
    page.drawingAt = width
    const proxy = await pdf.getPage(n)
    if (!current()) return
    const el = await drawPage(proxy, texts[n - 1], width / widest, page).catch((error) => {
      if (error instanceof RenderingCancelledException || !current()) return undefined
      throw error
    })
    if (!el || !current()) return
    page.task = undefined
    page.drawingAt = 0
    page.drawnAt = width
    empty(page.el, el.childNodes)
    for (const [id, found] of anchors) if (found.page === n - 1) highlight(page.el, texts[n - 1], found, id)
    on.drawn(n)
  }

  task.promise
    .then(async (opened) => {
      if (destroyed) return
      pdf = opened
      // Every page's size and text, once: neither changes with scale. The text is what the passages
      // are found in, and says where each one is on its page before the page is drawn.
      const viewports = []
      for (let n = 1; n <= opened.numPages; n++) {
        const page = await opened.getPage(n)
        viewports.push(page.getViewport({ scale: 1 }))
        texts.push(await page.getTextContent())
        if (destroyed) return
      }
      const pageTexts = texts.map(textOf)
      const places = new Map<string, Place>()
      for (const passage of passages) {
        const found = anchor(pageTexts, passage)
        if (!found) continue
        anchors.set(passage.id, found)
        places.set(passage.id, { page: found.page, top: lineTop(texts[found.page], viewports[found.page], found.start) })
      }
      widest = Math.max(...viewports.map((v) => v.width))
      into.replaceChildren()
      viewports.forEach((viewport, i) => {
        const el = document.createElement("div")
        el.className = `${CLASS}__page`
        el.dataset.page = String(i + 1)
        el.style.setProperty("--scale-round-x", "1px")
        el.style.setProperty("--scale-round-y", "1px")
        pages.push({ el, size: { width: viewport.width, height: viewport.height }, drawnAt: 0, drawingAt: 0, generation: 0 })
        into.append(el)
      })
      on.opened({ pages: pages.map((p) => p.size), places, widest })
      layout()
      resizeObserver.observe(into)
      for (const page of pages) {
        nearObserver.observe(page.el)
        farObserver.observe(page.el)
      }
    })
    .catch(fail)

  const shown: Shown = {
    destroy() {
      destroyed = true
      clearTimeout(resized)
      resizeObserver.disconnect()
      nearObserver.disconnect()
      farObserver.disconnect()
      for (const page of pages) page.task?.cancel()
      // Destroying the task destroys its document and terminates its worker.
      task.destroy()
    },
  }
  return shown
}

// Lets go of a page's drawing, and puts `into` it what replaces it. A canvas sized to nothing gives
// its memory back at once, where a removed one waits for the garbage collector.
function empty(page: HTMLElement, into: Iterable<Node> = []) {
  for (const canvas of page.querySelectorAll("canvas")) canvas.width = canvas.height = 0
  page.replaceChildren(...into)
}

// A page's text as the passages' offsets count it: its text items, end to end.
const textOf = (content: TextContent) =>
  content.items.map((item) => ("str" in item ? (item as TextItem).str : "")).join("")

// The top of the line holding `offset` of a page's text, as a fraction of the page's height, from
// the text items alone: where the item is set, less its font's height.
function lineTop(content: TextContent, viewport: PageViewport, offset: number): number {
  let at = 0
  for (const item of content.items) {
    if (!("str" in item)) continue
    const text = item as TextItem
    at += text.str.length
    if (at <= offset) continue
    const [, , c, d, e, f] = text.transform as number[]
    const [, baseline] = viewport.convertToViewportPoint(e, f) as number[]
    const height = text.height || Math.hypot(c, d)
    return Math.min(1, Math.max(0, (baseline - height) / viewport.height))
  }
  return 0
}

// Draws a page into a new element, fitted by `scale`: its canvas, text layer and an empty layer of
// highlights, for `into` to take in once it's done.
function drawPage(page: PDFPageProxy, text: TextContent, scale: number, into: PageState): Promise<HTMLElement> {
  const viewport = page.getViewport({ scale })
  const el = document.createElement("div")

  // Drawn at the screen's pixel density, so text stays sharp, but never above MAX_RATIO.
  const ratio = Math.min(MAX_RATIO, window.devicePixelRatio || 1)
  const canvas = document.createElement("canvas")
  canvas.className = `${CLASS}__canvas`
  canvas.width = Math.floor(viewport.width * ratio)
  canvas.height = Math.floor(viewport.height * ratio)

  const layer = document.createElement("div")
  layer.className = `${CLASS}__text-layer`
  const highlights = document.createElement("div")
  highlights.className = `${CLASS}__highlights`
  el.append(canvas, layer, highlights)

  const rendering = page.render({ canvas, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] })
  into.task = rendering
  return rendering.promise.then(async () => {
    await new TextLayer({ textContentSource: text, container: layer, viewport }).render()
    // TextLayer measures text on a canvas it parks in <body>, which only PDF.js's own stylesheet
    // hides. The Viewer doesn't ship that stylesheet, so the canvas goes once the text is laid out.
    TextLayer.cleanup()
    return el
  })
}

interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

// The boxes a passage's characters take up, one per line: the boxes of its text alone, each line's
// joined into one. Never a range's own client rects: a range that holds an element whole, as a
// passage running through a line does its span, gives that element's box as well as its text's, and
// the two boxes laid one on the other darken the line (#87). The text layer draws a line as several
// spans, which touch or overlap a little, so a line's pieces are joined too.
function lineBoxes(nodes: Text[], start: number, end: number): Box[] {
  const pieces: Box[] = []
  const range = document.createRange()
  let offset = 0
  for (const node of nodes) {
    const next = offset + node.data.length
    if (start < next && end > offset) {
      range.setStart(node, Math.max(start, offset) - offset)
      range.setEnd(node, Math.min(end, next) - offset)
      for (const rect of range.getClientRects()) {
        if (rect.width >= 1 && rect.height >= 1) pieces.push({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom })
      }
    }
    offset = next
  }
  const lines: Box[] = []
  for (const piece of pieces.sort((a, b) => a.top - b.top || a.left - b.left)) {
    const height = piece.bottom - piece.top
    // The same line: most of the shorter one's height shared, and no more than a line's height of
    // gap between them, so a passage running on in the next column stays apart.
    const line = lines.find((l) => {
      const shared = Math.min(l.bottom, piece.bottom) - Math.max(l.top, piece.top)
      const gap = Math.max(l.left, piece.left) - Math.min(l.right, piece.right)
      return shared >= Math.min(l.bottom - l.top, height) / 2 && gap <= height
    })
    if (!line) lines.push({ ...piece })
    else {
      line.left = Math.min(line.left, piece.left)
      line.top = Math.min(line.top, piece.top)
      line.right = Math.max(line.right, piece.right)
      line.bottom = Math.max(line.bottom, piece.bottom)
    }
  }
  // Tightly set lines' boxes can still overlap a little, top to bottom: they meet halfway instead.
  for (const upper of lines) {
    for (const lower of lines) {
      const across = Math.min(upper.right, lower.right) - Math.max(upper.left, lower.left)
      if (upper === lower || across <= 0 || upper.top >= lower.top || upper.bottom <= lower.top) continue
      const middle = (upper.bottom + lower.top) / 2
      upper.bottom = middle
      lower.top = middle
    }
  }
  return lines
}

// Covers the characters of `found` on `page` with highlight boxes, one per line.
function highlight(page: HTMLElement, content: TextContent, found: Anchor, id: string) {
  const layer = page.querySelector<HTMLElement>(`.${CLASS}__text-layer`)!
  const into = page.querySelector<HTMLElement>(`.${CLASS}__highlights`)!
  // The text layer's text can differ from the text items' in whitespace, so offsets are carried
  // across by non-space characters.
  const nodes: Text[] = []
  const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text)
  const dom = nodes.map((node) => node.data).join("")
  const [start, end] = translateOffsets(textOf(content), dom, found.start, found.end)
  if (end <= start) return
  const origin = page.getBoundingClientRect()
  for (const line of lineBoxes(nodes, start, end)) {
    const box = document.createElement("div")
    box.className = `${CLASS}__highlight`
    box.dataset.annotation = id
    box.style.left = `${line.left - origin.left}px`
    box.style.top = `${line.top - origin.top}px`
    box.style.width = `${line.right - line.left}px`
    box.style.height = `${line.bottom - line.top}px`
    into.append(box)
  }
}
