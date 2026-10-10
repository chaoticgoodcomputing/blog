// Note embeds: `![[note]]` shows the note in place, `![[note#Heading]]` one section of it, and
// `![[note#^block]]` one block.
//
// The embedded note is compiled on its own, by the same plugins a note's page is rendered with, as
// the note it is: its links are resolved from where it sits in the vault, not from the note that
// embeds it. What that compile leaves is lifted out as plain nodes and placed in the embedding
// note's tree, so everything that runs later there (a host's own plugins, its code highlighting,
// its image handling) reaches embedded content as it reaches the note's own.

import { defineMdastPlugin } from "satteri"
import { WIKILINK } from "./syntax/index.ts"
import { type Node, cloneWith, copyOf, isParent, mergeData, text } from "./syntax/node.ts"
import type { WikilinkData } from "./types.ts"
import type { SubpathResult } from "./vault.ts"

export const NOTE_EMBED = "noteEmbed"

/**
 * How many notes deep an embed is followed. A note that embeds itself, directly or through others,
 * is shown this many times, and the embed inside the last is left as a link.
 */
export const MAX_EMBED_DEPTH = 5

/** The key an embedded note's compile is told under, in its data bag, what it is embedded in. */
export const EMBED_KEY = "obsidianEmbed"

export interface EmbedState {
  /** How many embeds deep the note being compiled is: 0 for a note rendered as its own page. */
  depth: number
  /** The path of the note whose page all of this ends up on. An image's path is written from it. */
  host: string
}

type Found = { parent: Node; index: number }

function find(parent: Node, matches: (node: Node) => boolean): Found | null {
  const children = parent.children ?? []
  for (let index = 0; index < children.length; index++) {
    const child = children[index]!
    if (matches(child)) return { parent, index }
    const deeper = find(child, matches)
    if (deeper) return deeper
  }
  return null
}

/** The nodes of a note that an embed of it shows: all of it, or the heading or block it names. */
function select(root: Node, target: SubpathResult | null): Node[] {
  if (!target) return (root.children ?? []).filter((node) => node.type !== "yaml" && node.type !== "toml")

  if (target.type === "block") {
    const found = find(root, (node) => node.data?.block?.id === target.block.id)
    if (!found) return []
    const block = found.parent.children![found.index]!
    // A list item is shown as a list of that one item.
    return [block.type === "listItem" ? cloneWith(found.parent, [block]) : block]
  }

  // The heading, and everything under it: up to the next heading of its level or a higher one.
  const start = target.current.position.start.offset
  const found = find(root, (node) => node.type === "heading" && node.position?.start.offset === start)
  if (!found) return []
  const section = found.parent.children!.slice(found.index)
  const next = section.findIndex(
    (node, index) => index > 0 && node.type === "heading" && (node.depth as number) <= target.current.level,
  )
  return next === -1 ? section : section.slice(0, next)
}

const FOOTNOTE_DEFINITION = "footnoteDefinition"
const FOOTNOTE_REFERENCE = "footnoteReference"

function eachNode(nodes: Node[], visit: (node: Node) => void): void {
  for (const node of nodes) {
    visit(node)
    eachNode(node.children ?? [], visit)
  }
}

/**
 * The definitions of the footnotes some nodes refer to, wherever in the note each is defined, in
 * the order they are first referred to; and those a definition refers to in turn.
 */
function footnotesOf(root: Node, nodes: Node[]): Node[] {
  const definitions = new Map<string, Node>()
  eachNode([root], (node) => {
    if (node.type === FOOTNOTE_DEFINITION) definitions.set(node.identifier as string, node)
  })
  const found: Node[] = []
  const seen = new Set<string>()
  const refer = (nodes: Node[]) =>
    eachNode(nodes, (node) => {
      if (node.type !== FOOTNOTE_REFERENCE || seen.has(node.identifier as string)) return
      seen.add(node.identifier as string)
      const definition = definitions.get(node.identifier as string)
      if (!definition) return
      found.push(definition)
      refer(definition.children ?? [])
    })
  refer(nodes.filter((node) => node.type !== FOOTNOTE_DEFINITION))
  return found
}

/**
 * A copy of a node that belongs to no tree, ready to be placed in another note's. A link in it, a
 * wikilink or a Markdown link, is marked as settled, since it was resolved in the note it comes
 * from; a block id is dropped, since the anchor it makes is the embedded note's page's, not this
 * one's; and a footnote's name is given the embed's prefix, so it is never one of the page's own.
 * A footnote's definition is left out where it stands: what the embed shows refers to the ones it
 * carries (`footnotesOf`).
 */
function lift(node: Node, prefix: string): Node {
  const children = isParent(node)
    ? { children: node.children.filter((child) => child.type !== FOOTNOTE_DEFINITION).map((child) => lift(child, prefix)) }
    : {}
  const copy = copyOf(node, children)
  if (copy.type === FOOTNOTE_REFERENCE || copy.type === FOOTNOTE_DEFINITION) {
    copy.identifier = `${prefix}${copy.identifier as string}`
    if (typeof copy.label === "string") copy.label = `${prefix}${copy.label}`
  }
  if (copy.type === WIKILINK || copy.type === "link") copy.data = { ...copy.data, embedded: true }
  if (copy.data?.block) {
    const { block: _block, hProperties, ...data } = copy.data
    const { id: _id, ...properties } = (hProperties ?? {}) as Record<string, unknown>
    copy.data = { ...data, ...(Object.keys(properties).length ? { hProperties: properties } : {}) }
  }
  return copy
}

/**
 * The last plugin of an embedded note's compile: it takes what the embed shows out of the finished
 * tree, into `out`, followed by the definitions of the footnotes it refers to. Each footnote's name
 * is given `prefix`, which no other embed on the page has.
 */
export function capture(target: SubpathResult | null, out: { nodes?: Node[] }, prefix: string) {
  return defineMdastPlugin({
    name: "obsidian-embed-capture",
    options: { position: true },
    after(root) {
      const shown = select(root as unknown as Node, target)
      out.nodes = [
        ...shown.filter((node) => node.type !== FOOTNOTE_DEFINITION),
        ...footnotesOf(root as unknown as Node, shown),
      ].map((node) => lift(node, prefix))
    },
  })
}

/**
 * An embed as it sits in the embedding note: the content, then a link to where it comes from,
 * under Obsidian's class names (`internal-embed`, `markdown-embed`, `markdown-embed-content`,
 * `markdown-embed-link`). A note the site publishes nowhere has no address to link back to.
 */
export function noteEmbed(wikilink: WikilinkData, content: Node[], href: string | undefined): Node {
  return {
    type: NOTE_EMBED,
    data: {
      hName: "div",
      hProperties: { className: ["internal-embed", "markdown-embed"], "data-src": wikilink.link },
    },
    children: [
      {
        type: "noteEmbedContent",
        data: { hName: "div", hProperties: { className: ["markdown-embed-content"] } },
        children: content,
      },
      ...(href === undefined
        ? []
        : [
            {
              type: "noteEmbedLink",
              data: {
                hName: "a",
                hProperties: {
                  className: ["internal-link", "markdown-embed-link"],
                  href,
                  "data-href": wikilink.link,
                },
              },
              children: [text(wikilink.displayText)],
            },
          ]),
    ],
  }
}

const isBlank = (node: Node) => node.type === "break" || (node.type === "text" && (node.value ?? "").trim() === "")

/** A run of a paragraph's inline nodes as a paragraph of its own, or nothing when it says nothing. */
function paragraphOf(run: Node[]): Node[] {
  let nodes = [...run]
  while (nodes.length && isBlank(nodes[0]!)) nodes = nodes.slice(1)
  while (nodes.length && isBlank(nodes.at(-1)!)) nodes = nodes.slice(0, -1)
  if (!nodes.length) return []
  const first = nodes[0]!
  if (first.type === "text") nodes[0] = text((first.value ?? "").trimStart())
  const last = nodes.at(-1)!
  if (last.type === "text") nodes[nodes.length - 1] = text((last.value ?? "").trimEnd())
  return [{ type: "paragraph", children: nodes }]
}

/**
 * A paragraph with its note embeds shown: an embed is a block, so the paragraph is cut at each one,
 * and what was written around it stays a paragraph before and after. `embed` gives the block for
 * an inline node, or null for a node that stays where it is. Null when the paragraph holds no
 * embed to show.
 */
export function splitAtEmbeds(paragraph: Node, embed: (node: Node) => Node | null): Node[] | null {
  const pieces: Node[] = []
  let run: Node[] = []
  let shown = false
  for (const child of paragraph.children ?? []) {
    const block = child.type === WIKILINK ? embed(child) : null
    if (!block) {
      run.push(child)
      continue
    }
    pieces.push(...paragraphOf(run), block)
    run = []
    shown = true
  }
  if (!shown) return null
  pieces.push(...paragraphOf(run))
  // What the paragraph carried, a block id among it, stays on the first of its pieces.
  const [first, ...rest] = pieces
  return paragraph.data ? [{ ...first!, data: mergeData(paragraph, first!.data ?? {}) }, ...rest] : pieces
}
