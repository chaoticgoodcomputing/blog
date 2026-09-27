// The part of the Viewer that runs PDF.js. The Viewer imports it dynamically, so PDF.js loads only
// once the island hydrates, in a chunk of its own, and never at build time.
//
// PDF.js is bundled, never fetched from a CDN (#37). Its worker and wasm are files the plugin emits
// beside this chunk, found through `import.meta.url` (build.mjs copies them out of pdfjs-dist).
import { getDocument, GlobalWorkerOptions, TextLayer, VerbosityLevel, type PDFDocumentProxy, type PDFPageProxy } from "pdfjs-dist"
import type { TextContent, TextItem } from "pdfjs-dist/types/src/display/api"
import { anchor, translateOffsets, type Anchor, type Passage } from "./anchor"

// Renamed `.js` from pdfjs-dist's `.mjs`, so that any static host serves it as JavaScript, which a
// module worker needs.
GlobalWorkerOptions.workerSrc ||= new URL("./pdf.worker.min.js", import.meta.url).href
// JPEG 2000 images and ICC colour decode through wasm, which v4 fetched from a CDN. The worker
// fetches it itself: PDF.js only uses its colour engine then.
const WASM = new URL("./wasm/", import.meta.url).href

export interface Callbacks {
  /** The document opened. */
  opened(): void
  /** Every page is drawn, with its highlights: after the first drawing, and after each redraw. */
  drawn(): void
  /** It could not be opened or drawn. */
  failed(error: Error): void
}

export interface Shown {
  /** Stops loading and drawing, ends the document's worker, and stops watching for resizes. */
  destroy(): void
}

const CLASS = "cgc-annotator-viewer"

/**
 * Draws every page of the PDF at `url` into `into`, each fitted to its width, with a highlight over
 * each passage it finds. Draws again whenever `into` changes width. Anything left over from a load
 * that `destroy()` has ended is never drawn.
 */
export function show(url: string, into: HTMLElement, passages: Passage[], on: Callbacks): Shown {
  const task = getDocument({ url, wasmUrl: WASM, useWorkerFetch: true, verbosity: VerbosityLevel.ERRORS })
  let destroyed = false
  // Each drawing gets a number; one overtaken by a newer drawing, or by destroy(), stops.
  let drawing = 0
  let width = 0
  let resized: ReturnType<typeof setTimeout> | undefined
  const observer = new ResizeObserver(() => {
    clearTimeout(resized)
    resized = setTimeout(() => {
      if (!destroyed && Math.abs(into.clientWidth - width) > 1) draw().catch(fail)
    }, 150)
  })

  let pdf: PDFDocumentProxy | undefined
  const texts: TextContent[] = []
  const anchors = new Map<string, Anchor>()

  // A document that can't be shown lets go of PDF.js at once, worker and all.
  const fail = (error: unknown) => {
    if (destroyed) return
    on.failed(error instanceof Error ? error : new Error(String(error)))
    shown.destroy()
  }

  // Draws page by page, each page going in as soon as it's drawn: in place of the page it replaces
  // on a redraw, so the document never goes blank.
  async function draw() {
    const mine = ++drawing
    const current = () => !destroyed && mine === drawing
    width = into.clientWidth
    for (let n = 1; n <= pdf!.numPages; n++) {
      const page = await pdf!.getPage(n)
      if (!current()) return
      const el = await drawPage(page, n, texts[n - 1], width, current)
      if (!current()) return
      const old = into.children[n - 1]
      if (old) old.replaceWith(el)
      else into.append(el)
      for (const [id, found] of anchors) if (found.page === n - 1) highlight(el, texts[n - 1], found, id)
    }
    while (into.children.length > pdf!.numPages) into.lastElementChild!.remove()
    on.drawn()
  }

  task.promise
    .then(async (opened) => {
      if (destroyed) return
      pdf = opened
      on.opened()
      // The text of every page, once, to find the passages in: text doesn't change with scale.
      for (let n = 1; n <= opened.numPages; n++) {
        texts.push(await (await opened.getPage(n)).getTextContent())
        if (destroyed) return
      }
      const pageTexts = texts.map(textOf)
      for (const passage of passages) {
        const found = anchor(pageTexts, passage)
        if (found) anchors.set(passage.id, found)
      }
      await draw()
      if (!destroyed) observer.observe(into)
    })
    .catch(fail)

  const shown: Shown = {
    destroy() {
      destroyed = true
      clearTimeout(resized)
      observer.disconnect()
      // Destroying the task destroys its document and terminates its worker.
      task.destroy()
    },
  }
  return shown
}

// A page's text as the passages' offsets count it: its text items, end to end.
const textOf = (content: TextContent) =>
  content.items.map((item) => ("str" in item ? (item as TextItem).str : "")).join("")

async function drawPage(page: PDFPageProxy, n: number, text: TextContent, width: number, current: () => boolean) {
  // Fitted to the column. A Viewer laid out with no width is drawn at the PDF's own size.
  const scale = width > 0 ? width / page.getViewport({ scale: 1 }).width : 1
  const viewport = page.getViewport({ scale })

  const el = document.createElement("div")
  el.className = `${CLASS}__page`
  el.dataset.page = String(n)
  el.style.width = `${viewport.width}px`
  el.style.height = `${viewport.height}px`
  // PDF.js's own properties, which its text layer is sized by.
  el.style.setProperty("--total-scale-factor", String(scale))
  el.style.setProperty("--scale-round-x", "1px")
  el.style.setProperty("--scale-round-y", "1px")

  // Drawn at the screen's pixel density, so text stays sharp.
  const ratio = window.devicePixelRatio || 1
  const canvas = document.createElement("canvas")
  canvas.className = `${CLASS}__canvas`
  canvas.width = Math.floor(viewport.width * ratio)
  canvas.height = Math.floor(viewport.height * ratio)

  const layer = document.createElement("div")
  layer.className = `${CLASS}__text-layer`
  const highlights = document.createElement("div")
  highlights.className = `${CLASS}__highlights`
  el.append(canvas, layer, highlights)

  await page.render({ canvas, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] }).promise
  if (!current()) return el
  await new TextLayer({ textContentSource: text, container: layer, viewport }).render()
  // TextLayer measures text on a canvas it parks in <body>, which only PDF.js's own stylesheet
  // hides. The Viewer doesn't ship that stylesheet, so the canvas goes once the text is laid out.
  TextLayer.cleanup()
  return el
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
