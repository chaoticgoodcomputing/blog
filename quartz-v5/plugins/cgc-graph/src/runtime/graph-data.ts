// What a graph shows: its nodes and edges, and the global graph's filters (v4 core/graphData.ts,
// core/tagIndex.ts, ui/filters.ts, ui/filterLogic.ts). The tag hierarchy comes from the tags pages
// carry, as the cgc-tags engine publishes them: a tag's parent is its path's prefix (tags-core).
import { lineageOf, parentOf } from "@chaoticgoodcomputing/tags-core"
import type { TimePeriod } from "../options"
import { hrefOf, isTagId, tagNodeId } from "./pages"
import { underAny, type Settings } from "./settings"
import type { GraphData, NodeData, NodeId, Pages, SimpleLink } from "./types"

/**
 * Every edge in the site: page to page wherever a page links to another in the index, and, with
 * `showTags`, tag to page for each of a page's tags and tag to subtag down each tag's lineage.
 * `removeTags` leaves a tag out, with its subtags. Returns the tag nodes too.
 */
export function edgesOf(pages: Pages, settings: Settings): { links: SimpleLink[]; tags: NodeId[] } {
  const links: SimpleLink[] = []
  for (const [source, page] of pages) {
    for (const target of page.links) {
      if (target !== source && pages.has(target)) links.push({ source, target, type: "post-post" })
    }
  }
  if (!settings.showTags) return { links, tags: [] }

  const removed = underAny(settings.removeTags)
  const tags = new Set<NodeId>()
  for (const [source, page] of pages) {
    for (const tag of page.tags) {
      if (removed(tag)) continue
      // Up the tag's lineage, until a tag already seen, whose own lineage is in already.
      for (const t of lineageOf(tag)) {
        const id = tagNodeId(t)
        if (tags.has(id)) break
        tags.add(id)
        const parent = parentOf(t)
        if (parent !== null) links.push({ source: tagNodeId(parent), target: id, type: "tag-tag" })
      }
      // A tag's description page carries its own tag, which would be an edge to itself.
      const target = tagNodeId(tag)
      if (target !== source) links.push({ source, target, type: "tag-post" })
    }
  }
  return { links, tags: [...tags] }
}

/**
 * The nodes a graph shows: the current page and everything within `depth` edges of it, or with a
 * negative depth, every page and tag.
 */
export function neighbourhoodOf(
  current: NodeId,
  links: SimpleLink[],
  pages: Pages,
  tags: NodeId[],
  settings: Settings,
): Set<NodeId> {
  if (settings.depth < 0) return new Set([...pages.keys(), ...(settings.showTags ? tags : [])])
  const adjacent = new Map<NodeId, NodeId[]>()
  const connect = (a: NodeId, b: NodeId) => {
    if (!adjacent.has(a)) adjacent.set(a, [])
    adjacent.get(a)!.push(b)
  }
  for (const { source, target } of links) {
    connect(source, target)
    connect(target, source)
  }
  const found = new Set<NodeId>([current])
  let frontier = [current]
  for (let distance = 0; distance < settings.depth && frontier.length > 0; distance++) {
    const next: NodeId[] = []
    for (const id of frontier) {
      for (const neighbour of adjacent.get(id) ?? []) {
        if (!found.has(neighbour)) {
          found.add(neighbour)
          next.push(neighbour)
        }
      }
    }
    frontier = next
  }
  return found
}

export function nodesOf(neighbourhood: Set<NodeId>, pages: Pages, settings: Settings): NodeData[] {
  const isPrivate = underAny(settings.privateTags)
  return [...neighbourhood].map((id) => {
    const page = pages.get(id)
    const tag = isTagId(id)
    const tags = page?.tags ?? []
    return {
      id,
      text: tag ? `#${id.split("/").pop()}` : (page?.title ?? id),
      tags,
      tag,
      private: !tag && tags.some(isPrivate),
      primary: tag ? id.slice("tags/".length) : (page?.primary ?? null),
      href: hrefOf(id),
    }
  })
}

/** The nodes, with every edge between two of them. */
export function graphDataOf(nodes: NodeData[], links: SimpleLink[]): GraphData {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  return {
    nodes,
    links: links
      .filter((link) => byId.has(link.source) && byId.has(link.target))
      .map((link) => ({
        source: byId.get(link.source)!,
        target: byId.get(link.target)!,
        type: link.type,
      })),
  }
}

/**
 * How many pages each tag node is over in a graph: its own edges to pages, and its subtags'
 * (v4's `buildFilteredTagCountMap`). A tag node's size grows with it.
 */
export function tagCountsOf(data: GraphData): Map<NodeId, number> {
  const direct = new Map<NodeId, number>()
  const children = new Map<NodeId, NodeId[]>()
  for (const node of data.nodes) if (node.tag) direct.set(node.id, 0)
  for (const link of data.links) {
    if (link.type === "tag-tag") {
      if (!children.has(link.source.id)) children.set(link.source.id, [])
      children.get(link.source.id)!.push(link.target.id)
    } else if (link.type === "tag-post") {
      const tag = link.source.tag ? link.source.id : link.target.id
      direct.set(tag, (direct.get(tag) ?? 0) + 1)
    }
  }
  const total = new Map<NodeId, number>()
  const count = (id: NodeId): number => {
    if (total.has(id)) return total.get(id)!
    total.set(id, 0)
    const sum =
      (direct.get(id) ?? 0) + (children.get(id) ?? []).reduce((n, child) => n + count(child), 0)
    total.set(id, sum)
    return sum
  }
  for (const id of direct.keys()) count(id)
  return total
}

export interface FilterState {
  timePeriod: TimePeriod
  includePrivate: boolean
}

/** The earliest date a time period keeps, or null for all of them. */
export function cutoffOf(period: TimePeriod): Date | null {
  if (period === "all") return null
  const cutoff = new Date()
  if (period === "year") cutoff.setFullYear(cutoff.getFullYear() - 1)
  else cutoff.setMonth(cutoff.getMonth() - 1)
  return cutoff
}

// Whether a page node passes the filters. A tag always does, until it is left with no pages.
function passes(node: NodeData, pages: Pages, state: FilterState, cutoff: Date | null): boolean {
  if (node.tag) return true
  const page = pages.get(node.id)
  if (!page) return true
  if (!state.includePrivate && node.private) return false
  return !(cutoff && page.date && page.date < cutoff)
}

/**
 * The global graph, filtered: the pages that pass, the edges between them, and the tags still over
 * a page, directly or through a subtag (v4's `filterGraphData`).
 */
export function filtered(data: GraphData, pages: Pages, state: FilterState): GraphData {
  const cutoff = cutoffOf(state.timePeriod)
  const kept = new Set(
    data.nodes.filter((node) => passes(node, pages, state, cutoff)).map((node) => node.id),
  )
  const links = data.links.filter((link) => kept.has(link.source.id) && kept.has(link.target.id))

  const parents = new Map<NodeId, NodeId[]>()
  const alive = new Set<NodeId>()
  for (const link of links) {
    if (link.type === "tag-tag") {
      if (!parents.has(link.target.id)) parents.set(link.target.id, [])
      parents.get(link.target.id)!.push(link.source.id)
    }
  }
  const keepAlive = (id: NodeId) => {
    if (alive.has(id)) return
    alive.add(id)
    for (const parent of parents.get(id) ?? []) keepAlive(parent)
  }
  for (const link of links) {
    if (link.type !== "tag-post") continue
    if (link.source.tag) keepAlive(link.source.id)
    if (link.target.tag) keepAlive(link.target.id)
  }
  for (const node of data.nodes) if (node.tag && !alive.has(node.id)) kept.delete(node.id)

  return {
    nodes: data.nodes.filter((node) => kept.has(node.id)),
    links: links.filter((link) => kept.has(link.source.id) && kept.has(link.target.id)),
  }
}

/** How many pages a time period would show (v4's `countPostsInPeriod`). */
function pagesIn(
  data: GraphData,
  pages: Pages,
  period: TimePeriod,
  includePrivate: boolean,
): number {
  const cutoff = cutoffOf(period)
  return data.nodes.filter(
    (node) =>
      !node.tag &&
      pages.has(node.id) &&
      passes(node, pages, { timePeriod: period, includePrivate }, cutoff),
  ).length
}

/**
 * The narrowest time period, trying `order` from narrowest to widest, that shows at least
 * `minPosts` pages; the widest otherwise (v4's `resolveTimePeriod`).
 */
export function adaptivePeriod(
  data: GraphData,
  pages: Pages,
  { minPosts, order }: { minPosts: number; order?: TimePeriod[] },
  includePrivate: boolean,
): TimePeriod {
  const periods: TimePeriod[] = order?.length ? order : ["month", "year", "all"]
  return (
    periods.find((period) => pagesIn(data, pages, period, includePrivate) >= minPosts) ??
    periods[periods.length - 1]
  )
}
