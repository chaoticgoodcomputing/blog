// The local service's API: the fake service (src/service.ts) for the whole vault, not one note. Its
// notes are found here: a page's by its annotation target, an annotation's by the vault's index of
// block ids, and the first annotation of a page makes its note. Nothing here reaches Obsidian: the
// notes come through `VaultNotes`, so the same service runs in the plugin and in the tests.

import { readNote } from "@chaoticgoodcomputing/web-annotations"
import type { Page } from "./new-notes.ts"
import { createService, type FoundNote, type NoteStore, type Notes, type Service, type ServiceOptions } from "./service.ts"

export type { Page } from "./new-notes.ts"

/** An annotation note, by its path in the vault, and its annotation target's address. */
export interface AnnotationNote {
  path: string
  target: string
}

/** The vault's annotation notes, as the local service reads and makes them. */
export interface VaultNotes {
  /** Every annotation note whose target is an address, now. */
  list(): AnnotationNote[]
  /**
   * The notes whose `^id` blocks include `id`, by the vault's index, without reading them. The index
   * may be a moment behind a note just written.
   */
  withBlock(id: string): string[]
  /** Where a note is read and written. */
  store(path: string): NoteStore
  /** Makes a page's annotation note, and gives back its path. */
  create(page: Page): Promise<string>
  /** A link to an annotation of a note, as the vault writes one. */
  linkTo?(path: string, id: string): string
}

export interface VaultServiceOptions extends Omit<ServiceOptions, "notes" | "apiUrl"> {
  notes: VaultNotes
  /** Where the API is, as the client calls it. Ends with `/`. */
  apiUrl: string
}

/**
 * An address, so that two which name the same document compare equal: without its fragment, its
 * scheme and host in lower case, its path without a trailing `/`. One that is not a URL (a PDF's
 * `urn:x-pdf:` fingerprint) as it is.
 */
export function normalizeAddress(address: string): string {
  try {
    const url = new URL(address.trim())
    url.hash = ""
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "")
    return url.href
  } catch {
    return address.trim()
  }
}

/**
 * The vault's notes, as the service finds them. Annotations it wrote are remembered by the note they
 * went to, for while the vault's index is behind; a note found by either is read to be sure it holds
 * the annotation, so a renamed note's old path is passed over.
 */
export function notesOfVault(notes: VaultNotes): Notes {
  const written = new Map<string, string>()

  const found = (path: string): FoundNote => {
    const store = notes.store(path)
    const linkTo = notes.linkTo
    return {
      read: () => store.read(),
      update: async (change) =>
        store.update((text) => {
          const changed = change(text)
          for (const annotation of readNote(changed).annotations) written.set(annotation.blockId, path)
          return changed
        }),
      title: () => path.replace(/^.*\//, "").replace(/\.md$/i, ""),
      linkTo: linkTo && ((id) => linkTo(path, id)),
    }
  }

  const holds = async (path: string, id: string) => {
    try {
      return readNote(await notes.store(path).read()).annotations.some((annotation) => annotation.blockId === id)
    } catch {
      return false
    }
  }

  return {
    async forPage(addresses) {
      const wanted = new Set(addresses.filter(Boolean).map(normalizeAddress))
      const note = notes
        .list()
        .filter((note) => wanted.has(normalizeAddress(note.target)))
        .sort((a, b) => a.path.localeCompare(b.path))[0]
      return note && found(note.path)
    },

    async forAnnotation(id) {
      const remembered = written.get(id)
      const candidates = [...(remembered ? [remembered] : []), ...notes.withBlock(id).filter((path) => path !== remembered)]
      for (const path of candidates) if (await holds(path, id)) return found(path)
      if (remembered) written.delete(id)
      return undefined
    },

    async create(page) {
      return found(await notes.create(page))
    },
  }
}

export function createVaultService(options: VaultServiceOptions): Service {
  const { notes, ...rest } = options
  return createService({ ...rest, notes: notesOfVault(notes) })
}
