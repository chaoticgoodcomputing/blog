// A note's backlinks: the pages that link to it, an embed counting as a link, as the vault's
// metadata cache has them. Which of them a reader is shown, and in what order, is the site's: a
// private page is left out or marked, as site configuration says.

import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { site } from "../site.config.ts"
import type { PrivateTreatment } from "../site.config.types.ts"
import { noteOf, type NoteFacts, type NoteIndex } from "./notes.ts"
import { getVault } from "./vault.ts"

/** One page that links to a note, as the backlinks panel lists it. */
export interface Backlink {
  title: string
  url: string
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
    .map(({ source, url }) => ({ title: source.title, url, isPrivate: source.isPrivate }))
}
