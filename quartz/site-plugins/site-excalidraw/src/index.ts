// site-excalidraw: the vault's Excalidraw drawings, embedded as the SVGs Obsidian's Excalidraw plugin
// exports beside each one, the light or the dark by the page's theme. Vendored, for testing, from
// dinolupo/quartz-excalidraw (CONTEXT.md, Provenance) and ported to Quartz 5.
//
// Two factories, as site-styles has, because a plugin in two categories is instantiated once for each.
// The loader picks each by its shape, calling each with no options while it does.
//
// - `transformer`: rewrites an embed of a drawing, before obsidian-flavored-markdown reads it as a
//   transclusion (`defaultOrder: 25`, below OFM's 30), into the exports' `<img>`s. It ships no CSS:
//   the rules that show one export per theme are in site-styles' components tier.
// - `filter`: keeps each drawing's own note, the scene data Obsidian stores, off the site.
import type { BuildCtx, ProcessedContent } from "@quartz-community/types"
import { slugifyFilePath } from "@quartz-community/utils"
import fs from "node:fs"
import path from "node:path"
import { findDrawing, type Drawing } from "./resolve"

export interface Options {
  /** A folder, relative to the content folder, where exports are also looked for by file name. */
  imgDir?: string
}

// `![[target]]` or `![[target|alias]]`. A target with a heading or block anchor is left alone.
const WIKILINK = /!\[\[([^\]|#^\n]+?)(?:\|([^\]\n]+))?\]\]/g
// `![alt](target.excalidraw)`: markdown image syntax, which names a drawing only by that extension.
const MD_IMAGE = /!\[([^\]\n]*?)\]\(([^)\n]+?\.excalidraw(?:\.md)?)\)/g
// What Obsidian's Excalidraw plugin opens a drawing's note with: its frontmatter key.
const DRAWING_KEY = /^---\r?\n(?:(?!---)[^\n]*\r?\n)*?excalidraw-plugin\s*:/

export function transformer(opts?: Options) {
  return {
    name: "SiteExcalidraw",
    textTransform(ctx: BuildCtx, src: string) {
      const files = new Set<string>(ctx.allFiles)
      const isDrawingNote = (file: string) => drawingNote(ctx, file)
      const embed = (match: string, target: string, label: string | undefined) => {
        const drawing = findDrawing(target.trim(), files, isDrawingNote, opts?.imgDir)
        return drawing ? render(drawing, target.trim(), label?.trim()) : match
      }
      return src
        .replace(WIKILINK, (match, target, alias) => embed(match, target, alias))
        .replace(MD_IMAGE, (match, alt, target) => embed(match, safeDecode(target), alt || undefined))
    },
  }
}

// Whether a note is a drawing's, read from the head of its frontmatter. Kept per build, keyed on the
// file list, since every page's transform asks about the same few notes.
let noteCache: { files: BuildCtx["allFiles"]; notes: Map<string, boolean> } | undefined
function drawingNote(ctx: BuildCtx, file: string): boolean {
  if (noteCache?.files !== ctx.allFiles) noteCache = { files: ctx.allFiles, notes: new Map() }
  let known = noteCache.notes.get(file)
  if (known === undefined) {
    let head = ""
    try {
      const fd = fs.openSync(path.join(ctx.argv.directory, file), "r")
      const buffer = Buffer.alloc(4096)
      head = buffer.toString("utf8", 0, fs.readSync(fd, buffer, 0, buffer.length, 0))
      fs.closeSync(fd)
    } catch {
      // Gone since the file list was read: not a drawing's.
    }
    known = DRAWING_KEY.test(head)
    noteCache.notes.set(file, known)
  }
  return known
}

export function filter() {
  return {
    name: "SiteExcalidrawNotes",
    shouldPublish(_ctx: BuildCtx, [, vfile]: ProcessedContent) {
      const frontmatter = vfile.data?.frontmatter as Record<string, unknown> | undefined
      return frontmatter?.["excalidraw-plugin"] === undefined
    },
  }
}

// An alias of `600` or `600x400` sizes the drawing, as Obsidian's does; any other alias is its alt text.
// Each `src` is from the content root, as a link is written in markdown: crawl-links makes it
// relative to the page, which holds under any base path.
function render(drawing: Drawing, target: string, label: string | undefined): string {
  const width = label?.match(/^(\d+)(?:x\d+)?$/)?.[1]
  const alt = escapeAttribute(width || !label ? (target.split("/").pop() ?? target).replace(/\.(excalidraw|md).*$/, "") : label)
  const style = width ? ` style="max-width: ${width}px;"` : ""
  const img = (file: string, className: string) =>
    `<img class="${className}" src="/${slugifyFilePath(file as never)}" alt="${alt}" loading="lazy" />`
  const images = drawing.single
    ? img(drawing.single, "excalidraw-svg")
    : img(drawing.light!, "excalidraw-svg-light") + img(drawing.dark!, "excalidraw-svg-dark")
  return `<div class="excalidraw-svg-container"${style}>${images}</div>`
}

function safeDecode(target: string): string {
  try {
    return decodeURI(target)
  } catch {
    return target
  }
}

function escapeAttribute(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
