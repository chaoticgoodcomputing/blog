// The end-to-end suite's stand-in for Obsidian: what src/view.ts does, on a plain page. It frames
// the viewer page, hands it its port, and answers it with the fixture PDF and the fake service over
// a note kept in memory, which the tests read back as `window.harness.note`.

import { blobPage, framePage } from "../../src/frame-page.ts"
import { CONNECT, type Reply, type Request } from "../../src/protocol.ts"
import { createService } from "../../src/service.ts"
import { recognizePdf } from "../../src/ocr.ts"
import type { TextFile } from "@chaoticgoodcomputing/pdf-ocr"

const params = new URL(location.href).searchParams
const TARGET = "https://example.org/fixture.pdf"

const harness = {
  /** The annotation note, as the fake service last wrote it. */
  note: params.get("note") ?? `---\nannotation-target: ${TARGET}\n---\n\nA preface.\n`,
  /** Every request the viewer page made, for the tests to look at. */
  requests: [] as Request[],
  /** The links of rendered comments the user followed. */
  links: [] as { href: string; internal: boolean }[],
  /** The text file the plugin's OCR made, when the viewer said its PDF has no text. */
  textFile: undefined as TextFile | undefined,
  /** Pages recognized, as the progress said. */
  progress: [] as [number, number][],
}

/** The PDF: the plugin's fixture, or, with `?fixture=scanned`, pdf-ocr's scanned one. */
const PDF = params.get("fixture") === "scanned" ? "/scanned.pdf" : "/fixture.pdf"
const files = `${location.protocol}//127.0.0.1:${location.port}`

/** Recognizes the PDF's text as the plugin does (src/ocr.ts), and shows it again with the text. */
async function recognize() {
  const read = async (path: string) => (await fetch(`${files}${path}`)).text()
  const [worker, core, data, pdfWorker] = await Promise.all([
    read("/ocr/ocr-worker.js"),
    read("/ocr/tesseract-core-simd-lstm.wasm.js"),
    fetch(`${files}/ocr/eng.traineddata`).then(async (response) => new Uint8Array(await response.arrayBuffer())),
    read("/frames/pdfjs/build/pdf.worker.min.mjs"),
  ])
  const bytes = new Uint8Array(await (await fetch(PDF)).arrayBuffer())
  harness.textFile = await recognizePdf(bytes, { worker, core, data, pdfWorker }, { workers: 2, onProgress: (done, total) => harness.progress.push([done, total]) })
  document.querySelector("iframe")?.remove()
  void frameViewer()
}

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (character) => `&#${character.charCodeAt(0)};`)

/** Obsidian's renderer, as far as the suite needs it: paragraphs, bold, and wikilinks as Obsidian writes them. */
const renderMarkdown = (markdown: string) =>
  markdown
    .split(/\n\n+/)
    .map((paragraph) => {
      const html = escapeHtml(paragraph)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => `<a class="internal-link" data-href="${target}" href="${target}">${alias ?? target}</a>`)
      return `<p>${html}</p>`
    })
    .join("")

/** Obsidian's styles, as far as the suite needs them: a variable of its theme, and a rule using it. */
const STYLES = { css: ":host { --text-accent: rgb(1, 2, 3); }\n.internal-link { color: var(--text-accent); }\n", fonts: "" }
;(window as any).harness = harness

const service = createService({
  store: {
    read: async () => harness.note,
    update: async (change) => {
      harness.note = change(harness.note)
    },
  },
  displayName: "Tester",
})

async function frameViewer() {
  // As the plugin frames it (src/view.ts): a `blob:` document whose `<base>` is the folder of pages,
  // opened with the annotation and the page range the harness's own address names.
  const frame = document.createElement("iframe")
  const html = await (await fetch("/frames/viewer.html")).text()
  frame.src = blobPage(framePage(html, `${location.protocol}//127.0.0.1:${location.port}/frames/`, { annotation: params.get("annotation") ?? undefined, pages: params.get("pages") ?? undefined }))
  frame.addEventListener("load", () => {
    const channel = new MessageChannel()
    const port = channel.port1
    port.onmessage = async ({ data }: MessageEvent<Request>) => {
      harness.requests.push(data)
      try {
        const reply = (value: Extract<Reply, { ok: true }>["value"]) => port.postMessage({ id: data.id, ok: true, value } satisfies Reply)
        switch (data.kind) {
          case "document": {
            const bytes = await (await fetch(PDF)).arrayBuffer()
            port.postMessage({ id: data.id, ok: true, value: { data: bytes, url: TARGET, text: harness.textFile?.pages } } satisfies Reply, [bytes])
            break
          }
          case "scanned":
            reply(null)
            void recognize()
            break
          case "api":
            reply(await service(data.request))
            break
          case "markdown":
            reply({ html: renderMarkdown(data.markdown) })
            break
          case "styles":
            reply(STYLES)
            break
          case "open-link":
            harness.links.push({ href: data.href, internal: data.internal })
            reply(null)
            break
        }
      } catch (error) {
        port.postMessage({ id: data.id, ok: false, error: String(error) } satisfies Reply)
      }
    }
    frame.contentWindow!.postMessage({ type: CONNECT }, "*", [channel.port2])
  })
  document.body.append(frame)
}

void frameViewer()
