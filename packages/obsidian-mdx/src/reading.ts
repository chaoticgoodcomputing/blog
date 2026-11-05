// Reading view: an MDX note's imports and components as `jsx` code blocks, in place of the paragraph
// Obsidian makes of an import and the empty element it makes of a component.
//
// Obsidian renders a note section by section, a section being a run of lines between blank ones. A
// block can span several sections (a component whose props or children have blank lines), or share
// one with Markdown. Each section is rendered again from its own lines: a block as a code block in
// the section it starts in, and nothing in the rest; other lines as the Markdown they are.

import { type App, MarkdownRenderChild, MarkdownRenderer, type MarkdownPostProcessorContext } from "obsidian"
import { EXTENSIONS } from "./extensions.ts"
import { type MdxBlock, asCodeBlock, findMdxBlocks } from "./mdx-blocks.ts"

let memo: { text: string; blocks: MdxBlock[] } | null = null
/** The note's blocks; every section of a note asks, with the same text. */
function blocksOf(text: string) {
  if (memo?.text !== text) memo = { text, blocks: findMdxBlocks(text) }
  return memo.blocks
}

export function mdxInReading(app: App) {
  return (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    if (!EXTENSIONS.some((ext) => ctx.sourcePath.endsWith(`.${ext}`))) return
    const info = ctx.getSectionInfo(el)
    if (!info) return
    const blocks = blocksOf(info.text).filter((b) => b.startLine <= info.lineEnd && b.endLine >= info.lineStart)
    if (blocks.length === 0) return

    const lines = info.text.split("\n")
    const parts: string[] = []
    let markdown: string[] = []
    const flush = () => {
      if (markdown.join("").trim()) parts.push(markdown.join("\n"))
      markdown = []
    }
    for (let line = info.lineStart; line <= info.lineEnd; line++) {
      const block = blocks.find((b) => b.startLine <= line && line <= b.endLine)
      if (!block) {
        markdown.push(lines[line])
        continue
      }
      flush()
      if (line === block.startLine) parts.push(asCodeBlock(lines.slice(block.startLine, block.endLine + 1).join("\n")))
      line = Math.min(block.endLine, info.lineEnd)
    }
    flush()

    el.empty()
    if (parts.length === 0) return
    const child = new MarkdownRenderChild(el)
    ctx.addChild(child)
    void MarkdownRenderer.render(app, parts.join("\n\n"), el, ctx.sourcePath, child)
  }
}
