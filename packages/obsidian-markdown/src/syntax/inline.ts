// `==highlights==` and `#tags`, the inline syntax Sätteri's parser leaves as text.
//
// A highlight may hold other inline nodes (`==a **b** c==`), so its two markers can sit in different
// text nodes of one parent. Each parent's children are therefore read as one run: text is cut at the
// markers and tags, the markers are paired, and what a pair encloses moves into a `highlight` node.

import { defineMdastPlugin } from "satteri"
import type { Position } from "../types.ts"
import { type Node, isParent, rewriteChildren, text } from "./node.ts"
import { WIKILINK } from "./wikilinks.ts"

export const HIGHLIGHT = "highlight"
export const TAG = "tag"

export interface InlineOptions {
  /** Read `#tag` in a note's body as a tag, as Obsidian does. Default true. */
  tags?: boolean
}

type Item =
  | { kind: "text"; value: string }
  | { kind: "marker" }
  | { kind: "tag"; value: string; position?: Position }
  | { kind: "node"; node: Node }

// A highlight marker is exactly two `=`: a longer run is text. A tag follows whitespace or starts
// the text, and holds letters, digits, `_`, `-` and `/`, with at least one that isn't a digit.
const MARKER = "(?<!=)==(?!=)"
const TAG_PATTERN = "(?<=^|\\s)#[\\p{L}\\p{N}_/-]+"

function tokenize(value: string, pattern: RegExp, position: Position | undefined): Item[] {
  const items: Item[] = []
  let last = 0
  for (const match of value.matchAll(pattern)) {
    const found = match[0]
    const isTag = found.startsWith("#")
    if (isTag && /^#\d+$/.test(found)) continue
    if (match.index > last) items.push({ kind: "text", value: value.slice(last, match.index) })
    items.push(isTag ? { kind: "tag", value: found, ...(position ? { position } : {}) } : { kind: "marker" })
    last = match.index + found.length
  }
  if (last < value.length) items.push({ kind: "text", value: value.slice(last) })
  return items
}

// A marker opens a highlight when what follows it isn't whitespace, and closes one when what
// precedes it isn't. A highlight can't be empty.
const opens = (next: Item | undefined) =>
  next !== undefined && next.kind !== "marker" && !(next.kind === "text" && /^\s/.test(next.value))
const closes = (previous: Item | undefined) =>
  previous !== undefined && !(previous.kind === "text" && /\s$/.test(previous.value))

function build(items: Item[]): Node[] {
  const nodes: Node[] = []
  const pushText = (value: string) => {
    const last = nodes.at(-1)
    if (last?.type === "text" && last.position === undefined) last.value += value
    else nodes.push(text(value))
  }
  for (let index = 0; index < items.length; index++) {
    const item = items[index]!
    if (item.kind === "text") pushText(item.value)
    else if (item.kind === "node") nodes.push(item.node)
    else if (item.kind === "tag") {
      nodes.push({
        type: TAG,
        data: {
          tag: { tag: item.value, ...(item.position ? { position: item.position } : {}) },
          hName: "a",
          hProperties: { className: ["tag"], href: item.value },
        },
        children: [text(item.value)],
      })
    } else {
      let close = -1
      if (opens(items[index + 1])) {
        for (let later = index + 2; later < items.length; later++) {
          if (items[later]!.kind === "marker" && closes(items[later - 1])) {
            close = later
            break
          }
        }
      }
      if (close === -1) pushText("==")
      else {
        nodes.push({
          type: HIGHLIGHT,
          data: { hName: "mark" },
          children: build(items.slice(index + 1, close)),
        })
        index = close
      }
    }
  }
  return nodes
}

export function inline(options: InlineOptions = {}) {
  const tags = options.tags ?? true
  const pattern = new RegExp(tags ? `${MARKER}|${TAG_PATTERN}` : MARKER, "gu")

  return defineMdastPlugin({
    name: "obsidian-inline",
    options: { position: true },
    before(root, ctx) {
      const source = ctx.source
      if (!source.includes("==") && !(tags && source.includes("#"))) return
      rewriteChildren(
        root as unknown as Node,
        ctx,
        (parent, children) => {
          // A link's text is no place for a tag.
          const allowTags = parent.type !== "link"
          const items = children.flatMap((child): Item[] => {
            if (child.type !== "text") return [{ kind: "node", node: child }]
            // Text an earlier plugin rewrote has no position of its own: its parent's stands in.
            const found = tokenize(child.value ?? "", pattern, child.position ?? parent.position)
            return allowTags
              ? found
              : found.map((item) => (item.kind === "tag" ? { kind: "text", value: item.value } : item))
          })
          if (!items.some((item) => item.kind === "marker" || item.kind === "tag")) return undefined
          const built = build(items)
          // Unpaired markers alone change nothing.
          return built.some((node) => node.type === HIGHLIGHT || node.type === TAG) ? built : undefined
        },
        // A wikilink's text is its display text, already final.
        (node) => node.type === WIKILINK || !isParent(node),
      )
    },
  })
}
