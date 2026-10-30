// Recognizing a PDF in Node: the engine loaded from its packages, and the pages shared out among
// worker threads (src/node-worker.ts), each with its own engine and its own copy of the document.

import { createRequire } from "node:module"
import { availableParallelism } from "node:os"
import { readFileSync } from "node:fs"
import { Worker } from "node:worker_threads"
import { gunzipSync } from "node:zlib"
import { BUILD_FILE, DATA_FILE, createEngine, type Engine, type TesseractFactory } from "./engine.ts"
import { shareOut } from "./index.ts"
import { SCAN_OPTIONS, textlessPages } from "./scans.ts"
import { type PageText, sha256, type TextFile, textFileOf } from "./text-file.ts"

const require = createRequire(import.meta.url)

/** The engine, as Node loads it: its build's script, and its data, unzipped. */
export function loadEngine(): Promise<Engine> {
  const factory = require(BUILD_FILE) as TesseractFactory
  return createEngine(factory, gunzipSync(readFileSync(require.resolve(DATA_FILE))))
}

/**
 * PDF.js's build for Node. It makes a DOMMatrix as it loads, for drawing, and would take one from
 * the native module @napi-rs/canvas, where it is installed for the machine. Recognizing draws
 * nothing: a bare DOMMatrix does, and nothing here needs a native module.
 */
export async function pdfjs() {
  if (!("DOMMatrix" in globalThis)) {
    ;(globalThis as { DOMMatrix?: unknown }).DOMMatrix = class DOMMatrix {
      a = 1
      b = 0
      c = 0
      d = 1
      e = 0
      f = 0
    }
  }
  return import("pdfjs-dist/legacy/build/pdf.mjs")
}

/** A PDF, opened for its scans. */
export async function openPdf(bytes: Uint8Array) {
  const { getDocument } = await pdfjs()
  // PDF.js takes the bytes it is given: a copy, so the caller's are left alone.
  return getDocument({ data: bytes.slice(), ...SCAN_OPTIONS }).promise
}

export interface RecognizeOptions {
  /** How many worker threads; by default, one for each processor. */
  workers?: number
  /** Says how far it has got: pages done, of pages to do. */
  onProgress?: (done: number, total: number) => void
}

/**
 * A PDF's text file: its scanned pages, with no text of their own, recognized. A PDF with none has
 * a text file with no pages, which says it was looked at.
 */
export async function recognizePdf(bytes: Uint8Array, options: RecognizeOptions = {}): Promise<TextFile> {
  const hash = await sha256(bytes)
  const pdf = await openPdf(bytes)
  const pageCount = pdf.numPages
  const pages = await textlessPages(pdf)
  await pdf.destroy()
  if (!pages.length) return textFileOf(hash, pageCount, [])
  let done = 0
  options.onProgress?.(done, pages.length)
  const shares = shareOut(pages, options.workers ?? availableParallelism())
  const results = await Promise.all(
    shares.map(
      (share) =>
        new Promise<[number, PageText][]>((resolve, reject) => {
          const worker = new Worker(new URL("./node-worker.ts", import.meta.url), { workerData: { bytes, pages: share } })
          worker.on("message", (message: { page?: number; results?: [number, PageText][] }) => {
            if (message.page !== undefined) options.onProgress?.(++done, pages.length)
            if (message.results) resolve(message.results)
          })
          worker.on("error", reject)
          worker.on("exit", (code) => code !== 0 && reject(new Error(`a recognizing worker stopped (${code})`)))
        }),
    ),
  )
  return textFileOf(hash, pageCount, results.flat())
}
