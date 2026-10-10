// Mirrors: the site's own pinned copies of the annotated documents, which the annotation viewer
// draws (docs/adr/2801). A mirror is saved in the vault's mirror directory, which git ignores, since
// the documents are somebody else's: by hand, or by `astro:mirrors` (scripts/pin-mirrors.ts). The
// site serves each one at the same path, which robots.txt tells crawlers to skip. The vault the site
// reads leaves out what git ignores (./vault.ts), so the mirrors integration
// (src/integrations/mirrors.ts) publishes them, as the attachments integration publishes the vault's
// own files.

import fs from "node:fs"
import path from "node:path"
import { annotationTarget } from "@chaoticgoodcomputing/obsidian-markdown"
import { documentFileName } from "./annotations.ts"
import { getNotes, type Note } from "./notes.ts"
import { VAULT_ROOT, slugFor } from "./vault.ts"

/** Where mirrors are kept in the vault, and served from on the site. public/robots.txt names it. */
export const MIRRORS = "assets/annotated-documents"

/**
 * What a document's mirror is called: the file name its address ends in, written as a slug writes a
 * name, a space as `-`. Undefined for a document that is not on the web, or whose address names no
 * file.
 */
export function mirrorName(target: string): string | undefined {
  if (!URL.canParse(target)) return undefined
  const { protocol } = new URL(target)
  if (protocol !== "http:" && protocol !== "https:") return undefined
  const file = documentFileName(target)
  return file ? slugFor(file) : undefined
}

/** Where a mirror is kept, in the vault at `root`. */
export const mirrorFile = (name: string, root: string = VAULT_ROOT): string => path.join(root, MIRRORS, name)

/**
 * The address the site serves a document's mirror at, from the site's root and not encoded, when
 * the vault at `root` has one saved. Undefined when it has none.
 */
export function mirrorOf(target: string, root: string = VAULT_ROOT): string | undefined {
  const name = mirrorName(target)
  if (!name || !fs.existsSync(mirrorFile(name, root))) return undefined
  return `/${MIRRORS}/${name}`
}

/** The address of the mirror of a note's annotated document, when it is an annotation page and the vault has one. */
export function mirrorFor(note: Pick<Note, "frontmatter">): string | undefined {
  const target = annotationTarget(note.frontmatter)
  return target === undefined ? undefined : mirrorOf(target)
}

/**
 * The mirrors the site publishes, by address, each with its file: those of the annotated documents
 * of the published notes, that the vault has saved.
 */
export function publishedMirrors(): Map<string, string> {
  const published = new Map<string, string>()
  for (const note of getNotes()) {
    const address = mirrorFor(note)
    if (address) published.set(address, path.join(VAULT_ROOT, address))
  }
  return published
}

/**
 * Whether what a host answered with is a PDF: its header within the first kilobyte, where readers
 * look for it. A login page or a bot check must not be saved in a document's place.
 */
export const isPdf = (bytes: Uint8Array): boolean => Buffer.from(bytes.subarray(0, 1024)).includes("%PDF-")

/**
 * Which of `targets`, documents with no mirror, may be saved: each but those whose file names are
 * one, which would share a mirror, so that one page would show the other's document. Those are
 * listed, by the name they share, and none of them is saved.
 */
export function mirrorsToSave(targets: string[]): { save: string[]; clashing: [string, string[]][] } {
  const byName = Map.groupBy(targets, (target) => mirrorName(target)!)
  const clashing = [...byName].filter(([, sharing]) => sharing.length > 1)
  return { save: [...byName.values()].filter((sharing) => sharing.length === 1).flat(), clashing }
}

/**
 * The annotated documents of the published notes that could be mirrored and are not: on the web,
 * with a file name, and with no mirror saved. Each one's page shows its annotations without it.
 */
export function unmirroredDocuments(): string[] {
  const targets = getNotes().map((note) => annotationTarget(note.frontmatter))
  return [...new Set(targets)].filter((target): target is string => target !== undefined && mirrorName(target) !== undefined && !mirrorOf(target))
}
