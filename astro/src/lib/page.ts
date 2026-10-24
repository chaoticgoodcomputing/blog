// What a page tells the layouts about itself. Every page passes the same object to
// src/layouts/Page.astro, which passes it on to src/layouts/Base.astro, and a feature in either
// layout reads what it needs from it. A feature never adds a prop of its own to a layout.

import type { MarkdownHeading } from "astro"
import { getNotes, isPrivate, type Note, type UnpublishedNote } from "./notes.ts"
import { TAGS_INDEX } from "./tags.ts"

/** Which page the site shell is around. A feature is on some kinds of page and not on others. */
export type PageKind = "note" | "home" | "tag" | "annotation" | "404" | "graph"

export interface PageProps {
  kind: PageKind
  /** The page's title, without the site's suffix. */
  title: string
  description?: string | undefined
  /**
   * The page's address from the site's root: a note's `url`, `tagUrl(tag)`, `/404`. The only
   * source of a page's address: `Astro.url.pathname` ends in `.html` in a build, since the site
   * builds one file per page (docs/adr/0003).
   */
  url: string
  /** The note the page shows: its own, or on a tag page the tag's description note. */
  note?: Note | UnpublishedNote | undefined
  /** The headings of the rendered body, from `render()`. */
  headings?: MarkdownHeading[] | undefined
  /** On a tag page, the tag, as a tag slug. */
  tag?: string | undefined
}

/**
 * The tag page at an address, from the site's root and not encoded, by its tag as a tag page's props
 * name it: a tag slug, or none for the tags index. Undefined at any other address.
 */
export function tagAt(url: string): Pick<PageProps, "tag"> | undefined {
  if (url === TAGS_INDEX) return { tag: undefined }
  if (!url.startsWith(`${TAGS_INDEX}/`)) return undefined
  return { tag: url.slice(TAGS_INDEX.length + 1) }
}

/**
 * Whether a page is an indexable page: one the site asks search engines to index, and lists in its
 * sitemap. A private page is not, nor is the tag page of a private tag or of a tag under one, nor
 * the 404 page. The page of a tag that only private pages carry is: it shows the tag's description
 * note, and lists no posts.
 */
export function isIndexable(page: Pick<PageProps, "kind" | "note" | "tag">): boolean {
  if (page.kind === "404") return false
  if (page.note?.isPrivate) return false
  return !page.tag || !isPrivate([page.tag])
}

/**
 * Whether the page at an address, from the site's root and not encoded, is an indexable page, for
 * what knows a page only by its address (the sitemap, search). It is `isIndexable`'s answer for the
 * note or the tag page there; undefined where there is neither, a page the rule says nothing of.
 */
export function isIndexableAt(url: string, notes: Note[] = getNotes()): boolean | undefined {
  const tagPage = tagAt(url)
  if (tagPage) return isIndexable({ kind: "tag", ...tagPage })
  const note = notes.find((each) => each.url === url)
  return note === undefined ? undefined : isIndexable({ kind: "note", note })
}
