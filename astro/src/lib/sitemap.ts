// What the sitemap says of a page: whether it is listed, and when it was last modified. The sitemap
// integration knows a page only by its address (astro.config.ts), so that is what is asked here, and
// whether it is listed is whether the page there is indexable (./site-pages.ts): no tag page is.

import type { NoteIndex } from "./notes.ts"
import { tagAt } from "./page.ts"
import { sitePageAt } from "./site-pages.ts"

export interface SitemapEntry {
  /** When the page last changed. A page that no note says anything about has no such date. */
  lastModified: Date | undefined
}

/**
 * The sitemap's entry for the page at an address, or undefined for a page that is not an indexable
 * page. The address is whole, as the sitemap integration gives it.
 */
export function sitemapEntry(address: string, index: NoteIndex): SitemapEntry | undefined {
  // An address writes a note's url percent-encoded.
  const url = decodeURI(new URL(address).pathname)

  if (sitePageAt(index, url)?.indexable === false) return undefined
  // An address under the tags index is a tag page's, which is never indexable, whether or not the
  // site has a page there.
  if (tagAt(url)) return undefined

  const note = index.notes.find((each) => each.url === url)
  return { lastModified: note?.modified }
}
