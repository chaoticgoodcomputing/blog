// A graph of the site: its notes and tags as nodes, and the edges between them, made from the graph
// index the site publishes (./graph-index.ts). Pure, and run both where the site is built and in
// the browser, so a page and its script agree on what a graph holds. How a graph is laid out and
// drawn is src/lib/graph-drawing.ts's.

import type { EdgeKind, GraphSettings, HoverPulse, PrivateTreatment } from "../site.config.types.ts"
import { TAGS_INDEX, tagAncestors, tagName, tagUrl, underAny } from "./tags.ts"

/** Where the site publishes its graph index (src/pages/graph.json.ts). */
export const GRAPH_INDEX = "/graph.json"

/** One published note, as the graph index holds it. */
export interface IndexedNote {
  /** Its page's address, which is also its node's id. */
  url: string
  title: string
  /** The note's date, ISO 8601, in UTC. */
  date: string
  /** Its own tags, as tag slugs, in the order written. */
  tags: string[]
  /** The addresses of the published notes and tag pages it links to or embeds. */
  links: string[]
  /** Whether its page is a private page. */
  private: boolean
}

/** The graph index. */
export interface GraphIndex {
  notes: IndexedNote[]
}

/** A note, or a tag. */
export interface GraphNode {
  /** The address of the node's page: a note's, or a tag's `/tags/<tag slug>`. */
  id: string
  kind: "note" | "tag"
  /** What the node reads as: a note's title, or `#` and a tag's name. */
  label: string
  /**
   * The tag whose tag bubble the node is drawn as: a tag's own, or a note's first. A note with no
   * tags has none.
   */
  tag: string | undefined
  /** Whether it is a private page's node. */
  private: boolean
}

export interface GraphEdge {
  /** The node's id the edge runs from: the note that links, the note that carries a tag, the tag above. */
  source: string
  target: string
  kind: EdgeKind
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/** What a graph leaves out. */
export interface GraphChoices {
  /** Tags left out, each with every tag under it. A note under one stays. */
  removeTags: string[]
  /** Whether a private page is left out, or drawn, and marked as one. */
  privatePages: PrivateTreatment
}

// The tag whose page is at an address under the tags index, if any.
const tagPagedAt = (url: string): string | undefined =>
  url.startsWith(`${TAGS_INDEX}/`) ? url.slice(TAGS_INDEX.length + 1) || undefined : undefined

/**
 * The whole graph of the index: every note but what `choices` leaves out, every tag one of them
 * carries and every ancestor of one, and the edges between them. A note at a tag page's address, a
 * tag's description note, is that tag's node: the node keeps the note's edges and the tag's name.
 * A link to a tag's page is an edge to the tag's node, when the graph has it.
 */
export function graphOf(index: GraphIndex, choices: GraphChoices): Graph {
  const kept = (tag: string) => !underAny([tag], choices.removeTags)
  const notes = index.notes.filter((note) => {
    const tag = tagPagedAt(note.url)
    return tag === undefined ? choices.privatePages === "mark" || !note.private : kept(tag)
  })

  const tags = new Set<string>()
  const add = (tag: string) => [...tagAncestors(tag), tag].forEach((each) => tags.add(each))
  for (const note of notes) {
    const own = tagPagedAt(note.url)
    if (own !== undefined) add(own)
    note.tags.filter(kept).forEach(add)
  }

  const nodes: GraphNode[] = notes
    .filter((note) => tagPagedAt(note.url) === undefined)
    .map((note) => ({ id: note.url, kind: "note", label: note.title, tag: note.tags[0], private: note.private }))
  for (const tag of [...tags].sort()) {
    nodes.push({ id: tagUrl(tag), kind: "tag", label: `#${tagName(tag)}`, tag, private: false })
  }
  const ids = new Set(nodes.map((node) => node.id))

  const edges: GraphEdge[] = []
  for (const note of notes) {
    for (const target of note.links) {
      if (target !== note.url && ids.has(target)) edges.push({ source: note.url, target, kind: "noteNote" })
    }
    for (const tag of note.tags.filter(kept)) {
      // A tag's description note, carrying its own tag, is that tag's node: no edge to itself.
      if (note.url !== tagUrl(tag)) edges.push({ source: note.url, target: tagUrl(tag), kind: "tagNote" })
    }
  }
  for (const tag of [...tags].sort()) {
    const parent = tagAncestors(tag).at(-1)
    if (parent !== undefined) edges.push({ source: tagUrl(parent), target: tagUrl(tag), kind: "tagTag" })
  }
  return { nodes, edges }
}

/**
 * A node's neighbourhood: the node at `id` and every node within `depth` edges of it, whichever way
 * each edge runs, with the edges among them. With a depth below zero, the whole graph. Empty for an
 * id the graph has no node for.
 */
export function neighbourhood(graph: Graph, id: string, depth: number): Graph {
  if (depth < 0) return graph
  if (!graph.nodes.some((node) => node.id === id)) return { nodes: [], edges: [] }
  const adjacent = new Map<string, string[]>()
  const connect = (from: string, to: string) => adjacent.set(from, [...(adjacent.get(from) ?? []), to])
  for (const { source, target } of graph.edges) {
    connect(source, target)
    connect(target, source)
  }
  const found = new Set([id])
  let frontier = [id]
  for (let distance = 0; distance < depth && frontier.length > 0; distance++) {
    const next: string[] = []
    for (const each of frontier) {
      for (const neighbour of adjacent.get(each) ?? []) {
        if (found.has(neighbour)) continue
        found.add(neighbour)
        next.push(neighbour)
      }
    }
    frontier = next
  }
  return {
    nodes: graph.nodes.filter((node) => found.has(node.id)),
    edges: graph.edges.filter((edge) => found.has(edge.source) && found.has(edge.target)),
  }
}

/**
 * The graph around a reader's trail (./trail.ts): each of its notes, every node within `depth`
 * edges of one, and every edge among them, whichever note's neighbourhood each end is in. A trail
 * note the graph has no node for adds nothing.
 */
export function trailGraph(graph: Graph, trail: readonly string[], depth: number): Graph {
  const found = new Set(trail.flatMap((id) => neighbourhood(graph, id, depth).nodes.map((node) => node.id)))
  return {
    nodes: graph.nodes.filter((node) => found.has(node.id)),
    edges: graph.edges.filter((edge) => found.has(edge.source) && found.has(edge.target)),
  }
}

/**
 * Each node's radius, in CSS pixels, by its id. A note's grows with how many edges it has in the
 * graph, and a private page's is then made smaller; a tag's grows with how many notes in the graph
 * carry it or a tag under it.
 */
export function radii(graph: Graph, sizes: GraphSettings["sizes"]): Map<string, number> {
  const degree = new Map<string, number>()
  const notesOf = new Map<string, number>()
  const children = new Map<string, string[]>()
  for (const { source, target, kind } of graph.edges) {
    degree.set(source, (degree.get(source) ?? 0) + 1)
    degree.set(target, (degree.get(target) ?? 0) + 1)
    if (kind === "tagNote") notesOf.set(target, (notesOf.get(target) ?? 0) + 1)
    if (kind === "tagTag") children.set(source, [...(children.get(source) ?? []), target])
  }
  // A note under two tags of one lineage is counted under each, as many times as it is reached.
  const under = (tag: string): number =>
    (notesOf.get(tag) ?? 0) + (children.get(tag) ?? []).reduce((sum, child) => sum + under(child), 0)

  const size = ({ base, scaling }: { base: number; scaling: number }, n: number) => base + scaling * Math.sqrt(n)
  return new Map(
    graph.nodes.map((node) => {
      if (node.kind === "tag") return [node.id, size(sizes.tag, under(node.id))]
      const radius = size(sizes.note, degree.get(node.id) ?? 0)
      return [node.id, node.private ? radius * sizes.private : radius]
    }),
  )
}

/** What hovering a node lights: nodes by id, and edges, each with how many tags down it starts. */
export interface Lit {
  nodes: Set<string>
  edges: Map<GraphEdge, number>
}

/**
 * What hovering the node at `id` lights: the node, and every node it has an edge to, and those
 * edges. A tag lights the tags under it too, down its edges to them, and their neighbours, and an
 * edge counts as many hops as the tag it starts from is down.
 */
export function litBy(graph: Graph, id: string): Lit {
  const down = new Map([[id, 0]])
  if (graph.nodes.find((node) => node.id === id)?.kind === "tag") {
    const stack = [id]
    while (stack.length > 0) {
      const tag = stack.pop()!
      for (const { source, target, kind } of graph.edges) {
        if (kind !== "tagTag" || source !== tag || down.has(target)) continue
        down.set(target, down.get(tag)! + 1)
        stack.push(target)
      }
    }
  }
  const nodes = new Set(down.keys())
  const edges = new Map<GraphEdge, number>()
  for (const edge of graph.edges) {
    const hops = Math.min(down.get(edge.source) ?? Infinity, down.get(edge.target) ?? Infinity)
    if (hops === Infinity) continue
    edges.set(edge, hops)
    nodes.add(edge.source).add(edge.target)
  }
  return { nodes, edges }
}

/**
 * Whether a node's label is drawn: a tag's always, and while a node is hovered, the hovered node's
 * and the tags it lights. No other note's title shows, so the graph is never crowded with them.
 */
export function labelled(node: GraphNode, hovered: string | undefined, lit: Lit | undefined): boolean {
  if (node.id === hovered) return true
  return node.kind === "tag" && (hovered === undefined || (lit?.nodes.has(node.id) ?? false))
}

/** The faintest a lit edge's pulse leaves it. */
const PULSE_FLOOR = 0.25

/**
 * A lit edge's opacity, `elapsed` milliseconds after its node was hovered: a pulse that swells from
 * faint to whole and back over `on`, then rests faint for `off`, and again, each `delay` later for
 * each hop the edge is down. With no `on`, it is whole.
 */
export function pulseOpacity(elapsed: number, hops: number, { on, off, delay }: HoverPulse): number {
  if (on <= 0) return 1
  const since = Math.max(0, elapsed - hops * delay) % (on + Math.max(0, off))
  if (since >= on) return PULSE_FLOOR
  return PULSE_FLOOR + ((1 - Math.cos((since / on) * 2 * Math.PI)) / 2) * (1 - PULSE_FLOOR)
}

/**
 * An edge's opacity by how far apart its ends are, against its length at rest: `max` at half that
 * length or nearer, `min` at twice it or further, and in between in proportion.
 */
export function edgeOpacity(distance: number, length: number, { min, max }: { min: number; max: number }): number {
  const [near, far] = [length / 2, length * 2]
  if (far <= near) return distance > near ? min : max
  const along = (Math.min(far, Math.max(near, distance)) - near) / (far - near)
  return max - along * (max - min)
}
