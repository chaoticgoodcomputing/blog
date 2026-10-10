// `%%comments%%`: everything between two `%%` is left out of the page, whether the pair sits inside a
// line or around whole blocks.
//
// Sätteri's parser doesn't know the syntax, so a comment reaches us already parsed as Markdown: its
// `%%` are in text nodes, and what it holds may be paragraphs, code blocks, anything. So the state
// runs over the whole document in reading order. Each `%%` in a text node opens or closes a comment,
// and while one is open every node is dropped. A `%%` inside code is code: it never opens a comment,
// and never closes one. As in Obsidian, a comment left open runs to the end of the note.

import { defineMdastPlugin } from "satteri"
import { type Ctx, type Node, isParent, text } from "./node.ts"

const MARKER = "%%"

// Parents kept even when a comment empties them: a table needs its cells.
const KEPT_EMPTY = new Set(["root", "table", "tableRow", "tableCell"])

interface Plan {
  /** Whether anything a reader would see is left of the node. */
  visible: boolean
  /** Records the node's mutations. A removed parent never calls its children's. */
  apply?: () => void
}

function plan(root: Node, ctx: Ctx): Plan {
  let open = false

  const visit = (node: Node): Plan => {
    if (node.type === "text") {
      const value = node.value ?? ""
      if (!open && !value.includes(MARKER)) return { visible: true }
      const parts = value.split(MARKER)
      let kept = ""
      parts.forEach((part, index) => {
        if (!open) kept += part
        if (index < parts.length - 1) open = !open
      })
      if (kept === "") return { visible: false, apply: () => ctx.removeNode(node as never) }
      return {
        visible: kept.trim() !== "",
        apply: () => ctx.replaceNode(node as never, text(kept) as never),
      }
    }

    if (isParent(node)) {
      const startedOpen = open
      const plans = node.children.map(visit)
      const edited = plans.some((child) => child.apply)
      const emptied = edited ? !plans.some((child) => child.visible) : startedOpen
      if (emptied && !KEPT_EMPTY.has(node.type)) {
        return { visible: false, apply: () => ctx.removeNode(node as never) }
      }
      if (!edited) return { visible: true }
      return { visible: true, apply: () => plans.forEach((child) => child.apply?.()) }
    }

    return open ? { visible: false, apply: () => ctx.removeNode(node as never) } : { visible: true }
  }

  return visit(root)
}

export function comments() {
  return defineMdastPlugin({
    name: "obsidian-comments",
    before(root, ctx) {
      if (!ctx.source.includes(MARKER)) return
      plan(root as unknown as Node, ctx).apply?.()
    },
  })
}
