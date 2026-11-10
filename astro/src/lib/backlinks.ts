// A note's backlinks, the pages that link to it, and its outlinks, the pages it links to, an
// embed counting as a link, as the notes index has them. Which of them a reader is shown,
// and in what order, is the site's: a private page is left out or marked, as site configuration's
// `private.backlinks` says, for both.

import { site } from "../site.config.ts"
import type { PrivateTreatment } from "../site.config.types.ts"
import { annotatedFileType } from "./annotations.ts"
import { newestFirst, type LinkedNote, type NoteFacts, type NoteIndex } from "./notes.ts"

/** One page that links to a note, or that a note links to, as the related content lists it. */
export interface Backlink {
  title: string
  url: string
  /** Its date, which the panel shows under its title, before its summary. Undated pages have none. */
  date?: Date | undefined
  /** Its summary (its description, else its first paragraph), which the panel shows under its title. */
  description?: string | undefined
  /** Whether it is a private page, which the panel marks. */
  isPrivate: boolean
  /** For an annotation page, the kind of file it annotates, which the panel marks: `pdf`. */
  fileType?: string | undefined
  /** Its own tags, which the panel shows as tag badges, as the post listings do. */
  tags: string[]
}

export interface BacklinkOptions {
  /** How a private page is treated. The site's `private.backlinks` by default. */
  treatment?: PrivateTreatment
  /** The notes index the links are read from. */
  index: NoteIndex
}

/**
 * The pages that link to or embed a note, each once, in the panel's order (`listed`). A note that
 * links here and has no address of its own, such as a drawing, has nothing to link back to, and is
 * not among them.
 */
export function backlinksOf(note: NoteFacts, options: BacklinkOptions): Backlink[] {
  return listed(options.index.backlinks(note), options)
}

/**
 * The pages a note links to or embeds, each once, in the panel's order (`listed`). Itself, and a
 * note it links to that has no address of its own, such as a drawing, are not among them.
 */
export function outlinksOf(note: NoteFacts, options: BacklinkOptions): Backlink[] {
  return listed(options.index.outlinks(note), options)
}

/**
 * The pages of `pages` as the panel lists them: a private one left out or
 * kept as `treatment` says; public pages first, then newest first by date, by title on the same
 * day, and undated pages, such as tag pages, after every dated one (`newestFirst`).
 */
function listed(pages: LinkedNote[], { treatment = site.private.backlinks }: BacklinkOptions): Backlink[] {
  return pages
    .map((page) => ({ page, url: page.url }))
    .filter(({ page }) => treatment === "mark" || !page.isPrivate)
    .sort((a, b) => Number(a.page.isPrivate) - Number(b.page.isPrivate) || newestFirst(a.page, b.page))
    .map(({ page, url }) => linkTo(page, url))
}

const linkTo = (note: NoteFacts, url: string): Backlink => ({
  title: note.title,
  url,
  date: note.date,
  description: note.summary,
  isPrivate: note.isPrivate,
  fileType: annotatedFileType(note),
  tags: note.tags,
})
