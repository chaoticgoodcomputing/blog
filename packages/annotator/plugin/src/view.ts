// Annotation mode: an annotation note shown as its annotated document, with the sidebar beside it.
// The view is a frame holding the viewer page, which the plugin serves from its own folder
// (frames/), and the end of the port the page asks over (src/protocol.ts): for the document, and for
// the fake service, which reads and writes the note.

import { DocumentUnavailable } from "@chaoticgoodcomputing/annotator-documents"
import { FileView, type TFile, type ViewStateResult, type WorkspaceLeaf } from "obsidian"
import type AnnotatorPlugin from "./main.ts"
import { formatPageRange, PAGES_PROPERTY, parsePageRange } from "./pages.ts"
import { ANNOTATION_PARAM, CONNECT, PAGES_PARAM, type Reply, type Request } from "./protocol.ts"
import { createService, type Service } from "./service.ts"
import { addressOf, bytesOf, propertyOf, type Target, targetOf } from "./target.ts"

/** The view's type. Upstream's, so that workspaces saved with upstream's view open in this one. */
export const VIEW_TYPE = "pdf-annotator"

export class AnnotationView extends FileView {
  private frame?: HTMLIFrameElement
  private port?: MessagePort
  /** The annotation to open at, from the view's state; once opened, it is forgotten. */
  private annotation?: string

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: AnnotatorPlugin,
  ) {
    super(leaf)
  }

  getViewType() {
    return VIEW_TYPE
  }

  getDisplayText() {
    return this.file?.basename ?? "Annotator"
  }

  getIcon() {
    return "highlighter"
  }

  canAcceptExtension() {
    return false
  }

  async setState(state: unknown, result: ViewStateResult) {
    const annotation = (state as { annotation?: unknown } | null)?.annotation
    const reopen = typeof annotation === "string" && annotation !== this.annotation && this.file
    this.annotation = typeof annotation === "string" ? annotation : undefined
    await super.setState(state, result)
    // Already showing this note: open it again at the annotation.
    if (reopen && this.file) this.show(this.file)
  }

  async onLoadFile(file: TFile) {
    this.show(file)
  }

  async onUnloadFile() {
    this.close()
  }

  async onClose() {
    this.close()
  }

  /** Opens the view again, when it annotates the document at `url`: a copy of it has just been supplied. */
  reopenFor(url: string) {
    const target = this.file && targetOf(this.app, this.file, this.plugin.settings.customDefaultPath)
    if (this.file && target?.kind === "url" && target.url === url) this.show(this.file)
  }

  private close() {
    this.port?.close()
    this.port = undefined
    this.frame?.remove()
    this.frame = undefined
    this.contentEl.empty()
  }

  private show(note: TFile) {
    this.close()
    const target = targetOf(this.app, note, this.plugin.settings.customDefaultPath)
    if (!target) {
      this.contentEl.createEl("p", { cls: "annotator-message", text: "This note's annotation target names no document Annotator can find." })
      return
    }

    const service = createService({
      store: {
        read: () => this.app.vault.read(note),
        update: async (change) => {
          await this.app.vault.process(note, change)
        },
      },
      displayName: this.plugin.settings.displayName,
      view: this.plugin.viewOptions(),
    })

    const page = new URL(this.plugin.framePage("viewer.html"))
    if (this.annotation) page.searchParams.set(ANNOTATION_PARAM, this.annotation)
    const pages = parsePageRange(propertyOf(this.app, note, PAGES_PROPERTY))
    if (pages) page.searchParams.set(PAGES_PARAM, formatPageRange(pages))
    this.annotation = undefined

    this.contentEl.addClass("annotator-view")
    const frame = this.contentEl.createEl("iframe", { cls: "annotator-frame", attr: { src: page.href } })
    frame.addEventListener("load", () => {
      const channel = new MessageChannel()
      channel.port1.onmessage = ({ data }: MessageEvent<Request>) => this.answer(channel.port1, data, target, service)
      this.port = channel.port1
      // The page checks the message comes from this frame's parent. Its origin is Obsidian's own
      // for the plugin's folder, and not one to name here.
      frame.contentWindow?.postMessage({ type: CONNECT }, "*", [channel.port2])
    })
    this.frame = frame
  }

  /** Says above the document that the web won't give it, with a way to supply it by hand. */
  private offerToSupply(error: DocumentUnavailable) {
    this.contentEl.querySelector(".annotator-unavailable")?.remove()
    const bar = createDiv({ cls: "annotator-unavailable" })
    bar.createSpan({ text: `Annotator couldn't get this note's PDF: ${error.message}. If you have it, supply it here. ` })
    const button = bar.createEl("button", { text: "Choose the PDF…", cls: "mod-cta" })
    button.addEventListener("click", () => void this.plugin.supplyDocument(error.url))
    this.contentEl.prepend(bar)
  }

  private async answer(port: MessagePort, request: Request, target: Target, service: Service) {
    try {
      if (request.kind === "document") {
        const data = await bytesOf(this.app, target, this.plugin.documentStore())
        port.postMessage({ id: request.id, ok: true, value: { data, url: addressOf(target) } } satisfies Reply, [data])
      } else {
        port.postMessage({ id: request.id, ok: true, value: await service(request.request) } satisfies Reply)
      }
    } catch (error) {
      if (error instanceof DocumentUnavailable) this.offerToSupply(error)
      else console.error("Annotator:", error)
      port.postMessage({ id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) } satisfies Reply)
    }
  }
}
