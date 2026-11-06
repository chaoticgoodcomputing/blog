// A web page's annotation note in Obsidian's editor: no annotator, since Obsidian doesn't show the
// page, so its annotations are the note's own text; and, under its properties, a bar naming the
// page, which opens it in the browser, where it is annotated (the Annotator extension).

import { type Extension, StateField } from "@codemirror/state"
import { Decoration, type DecorationSet, EditorView, WidgetType } from "@codemirror/view"
import { setIcon } from "obsidian"
import { webPageOf } from "./region.ts"

class WebBar extends WidgetType {
  constructor(private url: string) {
    super()
  }

  eq(other: WidgetType) {
    return other instanceof WebBar && other.url === this.url
  }

  toDOM() {
    const bar = createDiv({ cls: "annotator-web-bar" })
    setIcon(bar.createSpan({ cls: "annotator-web-bar-icon" }), "globe")
    let host = this.url
    try {
      host = new URL(this.url).hostname.replace(/^www\./, "")
    } catch {}
    bar.createSpan({ cls: "annotator-web-bar-host", text: host })
    const open = bar.createEl("a", { cls: "external-link", text: "Annotate in the browser", href: this.url, attr: { title: this.url } })
    open.addEventListener("click", (event) => {
      event.preventDefault()
      window.open(this.url)
    })
    return bar
  }

  // The bar's link has its clicks; the editor doesn't.
  ignoreEvent() {
    return true
  }
}

function decorationsOf(text: string): DecorationSet {
  const page = webPageOf(text)
  if (!page) return Decoration.none
  return Decoration.set([Decoration.widget({ widget: new WebBar(page.url), block: true, side: -1 }).range(page.end)])
}

const webBarField = StateField.define<DecorationSet>({
  create: (state) => decorationsOf(state.doc.toString()),
  update: (decorations, transaction) => (transaction.docChanged ? decorationsOf(transaction.state.doc.toString()) : decorations),
  provide: (field) => EditorView.decorations.from(field),
})

/** The bar of every web page's annotation note the editor opens. */
export const webNoteInEditor: Extension = webBarField
