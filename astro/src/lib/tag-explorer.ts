// What the tag explorer shows: the tree of the site's tags, each with the notes under it, drawn
// into every page when the site builds.
//
// A private page is left out, or listed after the public pages with a mark, as the caller says. Left
// out, it is in no count and no list, so a tag only private pages carry, a private tag among them,
// has nothing under it and is not in the tree.

import type { PrivateTreatment } from "../site.config.types.ts"
import { isHomeNote, newestFirst, tagsOf, type Note } from "./notes.ts"
import { tagAncestors, withAncestors } from "./tags.ts"

/** One note as the explorer lists it. */
export interface ExplorerNote {
  title: string
  url: string
  /** Whether it is a private page, which the explorer marks. */
  isPrivate: boolean
}

/** One tag in the tree. */
export interface ExplorerTag {
  /** Its tag slug. */
  tag: string
  /** How many notes are under it: those that carry it or a tag under it, each once. */
  count: number
  /** The tags one level under it, in the tree's order. */
  children: ExplorerTag[]
  /**
   * The notes that carry the tag itself, listed after its children: public pages first, then
   * newest first, then by title. A note under a subtag is listed under the subtag only.
   */
  notes: ExplorerNote[]
}

// The tree's order at every level: the most notes first, then by tag slug.
const byCount = (a: ExplorerTag, b: ExplorerTag): number =>
  b.count - a.count || (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0)

// A tag's notes in the order they are listed.
const byListing = (a: Note, b: Note): number => Number(a.isPrivate) - Number(b.isPrivate) || newestFirst(a, b)

/**
 * The tag explorer's tree over `notes`, its top-level tags in order, with a private page left out or
 * marked. The home page is in no branch: it is not one of the posts under a tag, so a tag counts
 * what its tag page lists (src/lib/post-listing.ts).
 */
export function tagTree(notes: Note[], treatment: PrivateTreatment): ExplorerTag[] {
  const listed = notes.filter((note) => !isHomeNote(note) && (treatment === "mark" || !note.isPrivate))
  const nodes = new Map<string, ExplorerTag>()
  const tree: ExplorerTag[] = []
  // `tagsOf` holds every ancestor of a tag in use, and sorts a tag after its ancestors, so a tag's
  // parent is always in the map by the time the tag is reached.
  for (const { tag, own, under } of tagsOf(listed).values()) {
    const node: ExplorerTag = {
      tag,
      count: under.length,
      children: [],
      notes: [...own].sort(byListing).map(({ title, url, isPrivate }) => ({ title, url, isPrivate })),
    }
    nodes.set(tag, node)
    const parent = tagAncestors(tag).at(-1)
    ;(parent === undefined ? tree : nodes.get(parent)!.children).push(node)
  }
  for (const node of nodes.values()) node.children.sort(byCount)
  return tree.sort(byCount)
}

/**
 * The branches open on a page before the reader opens or closes any: those that lead to the page's
 * place in the tree. On a tag's page that is the tag; on any other, every tag the page is listed
 * under. Each once, sorted. A page the explorer does not list has no place in it.
 */
export function openAt(tree: ExplorerTag[], page: { url: string; tag?: string | undefined }): string[] {
  const places: string[] = []
  const walk = (nodes: ExplorerTag[]): void => {
    for (const node of nodes) {
      const here = page.tag === undefined ? node.notes.some((note) => note.url === page.url) : node.tag === page.tag
      if (here) places.push(node.tag)
      walk(node.children)
    }
  }
  walk(tree)
  return withAncestors(places)
}
