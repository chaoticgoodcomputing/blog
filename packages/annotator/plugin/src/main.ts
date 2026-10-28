// The Annotator: annotation notes opened as their annotated PDF, annotated with Hypothesis's own
// client, every annotation kept in the note.

import { around } from "monkey-around"
import { type MarkdownPostProcessorContext, MarkdownView, parseLinktext, Plugin, TFile, type ViewState, WorkspaceLeaf } from "obsidian"
import { type AnnotatorSettings, AnnotatorSettingTab, settingsFrom } from "./settings.ts"
import { isAnnotationNote } from "./target.ts"
import { AnnotationView, VIEW_TYPE } from "./view.ts"

export default class AnnotatorPlugin extends Plugin {
  // Obsidian's own field for a plugin's settings (Plugin.settings), typed here.
  declare settings: AnnotatorSettings

  /** Leaves (or note paths) the user switched to Markdown, which stay Markdown until closed. */
  private markdownLeaves = new Set<string>()

  async onload() {
    this.settings = settingsFrom(await this.loadData())
    this.registerView(VIEW_TYPE, (leaf) => new AnnotationView(leaf, this))
    this.addSettingTab(new AnnotatorSettingTab(this.app, this))
    this.openAnnotationNotesInAnnotationMode()
    this.registerMarkdownPostProcessor((el, ctx) => this.openLinksToAnnotations(el, ctx))

    this.addCommand({
      id: "toggle-annotation-mode",
      name: "Toggle annotation mode",
      checkCallback: (checking) => {
        const leaf = this.app.workspace.getMostRecentLeaf()
        const view = leaf?.view
        const annotating = view instanceof AnnotationView
        const file = annotating || view instanceof MarkdownView ? view.file : null
        if (!leaf || !isAnnotationNote(this.app, file)) return false
        if (!checking) void (annotating ? this.showAsMarkdown(leaf) : this.showAnnotating(leaf, file))
        return true
      },
    })

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file, _source, leaf) => {
        if (!(leaf?.view instanceof MarkdownView) || !isAnnotationNote(this.app, file instanceof TFile ? file : null)) return
        menu.addItem((item) => item.setTitle("Annotate").setIcon("highlighter").onClick(() => this.showAnnotating(leaf, file as TFile)))
      }),
    )
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  /** How a block's view is written, from the settings. */
  viewOptions() {
    const { includePrefix, includePostfix, highlightHighlightedText } = this.settings.annotationMarkdownSettings
    return { prefix: includePrefix, suffix: includePostfix, highlight: highlightHighlightedText }
  }

  /** The address of one of the plugin's pages (frames/), as Obsidian serves files of the plugin's folder. */
  framePage(name: string): string {
    return this.app.vault.adapter.getResourcePath(`${this.manifest.dir}/frames/${name}`)
  }

  /** Opens a note in annotation mode, at an annotation when one is named. */
  async showAnnotating(leaf: WorkspaceLeaf, file: TFile, annotation?: string) {
    this.markdownLeaves.delete(leafKey(leaf, file.path))
    await leaf.setViewState({ type: VIEW_TYPE, state: { file: file.path, ...(annotation ? { annotation } : {}) }, active: true })
  }

  async showAsMarkdown(leaf: WorkspaceLeaf) {
    const file = (leaf.view as AnnotationView).file
    if (file) this.markdownLeaves.add(leafKey(leaf, file.path))
    await leaf.setViewState({ type: "markdown", state: leaf.view.getState(), active: true })
  }

  /** Opening an annotation note as Markdown opens it in annotation mode instead, unless the setting is off or the user chose Markdown for it. */
  private openAnnotationNotesInAnnotationMode() {
    const plugin = this
    this.register(
      around(WorkspaceLeaf.prototype, {
        setViewState(next) {
          return function (this: WorkspaceLeaf, state: ViewState, eState?: unknown) {
            const path = typeof state.state?.file === "string" ? state.state.file : undefined
            if (state.type === "markdown" && path && plugin.settings.annotationMarkdownSettings.annotationModeByDefault && !plugin.markdownLeaves.has(leafKey(this, path))) {
              const file = plugin.app.vault.getAbstractFileByPath(path)
              if (isAnnotationNote(plugin.app, file instanceof TFile ? file : null)) {
                return next.call(this, { ...state, type: VIEW_TYPE }, eState)
              }
            }
            return next.call(this, state, eState)
          }
        },
        detach(next) {
          return function (this: WorkspaceLeaf) {
            const path = (this.view as { file?: TFile } | undefined)?.file?.path
            if (path) plugin.markdownLeaves.delete(leafKey(this, path))
            return next.apply(this)
          }
        },
      }),
    )
  }

  /** A link to an annotation (`[[note#^id]]`, a block's own "show annotation") opens its note in annotation mode, at it. */
  private openLinksToAnnotations(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    for (const link of Array.from(el.querySelectorAll<HTMLAnchorElement>("a.internal-link"))) {
      const href = link.getAttribute("data-href") ?? link.getAttribute("href")
      if (!href) continue
      const { path, subpath } = parseLinktext(href)
      if (!subpath.startsWith("#^")) continue
      const file = path ? this.app.metadataCache.getFirstLinkpathDest(path, ctx.sourcePath) : this.app.vault.getAbstractFileByPath(ctx.sourcePath)
      if (!isAnnotationNote(this.app, file instanceof TFile ? file : null)) continue
      link.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()
        const leaf = this.app.workspace.getLeaf(event.ctrlKey || event.metaKey ? "tab" : false)
        void this.showAnnotating(leaf, file as TFile, subpath.slice(2))
      }, { capture: true })
    }
  }
}

/** A leaf's key in markdownLeaves: its id, where Obsidian gives one, else the note's path. */
const leafKey = (leaf: WorkspaceLeaf, path: string) => (leaf as { id?: string }).id ?? path
