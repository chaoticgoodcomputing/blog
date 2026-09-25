// The graph's pages: its own index, fetched once per page load (docs/adr/0001), node ids, and the
// pages this reader has visited (v4 core/contentIndex.ts, core/tagIndex.ts, adapters/visited.ts).
import { tagOfPage } from "@chaoticgoodcomputing/tags-core"
import { GRAPH_INDEX, type GraphIndex } from "../graph-index"
import type { NodeId, Pages } from "./types"

/** The site's base path, as core writes it on <body>: empty at a domain's root and under `serve`. */
export const basePath = () => document.body.dataset.basepath ?? ""

/** A tag's node id. */
export const tagNodeId = (tag: string): NodeId => `tags/${tag}`

/** Whether a node id is a tag's. */
export const isTagId = (id: NodeId) => id.length > "tags/".length && id.startsWith("tags/")

/**
 * The node id of a slug, full or simple: its simple slug, where a tag's page, generated or a
 * description file, is the tag's node (tags-core's `tagOfPage`). `tags/` alone, the index of every
 * tag, is no tag.
 */
export function nodeIdOf(slug: string): NodeId {
  const bare = slug.replace(/^\/+/, "")
  // A simple slug keeps the trailing slash of a folder's index, `tags/<t>/`; a full one ends `index`.
  const tag = tagOfPage(bare.replace(/\/$/, ""))
  if (tag) return tagNodeId(tag)
  const simple = bare.replace(/(^|\/)index$/, "$1")
  return simple === "" ? "/" : simple
}

/** Where a node leads, under the site's base path. */
export const hrefOf = (id: NodeId) => `${basePath()}/${id === "/" ? "" : id}`

let loading: Promise<Pages> | null = null

/** The graph's index, as pages by node id. Fetched on first use, then kept for the page's life. */
export function loadPages(): Promise<Pages> {
  loading ??= fetch(`${basePath()}/${GRAPH_INDEX}`)
    .then((response) => {
      if (!response.ok) throw new Error(`${GRAPH_INDEX}: ${response.status}`)
      return response.json() as Promise<GraphIndex>
    })
    .then((index) => {
      const pages: Pages = new Map()
      for (const [slug, entry] of Object.entries(index)) {
        const id = nodeIdOf(slug)
        const date = entry.date ? new Date(entry.date) : null
        pages.set(id, {
          id,
          title: entry.title,
          links: entry.links.map(nodeIdOf),
          tags: entry.tags,
          date: date && !Number.isNaN(date.getTime()) ? date : null,
        })
      }
      return pages
    })
    .catch((err) => {
      // Try again on the next navigation.
      loading = null
      throw err
    })
  return loading
}

// v4's and stock's key, so a reader's history carries over.
const VISITED = "graph-visited"

/** The pages this reader has visited, by node id. Empty where storage is unavailable. */
export function visitedPages(): Set<NodeId> {
  try {
    return new Set(JSON.parse(localStorage.getItem(VISITED) ?? "[]"))
  } catch {
    return new Set()
  }
}

export function addVisited(id: NodeId) {
  try {
    const visited = visitedPages()
    visited.add(id)
    localStorage.setItem(VISITED, JSON.stringify([...visited]))
  } catch {
    // Private browsing, or storage blocked: the graph just doesn't remember.
  }
}
