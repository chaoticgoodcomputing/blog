// Live Preview: an MDX note's imports and components as code blocks. Away from the cursor, each is
// a highlighted `jsx` code block, rendered as Reading view renders one, in place of the empty embed
// Obsidian makes of a component; a click on it puts the cursor in it. With the cursor in it, its
// lines are styled as a code block's, and edited as text. Source mode is left alone.

import { type EditorState, type Extension, Prec, StateField } from "@codemirror/state"
import { Decoration, type DecorationSet, EditorView, WidgetType } from "@codemirror/view"
import { type App, Component, MarkdownRenderer, editorInfoField, editorLivePreviewField } from "obsidian"
import { EXTENSIONS } from "./extensions.ts"
import { type MdxBlock, asCodeBlock, findMdxBlocks } from "./mdx-blocks.ts"

class CodeBlockWidget extends WidgetType {
  private component: Component | null = null

  constructor(
    private readonly app: App,
    private readonly source: string,
    private readonly sourcePath: string,
  ) {
    super()
  }

  eq(other: CodeBlockWidget) {
    return other.source === this.source && other.sourcePath === this.sourcePath
  }

  toDOM(view: EditorView) {
    const el = document.createElement("div")
    el.className = "cm-embed-block markdown-rendered mdx-code-block"
    this.component = new Component()
    this.component.load()
    void MarkdownRenderer.render(this.app, asCodeBlock(this.source), el, this.sourcePath, this.component)
    el.addEventListener("mousedown", (event) => {
      // The code block's own copy button copies, as in Reading view.
      if ((event.target as HTMLElement).closest(".copy-code-button")) return
      event.preventDefault()
      view.dispatch({ selection: { anchor: view.posAtDOM(el) } })
      view.focus()
    })
    return el
  }

  destroy() {
    this.component?.unload()
    this.component = null
  }

  ignoreEvent() {
    return true
  }
}

const sourcePathOf = (state: EditorState) => state.field(editorInfoField, false)?.file?.path ?? null
const isMdx = (path: string | null) => !!path && EXTENSIONS.some((ext) => path.endsWith(`.${ext}`))

/** The editor's MDX blocks: none, unless its file is an MDX note. */
const blocksField = StateField.define<MdxBlock[]>({
  create: (state) => (isMdx(sourcePathOf(state)) ? findMdxBlocks(state.doc.toString()) : []),
  update(blocks, tr) {
    if (!tr.docChanged && sourcePathOf(tr.startState) === sourcePathOf(tr.state)) return blocks
    return isMdx(sourcePathOf(tr.state)) ? findMdxBlocks(tr.state.doc.toString()) : []
  },
})

const sourceLine = (block: MdxBlock, line: number) => {
  const classes = ["HyperMD-codeblock", "HyperMD-codeblock-bg", "mdx-source-line"]
  if (line === block.startLine) classes.push("HyperMD-codeblock-begin", "HyperMD-codeblock-begin-bg")
  if (line === block.endLine) classes.push("HyperMD-codeblock-end", "HyperMD-codeblock-end-bg")
  return Decoration.line({ class: classes.join(" ") })
}

function decorationsOf(app: App, state: EditorState): DecorationSet {
  const blocks = state.field(blocksField)
  if (blocks.length === 0 || !state.field(editorLivePreviewField, false)) return Decoration.none
  const sourcePath = sourcePathOf(state) ?? ""
  const ranges = []
  for (const block of blocks) {
    const editing = state.selection.ranges.some((r) => r.from <= block.to && r.to >= block.from)
    if (editing) {
      for (let line = block.startLine; line <= block.endLine; line++) {
        ranges.push(sourceLine(block, line).range(state.doc.line(line + 1).from))
      }
    } else {
      const widget = new CodeBlockWidget(app, state.sliceDoc(block.from, block.to), sourcePath)
      ranges.push(Decoration.replace({ widget, block: true }).range(block.from, block.to))
    }
  }
  return Decoration.set(ranges, true)
}

/** The editor extension, ahead of Obsidian's own, so its code blocks take the place of Obsidian's embeds. */
export function mdxInEditor(app: App): Extension {
  const decorations = StateField.define<DecorationSet>({
    create: (state) => decorationsOf(app, state),
    update(value, tr) {
      const livePreviewChanged = tr.startState.field(editorLivePreviewField, false) !== tr.state.field(editorLivePreviewField, false)
      if (!tr.docChanged && !tr.selection && !livePreviewChanged && tr.startState.field(blocksField, false) === tr.state.field(blocksField)) {
        return value
      }
      return decorationsOf(app, tr.state)
    },
    provide: (field) => EditorView.decorations.from(field),
  })
  return Prec.highest([blocksField, decorations])
}
