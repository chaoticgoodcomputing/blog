// A card's comment, edited in place (src/editor/annotator.ts): a text box of the comment's Markdown
// alone, with Obsidian's notes suggested as a wikilink is typed, and Save and Cancel. The block that
// keeps the comment is never shown or edited; saving writes it again (src/comment-edit.ts).

import { AbstractInputSuggest, type App, type TFile } from "obsidian"
import { completeWikilink, wikilinkQuery } from "../comment-edit.ts"

export interface CommentEditorOptions {
  app: App
  /** The comment as it is. */
  comment: string
  /** The note the comment is in, which its links are written from. */
  sourcePath: string
  save: (comment: string) => void
  cancel: () => void
}

/** The notes of the vault, suggested while a wikilink is typed, and completed into it when chosen. */
class WikilinkSuggest extends AbstractInputSuggest<TFile> {
  constructor(
    app: App,
    private box: HTMLTextAreaElement,
    private sourcePath: string,
  ) {
    // The box is a text area: it has an input's value, which is all the suggester reads of it.
    super(app, box as unknown as HTMLInputElement)
    this.limit = 20
  }

  protected getSuggestions(): TFile[] {
    const query = wikilinkQuery(this.box.value.slice(0, this.box.selectionStart))
    if (query === null) return []
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return this.app.vault
      .getMarkdownFiles()
      .filter((file) => words.every((word) => file.path.toLowerCase().includes(word)))
      .sort((a, b) => a.basename.length - b.basename.length || a.path.localeCompare(b.path))
  }

  renderSuggestion(file: TFile, element: HTMLElement) {
    element.createDiv({ text: file.basename })
    if (file.parent && !file.parent.isRoot()) element.createDiv({ cls: "annotator-suggest-path", text: file.parent.path })
  }

  selectSuggestion(file: TFile) {
    const linktext = this.app.metadataCache.fileToLinktext(file, this.sourcePath, true)
    const { text, caret } = completeWikilink(this.box.value, this.box.selectionStart, linktext)
    this.box.value = text
    this.box.setSelectionRange(caret, caret)
    this.box.dispatchEvent(new Event("input"))
    this.close()
  }
}

/** Puts the comment's editor in `container`, in the editor's focus. */
export function openCommentEditor(container: HTMLElement, options: CommentEditorOptions) {
  const editor = container.createDiv({ cls: "annotator-web-comment-editor" })
  const box = editor.createEl("textarea", { attr: { rows: "4", "aria-label": "The annotation's comment, in Markdown" } })
  box.value = options.comment
  const fit = () => {
    box.style.height = "auto"
    box.style.height = `${box.scrollHeight + 2}px`
  }
  box.addEventListener("input", fit)
  new WikilinkSuggest(options.app, box, options.sourcePath)

  const buttons = editor.createDiv({ cls: "annotator-web-comment-buttons" })
  buttons.createEl("button", { text: "Cancel" }).addEventListener("click", () => options.cancel())
  buttons.createEl("button", { cls: "mod-cta", text: "Save" }).addEventListener("click", () => options.save(box.value))
  // Escape cancels and Mod-Enter saves, unless a suggestion list has the keys.
  box.addEventListener("keydown", (event) => {
    if (event.isComposing) return
    if (event.key === "Escape") {
      event.preventDefault()
      options.cancel()
    } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      options.save(box.value)
    }
  })
  requestAnimationFrame(() => {
    fit()
    box.focus()
    box.setSelectionRange(box.value.length, box.value.length)
  })
}
