// A note's table of contents: its headings, from the list of headings Astro gives with a rendered
// page, each read the way the note writes it.
//
// Astro's list is the page's, so it also holds the headings of a note the page embeds, and it reads
// a heading's text once the page is rendered, when a formula in it is KaTeX's typesetting: its
// MathML, its TeX and its glyphs, run together. The vault's metadata cache has the note's own
// headings with their math as written, and a heading's anchor is the slug of that text
// (src/lib/math.ts), so the two are joined by the anchor.

import GithubSlugger from "github-slugger"
import type { MarkdownHeading } from "astro"
import type { NoteFacts } from "./notes.ts"

/** The deepest heading listed: a third-level heading is, a fourth-level one is not. */
const DEEPEST = 3

export interface TableOfContentsEntry {
  /** The heading's anchor on the page. */
  slug: string
  /** The heading as the note writes it, math as written. */
  text: string
  /** How far it is indented: none for the shallowest heading listed, one more for each level. */
  indent: number
}

/**
 * The entries of a note's table of contents: each of the note's own headings to the third level,
 * in the order of the page, given `headings`, the list Astro gives with the note's rendered page.
 * A note with no headings has none.
 */
export function tableOfContents(headings: MarkdownHeading[], note: NoteFacts): TableOfContentsEntry[] {
  // Each of the note's own headings by its anchor, numbered as Astro numbers a repeated one.
  const slugger = new GithubSlugger()
  const own = new Map((note.cache.headings ?? []).map(({ heading }) => [slugger.slug(heading), heading]))

  const listed = headings.filter((heading) => heading.depth <= DEEPEST && own.has(heading.slug))
  const shallowest = Math.min(...listed.map((heading) => heading.depth))
  return listed.map((heading) => ({
    slug: heading.slug,
    text: own.get(heading.slug)!,
    indent: heading.depth - shallowest,
  }))
}
