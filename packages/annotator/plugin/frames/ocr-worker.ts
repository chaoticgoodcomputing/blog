// A worker that recognizes scanned pages (src/ocr.ts starts it): @chaoticgoodcomputing/pdf-ocr,
// as the site runs it in Node, here in a Web Worker, as Obsidian's Node can't start worker threads.
// What differs is only how the engine is loaded: its build's script, by importScripts.
//
// Asked, in turn: `start` (the engine's script and data, PDF.js's worker), then `textless` (which
// pages to recognize) or `recognize` (some of them), each with the PDF's bytes.

import * as pdfjs from "pdfjs-dist"
import { createEngine, type Engine, recognizePages, SCAN_OPTIONS, type TesseractFactory, textlessPages } from "@chaoticgoodcomputing/pdf-ocr"

export type OcrRequest =
  | { kind: "start"; coreUrl: string; data: Uint8Array; pdfWorkerUrl: string }
  | { kind: "textless"; bytes: Uint8Array }
  | { kind: "recognize"; bytes: Uint8Array; pages: number[] }

export type OcrMessage =
  | { kind: "started" }
  | { kind: "textless"; pages: number[]; pageCount: number }
  | { kind: "page"; page: number }
  | { kind: "recognized"; results: Awaited<ReturnType<typeof recognizePages>> }
  | { kind: "failed"; error: string }

// The worker's scope, as far as it is used: the pages' DOM types have no worker's.
declare const self: {
  importScripts(...urls: string[]): void
  postMessage(message: unknown): void
  onmessage: ((event: MessageEvent<OcrRequest>) => void) | null
  TesseractCore?: TesseractFactory
}
const post = (message: OcrMessage) => self.postMessage(message)

let engine: Engine | undefined

const open = (bytes: Uint8Array) => pdfjs.getDocument({ data: bytes, ...SCAN_OPTIONS }).promise

self.onmessage = async ({ data: request }: MessageEvent<OcrRequest>) => {
  try {
    switch (request.kind) {
      case "start": {
        self.importScripts(request.coreUrl)
        if (!self.TesseractCore) throw new Error("the OCR engine did not load")
        // PDF.js's own worker, as a module worker of this one.
        pdfjs.GlobalWorkerOptions.workerPort = new Worker(request.pdfWorkerUrl, { type: "module" })
        engine = await createEngine(self.TesseractCore, request.data)
        post({ kind: "started" })
        break
      }
      case "textless": {
        const pdf = await open(request.bytes)
        post({ kind: "textless", pages: await textlessPages(pdf), pageCount: pdf.numPages })
        await pdf.destroy()
        break
      }
      case "recognize": {
        if (!engine) throw new Error("the OCR engine is not started")
        const pdf = await open(request.bytes)
        const results = await recognizePages(pdf, request.pages, engine, (page) => post({ kind: "page", page }))
        await pdf.destroy()
        post({ kind: "recognized", results })
        break
      }
    }
  } catch (error) {
    post({ kind: "failed", error: error instanceof Error ? error.message : String(error) })
  }
}
