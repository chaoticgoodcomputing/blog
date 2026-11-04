// A note's footnotes as sidenotes: each footnote beside the paragraph that cites it, in the margin
// to the right of the text where the margin is wide enough, and under the paragraph where it isn't.
// The footnotes' own section, under the body, is kept in the page and not drawn
// (src/styles/prose/sidenotes.css): the feed and the Markdown copies are made from the page, and keep
// it in place of the sidenotes (`restoreFootnotes`).
//
// Each block at the top of the note that cites a footnote, a paragraph, a list, a quote or a
// callout, is wrapped with a copy of each footnote it is the first to cite, in the order cited, the
// copies before the block: `<div class="sidenoted"><aside class="sidenote">…</aside><p>…</p></div>`.
// A footnote cited twice is beside its first citation alone. Its reference links to its sidenote.
//
// Whether the margin is wide enough is a container query on the note's room, which can't read the
// widths from custom properties, so the site config's widths are written into it
// (`sidenoteMarginStyles`, Base.astro).

import type { HTMLElement } from "node-html-parser"
import { defineHastPlugin, type HastNode } from "satteri"
import type { LayoutConfig } from "../site.config.types.ts"

const FOOTNOTE_PREFIX = "#user-content-fn-"
const SIDENOTE_PREFIX = "user-content-sn-"

type Element = Extract<HastNode, { type: "element" }>
type ElementContent = Element["children"][number]

type Node = Readonly<HastNode> & { tagName?: string; properties?: Record<string, unknown>; children?: Node[] }

const isElement = (node: Node): node is Node & Readonly<Element> => node.type === "element"

/** A plain copy of a node and what is under it, to place elsewhere in the tree. */
function copyOf(node: Node): ElementContent {
  const { children, position: _position, ...rest } = node as Node & { position?: unknown }
  const copy = { ...rest } as ElementContent & { children?: ElementContent[]; properties?: Record<string, unknown> }
  if (copy.properties) copy.properties = { ...copy.properties }
  if (children) copy.children = children.map(copyOf)
  return copy
}

/** The footnote references under `node`, in the order written. */
function referencesIn(node: Node, found: Node[] = []): Node[] {
  if (isElement(node) && node.tagName === "a" && node.properties?.dataFootnoteRef !== undefined) found.push(node)
  for (const child of node.children ?? []) referencesIn(child, found)
  return found
}

const isBackReference = (node: Node) => isElement(node) && node.properties?.dataFootnoteBackref !== undefined

/** A footnote's content without its links back to its references, and the text space before one. */
function withoutBackReferences(node: Node): ElementContent[] {
  if (isBackReference(node)) return []
  const copy = copyOf(node) as ElementContent & { children?: ElementContent[] }
  if (node.children) {
    copy.children = node.children.flatMap(withoutBackReferences)
    const last = copy.children.at(-1)
    if (last?.type === "text") last.value = last.value.trimEnd()
  }
  return [copy]
}

/** The sidenote of a footnote: its number, then its content, its first paragraph begun by the number. */
function sidenote(id: string, number: string, item: Node): Element {
  const content = (item.children ?? []).flatMap(withoutBackReferences).filter((node) => node.type !== "text" || node.value.trim() !== "")
  const label: Element = { type: "element", tagName: "span", properties: { className: ["sidenote-number"] }, children: [{ type: "text", value: number }] }
  const first = content[0]
  if (first?.type === "element" && first.tagName === "p") first.children.unshift(label, { type: "text", value: " " })
  else content.unshift(label)
  return { type: "element", tagName: "aside", properties: { className: ["sidenote"], id: `${SIDENOTE_PREFIX}${id}` }, children: content }
}

export function sidenotes() {
  return defineHastPlugin({
    name: "sidenotes",
    before(root, ctx) {
      const top = (root as unknown as Node).children ?? []
      const section = top.find((node) => isElement(node) && node.tagName === "section" && node.properties?.dataFootnotes !== undefined)
      if (!section) return
      const items = new Map<string, Node>()
      for (const list of section.children ?? []) {
        for (const item of list.children ?? []) {
          const id = item.properties?.id
          if (typeof id === "string") items.set(id, item)
        }
      }
      const placed = new Set<string>()
      for (const block of top) {
        if (block === section || !isElement(block)) continue
        const notes: Element[] = []
        for (const reference of referencesIn(block)) {
          const href = reference.properties?.href
          if (typeof href !== "string" || !href.startsWith(FOOTNOTE_PREFIX)) continue
          const id = href.slice(FOOTNOTE_PREFIX.length)
          const item = items.get(`user-content-fn-${id}`)
          if (!item) continue
          ctx.setProperty(reference, "href", `#${SIDENOTE_PREFIX}${id}`)
          if (placed.has(id)) continue
          placed.add(id)
          notes.push(sidenote(id, ctx.textContent(reference), item))
        }
        if (notes.length === 0) continue
        ctx.replaceNode(block, {
          type: "element",
          tagName: "div",
          properties: { className: ["sidenoted"] },
          children: [...notes, block as unknown as ElementContent],
        })
      }
    },
  })
}

/**
 * The page's body as it reads without the site's styles, in the feed and the Markdown copies: the
 * sidenotes gone, and each reference linking to its footnote in the section under the body again.
 */
export function restoreFootnotes(body: HTMLElement): void {
  for (const note of body.querySelectorAll(".sidenote")) note.remove()
  for (const reference of body.querySelectorAll(`a[href^="#${SIDENOTE_PREFIX}"]`)) {
    reference.setAttribute("href", `${FOOTNOTE_PREFIX}${reference.getAttribute("href")!.slice(SIDENOTE_PREFIX.length + 1)}`)
  }
}

/**
 * The sidenotes' layout in the margin, for a note whose room is wide enough for the text, with a
 * margin either side as wide as a sidenote, the gap before it and the room's edge. Below that, the
 * sidenotes are under their blocks (src/styles/prose/sidenotes.css). An annotation page whose
 * document opens has its margin for its annotations, and keeps its sidenotes under their blocks.
 */
export function sidenoteMarginStyles({ noteWidth, sidenoteWidth, sidenoteGap }: LayoutConfig): string {
  const room = `calc(${noteWidth} + 2 * (${sidenoteGap} + ${sidenoteWidth} + 2rem))`
  const note = `.note-room:not(:has(.annotation-viewer:not([data-state="failed"]))) .prose`
  return `@container note-room (width >= ${room}) {
  ${note} .sidenoted { display: contents; }
  ${note} .sidenote {
    float: right;
    clear: right;
    box-sizing: border-box;
    width: ${sidenoteWidth};
    margin: 0.35em calc(-1 * (${sidenoteWidth} + ${sidenoteGap})) 1rem 0;
    padding: 0;
    border: none;
  }
  ${note} .wide { clear: right; }
}`
}
