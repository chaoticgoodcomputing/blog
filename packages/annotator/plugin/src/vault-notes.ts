// The vault's annotation notes, as the local service reads and makes them (src/vault-service.ts):
// found by Obsidian's index of their properties, read and written through the vault.

import { type App, moment, normalizePath, TFile } from "obsidian"
import type { NoteStore } from "./service.ts"
import { targetOf } from "./target.ts"
import { type AnnotationNote, newNote, noteName, type Page, type VaultNotes } from "./vault-service.ts"

export interface VaultNotesOptions {
  /** Looked in for a target that names no file (the plugin's default path setting). */
  defaultPath: () => string
  /** Where a page's new note goes: a folder of the vault, or, empty, where Obsidian puts new notes. */
  folder: () => string
}

export function vaultNotes(app: App, options: VaultNotesOptions): VaultNotes {
  // Notes just made, by path, with their targets: Obsidian's index has a new note's properties a
  // moment after the note, and the client asks for its page's annotations again at once.
  const made = new Map<string, string>()

  const fileAt = (path: string) => {
    const file = app.vault.getAbstractFileByPath(path)
    if (!(file instanceof TFile)) throw new Error(`No note ${path}`)
    return file
  }

  return {
    list(): AnnotationNote[] {
      const notes: AnnotationNote[] = []
      for (const file of app.vault.getMarkdownFiles()) {
        const target = targetOf(app, file, options.defaultPath())
        if (target?.kind === "url") {
          notes.push({ path: file.path, target: target.url })
          made.delete(file.path)
        }
      }
      for (const [path, target] of made) notes.push({ path, target })
      return notes
    },

    store(path: string): NoteStore {
      return {
        read: () => app.vault.read(fileAt(path)),
        update: async (change) => void (await app.vault.process(fileAt(path), change)),
      }
    },

    async create(page: Page): Promise<string> {
      const folder = normalizePath(options.folder().trim() || app.fileManager.getNewFileParent("").path)
      if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder)
      const name = noteName(page)
      let path = normalizePath(`${folder}/${name}.md`)
      for (let n = 2; app.vault.getAbstractFileByPath(path); n++) path = normalizePath(`${folder}/${name} ${n}.md`)
      await app.vault.create(path, newNote(page, moment().format("YYYY-MM-DD")))
      made.set(path, page.uri)
      return path
    },

    linkTo(path: string, id: string): string {
      return app.fileManager.generateMarkdownLink(fileAt(path), "", `#^${id}`)
    },
  }
}
