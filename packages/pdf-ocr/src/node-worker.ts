// A worker thread of src/node.ts: recognizes its share of a document's pages.

import { parentPort, workerData } from "node:worker_threads"
import { recognizePages } from "./index.ts"
import { loadEngine, openPdf } from "./node.ts"

const { bytes, pages } = workerData as { bytes: Uint8Array; pages: number[] }
const [engine, pdf] = await Promise.all([loadEngine(), openPdf(bytes)])
const results = await recognizePages(pdf, pages, engine, (page) => parentPort!.postMessage({ page }))
await pdf.destroy()
parentPort!.postMessage({ results })
