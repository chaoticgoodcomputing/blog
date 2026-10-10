// Which of the pages the build wrote the search index holds. The index is built from the written
// pages, which the search integration knows only by their addresses (src/integrations/search.ts),
// so that is what is asked here. The answer is `isIndexableAt`'s for a page that is a note's or a
// tag's (./page.ts), the sitemap's own; any other page, the 404 page or an alias redirect, is not
// searched.

import { getNotes, type Note } from "./notes.ts"
import { isIndexableAt } from "./page.ts"

/** Whether the page at an address, from the site's root and not encoded, is in the search index. */
export function isSearched(url: string, notes: Note[] = getNotes()): boolean {
  return isIndexableAt(url, notes) === true
}
