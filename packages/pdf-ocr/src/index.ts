// Text for scanned PDFs: what runs anywhere. Recognizing pages (`recognizePages`) takes a PDF.js
// document opened with SCAN_OPTIONS and an engine; running it over workers is the caller's
// (src/node.ts for Node; the Annotator plugin's Web Workers). Reading a text file needs neither.

import type { PDFDocumentProxy } from "pdfjs-dist"
import type { Engine } from "./engine.ts"
import { scanOf } from "./scans.ts"
import { type PageText, pageTextOf } from "./text-file.ts"

export { BUILD_FILE, DATA_FILE, ENGINE, createEngine } from "./engine.ts"
export type { Engine, TesseractFactory } from "./engine.ts"
export { SCAN_OPTIONS, hasScan, hasText, scanOf, textlessPages } from "./scans.ts"
export type { Scan } from "./scans.ts"
export { FONT_NAME, FORMAT, isTextFileOf, sha256, textContentOf, textFileName, textFileOf } from "./text-file.ts"
export type { OcrTextContent, PageText, TextFile, TextItem, Word } from "./text-file.ts"

/**
 * Recognizes pages of a document, each on its own, so the result is the same whichever worker
 * recognizes which page, in whatever order. A page with no scan has no text. Says each page done.
 */
export async function recognizePages(
  pdf: PDFDocumentProxy,
  pages: number[],
  engine: Engine,
  onPage?: (page: number) => void,
): Promise<[number, PageText][]> {
  const results: [number, PageText][] = []
  for (const n of pages) {
    const page = await pdf.getPage(n)
    const scan = await scanOf(page)
    if (scan) results.push([n, pageTextOf(engine.recognize(scan), scan)])
    page.cleanup()
    onPage?.(n)
  }
  return results
}

/** Pages shared out among workers: every `count`th page to each, so long runs of hard pages are spread. */
export function shareOut(pages: number[], count: number): number[][] {
  const workers = Math.max(1, Math.min(count, pages.length))
  return Array.from({ length: workers }, (_, worker) => pages.filter((_, i) => i % workers === worker))
}
