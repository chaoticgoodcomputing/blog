// The graph's own content index (docs/adr/0001): the plugin's published artifact, and what its
// browser runtime draws from. Stock content-index drops each page's date, which the global graph's
// time filter needs (FORK-LEDGER plugins/emitters/contentIndex.tsx), so the plugin publishes this. It
// also carries the icons the graph draws, so a page fetches none (docs/adr/0004).
// Types and plain data only: the runtime imports this file too.

/** Where the index lands, relative to the site's output. Part of the plugin's published contract. */
export const GRAPH_INDEX = "static/cgcGraph.json"

/** One page in the index. */
export interface GraphEntry {
  /** The page's title. */
  title: string
  /** The pages it links to, as Quartz resolves links: simple slugs, `/` for the site's index. */
  links: string[]
  /** Its tags, as the `cgc-tags` engine publishes them: normalised, in frontmatter order. */
  tags: string[]
  /**
   * Its primary tag, as the `cgc-tags` engine resolves it: the tag that paints its node. Absent for a
   * page with no tags.
   */
  primary?: string
  /**
   * Its date, as an ISO 8601 string: the date Quartz shows for it, by the site's `defaultDateType`.
   * Absent only for a page no date plugin dated.
   */
  date?: string
}

/** The index. */
export interface GraphIndex {
  /** Every authored page, keyed by its slug, as Quartz names it (`index`, `notes/a-note`). */
  pages: Record<string, GraphEntry>
  /**
   * Every icon a tag in the site is drawn with, keyed by its icon id (`mdi:robot`): an `<svg>`, drawn
   * when the site built, whose every mark is painted in `currentColor`.
   */
  icons: Record<string, string>
}
