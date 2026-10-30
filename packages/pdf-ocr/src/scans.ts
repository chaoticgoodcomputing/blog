// A page's scan: the one large image a scanned page is, as the PDF stores it, decoded by PDF.js and
// written as a PNM image (PBM, or PPM for colour), which Tesseract's Leptonica reads itself. Not a
// rendering of the page: no canvas, no scale, no smoothing, so the pixels are the same wherever this
// runs, which is what makes the text the same.

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist"

/** An affine transform, as PDF and PDF.js write one: [a, b, c, d, e, f]. */
export type Matrix = [number, number, number, number, number, number]

export interface Scan {
  /** The image as a PNM file. */
  pnm: Uint8Array
  width: number
  height: number
  /** Where the image is on the page: from the image's unit square to the page's space. */
  transform: Matrix
  /** Its resolution, in pixels per inch along its width, for Tesseract's sizing of text. */
  dpi: number
}

/**
 * How a PDF is opened for its scans: with PDF.js's own decoders everywhere, not a browser's (its
 * JPEG decoder, OffscreenCanvas) or optional WASM ones, so Node and a browser decode alike.
 */
export const SCAN_OPTIONS = { isOffscreenCanvasSupported: false, isImageDecoderSupported: false, useWasm: false, disableFontFace: true, verbosity: 0 } as const

// PDF.js's operator numbers (pdfjs-dist's OPS), for the few the page's operator list is read for.
// Here rather than imported, so this module needn't load PDF.js's build; a test checks them.
export const OPS = { save: 10, restore: 11, transform: 12, paintImageMaskXObject: 83, paintImageXObject: 85 } as const

// PDF.js's kinds of decoded image (pdfjs-dist's ImageKind).
const GRAYSCALE_1BPP = 1
const RGB_24BPP = 2
const RGBA_32BPP = 3

/** A scan must cover at least this share of the page to be the page: a quarter, as a scan with wide margins may cover less than half, and a page's ornament much less. */
const MIN_COVER = 0.25

const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
]

/** A point through a transform. */
export const apply = (m: Matrix, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]

interface Decoded {
  width: number
  height: number
  data: Uint8Array | Uint8ClampedArray
  kind?: number
}

/** An image of the page's, by its id: the page's own, or the document's. */
function objectOf(page: PDFPageProxy, id: string): Promise<Decoded | undefined> {
  const objects = id.startsWith("g_") ? (page as unknown as { commonObjs: PDFPageProxy["objs"] }).commonObjs : page.objs
  return new Promise((resolve) => objects.get(id, (value: unknown) => resolve(value as Decoded | undefined)))
}

/** Whether a page has text of its own. */
export async function hasText(page: PDFPageProxy): Promise<boolean> {
  const { items } = await page.getTextContent()
  return items.some((item) => "str" in item && item.str.trim() !== "")
}

/** A page's largest image, where it is on the page, when it covers enough of the page to be a scan of it. */
async function largestImage(page: PDFPageProxy) {
  const list = await page.getOperatorList()
  const [x0, y0, x1, y1] = page.view as [number, number, number, number]
  const pageArea = (x1 - x0) * (y1 - y0)
  let ctm: Matrix = [1, 0, 0, 1, 0, 0]
  const stack: Matrix[] = []
  let best: { id: string; mask: boolean; transform: Matrix; area: number } | undefined
  for (let i = 0; i < list.fnArray.length; i++) {
    const op = list.fnArray[i]
    const args = list.argsArray[i] as unknown[]
    if (op === OPS.save) stack.push(ctm)
    else if (op === OPS.restore) ctm = stack.pop() ?? ctm
    else if (op === OPS.transform) ctm = multiply(ctm, args as Matrix)
    else if (op === OPS.paintImageMaskXObject || op === OPS.paintImageXObject) {
      const id = op === OPS.paintImageMaskXObject ? (args[0] as { data: string }).data : (args[0] as string)
      // The unit square's area on the page.
      const area = Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2])
      if (!best || area > best.area) best = { id, mask: op === OPS.paintImageMaskXObject, transform: ctm, area }
    }
  }
  return best && best.area >= MIN_COVER * pageArea ? best : undefined
}

/**
 * Whether a page is a scan: whether it has an image large enough to be one. Reads only how the page
 * is drawn, not the image, so it answers in any PDF.js document, however opened.
 */
export const hasScan = async (page: PDFPageProxy) => (await largestImage(page)) !== undefined

/** A page's scan: its largest image, when that covers enough of the page. None for any other page. */
export async function scanOf(page: PDFPageProxy): Promise<Scan | undefined> {
  const best = await largestImage(page)
  if (!best) return undefined
  const image = await objectOf(page, best.id)
  if (!image?.data) return undefined
  const pnm = best.mask ? maskPbm(image) : imagePnm(image)
  if (!pnm) return undefined
  const widthOnPage = Math.hypot(best.transform[0], best.transform[1])
  return { pnm, width: image.width, height: image.height, transform: best.transform, dpi: Math.round((image.width / widthOnPage) * 72) }
}

const header = (magic: string, width: number, height: number, max?: number) =>
  new TextEncoder().encode(`${magic}\n${width} ${height}\n${max === undefined ? "" : `${max}\n`}`)

const concat = (head: Uint8Array, body: Uint8Array) => {
  const out = new Uint8Array(head.length + body.length)
  out.set(head)
  out.set(body, head.length)
  return out
}

/**
 * An image mask, as PDF.js decodes one: a bit a pixel, rows padded to whole bytes, 1 where the page
 * shows through (white), 0 where it is painted. PBM's bits are the other way round.
 */
function maskPbm({ width, height, data }: Decoded): Uint8Array {
  const body = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) body[i] = ~data[i]! & 0xff
  return concat(header("P4", width, height), body)
}

/** An image, as PDF.js decodes one, in one of its kinds. */
function imagePnm({ width, height, data, kind }: Decoded): Uint8Array | undefined {
  if (kind === GRAYSCALE_1BPP) {
    // A bit a pixel, rows padded to whole bytes, 1 for white: PBM's the other way round.
    const body = new Uint8Array(data.length)
    for (let i = 0; i < data.length; i++) body[i] = ~data[i]! & 0xff
    return concat(header("P4", width, height), body)
  }
  if (kind === RGB_24BPP) return concat(header("P6", width, height, 255), Uint8Array.from(data))
  if (kind === RGBA_32BPP) {
    const body = new Uint8Array(width * height * 3)
    for (let p = 0, q = 0; p < data.length; p += 4, q += 3) {
      body[q] = data[p]!
      body[q + 1] = data[p + 1]!
      body[q + 2] = data[p + 2]!
    }
    return concat(header("P6", width, height, 255), body)
  }
  return undefined
}

/** The pages to recognize: those with no text of their own and a scan. Numbered from 1. */
export async function textlessPages(pdf: PDFDocumentProxy): Promise<number[]> {
  const pages: number[] = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n)
    if (!(await hasText(page))) pages.push(n)
    page.cleanup()
  }
  return pages
}
