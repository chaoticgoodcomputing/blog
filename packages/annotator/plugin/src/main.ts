// The Annotator: an annotation note opens in Obsidian's editor with its annotations shown as the
// annotated PDF and Hypothesis's own client, between its preface and its epilogue; every
// annotation is kept in the note.

import { NotAPdf, supplyDocument } from "@chaoticgoodcomputing/annotator-documents"
import type { EditorView } from "@codemirror/view"
import { around } from "monkey-around"
import { ItemView, MarkdownView, Notice, Plugin, type ViewStateResult } from "obsidian"
import { documentStore } from "./documents.ts"
import { annotatorInEditor, openAtAnnotation } from "./editor/annotator.ts"
import { folderOf } from "./frame-page.ts"
import type { AnnotatorSession } from "./session.ts"
import { type AnnotatorSettings, AnnotatorSettingTab, settingsFrom } from "./settings.ts"
import { isAnnotationNote, targetOf } from "./target.ts"

/** The view type of upstream's annotation mode, and of this plugin's until 0.4. */
const LEGACY_VIEW_TYPE = "pdf-annotator"

export default class AnnotatorPlugin extends Plugin {
  // Obsidian's own field for a plugin's settings (Plugin.settings), typed here.
  declare settings: AnnotatorSettings

  /** The annotators open in editors. */
  readonly sessions = new Set<AnnotatorSession>()

  async onload() {
    this.settings = settingsFrom(await this.loadData())
    this.addSettingTab(new AnnotatorSettingTab(this.app, this))
    this.registerEditorExtension(annotatorInEditor(this))
    this.registerView(LEGACY_VIEW_TYPE, (leaf) => new LegacyAnnotationView(leaf))
    this.openLinksToAnnotationsAtThem()

    // Obsidian's styles changed (a theme, a snippet): the sidebars show comments with the new ones.
    this.registerEvent(this.app.workspace.on("css-change", () => this.sessions.forEach((session) => session.stylesChanged())))

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
