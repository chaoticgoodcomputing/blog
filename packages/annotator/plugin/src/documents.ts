// Where the plugin keeps annotated documents' saved copies, and how it fetches them: the Obsidian
// side of annotator-documents.

import type { DocumentStore, Fetch } from "@chaoticgoodcomputing/annotator-documents"
import { type App, normalizePath, requestUrl } from "obsidian"

/** Whether a folder setting names a folder outside the vault, by an absolute path. */
export const isAbsolute = (folder: string) => folder.startsWith("/") || /^[A-Za-z]:[\\/]/.test(folder)

/**
 * The store for saved copies, in `folder`: a folder of the vault, through Obsidian; or, by an
 * absolute path, a folder anywhere, through Node's file system, which only Obsidian's desktop app has.
 */
export function documentStore(app: App, folder: string): DocumentStore {
  if (isAbsolute(folder)) return fileSystemStore(folder)
  const adapter = app.vault.adapter
  const at = (name: string) => normalizePath(`${folder}/${name}`)
  return {
    async read(name) {
      const path = at(name)
      return (await adapter.exists(path)) ? new Uint8Array(await adapter.readBinary(path)) : undefined
    },
    async write(name, bytes) {
      const path = at(name)
      const parent = path.slice(0, path.lastIndexOf("/"))
      if (parent && !(await adapter.exists(parent))) await adapter.mkdir(parent)
      await adapter.writeBinary(path, bytes.slice().buffer)
    },
  }
}

function fileSystemStore(folder: string): DocumentStore {
  // Obsidian's desktop app gives plugins Node's modules; the plugin is desktop-only (manifest.json).
  const require = (window as any).require as (module: string) => any
  const fs = require("fs").promises
  const path = require("path")
  return {
    async read(name) {
      try {
        return new Uint8Array(await fs.readFile(path.join(folder, name)))
      } catch (error: any) {
        if (error?.code === "ENOENT") return undefined
        throw error
      }
    },
    async write(name, bytes) {
      const file = path.join(folder, name)
      await fs.mkdir(path.dirname(file), { recursive: true })
      await fs.writeFile(file, bytes)
    },
  }
}

/** Fetches through Obsidian, which no site's CORS rules stop, answering with the status rather than throwing on it. */
export const obsidianFetch: Fetch = async (url) => {
  const response = await requestUrl({ url, throw: false })
  return { status: response.status, bytes: new Uint8Array(response.arrayBuffer) }
}
