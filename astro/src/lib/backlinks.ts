// A note's backlinks, the pages that link to it, and its forward links, the pages it links to, an
// embed counting as a link, as the vault's metadata cache has them. Which of them a reader is shown,
// and in what order, is the site's: a private page is left out or marked, as site configuration's
// `private.backlinks` says, for both.

import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { site } from "../site.config.ts"
import type { PrivateTreatment } from "../site.config.types.ts"
import { noteOf, type NoteFacts, type NoteIndex } from "./notes.ts"
import { getVault } from "./vault.ts"

/** One page that links to a note, or that a note links to, as the links panel lists it. */
export interface Backlink {
  title: string
  url: string
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
 * The pages that link to or embed a note, each once: public pages first, then the most recently
 * changed, then by title. A note that links here and has no address of its own, such as a
 * drawing, has nothing to link back to, and is not among them.
 */
export function backlinksOf(note: NoteFacts, options: BacklinkOptions = {}): Backlink[] {
  const { treatment = site.private.backlinks, vault = getVault(), index } = options
  const lookup = (file: string) => (index ? index.byPath.get(file) : noteOf(file))
  return [...vault.metadataCache.getBacklinksForFile(note.file).keys()]
    .flatMap((file) => {
      const source = lookup(file)
      return source?.url ? [{ source, url: source.url }] : []
    })
    .filter(({ source }) => treatment === "mark" || !source.isPrivate)
    .sort(
      (a, b) =>
        Number(a.source.isPrivate) - Number(b.source.isPrivate) ||
        b.source.modified.getTime() - a.source.modified.getTime() ||
        a.source.title.localeCompare(b.source.title),
    )
    .map(({ source, url }) => linkTo(source, url))
}

/**
 * The pages a note links to or embeds, each once: public pages first, then in the order the note
 * first links to each. Itself, and a note that links here and has no address of its own, such as a
 * drawing, are not among them.
 */
export function forwardLinksOf(note: NoteFacts, options: BacklinkOptions = {}): Backlink[] {
  const { treatment = site.private.backlinks, vault = getVault(), index } = options
  const lookup = (file: string) => (index ? index.byPath.get(file) : noteOf(file))
  return Object.keys(vault.metadataCache.resolvedLinks[note.file.path] ?? {})
    .filter((file) => file !== note.file.path)
    .flatMap((file) => {
      const target = lookup(file)
      return target?.url ? [{ target, url: target.url }] : []
    })
    .filter(({ target }) => treatment === "mark" || !target.isPrivate)
    // A stable sort: in the note's order still, within the public pages and within the private.
    .sort((a, b) => Number(a.target.isPrivate) - Number(b.target.isPrivate))
    .map(({ target, url }) => linkTo(target, url))
}

const linkTo = (note: NoteFacts, url: string): Backlink => ({
  title: note.title,
  url,
  description: note.summary,
  isPrivate: note.isPrivate,
})
