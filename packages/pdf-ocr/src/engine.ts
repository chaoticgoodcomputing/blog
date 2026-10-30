// Tesseract, as tesseract.js-core builds it to WebAssembly, driven directly: one pinned build and
// one pinned language, set up the same way wherever it runs. How the build is loaded is the caller's
// (src/node.ts, or a Web Worker's importScripts): the build is a script that defines its factory.

import type { Scan } from "./scans.ts"

/**
 * The engine, pinned. Its SIMD, LSTM-only build: WebAssembly SIMD is deterministic by spec, where
 * the relaxed-SIMD build, which tesseract.js would choose for itself, is allowed to differ by
 * machine. English, from the "4.0.0_best_int" data.
 */
export const ENGINE = {
  core: "tesseract.js-core@7.0.0",
  build: "tesseract-core-simd-lstm.wasm.js",
  data: "@tesseract.js-data/eng@1.0.0",
  language: "eng",
  model: "4.0.0_best_int",
  /** Page segmentation: automatic, for pages laid out as books lay them out. */
  pageSegmentation: 3,
} as const

/** Where the build and the data are in their packages. */
export const BUILD_FILE = `tesseract.js-core/${ENGINE.build}`
export const DATA_FILE = `@tesseract.js-data/eng/${ENGINE.model}/eng.traineddata.gz`

// The few parts of the Emscripten module the engine uses.
interface TessBaseAPI {
  Init(dataPath: null, language: string, oem: number): number
  SetVariable(name: string, value: string): boolean
  SetImageFile(exif: number, angle: number): number
  Recognize(monitor: null): number
  GetJSONText(): string
  End(): void
}
export interface TesseractModule {
  FS: { writeFile(path: string, data: Uint8Array | string): void; unlink(path: string): void }
  TessBaseAPI: new () => TessBaseAPI
  /** Frees an object the module made (Emscripten's WebIDL bindings). */
  destroy(object: object): void
}
/** The build's factory: what its script defines (`TesseractCore`). */
export type TesseractFactory = (options: { print?: (text: string) => void; printErr?: (text: string) => void; wasmBinary?: Uint8Array }) => Promise<TesseractModule>

/** LSTM only: the build has no other engine. */
const OEM_LSTM_ONLY = 1

/** A box in the scan's pixels, from the top left. */
export interface Box {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** A recognized line: its box, its baseline's two ends, and its words. */
export interface RecognizedLine {
  box: Box
  baseline: { x0: number; y0: number; x1: number; y1: number }
  words: { text: string; box: Box }[]
}

export interface Engine {
  /** The lines of a scan's text, in reading order. */
  recognize(scan: Scan): RecognizedLine[]
}

/** The engine, from the build's factory and the language's data (unzipped). */
export async function createEngine(factory: TesseractFactory, data: Uint8Array): Promise<Engine> {
  const module = await factory({ print: () => {}, printErr: () => {} })
  module.FS.writeFile(`/${ENGINE.language}.traineddata`, data)
  return {
    recognize(scan) {
      // A fresh engine state for each page, so that a page's text never depends on which pages were
      // recognized before it, or in which worker.
      const api = new module.TessBaseAPI()
      try {
        if (api.Init(null, ENGINE.language, OEM_LSTM_ONLY) !== 0) throw new Error("Tesseract could not start")
        api.SetVariable("tessedit_pageseg_mode", String(ENGINE.pageSegmentation))
        api.SetVariable("user_defined_dpi", String(scan.dpi))
        module.FS.writeFile("/input", scan.pnm)
        if (api.SetImageFile(1, 0) === 1) throw new Error("Tesseract could not read the scan")
        api.Recognize(null)
        return linesOf(JSON.parse(api.GetJSONText()) as TesseractJson)
      } finally {
        api.End()
        module.destroy(api)
        module.FS.unlink("/input")
      }
    },
  }
}

interface TesseractJson {
  blocks?: {
    paragraphs?: {
      lines?: {
        bbox: Box
        baseline: { x0: number; y0: number; x1: number; y1: number }
        words?: { text: string; bbox: Box }[]
      }[]
    }[]
  }[]
}

function linesOf(json: TesseractJson): RecognizedLine[] {
  const lines: RecognizedLine[] = []
  for (const block of json.blocks ?? [])
    for (const paragraph of block.paragraphs ?? [])
      for (const line of paragraph.lines ?? []) {
        const words = (line.words ?? []).map((word) => ({ text: word.text.trim(), box: word.bbox })).filter((word) => word.text !== "")
        if (words.length) lines.push({ box: line.bbox, baseline: line.baseline, words })
      }
  return lines
}
