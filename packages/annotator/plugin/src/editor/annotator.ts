// The annotator in Obsidian's editor: an annotation note opens as any note, with its run of
// annotation blocks shown as the annotator, the PDF and the sidebar, between the preface above and
// the epilogue below. A web page's note, annotated in the browser, has its blocks shown as cards
// in their place instead (WebCards): the same preface and epilogue, the same blocks kept from edits.
//
// The editor shows a placeholder in the blocks' place (a block widget over the region,
// src/editor/region.ts), and the annotator itself lives in a layer of the plugin's in the editor's
// scroller, put over the placeholder wherever it is. It can't be the widget's own content: an iframe
// reloads whenever it is moved in the page, and the editor rebuilds its widgets, and drops those far
// out of view, as it pleases. The layer stays; only its place changes.

import { type Extension, RangeSet, StateField, type Text, Transaction } from "@codemirror/state"
import { Decoration, type DecorationSet, EditorView, type PluginValue, ViewPlugin, type ViewUpdate, WidgetType } from "@codemirror/view"
import { type Component, editorInfoField, type TFile } from "obsidian"
import type AnnotatorPlugin from "../main.ts"
import { AnnotatorSession } from "../session.ts"
import { parseNote } from "@chaoticgoodcomputing/annotator-format"
import { withComment } from "../comment-edit.ts"
import { type Card, cardsOf, openPassages, renderCard } from "../web-cards.ts"
import { openCommentEditor } from "./comment-editor.ts"
import { annotatorWrite, changeBetween, isWebNoteText, protectBlocks, type Region, regionField } from "./region.ts"

/** The annotator's distance from the editor's sides. */
const LAYER_MARGIN = 16

/** The annotator's height when the note has none of its own: the editor's, less a margin. */
const defaultHeight = (view: EditorView) => Math.max(360, view.scrollDOM.clientHeight - 64)

/**
 * The placeholder the editor shows in the blocks' place: where the annotator goes, and its handle
 * for resizing. It comes from the editor's state, as a block widget must, and finds its editor's
 * host when it is drawn.
 */
class Placeholder extends WidgetType {
  // Always the same: the editor keeps its element when the note changes.
  eq(other: WidgetType) {
    return other instanceof Placeholder
  }

  get estimatedHeight() {
    return 600
  }

  toDOM(view: EditorView) {
    const element = createDiv({ cls: "annotator-placeholder" })
    const host = hostOf(view)
    if (!host) return element
    element.style.height = `${host.height}px`
    const handle = element.createDiv({ cls: "annotator-resize", attr: { "aria-label": "Drag to resize the annotator" } })
    handle.addEventListener("pointerdown", (event) => host.resize(event, element))
    host.attach(element)
    return element
  }

  destroy(element: HTMLElement) {
    for (const host of liveHosts) host.detach(element)
  }

  // The editor leaves the placeholder's events alone: the annotator and the handle have them.
  ignoreEvent() {
    return true
  }
}

const placeholder = new Placeholder()

/**
 * A web page's note's annotations, in its blocks' place: a card for each, its passage as a quote
 * callout (`[!QUOTE]`) that opens it in the page, in the browser, its comment as Obsidian renders
 * Markdown, and its tags. A click on a card turns its comment into a text box of the comment alone
 * (src/editor/comment-editor.ts), wikilinks suggested; saving writes the whole block again through
 * the format (src/comment-edit.ts), so nothing of the block itself can be broken by an edit.
 */
class WebCards extends WidgetType {
  constructor(private cards: Card[]) {
    super()
  }

  eq(other: WidgetType) {
    return other instanceof WebCards && JSON.stringify(other.cards) === JSON.stringify(this.cards)
  }

  toDOM(view: EditorView) {
    const element = createDiv({ cls: "annotator-web-cards" })
    const path = view.state.field(editorInfoField, false)?.file?.path ?? ""
    if (!this.cards.length) {
      element.createDiv({ cls: "annotator-web-empty", text: "No annotations yet: highlight a passage of the page in the browser." })
      return element
    }
    if (!cardsHost) return element
    const host = cardsHost
    for (const card of this.cards) {
      const { article, slot } = renderCard(element, card, { app: host.app, component: host.component, sourcePath: path })
      // A click on the card, but on a link or the passage's box, edits its comment.
      article.addEventListener("click", (event) => {
        if ((event.target as HTMLElement).closest("a, button, textarea, [data-passage]")) return
        if (article.hasClass("is-editing")) return
        event.preventDefault()
        article.addClass("is-editing")
        const close = () => {
          article.removeClass("is-editing")
          slot.querySelector(".annotator-web-comment-editor")?.remove()
        }
        openCommentEditor(slot, {
          app: host.app,
          comment: card.text ?? "",
          sourcePath: path,
          cancel: close,
          save: (text) => {
            const before = view.state.doc.toString()
            const changes = changeBetween(before, withComment(before, card.id, text, new Date().toISOString(), host.viewOptions()))
            // The plugin's own write, past the blocks' protection; out of the undo history, which
            // the protection would refuse to undo.
            if (changes) view.dispatch({ changes, filter: false, annotations: [annotatorWrite.of(true), Transaction.addToHistory.of(false)] })
            close()
          },
        })
      })
    }
    openPassages(element)
    // The comments' links, which the editor would follow in its own text, are followed here.
    element.addEventListener("click", (event) => {
      const link = (event.target as HTMLElement).closest("a")
      if (!link || !cardsHost) return
      event.preventDefault()
      const href = link.getAttribute("data-href") ?? link.getAttribute("href") ?? ""
      if (link.hasClass("internal-link")) void cardsHost.app.workspace.openLinkText(href, path, event.metaKey || event.ctrlKey)
      else if (href) window.open(href)
    })
    return element
  }

  get estimatedHeight() {
    return 120 * Math.max(1, this.cards.length)
  }

  // The cards' links have their clicks; the editor doesn't.
  ignoreEvent() {
    return true
  }
}

/**
 * What the cards render their comments with: the plugin's app, and the plugin, which owns what they
 * render; and how the plugin writes a block's view.
 */
let cardsHost: { app: AnnotatorPlugin["app"]; component: Component; viewOptions: () => ReturnType<AnnotatorPlugin["viewOptions"]> } | undefined

/** Hosts one editor's annotator: its session, its layer, and the placeholder it follows. */
class AnnotatorHost implements PluginValue {
  private session?: AnnotatorSession
  private layer?: HTMLDivElement
  private placeholder?: HTMLElement
  private observer = new ResizeObserver(() => this.place())
  private file?: TFile
  height: number

  constructor(
    private view: EditorView,
    private plugin: AnnotatorPlugin,
  ) {
    this.height = defaultHeight(view)
    this.observer.observe(view.scrollDOM)
    liveHosts.add(this)
    this.sync()
  }

  update(update: ViewUpdate) {
    this.sync()
    if (update.geometryChanged || update.viewportChanged || update.docChanged) this.place()
  }

  destroy() {
    liveHosts.delete(this)
    this.observer.disconnect()
    this.end()
  }

  /** Starts or ends the session as the editor's note is, or isn't, an annotation note, or is another note. */
  private sync() {
    const file = this.view.state.field(editorInfoField, false)?.file ?? undefined
    const region = this.view.state.field(regionField, false)
    // A web page's note has cards, not the annotator: Obsidian doesn't show the page.
    if (!file || !region || isWebNoteText(this.view.state.doc.toString())) return this.end()
    if (this.session && this.file === file) return
    this.end()
    this.file = file
    this.height = this.plugin.settings.annotatorHeights[file.path] ?? defaultHeight(this.view)
    this.session = new AnnotatorSession(this.plugin, file, {
      read: async () => this.view.state.doc.toString(),
      update: async (change) => this.write(change),
    })
    this.layer = createDiv({ cls: "annotator-layer" })
    this.layer.append(this.session.element)
    this.view.scrollDOM.append(this.layer)
    this.view.scrollDOM.addClass("annotator-scroller")
    this.session.start()
    hosts.set(this.session, this)
    this.place()
  }

  private end() {
    if (this.session) hosts.delete(this.session)
    this.session?.destroy()
    this.session = undefined
    this.layer?.remove()
    this.layer = undefined
    this.file = undefined
    this.view.scrollDOM.removeClass("annotator-scroller")
  }

  /**
   * Writes the fake service's change to the note through the editor, so the note on screen and on
   * disk are one, past the blocks' protection and out of the undo history: undoing an edit of the
   * preface never undoes an annotation.
   */
  private write(change: (note: string) => string) {
    const before = this.view.state.doc.toString()
    const changes = changeBetween(before, change(before))
    if (!changes) return
    this.view.dispatch({ changes, filter: false, annotations: [annotatorWrite.of(true), Transaction.addToHistory.of(false)] })
  }

  attach(placeholder: HTMLElement) {
    this.placeholder = placeholder
    this.observer.observe(placeholder)
    this.place()
  }

  detach(placeholder: HTMLElement) {
    this.observer.unobserve(placeholder)
    if (this.placeholder === placeholder) this.placeholder = undefined
  }

  /** Puts the layer over the placeholder: in the scroller's own coordinates, so it scrolls with the note. */
  place() {
    const { layer, placeholder } = this
    if (!layer) return
    // Out of the editor's drawn part, the placeholder is gone; the layer stays where it last was,
    // out of view with it, and keeps the annotator loaded.
    if (!placeholder?.isConnected) return
    const scroller = this.view.scrollDOM
    const box = placeholder.getBoundingClientRect()
    const frame = scroller.getBoundingClientRect()
    // As high as the placeholder, where it is; as wide as the editor, whatever the note's line
    // width: a PDF and a sidebar need more than a line of text.
    layer.style.top = `${box.top - frame.top + scroller.scrollTop}px`
    layer.style.left = `${LAYER_MARGIN + scroller.scrollLeft}px`
    layer.style.width = `${scroller.clientWidth - 2 * LAYER_MARGIN}px`
    layer.style.height = `${box.height}px`
  }

  /** Resizes the annotator by its handle, and keeps the height for the note. */
  resize(start: PointerEvent, placeholder: HTMLElement) {
    start.preventDefault()
    const handle = start.currentTarget as HTMLElement
    handle.setPointerCapture(start.pointerId)
    const from = this.height
    // While dragging, the annotator's frame mustn't take the pointer.
    this.layer?.addClass("is-resizing")
    const move = (event: PointerEvent) => {
      this.height = Math.max(200, Math.round(from + event.clientY - start.clientY))
      placeholder.style.height = `${this.height}px`
      this.place()
    }
    const end = () => {
      handle.removeEventListener("pointermove", move)
      this.layer?.removeClass("is-resizing")
      this.view.requestMeasure()
      if (this.file) {
        this.plugin.settings.annotatorHeights[this.file.path] = this.height
        void this.plugin.saveSettings()
      }
    }
    handle.addEventListener("pointermove", move)
    handle.addEventListener("pointerup", end, { once: true })
    handle.addEventListener("pointercancel", end, { once: true })
  }

  /** Scrolls to the annotator, and starts it again at an annotation, when the note has it. */
  openAt(id: string): boolean {
    if (!this.session || !parseNote(this.view.state.doc.toString()).blocks.some((block) => block.id === id)) return false
    this.session.start(id)
    // After the editor's own scrolling to the block, which ends in the annotator's place anyway.
    requestAnimationFrame(() => this.reveal())
    return true
  }

  /** Scrolls the editor to the annotator. */
  reveal() {
    const region = this.view.state.field(regionField, false)
    if (region) this.view.dispatch({ effects: EditorView.scrollIntoView(region.from, { y: "start", yMargin: 24 }) })
  }
}

/** Each session's host. */
const hosts = new WeakMap<AnnotatorSession, AnnotatorHost>()

/**
 * Opens an editor's annotator at an annotation, when the editor has one and the note has the
 * annotation: scrolls to the annotator, and starts it again at the annotation. Says whether it did.
 */
export function openAtAnnotation(view: EditorView, id: string): boolean {
  const host = hostOf(view)
  return host ? host.openAt(id) : false
}

/**
 * The placeholder over the region: replacing the blocks, or, with none, at the note's end. A web
 * page's note has its cards there instead.
 */
function decorationsOf(region: Region | null, doc: Text): DecorationSet {
  if (!region) return Decoration.none
  const text = doc.toString()
  const widget = isWebNoteText(text) ? new WebCards(cardsOf(text)) : placeholder
  if (region.from === region.to) return Decoration.set([Decoration.widget({ widget, block: true, side: 1 }).range(doc.length)])
  return Decoration.set([Decoration.replace({ widget, block: true }).range(region.from, region.to)])
}

/** The placeholder, as editor state: block widgets can come from nowhere else. */
const placeholderField = StateField.define<DecorationSet>({
  create: (state) => decorationsOf(state.field(regionField, false) ?? null, state.doc),
  update: (decorations, transaction) => (transaction.docChanged ? decorationsOf(transaction.state.field(regionField, false) ?? null, transaction.state.doc) : decorations),
  provide: (field) => EditorView.decorations.from(field),
})

/** The editors' hosts, live, and the plugin that makes them. */
const liveHosts = new Set<AnnotatorHost>()
let hostPlugin: ViewPlugin<AnnotatorHost> | undefined
const hostOf = (view: EditorView) => (hostPlugin ? view.plugin(hostPlugin) : null)

/** The annotator in the editor, for every annotation note it opens. */
export function annotatorInEditor(plugin: AnnotatorPlugin): Extension {
  hostPlugin = ViewPlugin.define((view) => new AnnotatorHost(view, plugin))
  cardsHost = { app: plugin.app, component: plugin, viewOptions: () => plugin.viewOptions() }
  return [
    regionField,
    placeholderField,
    protectBlocks,
    hostPlugin,
    // The cursor steps over the annotator, as over one character.
    EditorView.atomicRanges.of((view) => {
      const region = view.state.field(regionField, false)
      return region && region.from !== region.to ? RangeSet.of([Decoration.replace({}).range(region.from, region.to)]) : RangeSet.empty
    }),
  ]
}
