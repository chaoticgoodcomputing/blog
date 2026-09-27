// What the graph draws from, fetched once per page load: its own index (docs/adr/0001) and the
// quartz-tags engine's tag index (docs/adr/0004). Node ids, and the pages this reader has visited (v4
// core/contentIndex.ts, core/tagIndex.ts, adapters/visited.ts).
import { tagOfPage, type TagProperties } from "@chaoticgoodcomputing/tags-core"
import { GRAPH_INDEX, type GraphIndex } from "../graph-index"
import { IconImages } from "./icons"
import type { NodeId, Pages, Sources, Tags } from "./types"

/**
 * The quartz-tags engine's tag index, relative to the site's output: every tag in the site, with the
 * name of its colour property and its icon id. The engine's published contract (its README).
 */
const TAGS_INDEX = "static/cgcTags.json"

/** The site's base path, as core writes it on <body>: empty at a domain's root and under `serve`. */
export const basePath = () => document.body.dataset.basepath ?? ""

/** A tag's node id. */
export const tagNodeId = (tag: string): NodeId => `tags/${tag}`

/** Whether a node id is a tag's. */
export const isTagId = (id: NodeId) => id.length > "tags/".length && id.startsWith("tags/")

/** The tag whose node an id is, `tagNodeId`'s inverse, or null for a page's. */
export const tagOfNodeId = (id: NodeId): string | null =>
  isTagId(id) ? id.slice("tags/".length) : null

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

let loading: Promise<Pick<Sources, "pages" | "icons">> | null = null

/**
 * The graph's index, as pages by node id and the icons drawn on them. Fetched on first use, then kept
 * for the page's life.
 */
function loadIndex(): Promise<Pick<Sources, "pages" | "icons">> {
  loading ??= fetch(`${basePath()}/${GRAPH_INDEX}`)
    .then((response) => {
      if (!response.ok) throw new Error(`${GRAPH_INDEX}: ${response.status}`)
      return response.json() as Promise<GraphIndex>
    })
    .then((index) => {
      const pages: Pages = new Map()
      for (const [slug, entry] of Object.entries(index.pages)) {
        const id = nodeIdOf(slug)
        const date = entry.date ? new Date(entry.date) : null
        pages.set(id, {
          id,
          title: entry.title,
          links: entry.links.map(nodeIdOf),
          tags: entry.tags,
          primary: entry.primary ?? null,
          date: date && !Number.isNaN(date.getTime()) ? date : null,
        })
      }
      return { pages, icons: new IconImages(index.icons) }
    })
    .catch((err) => {
      // Try again on the next navigation.
      loading = null
      throw err
    })
  return loading
}

let loadingTags: Promise<Tags> | null = null

/**
 * The engine's tag index, as each tag's properties by tag. Fetched on first use, then kept for the
 * page's life. Without it the graph still draws, in the theme's colours alone.
 */
function loadTags(): Promise<Tags> {
  loadingTags ??= fetch(`${basePath()}/${TAGS_INDEX}`)
    .then((response) => {
      if (!response.ok) throw new Error(`${TAGS_INDEX}: ${response.status}`)
      return response.json() as Promise<Record<string, TagProperties>>
    })
    .then((index) => new Map(Object.entries(index)))
    .catch((err) => {
      console.error("cgc-graph: could not load the tag index; drawing without tag colours", err)
      loadingTags = null
      return new Map()
    })
  return loadingTags
}

/**
 * Everything the graphs draw from, the two indexes fetched side by side. Rejects only when the graph's
 * own index can't be had.
 */
export async function loadSources(): Promise<Sources> {
  const [index, tags] = await Promise.all([loadIndex(), loadTags()])
  return { ...index, tags }
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
