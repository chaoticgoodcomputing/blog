// The viewer page: the annotated PDF, drawn by PDF.js's viewer components, with the Hypothesis
// client loaded into it. The client's PDF integration looks for PDF.js's viewer application, a
// `window.PDFViewerApplication`, before it starts; this page has none, so it makes one of the members
// the client reads (research-hypothesis-embedding.md, Q6), around a PDFViewer of its own.
//
// It is also the bridge between the plugin and the sidebar: the plugin answers over the port it
// hands this page (src/protocol.ts), and the sidebar, on this page's origin, calls `annotatorBridge`.

import * as pdfjs from "pdfjs-dist"
import { EventBus, PDFLinkService, PDFViewer } from "pdfjs-dist/web/pdf_viewer.mjs"
import { inPageRange, parsePageRange } from "../src/pages.ts"
import { ANNOTATION_PARAM, CONNECT, type DocumentReply, type MarkdownReply, PAGES_PARAM, type Push, type Reply, type Request, type StylesReply } from "../src/protocol.ts"
import { API_URL, AUTHORITY, GROUP_ID, type ApiRequest, type ApiResponse } from "../src/service.ts"

const here = (path: string) => new URL(path, location.href).href

pdfjs.GlobalWorkerOptions.workerSrc = here("pdfjs/build/pdf.worker.min.mjs")

// The plugin's port, once it has handed it over, and the requests waiting on it.
const port = new Promise<MessagePort>((resolve) => {
  addEventListener("message", function connect(event) {
    if (event.source !== parent || event.data?.type !== CONNECT || !event.ports[0]) return
    removeEventListener("message", connect)
    resolve(event.ports[0])
  })
})
const waiting = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>()
let next = 0
const styleListeners = new Set<(styles: StylesReply) => void>()
port.then((port) => {
  port.onmessage = ({ data }: MessageEvent<Reply | Push>) => {
    if ("push" in data) {
      for (const listener of styleListeners) listener(data.styles)
      return
    }
    const request = waiting.get(data.id)
    waiting.delete(data.id)
    if (data.ok) request?.resolve(data.value)
    else request?.reject(new Error(data.error))
  }
})

type Ask = Request extends infer R ? (R extends { id: number } ? Omit<R, "id"> : never) : never
async function ask<T>(question: Ask): Promise<T> {
  const id = next++
  const answered = new Promise<T>((resolve, reject) => waiting.set(id, { resolve: resolve as (value: unknown) => void, reject }))
  ;(await port).postMessage({ id, ...question } as Request)
  return answered
}

/** What the sidebar page calls (frames/sidebar.ts): the plugin's answers, through this page. */
export interface Bridge {
  /** The fake service. */
  api(request: ApiRequest): Promise<ApiResponse>
  /** A comment's Markdown, as Obsidian renders it in the note. */
  renderMarkdown(markdown: string): Promise<string>
  /** Obsidian's styles now, and each time they change. */
  styles(): Promise<StylesReply>
  onStyles(listener: (styles: StylesReply) => void): void
  /** Opens a link of a rendered comment in Obsidian. */
  openLink(href: string, internal: boolean): Promise<unknown>
}
const bridge: Bridge = {
  api: (request) => ask<ApiResponse>({ kind: "api", request }),
  renderMarkdown: async (markdown) => (await ask<MarkdownReply>({ kind: "markdown", markdown })).html,
  styles: () => ask<StylesReply>({ kind: "styles" }),
  onStyles: (listener) => void styleListeners.add(listener),
  openLink: (href, internal) => ask({ kind: "open-link", href, internal }),
}
;(window as any).annotatorBridge = bridge

// The page as PDF.js's own viewer lays it out, which is what the client's integration looks for:
// #outerContainer, around the scroll container #viewerContainer, around #viewer.
const outerContainer = document.getElementById("outerContainer")!
const container = document.getElementById("viewerContainer") as HTMLDivElement
const viewer = document.getElementById("viewer") as HTMLDivElement

const eventBus = new EventBus()
const linkService = new PDFLinkService({ eventBus })
const pdfViewer = new PDFViewer({ container, viewer, eventBus, linkService })
linkService.setViewer(pdfViewer)
// The pages the note names, when it names some: the rest of the document is there, for the client
// to find passages in, but not shown.
const pageRange = parsePageRange(new URL(location.href).searchParams.get(PAGES_PARAM))

eventBus.on("pagesinit", () => {
  pdfViewer.currentScaleValue = "page-width"
  if (!pageRange) return
  for (let index = 0; index < pdfViewer.pagesCount; index++) {
    pdfViewer.getPageView(index)?.div.classList.toggle("annotator-outside", !inPageRange(pageRange, index + 1))
  }
  const first = Math.min(pageRange[0]![0], pdfViewer.pagesCount)
  pdfViewer.scrollPageIntoView({ pageNumber: first })
  // PDF.js draws the pages it finds in view on scrolling and on updates. Hiding pages moves the rest
  // without either, so it is told to look again once the layout has settled, and once every page
  // has loaded.
  requestAnimationFrame(() => pdfViewer.update())
  eventBus.on("pagesloaded", () => pdfViewer.update(), { once: true })
})
addEventListener("resize", () => {
  if (["page-width", "page-fit", "auto"].includes(pdfViewer.currentScaleValue)) pdfViewer.currentScaleValue = pdfViewer.currentScaleValue
})

let documentLoaded!: (document: pdfjs.PDFDocumentProxy) => void
const loaded = new Promise<pdfjs.PDFDocumentProxy>((resolve) => (documentLoaded = resolve))

// The viewer application, as much of it as the client reads. It is ready once its document is.
const app = {
  pdfViewer,
  eventBus,
  url: "",
  appConfig: { appContainer: outerContainer },
  pdfDocument: null as pdfjs.PDFDocumentProxy | null,
  initializedPromise: loaded.then((document) => {
    app.pdfDocument = document
  }),
}
;(window as any).PDFViewerApplication = app

const annotation = new URL(location.href).searchParams.get(ANNOTATION_PARAM)

// The client's settings for the page it annotates (src/annotator/config in the client).
;(window as any).hypothesisConfig = () => ({
  services: [
    {
      apiUrl: API_URL,
      authority: AUTHORITY,
      grantToken: "local",
      groups: [GROUP_ID],
      enableShareLinks: false,
      enableShareImportExportPanel: false,
      enableAccountMenu: false,
      enableHelpPanel: false,
      allowFlagging: false,
      allowLeavingGroups: false,
    },
  ],
  openSidebar: true,
  showHighlights: "always",
})

/**
 * Loads the client into this page: its addresses as JSON, which is the only place its boot script
 * reads them, then the script. The annotation to open at goes in the JSON too, which, with the
 * page's `#annotations:` fragment, is the only place the client reads it from (its
 * src/annotator/config/settings.ts), not `hypothesisConfig`.
 */
function bootClient() {
  const config = document.createElement("script")
  config.type = "application/json"
  config.className = "js-hypothesis-config"
  config.textContent = JSON.stringify({
    ...(annotation ? { annotations: annotation } : {}),
    assetRoot: here("hypothesis/"),
    sidebarAppUrl: here("sidebar.html"),
    // Never opened (the account menu is off), but the client parses them as addresses.
    notebookAppUrl: here("sidebar.html#notebook"),
    profileAppUrl: here("sidebar.html#profile"),
  })
  const boot = document.createElement("script")
  boot.src = here("hypothesis/build/boot.js")
  document.body.append(config, boot)
}

async function open() {
  const reply = await ask<DocumentReply>({ kind: "document" })
  app.url = reply.url
  const document = await pdfjs.getDocument({
    data: new Uint8Array(reply.data),
    cMapUrl: here("pdfjs/cmaps/"),
    cMapPacked: true,
    standardFontDataUrl: here("pdfjs/standard_fonts/"),
    wasmUrl: here("pdfjs/wasm/"),
    iccUrl: here("pdfjs/iccs/"),
  }).promise
  // Ready once the viewer has made its pages: the client counts them (pdfViewer.pagesCount) to
  // decide whether the PDF has text to annotate, and would find none before.
  const pagesMade = new Promise<void>((resolve) => eventBus.on("pagesinit", () => resolve(), { once: true }))
  pdfViewer.setDocument(document)
  linkService.setDocument(document)
  await pagesMade
  documentLoaded(document)
}

bootClient()
open().catch((error) => {
  console.error("Annotator: could not open the document", error)
  const message = document.createElement("p")
  message.className = "annotator-error"
  message.textContent = `The document could not be opened: ${error instanceof Error ? error.message : error}`
  outerContainer.prepend(message)
})
