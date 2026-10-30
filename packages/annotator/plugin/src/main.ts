// The Annotator: an annotation note opens in Obsidian's editor with its annotations shown as the
// annotated PDF and Hypothesis's own client, between its preface and its epilogue; every
// annotation is kept in the note.

import { NotAPdf, supplyDocument } from "@chaoticgoodcomputing/annotator-documents"
import type { EditorView } from "@codemirror/view"
import { around } from "monkey-around"
import { type Events, ItemView, MarkdownView, Notice, Plugin, TFile, type ViewStateResult } from "obsidian"
import { documentStore } from "./documents.ts"
import { type OcrFiles, recognizePdf } from "./ocr.ts"
import { annotatorInEditor, openAtAnnotation } from "./editor/annotator.ts"
import { folderOf } from "./frame-page.ts"
import type { AnnotatorSession } from "./session.ts"
import { type AnnotatorSettings, AnnotatorSettingTab, settingsFrom } from "./settings.ts"
import { addressOf, bytesOf, isAnnotationNote, type Target, targetOf, textFileOf } from "./target.ts"

/** The view type of upstream's annotation mode, and of this plugin's until 0.4. */
const LEGACY_VIEW_TYPE = "pdf-annotator"

export default class AnnotatorPlugin extends Plugin {
  // Obsidian's own field for a plugin's settings (Plugin.settings), typed here.
  declare settings: AnnotatorSettings

  /** The annotators open in editors. */
  readonly sessions = new Set<AnnotatorSession>()

  /** The version of the plugin's files, for the pages' addresses (src/frame-page.ts): new each time it loads. */
  readonly filesVersion = `${Date.now().toString(36)}`

  async onload() {
    this.settings = settingsFrom(await this.loadData())
    this.addSettingTab(new AnnotatorSettingTab(this.app, this))
    this.registerEditorExtension(annotatorInEditor(this))
    this.registerView(LEGACY_VIEW_TYPE, (leaf) => new LegacyAnnotationView(leaf))
    this.openLinksToAnnotationsAtThem()

    // Obsidian's styles changed (a theme, a snippet): the sidebars show comments with the new ones.
    this.registerEvent(this.app.workspace.on("css-change", () => this.sessions.forEach((session) => session.stylesChanged())))

    // A note's target or page range changed: its annotators show the new ones. Obsidian's index
    // and Dataview's each say so when they have the change.
    const propertiesChanged = (file: unknown) => {
      if (!(file instanceof TFile)) return
      for (const session of this.sessions) if (session.note.path === file.path) session.propertiesChanged()
    }
    this.registerEvent(this.app.metadataCache.on("changed", propertiesChanged))
    this.registerEvent(
      // Dataview's own event, on Obsidian's metadata cache: (kind, file, old path).
      (this.app.metadataCache as Events).on("dataview:metadata-change", (_kind: unknown, file: unknown) => propertiesChanged(file)),
    )

    this.addCommand({
      id: "recognize-text",
      name: "Recognize the text of this note's scanned PDF",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveViewOfType(MarkdownView)?.file ?? null
        const target = isAnnotationNote(this.app, file) ? targetOf(this.app, file, this.settings.customDefaultPath) : undefined
        if (!target) return false
        if (!checking) {
          const notice = new Notice("Recognizing this PDF's text…", 0)
          void this.recognizeText(target, (done, total) => notice.setMessage(`Recognizing this PDF's text: ${done} of ${total} pages…`)).finally(() => notice.hide())
        }
        return true
      },
    })

    this.addCommand({
      id: "supply-document",
      name: "Supply this note's PDF from a file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveViewOfType(MarkdownView)?.file ?? null
        const target = isAnnotationNote(this.app, file) ? targetOf(this.app, file, this.settings.customDefaultPath) : undefined
        if (target?.kind !== "url") return false
        if (!checking) void this.supplyDocument(target.url)
        return true
      },
    })
  }

  /** Documents whose text is being recognized, by address, so one isn't recognized twice at once. */
  private recognizing = new Set<string>()

  /**
   * Recognizes the text of a document's scanned pages, once, and keeps it as the document's text
   * file in the store, beside its saved copy; then shows the annotators of it again, with the text.
   * Resolves to whether it did.
   */
  async recognizeText(target: Target, onProgress?: (done: number, total: number) => void): Promise<boolean> {
    const address = addressOf(target)
    if (this.recognizing.has(address)) {
      new Notice("Annotator is already recognizing this PDF's text.")
      return false
    }
    this.recognizing.add(address)
    try {
      const store = this.documentStore()
      const bytes = new Uint8Array(await bytesOf(this.app, target, store))
      const text = await recognizePdf(bytes, await this.ocrFiles(), { onProgress })
      if (!Object.keys(text.pages).length) {
        new Notice("This PDF has no scanned pages: there is nothing to recognize.")
        return false
      }
      await store.write(textFileOf(target), new TextEncoder().encode(JSON.stringify(text)))
      new Notice(`Annotator recognized the text of ${Object.keys(text.pages).length} pages.`)
      for (const session of this.sessions) session.restartFor(address)
      return true
    } catch (error) {
      console.error("Annotator: recognizing text", error)
      new Notice(`Annotator could not recognize this PDF's text: ${error instanceof Error ? error.message : error}`)
      return false
    } finally {
      this.recognizing.delete(address)
    }
  }

  /** The OCR worker's files, from the plugin's folder (dist/ocr/, and PDF.js's worker). */
  private async ocrFiles(): Promise<OcrFiles> {
    const adapter = this.app.vault.adapter
    const dir = this.manifest.dir
    const [worker, core, data, pdfWorker] = await Promise.all([
      adapter.read(`${dir}/ocr/ocr-worker.js`),
      adapter.read(`${dir}/ocr/tesseract-core-simd-lstm.wasm.js`),
      adapter.readBinary(`${dir}/ocr/eng.traineddata`),
      adapter.read(`${dir}/frames/pdfjs/build/pdf.worker.min.mjs`),
    ])
    return { worker, core, data: new Uint8Array(data), pdfWorker }
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  /** Where saved copies of documents are kept when the setting names nowhere: the plugin's own folder. */
  defaultDocumentFolder() {
    return `${this.manifest.dir}/documents`
  }

  /** The store of documents' saved copies, in the folder the settings name. */
  documentStore() {
    return documentStore(this.app, this.settings.documentFolder || this.defaultDocumentFolder())
  }

  /**
   * Asks the user for a PDF to keep as the saved copy of the document at `url`, for when the web
   * won't give it. Restarts the annotators of it. Resolves to whether one was kept.
   */
  async supplyDocument(url: string): Promise<boolean> {
    const file = await chooseFile(".pdf,application/pdf")
    if (!file) return false
    try {
      await supplyDocument(url, new Uint8Array(await file.arrayBuffer()), this.documentStore())
    } catch (error) {
      new Notice(error instanceof NotAPdf ? `${file.name} is not a PDF.` : `Annotator could not keep ${file.name}: ${error}`)
      return false
    }
    new Notice(`Annotator will open ${file.name} for ${url}.`)
    for (const session of this.sessions) session.restartFor(url)
    return true
  }

  /** How a block's view is written, from the settings. */
  viewOptions() {
    const { includePrefix, includePostfix, highlightHighlightedText } = this.settings.annotationMarkdownSettings
    return { prefix: includePrefix, suffix: includePostfix, highlight: highlightHighlightedText }
  }

  /** The address of the plugin's folder of pages (frames/), as Obsidian serves the plugin's files. */
  framesFolder(): string {
    return folderOf(this.app.vault.adapter.getResourcePath(`${this.manifest.dir}/frames/viewer.html`))
  }

  /** One of the plugin's pages, as HTML. */
  readFrame(name: string): Promise<string> {
    return this.app.vault.adapter.read(`${this.manifest.dir}/frames/${name}`)
  }

  /**
   * A link to an annotation (`[[note#^id]]`), from anywhere, opens its note at its annotator, opened
   * at the annotation. Obsidian opens a link to a block by telling the note's view where to go (its
   * ephemeral state), so that is where the plugin hears of it.
   */
  private openLinksToAnnotationsAtThem() {
    this.register(
      around(MarkdownView.prototype, {
        setEphemeralState(next) {
          return function (this: MarkdownView, state: unknown) {
            const result = next.call(this, state)
            const subpath = (state as { subpath?: unknown } | null)?.subpath
            const editor = (this.editor as { cm?: EditorView } | undefined)?.cm
            if (typeof subpath === "string" && subpath.startsWith("#^") && editor) openAtAnnotation(editor, subpath.slice(2))
            return result
          }
        },
      }),
    )
  }
}

/**
 * Upstream's annotation mode, as a workspace saved with it names it: opens its note in the editor,
 * where the annotator is now.
 */
class LegacyAnnotationView extends ItemView {
  getViewType() {
    return LEGACY_VIEW_TYPE
  }

  getDisplayText() {
    return "Annotator"
  }

  async setState(state: unknown, result: ViewStateResult) {
    await super.setState(state, result)
    const file = (state as { file?: unknown } | null)?.file
    if (typeof file === "string") await this.leaf.setViewState({ type: "markdown", state: { file } })
  }

  // A tab whose state names no note, which can't be turned into one.
  async onOpen() {
    this.contentEl.empty()
    this.contentEl.createEl("p", {
      cls: "annotator-message",
      text: "Annotator now shows in an annotation note's own editor, between its preface and its epilogue. This tab can be closed.",
    })
  }
}

/** Asks the user for a file, as a file input does; resolves to none if they cancel. */
function chooseFile(accept: string): Promise<File | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.addEventListener("change", () => resolve(input.files?.[0]), { once: true })
    input.addEventListener("cancel", () => resolve(undefined), { once: true })
    input.click()
  })
}
