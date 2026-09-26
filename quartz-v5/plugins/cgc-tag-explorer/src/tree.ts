// What the explorer shows, worked out from what the cgc-tags engine publishes on every page's
// `fileData.cgcTags` (ADR-0002): the tree of tags, which the component renders into every page, and
// the pages under each tag, which the emitter writes for the browser to fill in as tags open
// (docs/adr/0001).
import { getDate } from "@quartz-community/utils/sort"
import { parentOf, type TagProperties, type TagsData } from "@chaoticgoodcomputing/tags-core"
import type { QuartzPluginData } from "@quartz-community/types"
import type { Settings, TagSort } from "./options"

export type PageData = QuartzPluginData & Record<string, unknown>

/** One tag in the tree. */
export interface TagNode {
  tag: string
  /** The published properties: the tag colour's property name and the icon id. */
  properties: TagProperties
  /** How many pages are under the tag, its subtags' included, each once. */
  count: number
  children: TagNode[]
}

/**
 * The pages under each tag, as the emitter writes them: every page once, and each tag's list of the
 * pages that carry it, by their place in `pages`, already in order.
 */
export interface PagesIndex {
  pages: { slug: string; title: string; private?: true }[]
  tags: Record<string, number[]>
}

/** Where the emitter writes the index, relative to the site's output. */
export const PAGES_INDEX = "static/cgcTagExplorer.json"

const tagsOf = (file: PageData) => file.cgcTags as TagsData

// The pages the explorer lists: every page the engine has published tags for, less those a site
// marks unlisted (`unlisted-pages`), which stock content-index leaves out too, and, when the site
// leaves them out (`excludePrivate`), the private pages. Those then count under no tag, and no tag
// only they carry makes the tree.
const listed = (files: PageData[], settings: Settings) =>
  files.filter(
    (file) =>
      file.cgcTags !== undefined &&
      file.unlisted !== true &&
      !(settings.excludePrivate && settings.isPrivate(tagsOf(file).ancestors)),
  )

const byName = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })

// v4's tag orders, each settling ties A→Z.
const ORDERS: Record<TagSort, (a: TagNode, b: TagNode) => number> = {
  "count-desc": (a, b) => b.count - a.count || byName(a.tag, b.tag),
  "count-asc": (a, b) => a.count - b.count || byName(a.tag, b.tag),
  alphabetical: (a, b) => byName(a.tag, b.tag),
  "alphabetical-reverse": (a, b) => byName(b.tag, a.tag),
}

/** Every tag in the corpus but the excluded ones, as a tree of top-level tags, each level in order. */
export function treeOf(files: PageData[], settings: Settings): TagNode[] {
  const nodes = new Map<string, TagNode>()
  for (const file of listed(files, settings)) {
    for (const [tag, properties] of Object.entries(tagsOf(file).ancestors)) {
      if (settings.excluded(tag)) continue
      const node = nodes.get(tag) ?? { tag, properties, count: 0, children: [] }
      node.count++
      nodes.set(tag, node)
    }
  }
  const top: TagNode[] = []
  // A page is under every ancestor of its tags, so each tag's parent is in the map, unless the
  // parent is excluded, and then so is the tag.
  for (const node of nodes.values()) {
    const parent = parentOf(node.tag)
    if (parent === null) top.push(node)
    else nodes.get(parent)?.children.push(node)
  }
  const order = ORDERS[settings.tagSort]
  const sort = (level: TagNode[]) => {
    level.sort(order)
    level.forEach((node) => sort(node.children))
    return level
  }
  return sort(top)
}

// A tag's pages as v4 listed them: public before private, then newest first, pages with no date
// last, and pages of one date A→Z by title (#42 restored upstream's A→Z; v4 had Z→A).
function byPage(a: Listed, b: Listed): number {
  if (a.private !== b.private) return a.private ? 1 : -1
  if (a.date !== b.date) {
    if (a.date === undefined) return 1
    if (b.date === undefined) return -1
    return b.date - a.date
  }
  return byName(a.title, b.title)
}

interface Listed {
  index: number
  title: string
  private: boolean
  date: number | undefined
}

/** The pages under each tag the tree shows: those that carry the tag itself, in order. */
export function pagesIndexOf(files: PageData[], settings: Settings): PagesIndex {
  const index: PagesIndex = { pages: [], tags: {} }
  const lists = new Map<string, Listed[]>()
  for (const file of listed(files, settings)) {
    const data = tagsOf(file)
    const own = Object.keys(data.tags).filter((tag) => !settings.excluded(tag))
    if (own.length === 0) continue
    const title = String(file.frontmatter?.title ?? file.slug)
    const isPrivate = settings.isPrivate(data.ancestors)
    const page: Listed = {
      index: index.pages.length,
      title,
      private: isPrivate,
      date: getDate(file)?.getTime(),
    }
    index.pages.push({
      slug: file.slug as string,
      title,
      ...(isPrivate && { private: true as const }),
    })
    for (const tag of own) lists.set(tag, [...(lists.get(tag) ?? []), page])
  }
  for (const [tag, pages] of [...lists].sort(([a], [b]) => byName(a, b))) {
    index.tags[tag] = pages.sort(byPage).map((page) => page.index)
  }
  return index
}
