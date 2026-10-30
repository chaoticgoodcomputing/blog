// An annotation note's annotation target: where the annotated document is, and its bytes.

import { type DocumentStore, documentFor, savedName } from "@chaoticgoodcomputing/annotator-documents"
import { textFileName } from "@chaoticgoodcomputing/pdf-ocr"
import { type App, TFile } from "obsidian"
import { obsidianFetch } from "./documents.ts"

export const TARGET_PROPERTY = "annotation-target"

/** Where a note's annotated document is: on the web, or a file of the vault. */
export type Target = { kind: "url"; url: string } | { kind: "file"; file: TFile }

/**
 * A note's property, from its frontmatter, or from Dataview's index of it when Dataview is on, so
 * that an inline `annotation-target::` field counts too, as it did upstream.
 */
export function propertyOf(app: App, file: TFile, name: string): unknown {
  // Dataview's API, as obsidian-dataview's getAPI() finds it with no app: the global it installs.
  const dataview = (window as any).DataviewAPI
  const fromDataview = dataview?.page?.(file.path)?.[name]
  if (fromDataview) {
    if (fromDataview.path) return app.metadataCache.getFirstLinkpathDest(fromDataview.path, file.path)?.path
    const link = /^\[.*\]\((.*)\)$/.exec(String(fromDataview))?.[1]
    return link ?? fromDataview
  }
  return app.metadataCache.getFileCache(file)?.frontmatter?.[name]
}

/** Whether a note is an annotation note: it has an annotation target. */
export const isAnnotationNote = (app: App, file: TFile | null): file is TFile =>
  file instanceof TFile && Boolean(propertyOf(app, file, TARGET_PROPERTY))

const isUrl = (text: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(text)

/**
 * A note's annotation target: its property, as an address on the web, or as a link to a file of
 * the vault, from the note, then from `defaultPath` (the setting upstream called its custom default
 * path). A list's first item counts, as MetaEdit writes one.
 */
export function targetOf(app: App, note: TFile, defaultPath = ""): Target | undefined {
  let value = propertyOf(app, note, TARGET_PROPERTY)
  if (Array.isArray(value)) value = value[0]
  if (typeof value !== "string" || !value.trim()) return undefined
  const target = value.trim().replace(/^\[\[(.*?)(\|.*)?\]\]$/, "$1")
  if (isUrl(target)) return { kind: "url", url: target }
  for (const path of [target, `${defaultPath}${target}`]) {
    const file = app.metadataCache.getFirstLinkpathDest(path, note.path)
    if (file) return { kind: "file", file }
  }
  return undefined
}

/**
 * The address annotations name the document by: the target's own for a document on the web, and
 * `vault:/<path>` for a file of the vault, as upstream named one.
 */
export const addressOf = (target: Target) => (target.kind === "url" ? target.url : `vault:/${target.file.path}`)

/**
 * The annotated document's bytes: a file of the vault's own; a document on the web's saved copy in
 * `store`, or else fetched and saved there. Throws annotator-documents' DocumentUnavailable when
 * the web won't give it, for the user to supply it.
 */
export async function bytesOf(app: App, target: Target, store: DocumentStore): Promise<ArrayBuffer> {
  if (target.kind === "file") return app.vault.readBinary(target.file)
  const { bytes } = await documentFor(target.url, { store, fetch: obsidianFetch })
  return bytes.slice().buffer
}

/**
 * The name of the target's text file in the store of saved copies (@chaoticgoodcomputing/pdf-ocr):
 * beside its saved copy, for a document on the web; under `vault/`, for a file of the vault, which
 * is kept out of the vault itself.
 */
export const textFileOf = (target: Target) => textFileName(target.kind === "url" ? savedName(target.url) : `vault/${target.file.path}`)
