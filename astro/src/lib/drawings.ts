// The vault's Excalidraw drawings on the site. A drawing is a note whose body is scene data, so it
// has no page (the notes query's `unpublished`), and a note that embeds one shows the SVGs
// Obsidian's Excalidraw plugin exports beside it (astro.config.ts). What a drawing is, and which
// files are its exports, is the library's to say. This module says where the site publishes them,
// and what it publishes: each export without the canvas it was drawn on, so that a drawing sits on
// the page's own background in either colour scheme (docs/adr/0301).

import fs from "node:fs"
import path from "node:path"
import {
  excalidrawExports,
  isExcalidraw,
  parseLinktext,
  withoutExcalidrawBackground,
  type ExcalidrawExport,
  type Vault,
  type VaultFile,
} from "@chaoticgoodcomputing/obsidian-markdown"
import { getUnpublished, type UnpublishedNote } from "./notes.ts"
import { getVault, slugFor } from "./vault.ts"

/**
 * The address the site publishes one of a drawing's exports at: under `/drawings`, at its path in
 * the vault as a slug. Not the export's own path, which is the attachment's, the file as the vault
 * has it.
 */
export const drawingExportUrl = (file: VaultFile): string => `/drawings/${slugFor(file.path)}`

export interface PublishedExport extends ExcalidrawExport {
  url: string
}

export interface UnexportedDrawing {
  /** The drawing's note. */
  drawing: string
  /** The notes that embed it. */
  embeddedBy: string[]
}

/**
 * The drawings some note embeds that have no export to show: a page would have nothing where each
 * embed is. A drawing that no note embeds needs none.
 */
export function unexportedDrawings(vault: Vault): UnexportedDrawing[] {
  const cache = vault.metadataCache
  const missing = new Map<string, string[]>()
  for (const note of vault.getMarkdownFiles()) {
    for (const embed of cache.getFileCache(note)?.embeds ?? []) {
      const linkpath = parseLinktext(embed.link).path
      const drawing = linkpath ? cache.getFirstLinkpathDest(linkpath, note.path) : null
      if (!drawing || !isExcalidraw(cache.getFileCache(drawing))) continue
      if (excalidrawExports(vault, drawing).length > 0) continue
      const by = missing.get(drawing.path) ?? []
      if (!by.includes(note.path)) missing.set(drawing.path, [...by, note.path])
    }
  }
  return [...missing].map(([drawing, embeddedBy]) => ({ drawing, embeddedBy }))
}

export interface DrawingExportOptions {
  /**
   * Whether a drawing some note embeds with no export fails the list (docs/adr/0302). Default:
   * true. Astro renders a Markdown note that fails as an empty page and only logs the error, and a
   * page with nothing where its drawings should be is not to be published.
   */
  strict?: boolean
}

/**
 * Every export of each of `drawings`, the vault's drawings, with its address. Unless told it need
 * not be strict, it fails, and with it the build, when a note embeds a drawing that has no export.
 */
export function drawingExports(
  vault: Vault,
  drawings: UnpublishedNote[],
  { strict = true }: DrawingExportOptions = {},
): PublishedExport[] {
  const missing = strict ? unexportedDrawings(vault) : []
  if (missing.length > 0) {
    const list = missing.map(({ drawing, embeddedBy }) => `  ${drawing}, embedded by ${embeddedBy.join(", ")}`)
    throw new Error(
      `These Excalidraw drawings are embedded, and have no exported SVG beside them:\n${list.join("\n")}\n` +
        `Turn on "Auto-export SVG" in the Excalidraw plugin's settings and save each drawing again.`,
    )
  }
  return drawings.flatMap((drawing) =>
    excalidrawExports(vault, drawing.file).map((each) => ({ ...each, url: drawingExportUrl(each.file) })),
  )
}

/** Every export of every drawing in the site's vault, with its address: `drawingExports` of the site's own. */
export const getDrawingExports = (options: DrawingExportOptions = {}): PublishedExport[] =>
  drawingExports(getVault(), getUnpublished("drawing"), options)

/** An export as the site publishes it: the vault's SVG, without its canvas. */
export const readDrawingExport = (file: VaultFile): string =>
  withoutExcalidrawBackground(fs.readFileSync(path.join(getVault().root, file.path), "utf8"))
