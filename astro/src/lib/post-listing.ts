// What a post listing lists: the site's posts, or on a tag page those under its tag, in one of two
// orders: newest first, or most central first. A private page is in no listing, whatever
// `site.private` says of other features: a listing that marked one would still be a list of the
// site's private pages. A fragment (`site.fragments`) is in the tag pages' listings, not the home page's.

import { getNoteIndex, getNotes, isFragment, isHomeNote, newestFirst, tagsOf, type Note, type NoteIndex } from "./notes.ts"
import { lists, postListing } from "../site.config.ts"
import type { ListingPageConfig, ListingPageKind, ListsConfig, Paging, PostListingConfig, PostOrder } from "../site.config.types.ts"
import { isUnderTag } from "./tags.ts"

/**
 * The posts a listing shows, newest first: every post, or with `tag` those carrying it or a tag
 * under it. The index note is the home page, and not one of its own posts. A fragment is listed on
 * its tags' pages, and not on the home page.
 */
export function listedPosts(tag?: string, notes: Note[] = getNotes()): Note[] {
  return notes
    .filter((note) => !note.isPrivate && !isHomeNote(note))
    .filter((note) => tag !== undefined || !isFragment(note.tags))
    .filter((note) => tag === undefined || note.tags.some((own) => isUnderTag(own, tag)))
    .sort(newestFirst)
}

/**
 * How many posts are under each tag, which is how many its tag page lists: what a tag badge's count
 * says. A tag no post is under has none. A fragment counts under its tags, as their pages list it.
 */
export function postCounts(notes: Note[] = getNotes()): Map<string, number> {
  const counts = new Map<string, number>()
  const tagged = notes.filter((note) => !note.isPrivate && !isHomeNote(note))
  for (const [tag, use] of tagsOf(tagged)) counts.set(tag, use.under.length)
  return counts
}

/**
 * How many posts link to each post, an embed counting as a link: its backlinks from posts alone. A
 * link from a private page, the home page, a tag description note or the post itself doesn't count,
 * so neither does one only a private page can see. Keyed by the post's address; a post no other
 * post links to has none.
 */
export function postBacklinkCounts(index: NoteIndex = getNoteIndex()): Map<string, number> {
  const posts = listedPosts(undefined, index.notes)
  const isPost = new Set(posts.map((post) => post.url))
  const counts = new Map<string, number>()
  for (const source of posts) {
    for (const { url } of index.outlinks(source)) {
      if (isPost.has(url)) counts.set(url, (counts.get(url) ?? 0) + 1)
    }
  }
  return counts
}

export interface CentralityOptions {
  /** The notes index the posts and their links are read from. The site's by default. */
  index?: NoteIndex
  /** How many mentions each note has, by its address (`mentionCounts`). None by default. */
  mentions?: Map<string, number>
  /** What one mention is worth beside one backlink from a post. The site's by default. */
  mentionWeight?: number
}

/**
 * The central posts a listing shows: the posts other posts link to, or other sites mention, the
 * most central first, then newest first. A post's centrality is its backlinks from posts, and its
 * mentions, each worth `mentionWeight` backlinks. With `tag`, the posts under it, still counting
 * backlinks from every post of the site.
 */
export function centralPosts(tag?: string, options: CentralityOptions = {}): Note[] {
  const { index = getNoteIndex(), mentions = new Map(), mentionWeight = postListing.mentionWeight } = options
  const backlinks = postBacklinkCounts(index)
  const score = (note: Note) => (backlinks.get(note.url) ?? 0) + mentionWeight * (mentions.get(note.url) ?? 0)
  return listedPosts(tag, index.notes)
    .filter((note) => score(note) > 0)
    .sort((a, b) => score(b) - score(a) || newestFirst(a, b))
}

/** One listing as a kind of page sets it out: its order, its heading, and its paging. */
export interface ResolvedListing extends Paging {
  order: PostOrder
  title: string
  /** The tag its posts are narrowed to on this kind of page, when it says one. */
  tag?: string
}

/**
 * How a kind of page sets out the post listings: its layout, and each listing with its paging, the
 * page's for it, else the listing's own, else every list's (`lists`), a setting at a time; and its
 * heading and the tag it is narrowed to, where the page says.
 */
export function listingsOn(
  kind: ListingPageKind,
  config: PostListingConfig = postListing,
  defaults: ListsConfig = lists,
): { layout: ListingPageConfig["layout"]; listings: ResolvedListing[] } {
  const page = config.pages[kind]
  return {
    layout: page.layout,
    listings: config.listings.map(({ order, title, show, more }) => {
      const own = page.paging?.[order]
      const here = page.listings?.[order]
      return {
        order,
        title: here?.title ?? title,
        ...(here?.tag !== undefined && { tag: here.tag }),
        show: own?.show ?? show ?? defaults.show,
        more: own?.more ?? more ?? defaults.more,
      }
    }),
  }
}
