// One annotator: the viewer page for an annotation note, framed as a `blob:` document
// (src/frame-page.ts), and the plugin's end of the port it asks over (src/protocol.ts): for the
// document, the fake service, Obsidian's rendering of comments and its styles. Where it is shown,
// and how the note is read and written, are its host's: the editor (src/editor/).

import { DocumentUnavailable } from "@chaoticgoodcomputing/annotator-documents"
import { isTextFileOf, sha256 } from "@chaoticgoodcomputing/pdf-ocr"
import type { TFile } from "obsidian"
import { blobPage, framePage, type PageOptions } from "./frame-page.ts"
import type AnnotatorPlugin from "./main.ts"
import { obsidianStyles, renderMarkdown } from "./obsidian-rendering.ts"
import { formatPageRange, PAGES_PROPERTY, parsePageRange } from "./pages.ts"
import { CONNECT, type Push, type Reply, type Request } from "./protocol.ts"
import { createService, type NoteStore, type Service } from "./service.ts"
import { addressOf, bytesOf, propertyOf, type Target, targetOf, textFileOf } from "./target.ts"

export class AnnotatorSession {
  /** What the session shows: the viewer page's frame, or why there is none, below any notice. */
  readonly element: HTMLDivElement
  private frame?: HTMLIFrameElement
  private port?: MessagePort
  /** The viewer page's `blob:` address, released when its frame goes. */
  private pageUrl?: string
  /** Counts the times the session was started, so a frame read for an earlier time is dropped. */
  private generation = 0
  /** The target and page range the session last started with, to know when the note's change them. */
  private shown?: string
  private service: Service

  constructor(
    private plugin: AnnotatorPlugin,
    readonly note: TFile,
    store: NoteStore,
  ) {
    this.element = createDiv({ cls: "annotator-session" })
    this.service = createService({ store, displayName: plugin.settings.displayName, view: plugin.viewOptions() })
    plugin.sessions.add(this)
  }

  /** The note's annotated document, as its annotation target names it now. */
  private target(): Target | undefined {
    return targetOf(this.plugin.app, this.note, this.plugin.settings.customDefaultPath)
  }

  /** Shows the annotator, from the start, at an annotation when one is named. */
  start(annotation?: string) {
    this.stop()
    this.shown = this.shownNow()
    const target = this.target()
    if (!target) {
      this.element.createEl("p", { cls: "annotator-message", text: "This note's annotation target names no document Annotator can find." })
      return
    }
    const pages = parsePageRange(propertyOf(this.plugin.app, this.note, PAGES_PROPERTY))
    void this.frameViewer(target, { annotation, pages: pages && formatPageRange(pages), version: this.plugin.filesVersion })
  }

  /**
   * Starts again when the note's properties name another target or page range than the session
   * shows. A note's properties reach Obsidian's index (and Dataview's) a moment after its text: the
   * session may have started on a new note before its target was known.
   */
  propertiesChanged() {
    if (this.shownNow() !== this.shown) this.start()
  }

  /** The note's target and page range, as they are now. */
  private shownNow() {
    const target = this.target()
    const pages = parsePageRange(propertyOf(this.plugin.app, this.note, PAGES_PROPERTY))
    return JSON.stringify([target && addressOf(target), pages && formatPageRange(pages)])
  }

  /**
   * Shows the annotator again, when it annotates the document at `address` (its annotation target,
   * as annotations name it): a copy of it was just supplied, or its text recognized.
   */
  restartFor(address: string) {
    const target = this.target()
    if (target && addressOf(target) === address) this.start()
  }

  /** Tells the pages Obsidian's styles changed (a theme, a snippet). */
  stylesChanged() {
    this.port?.postMessage({ push: "styles", styles: obsidianStyles() } satisfies Push)
  }

  /** Ends the session for good. */
  destroy() {
    this.stop()
    this.element.remove()
    this.plugin.sessions.delete(this)
  }

  private stop() {
    this.generation++
    if (this.pageUrl) URL.revokeObjectURL(this.pageUrl)
    this.pageUrl = undefined
    this.port?.close()
    this.port = undefined
    this.frame?.remove()
    this.frame = undefined
    this.element.empty()
  }

  /** Frames the viewer page, and hands it its port when it has loaded. A later start supersedes this one. */
  private async frameViewer(target: Target, options: PageOptions) {
    const generation = ++this.generation
    const html = await this.plugin.readFrame("viewer.html")
    if (generation !== this.generation) return
    this.pageUrl = blobPage(framePage(html, this.plugin.framesFolder(), options))
    const frame = this.element.createEl("iframe", { cls: "annotator-frame", attr: { src: this.pageUrl } })
    frame.addEventListener("load", () => {
      const channel = new MessageChannel()
      channel.port1.onmessage = ({ data }: MessageEvent<Request>) => this.answer(channel.port1, data, target)
      this.port = channel.port1
      // The page checks the message comes from this frame's parent.
      frame.contentWindow?.postMessage({ type: CONNECT }, "*", [channel.port2])
    })
    this.frame = frame
  }

  /** Says above the document that the web won't give it, with a way to supply it by hand. */
  private offerToSupply(error: DocumentUnavailable) {
    this.element.querySelector(".annotator-unavailable")?.remove()
    const bar = createDiv({ cls: "annotator-unavailable" })
    bar.createSpan({ text: `Annotator couldn't get this note's PDF: ${error.message}. If you have it, supply it here. ` })
    const button = bar.createEl("button", { text: "Choose the PDF…", cls: "mod-cta" })
    button.addEventListener("click", () => void this.plugin.supplyDocument(error.url))
    this.element.prepend(bar)
  }

  /**
   * Says above the document that it has scanned pages, with no text to annotate, with a way to
   * recognize their text; and, while it does, how far it has got.
   */
  private offerToRecognize(target: Target) {
    this.element.querySelector(".annotator-scanned")?.remove()
    const bar = createDiv({ cls: "annotator-unavailable annotator-scanned" })
    const message = bar.createSpan({ text: "This PDF has scanned pages, with no text to select or annotate. Annotator can recognize their text, once; for a book, it takes a minute or two. " })
    const button = bar.createEl("button", { text: "Recognize its text", cls: "mod-cta" })
    button.addEventListener("click", async () => {
      button.remove()
      const recognized = await this.plugin.recognizeText(target, (done, total) => message.setText(`Recognizing this PDF's text: ${done} of ${total} pages…`))
      if (!recognized) bar.remove()
    })
    this.element.prepend(bar)
  }

  /** The text of the document's scanned pages, from its text file, when the file is this PDF's. */
  private async textOf(target: Target, data: ArrayBuffer) {
    const saved = await this.plugin.documentStore().read(textFileOf(target))
    if (!saved) return undefined
    try {
      const file: unknown = JSON.parse(new TextDecoder().decode(saved))
      return isTextFileOf(file, await sha256(new Uint8Array(data))) ? file.pages : undefined
    } catch {
      return undefined
    }
  }

  private async answer(port: MessagePort, request: Request, target: Target) {
    const app = this.plugin.app
    const reply = (value: Extract<Reply, { ok: true }>["value"]) => port.postMessage({ id: request.id, ok: true, value } satisfies Reply)
    try {
      switch (request.kind) {
        case "document": {
          const data = await bytesOf(app, target, this.plugin.documentStore())
          const text = await this.textOf(target, data)
          port.postMessage({ id: request.id, ok: true, value: { data, url: addressOf(target), text } } satisfies Reply, [data])
          break
        }
        case "scanned":
          this.offerToRecognize(target)
          reply(null)
          break
        case "api":
          reply(await this.service(request.request))
          break
        case "markdown":
          reply({ html: await renderMarkdown(app, request.markdown, this.note.path) })
          break
        case "styles":
          reply(obsidianStyles())
          break
        case "open-link":
          // A link to the vault opens in a tab of its own, so this one keeps annotating.
          if (request.internal) await app.workspace.openLinkText(request.href, this.note.path, "tab")
          else window.open(request.href)
          reply(null)
          break
      }
    } catch (error) {
      if (error instanceof DocumentUnavailable) this.offerToSupply(error)
      else console.error("Annotator:", error)
      port.postMessage({ id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) } satisfies Reply)
    }
  }
}
