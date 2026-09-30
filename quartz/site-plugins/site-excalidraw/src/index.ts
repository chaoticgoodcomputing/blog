// site-excalidraw: the vault's Excalidraw drawings, embedded as the SVGs Obsidian's Excalidraw plugin
// exports beside each one, the light or the dark by the page's theme. Vendored, for testing, from
// dinolupo/quartz-excalidraw (CONTEXT.md, Provenance) and ported to Quartz 5.
//
// Three factories, as site-styles has two, because a plugin in several categories is instantiated once
// for each. The loader picks each by its shape, calling each with no options while it does.
//
// - `transformer`: rewrites an embed of a drawing, before obsidian-flavored-markdown reads it as a
//   transclusion (`defaultOrder: 25`, below OFM's 30), into the exports' `<img>`s. It ships no CSS:
//   the rules that show one export per theme are in site-styles' components tier.
// - `filter`: keeps each drawing's own note, the scene data Obsidian stores, off the site.
// - `emitter`: unless `keepBackground`, writes each export's copy without its background, which is
//   what an embed then shows (`src/background.ts`).
import type { BuildCtx, ProcessedContent } from "@quartz-community/types"
import { slugifyFilePath } from "@quartz-community/utils"
import fs from "node:fs"
import path from "node:path"
import { findDrawing, type Drawing } from "./resolve"
import { isDrawingExport, transparentCopy, withoutBackground } from "./background"

export interface Options {
  /** A folder, relative to the content folder, where exports are also looked for by file name. */
  imgDir?: string
  /**
   * Whether an embed shows the export's own background, the canvas colour it was drawn on. Off by
   * default: the drawing sits on the page's own background, in either theme.
   */
  keepBackground?: boolean
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
        if (!drawing) return match
        const source = (file: string) =>
          opts?.keepBackground || !isDrawingExport(file, isDrawingNote) ? file : transparentCopy(file)
        return render(drawing, target.trim(), label?.trim(), source)
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

// Each export's copy without its background, beside it, when the background is dropped. The Assets
// emitter copies the export itself as it copies any file. Few and small, so a rebuild writes them all.
export function emitter(opts?: Options) {
  const emit = async (ctx: BuildCtx): Promise<string[]> => {
    if (opts?.keepBackground) return []
    const exports = ctx.allFiles.filter((file) => isDrawingExport(file, (note) => drawingNote(ctx, note)))
    return Promise.all(
      exports.map(async (file) => {
        const svg = await fs.promises.readFile(path.join(ctx.argv.directory, file), "utf8")
        const dest = path.join(ctx.argv.output, slugifyFilePath(transparentCopy(file) as never))
        await fs.promises.mkdir(path.dirname(dest), { recursive: true })
        await fs.promises.writeFile(dest, withoutBackground(svg))
        return dest
      }),
    )
  }
  return { name: "SiteExcalidrawBackgrounds", emit, partialEmit: emit }
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
// `source` names the file an export is shown from: itself, or its copy without its background.
function render(drawing: Drawing, target: string, label: string | undefined, source: (file: string) => string): string {
  const width = label?.match(/^(\d+)(?:x\d+)?$/)?.[1]
  const alt = escapeAttribute(width || !label ? (target.split("/").pop() ?? target).replace(/\.(excalidraw|md).*$/, "") : label)
  const style = width ? ` style="max-width: ${width}px;"` : ""
  const img = (file: string, className: string) =>
    `<img class="${className}" src="/${slugifyFilePath(source(file) as never)}" alt="${alt}" loading="lazy" />`
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
