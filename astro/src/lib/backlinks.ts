// A note's backlinks, the pages that link to it, and its outlinks, the pages it links to, an
// embed counting as a link, as the vault's metadata cache has them. Which of them a reader is shown,
// and in what order, is the site's: a private page is left out or marked, as site configuration's
// `private.backlinks` says, for both.

import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { site } from "../site.config.ts"
import type { PrivateTreatment } from "../site.config.types.ts"
import { newestFirst, noteOf, type NoteFacts, type NoteIndex } from "./notes.ts"
import { getVault } from "./vault.ts"

/** One page that links to a note, or that a note links to, as the links panel lists it. */
export interface Backlink {
  title: string
  url: string
  /** Its date, which the panel shows under its title, before its summary. Undated pages have none. */
  date?: Date | undefined
  /** Its summary (its description, else its first paragraph), which the panel shows under its title. */
  description?: string | undefined
  /** Whether it is a private page, which the panel marks. */
  isPrivate: boolean
}

export interface BacklinkOptions {
  /** How a private page is treated. The site's `private.backlinks` by default. */
  treatment?: PrivateTreatment
  /** The vault and its notes' index. The site's by default; a test passes a vault of its own. */
  vault?: Vault
  index?: NoteIndex
}

/**
 * The pages that link to or embed a note, each once, in the panel's order (`listed`). A note that
 * links here and has no address of its own, such as a drawing, has nothing to link back to, and is
 * not among them.
 */
export function backlinksOf(note: NoteFacts, options: BacklinkOptions = {}): Backlink[] {
  const vault = options.vault ?? getVault()
  return listed([...vault.metadataCache.getBacklinksForFile(note.file).keys()], options)
}

/**
 * The pages a note links to or embeds, each once, in the panel's order (`listed`). Itself, and a
 * note it links to that has no address of its own, such as a drawing, are not among them.
 */
export function outlinksOf(note: NoteFacts, options: BacklinkOptions = {}): Backlink[] {
  const vault = options.vault ?? getVault()
  const files = Object.keys(vault.metadataCache.resolvedLinks[note.file.path] ?? {})
  return listed(files.filter((file) => file !== note.file.path), options)
}

/**
 * The pages at `files` as the panel lists them: those with an address, a private one left out or
 * kept as `treatment` says; public pages first, then newest first by date, by title on the same
 * day, and undated pages, such as tag pages, after every dated one (`newestFirst`).
 */
function listed(files: string[], { treatment = site.private.backlinks, index }: BacklinkOptions): Backlink[] {
  const lookup = (file: string) => (index ? index.byPath.get(file) : noteOf(file))
  return files
    .flatMap((file) => {
      const page = lookup(file)
      return page?.url ? [{ page, url: page.url }] : []
    })
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
})
