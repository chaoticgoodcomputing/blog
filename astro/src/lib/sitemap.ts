// What the sitemap says of a page: whether it is listed, and when it was last modified. The
// sitemap integration knows a page only by its address (astro.config.ts), so that is what is asked
// here, and whether it is listed is `isIndexableAt`'s answer, the one `isIndexable` gives a page that
// has its props (./page.ts).

import { getNotes, noteOf, type Note, type UnpublishedNote } from "./notes.ts"
import { isIndexableAt, tagAt } from "./page.ts"
import { listedPosts } from "./post-listing.ts"
import { descriptionOf } from "./tag-pages.ts"
import { isUnderTag } from "./tags.ts"

/** The notes the sitemap is drawn from. The site's own are the notes query's. */
export interface SitemapNotes {
  /** The published notes. */
  notes: Note[]
  /** The note a path of the vault is, published or not. */
  noteOf: (file: string) => Note | UnpublishedNote | undefined
}

export interface SitemapEntry {
  /** When the page last changed. A page that no note says anything about has no such date. */
  lastModified: Date | undefined
}

const newest = (dates: Date[]): Date | undefined =>
  dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : undefined

/**
 * The sitemap's entry for the page at an address, or undefined for a page that is not an indexable
 * page. The address is whole, as the sitemap integration gives it.
 */
export function sitemapEntry(
  address: string,
  { notes, noteOf: find }: SitemapNotes = { notes: getNotes(), noteOf },
): SitemapEntry | undefined {
  // An address writes a note's url percent-encoded.
  const url = decodeURI(new URL(address).pathname)

  if (isIndexableAt(url, notes) === false) return undefined

  // A tag page shows its tag's description note and lists the posts under the tag, so it changed
  // when the newest of them did; the tags index lists every post. Both are asked as the page asks
  // them. A tag page that shows neither is there for the private pages that carry its tag, and
  // changed when the newest of them did.
  const tagPage = tagAt(url)
  if (tagPage) {
    const { tag } = tagPage
    const description = tag === undefined ? undefined : descriptionOf(tag, find)
    const shown = [...listedPosts(tag, notes), ...(description ? [description] : [])]
    const carrying = tag === undefined ? [] : notes.filter((note) => note.tags.some((own) => isUnderTag(own, tag)))
    return { lastModified: newest((shown.length ? shown : carrying).map((note) => note.modified)) }
  }

  const note = notes.find((each) => each.url === url)
  if (note) return { lastModified: note.modified }

  return { lastModified: undefined }
}
