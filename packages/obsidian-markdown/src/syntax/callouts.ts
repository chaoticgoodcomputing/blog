// Callouts: a quote whose first line is `[!type]`, optionally `+` or `-` to fold, then a title.
//
//   > [!warning]- Mind the gap
//   > The body, which is any Markdown, a nested callout included.
//
// The quote becomes a `callout` node holding a title and a body, under Obsidian's own class names
// (`callout`, `callout-title`, `callout-content`, and `data-callout` for the type). A callout that
// folds is a `<details>` with the title as its `<summary>`, so it opens and closes without a script.

import { defineMdastPlugin } from "satteri"
import type { CalloutData } from "../types.ts"
import { type Node, text } from "./node.ts"

export const CALLOUT = "callout"

const HEAD = /^\[!([^\]\n]+)\]([+-]?)[ \t]*/

const defaultTitle = (type: string) => {
  const words = type.replace(/-/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * Split the first paragraph's inline nodes into the title, which is the rest of its first line, and
 * the start of the body. A soft line break is a `\n` inside a text node.
 */
function splitFirstLine(children: Node[]): { title: Node[]; body: Node[] } {
  const title: Node[] = []
  for (let index = 0; index < children.length; index++) {
    const child = children[index]!
    if (child.type === "break") return { title, body: children.slice(index + 1) }
    const value = child.type === "text" ? (child.value ?? "") : ""
    const newline = value.indexOf("\n")
    if (newline === -1) {
      title.push(child)
      continue
    }
    if (newline > 0) title.push(text(value.slice(0, newline)))
    const after = value.slice(newline + 1)
    return { title, body: [...(after ? [text(after)] : []), ...children.slice(index + 1)] }
  }
  return { title, body: [] }
}

export function callouts() {
  return defineMdastPlugin({
    name: "obsidian-callouts",
    blockquote(blockquote, ctx) {
      const node = blockquote as unknown as Node
      const [first, ...rest] = node.children ?? []
      if (first?.type !== "paragraph") return
      const [lead, ...inlines] = first.children ?? []
      if (lead?.type !== "text") return
      const head = HEAD.exec(lead.value ?? "")
      if (!head) return

      // `[!note|wide]` carries metadata after a pipe; the type is what comes before it.
      const type = head[1]!.split("|")[0]!.trim().toLowerCase()
      const fold = (head[2] || undefined) as CalloutData["fold"]
      const remainder = (lead.value ?? "").slice(head[0].length)
      const { title, body } = splitFirstLine([...(remainder ? [text(remainder)] : []), ...inlines])

      const callout: CalloutData = { type, ...(fold ? { fold } : {}) }
      const content: Node[] = [...(body.length ? [{ type: "paragraph", children: body }] : []), ...rest]
      const replacement: Node = {
        type: CALLOUT,
        data: {
          // What an earlier plugin set on the quote, a block id among it, stays on the callout.
          ...node.data,
          callout,
          hName: fold ? "details" : "div",
          hProperties: {
            ...node.data?.hProperties,
            className: ["callout"],
            "data-callout": type,
            ...(fold === "+" ? { open: true } : {}),
          },
        },
        children: [
          {
            type: "calloutTitle",
            data: { hName: fold ? "summary" : "div", hProperties: { className: ["callout-title"] } },
            children: title.length ? title : [text(defaultTitle(type))],
          },
          ...(content.length
            ? [
                {
                  type: "calloutContent",
                  data: { hName: "div", hProperties: { className: ["callout-content"] } },
                  children: content,
                },
              ]
            : []),
        ],
      }
      ctx.replaceNode(blockquote, replacement as never)
    },
  })
}
