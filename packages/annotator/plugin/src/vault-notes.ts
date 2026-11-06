// The vault's annotation notes, as the local service reads and makes them (src/vault-service.ts):
// found by Obsidian's index of their properties, read and written through the vault.

import { type App, moment, normalizePath, TFile } from "obsidian"
import { newNote, notePath, type Page, pageVariables } from "./new-notes.ts"
import type { NoteStore } from "./service.ts"
import { targetOf } from "./target.ts"
import type { AnnotationNote, VaultNotes } from "./vault-service.ts"

export interface VaultNotesOptions {
  /** Looked in for a target that names no file (the plugin's default path setting). */
  defaultPath: () => string
  /**
   * Where a page's new note goes: a path pattern (src/new-notes.ts) from the vault's root, or, empty,
   * its title, where Obsidian puts new notes.
   */
  path: () => string
  /** The note a page's new note is made from, a web page's or a PDF's: a note of the vault, or, empty, none. */
  template: (page: Page) => string
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

  /** The template's text, or none when the settings name none; one they name that isn't there is told of, and skipped. */
  async function templateText(page: Page): Promise<string | undefined> {
    const name = options.template(page).trim()
    if (!name) return undefined
    const file = app.metadataCache.getFirstLinkpathDest(name.replace(/\.md$/i, ""), "")
    if (file) return app.vault.read(file)
    console.warn(`Annotator: no template ${name} for a new note; made it without one.`)
    return undefined
  }

  /** Makes each folder of a path that isn't there yet, from the vault's root down. */
  async function createFolders(parts: string[]) {
    for (let i = 1; i <= parts.length; i++) {
      const folder = parts.slice(0, i).join("/")
      if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder)
    }
  }

  /**
   * Runs Templater's commands (`<% %>`) in a new note, when Templater is on, as its "Replace
   * templates in the active file" command does. Its own setting may run them as the note is made
   * too: a second run finds none left.
   */
  async function runTemplater(file: TFile) {
    const templater = (app as any).plugins?.plugins?.["templater-obsidian"]?.templater
    if (typeof templater?.overwrite_file_commands !== "function") return
    try {
      await templater.overwrite_file_commands(file)
    } catch (error) {
      console.error("Annotator: Templater, on a new note", error)
    }
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
      const today = moment().format("YYYY-MM-DD")
      const pattern = options.path().trim()
      const relative = notePath(pattern, pageVariables(page, today))
      const base = normalizePath(`${pattern ? "" : app.fileManager.getNewFileParent("").path}/${relative}`)
      await createFolders(base.split("/").slice(0, -1))
      let path = `${base}.md`
      for (let n = 2; app.vault.getAbstractFileByPath(path); n++) path = `${base} ${n}.md`
      const template = await templateText(page)
      const file = await app.vault.create(path, newNote(page, today, template))
      made.set(path, page.uri)
      if (template?.includes("<%")) await runTemplater(file)
      return path
    },

    linkTo(path: string, id: string): string {
      return app.fileManager.generateMarkdownLink(fileAt(path), "", `#^${id}`)
    },
  }
}
