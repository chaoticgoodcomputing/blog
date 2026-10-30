// Recognizing a scanned PDF's text in Obsidian (@chaoticgoodcomputing/pdf-ocr): in Web Workers
// (frames/ocr-worker.ts), each with its own engine, sharing out the pages as the site's Node
// workers do, so the text file is the one the site makes of the same PDF.

import { shareOut, sha256, type TextFile, textFileOf } from "@chaoticgoodcomputing/pdf-ocr"
import type { OcrMessage, OcrRequest } from "../frames/ocr-worker.ts"

/** The worker's files, as their contents: workers start only from `blob:` addresses of the window's own origin. */
export interface OcrFiles {
  /** The worker's script (dist/ocr/ocr-worker.js). */
  worker: string
  /** The engine's build (dist/ocr/tesseract-core-simd-lstm.wasm.js). */
  core: string
  /** The language's data, unzipped (dist/ocr/eng.traineddata). */
  data: Uint8Array
  /** PDF.js's worker (dist/frames/pdfjs/build/pdf.worker.min.mjs). */
  pdfWorker: string
}

export interface RecognizeOptions {
  /** How many workers: by default, one for each processor but one, and no more than four. */
  workers?: number
  /** Pages done, of pages to do. */
  onProgress?: (done: number, total: number) => void
  /** Stops recognizing: the promise rejects. */
  signal?: AbortSignal
}

const scriptUrl = (source: string) => URL.createObjectURL(new Blob([source], { type: "text/javascript" }))

/** One worker, and its replies, in order. */
class OcrWorker {
  private worker: Worker
  private listeners = new Set<(message: OcrMessage) => void>()

  constructor(url: string) {
    this.worker = new Worker(url)
    this.worker.onmessage = ({ data }: MessageEvent<OcrMessage>) => this.listeners.forEach((listener) => listener(data))
    this.worker.onerror = (event) => this.listeners.forEach((listener) => listener({ kind: "failed", error: event.message || "the OCR worker failed" }))
  }

  /** Asks, and waits for the reply of `kind`, hearing every page done on the way. */
  ask<K extends OcrMessage["kind"]>(request: OcrRequest, kind: K, onPage?: () => void): Promise<Extract<OcrMessage, { kind: K }>> {
    return new Promise((resolve, reject) => {
      const listener = (message: OcrMessage) => {
        if (message.kind === "page") return onPage?.()
        this.listeners.delete(listener)
        if (message.kind === kind) resolve(message as Extract<OcrMessage, { kind: K }>)
        else reject(new Error(message.kind === "failed" ? message.error : `unexpected ${message.kind}`))
      }
      this.listeners.add(listener)
      this.worker.postMessage(request)
    })
  }

  terminate() {
    this.worker.terminate()
  }
}

/** A PDF's text file, its scanned pages recognized: none, when it has none. */
export async function recognizePdf(bytes: Uint8Array, files: OcrFiles, options: RecognizeOptions = {}): Promise<TextFile> {
  const urls = [scriptUrl(files.worker), scriptUrl(files.core), scriptUrl(files.pdfWorker)] as const
  const [workerUrl, coreUrl, pdfWorkerUrl] = urls
  const workers: OcrWorker[] = []
  const stop = () => workers.forEach((worker) => worker.terminate())
  const aborted = new Promise<never>((_, reject) => {
    if (options.signal?.aborted) reject(new Error("stopped"))
    options.signal?.addEventListener("abort", () => reject(new Error("stopped")), { once: true })
  })
  aborted.catch(() => {})
  const start = async () => {
    const worker = new OcrWorker(workerUrl)
    workers.push(worker)
    await worker.ask({ kind: "start", coreUrl, data: files.data, pdfWorkerUrl }, "started")
    return worker
  }
  try {
    return await Promise.race([
      aborted,
      (async () => {
        const hash = await sha256(bytes)
        const first = await start()
        const { pages, pageCount } = await first.ask({ kind: "textless", bytes }, "textless")
        if (!pages.length) return textFileOf(hash, pageCount, [])
        const count = options.workers ?? Math.min(4, Math.max(1, navigator.hardwareConcurrency - 1))
        const shares = shareOut(pages, count)
        const all = [first, ...(await Promise.all(shares.slice(1).map(() => start())))]
        let done = 0
        options.onProgress?.(done, pages.length)
        const results = await Promise.all(
          shares.map((share, i) => all[i]!.ask({ kind: "recognize", bytes, pages: share }, "recognized", () => options.onProgress?.(++done, pages.length))),
        )
        return textFileOf(hash, pageCount, results.flatMap((reply) => reply.results))
      })(),
    ])
  } finally {
    stop()
    urls.forEach((url) => URL.revokeObjectURL(url))
  }
}
