// What a post listing lists: the site's posts, or on a tag page those under its tag, in one of two
// orders: newest first, or most central first. A private page is in no listing, whatever
// `site.private` says of other features: a listing that marked one would still be a list of the
// site's private pages.

import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { getNotes, isHomeNote, newestFirst, tagsOf, type Note } from "./notes.ts"
import { postListing } from "../site.config.ts"
import { isUnderTag } from "./tags.ts"
import { getVault } from "./vault.ts"

/**
 * The posts a listing shows, newest first: every post, or with `tag` those carrying it or a tag
 * under it. The index note is the home page, and not one of its own posts.
 */
export function listedPosts(tag?: string, notes: Note[] = getNotes()): Note[] {
  return notes
    .filter((note) => !note.isPrivate && !isHomeNote(note))
    .filter((note) => tag === undefined || note.tags.some((own) => isUnderTag(own, tag)))
    .sort(newestFirst)
}

/**
 * How many posts are under each tag, which is how many its tag page lists: what a tag badge's count
 * says. A tag no post is under has none.
 */
export function postCounts(notes: Note[] = getNotes()): Map<string, number> {
  const counts = new Map<string, number>()
  for (const [tag, use] of tagsOf(listedPosts(undefined, notes))) counts.set(tag, use.under.length)
  return counts
}

/**
 * How many posts link to each post, an embed counting as a link: its backlinks from posts alone. A
 * link from a private page, the home page, a tag description note or the post itself doesn't count,
 * so neither does one only a private page can see. Keyed by the post's address; a post no other
 * post links to has none.
 */
export function postBacklinkCounts(notes: Note[] = getNotes(), vault: Vault = getVault()): Map<string, number> {
  const posts = listedPosts(undefined, notes)
  const byPath = new Map(posts.map((post) => [post.file.path, post]))
  const counts = new Map<string, number>()
  for (const source of posts) {
    for (const target of Object.keys(vault.metadataCache.resolvedLinks[source.file.path] ?? {})) {
      const post = byPath.get(target)
      if (post && post !== source) counts.set(post.url, (counts.get(post.url) ?? 0) + 1)
    }
  }
  return counts
}

export interface CentralityOptions {
  /** The notes, and the vault their links are read from. The site's by default. */
  notes?: Note[]
  vault?: Vault
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
  const { notes = getNotes(), vault = getVault(), mentions = new Map(), mentionWeight = postListing.mentionWeight } = options
  const backlinks = postBacklinkCounts(notes, vault)
  const score = (note: Note) => (backlinks.get(note.url) ?? 0) + mentionWeight * (mentions.get(note.url) ?? 0)
  return listedPosts(tag, notes)
    .filter((note) => score(note) > 0)
    .sort((a, b) => score(b) - score(a) || newestFirst(a, b))
}
