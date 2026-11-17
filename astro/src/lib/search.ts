// Which of the pages the build wrote the search index holds. The index is built from the written
// pages, which the search integration knows only by their addresses (src/integrations/search.ts),
// so that is what is asked here. A page is searched when it is discoverable (./site-pages.ts), a tag
// page among them, though no search engine is asked to index one; any other page, the 404 page or
// an alias redirect, is not.

import type { NoteIndex } from "./notes.ts"
import { sitePageAt } from "./site-pages.ts"

/** Whether the page at an address, from the site's root and not encoded, is in the search index. */
export function isSearched(url: string, index: NoteIndex): boolean {
  return sitePageAt(index, url)?.discoverable === true
}
