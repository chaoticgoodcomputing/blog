// What a post listing lists: the site's posts, newest first, or on a tag page those under its tag.
// A private page is in no listing, whatever `site.private` says of other features: a listing that
// marked one would still be a list of the site's private pages.

import { getNotes, isHomeNote, newestFirst, tagsOf, type Note } from "./notes.ts"
import { isUnderTag } from "./tags.ts"

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
