// Block ids: `^id` at the end of a paragraph or list item names that block, and `^id` alone in a
// paragraph names the block before it, which is how a quote, a table or a list gets one. The marker
// is taken out of the text, and the block gets the id `^id`, the anchor a `[[note#^id]]` link points
// at.

import { defineMdastPlugin } from "satteri"
import type { Position } from "../types.ts"
import { type Ctx, type Node, mergeData, text } from "./node.ts"

const TRAILING = /(^|\s)\^([A-Za-z0-9-]+)\s*$/

/** The anchor a block id is given in the page: its `^` included, as Obsidian writes the link. */
export const blockAnchor = (id: string) => `^${id}`

function mark(ctx: Ctx, target: Node, id: string, position: Position | undefined): void {
  ctx.setProperty(
    target as never,
    "data",
    mergeData(target, {
      block: { id, ...(position ? { position } : {}) },
      hProperties: { id: blockAnchor(id) },
    }),
  )
}

export function blocks() {
  return defineMdastPlugin({
    name: "obsidian-blocks",
    options: { position: true },
    paragraph(paragraph, ctx) {
      const node = paragraph as unknown as Node
      const last = node.children?.at(-1)
      if (last?.type !== "text") return
      const match = TRAILING.exec(last.value ?? "")
      if (!match) return
      const id = match[2]!
      const parent = ctx.parent(paragraph) as unknown as Node | undefined
      const index = ctx.indexOf(paragraph)

      const rest = (last.value ?? "").slice(0, match.index)
      if (node.children!.length === 1 && rest.trim() === "") {
        // The id stands alone: it names the block before it.
        const previous = index === undefined ? undefined : parent?.children?.[index - 1]
        if (!previous) return
        ctx.removeNode(paragraph)
        mark(ctx, previous, id, previous.position)
        return
      }

      if (rest === "") ctx.removeNode(last as never)
      else ctx.replaceNode(last as never, text(rest) as never)
      // A list item's own line is the item, not the paragraph inside it.
      const target = parent?.type === "listItem" && index === 0 ? parent : node
      mark(ctx, target, id, target.position)
    },
  })
}
