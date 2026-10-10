// Drawings made with Obsidian's Excalidraw plugin. A drawing is a note: it opens with the plugin's
// `excalidraw-plugin` frontmatter key and holds the scene, which only the plugin can draw. What a
// site can show is what the plugin exports beside the note when its auto-export is on: one SVG, or
// with "export both dark- and light-themed image" a light and a dark one.
//
//   doodles/loop.md            the drawing
//   doodles/loop.svg           its one export, or
//   doodles/loop.light.svg     its light export, and
//   doodles/loop.dark.svg      its dark one
//
// So an embed of a drawing renders as its exports, not as a note. Which export a reader sees is the
// site's stylesheet's to say, and where an export is published is the site's decision, passed in.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineMdastPlugin } from "satteri"
import { parseLinktext, parseSize } from "./linktext.ts"
import { WIKILINK } from "./syntax/index.ts"
import type { Node } from "./syntax/node.ts"
import type { CachedMetadata, VaultFile, WikilinkData } from "./types.ts"
import type { Vault } from "./vault.ts"

/** The frontmatter key the Excalidraw plugin opens a drawing's note with. */
const DRAWING_KEY = "excalidraw-plugin"

/** Whether a note is an Excalidraw drawing, from its metadata. */
export const isExcalidraw = (cache: CachedMetadata | null | undefined): boolean =>
  cache?.frontmatter?.[DRAWING_KEY] !== undefined

/** One of a drawing's exported SVGs. */
export interface ExcalidrawExport {
  file: VaultFile
  /** The colour scheme it was exported for. A drawing's one export is for both, and has none. */
  scheme?: "light" | "dark"
}

/**
 * A drawing's exports, as the Excalidraw plugin names them beside its note: the light and the dark
 * one when both are there, else the one export, else none.
 */
export function excalidrawExports(vault: Vault, drawing: VaultFile): ExcalidrawExport[] {
  const stem = drawing.path.slice(0, -(drawing.extension.length + 1))
  const light = vault.getFileByPath(`${stem}.light.svg`)
  const dark = vault.getFileByPath(`${stem}.dark.svg`)
  if (light && dark) {
    return [
      { file: light, scheme: "light" },
      { file: dark, scheme: "dark" },
    ]
  }
  const single = vault.getFileByPath(`${stem}.svg`)
  return single ? [{ file: single }] : []
}

/**
 * An export without the canvas it was drawn on. The plugin paints the canvas colour, white in the
 * light export and near-black in the dark, as one `<rect>` over the whole view box, the first rect
 * of the file. An SVG whose first rect is anything else is returned as it is.
 */
export function withoutExcalidrawBackground(svg: string): string {
  const viewBox = /<svg\b[^>]*?\sviewBox="([^"]*)"/.exec(svg)?.[1]?.trim().split(/[\s,]+/).map(Number)
  const rect = /<rect\b([^>]*?)\/?>(?:\s*<\/rect>)?/.exec(svg)
  if (viewBox?.length !== 4 || !rect) return svg
  const is = (name: string, value: number, fallback?: number): boolean => {
    const written = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(rect[1]!)?.[1]
    const number = written === undefined ? fallback : Number(written)
    return number !== undefined && Math.abs(number - value) < 0.01
  }
  const [x, y, width, height] = viewBox as [number, number, number, number]
  const covers = is("x", x, 0) && is("y", y, 0) && is("width", width) && is("height", height)
  return covers ? svg.slice(0, rect.index) + svg.slice(rect.index + rect[0].length) : svg
}

export interface ExcalidrawOptions {
  /** The vault to find drawings in. A function is called for each note, as the resolver's is. */
  vault: Vault | (() => Vault)
  /** The URL the site publishes one of a drawing's exports at. */
  urlFor: (file: VaultFile, drawing: VaultFile) => string
}

interface Size {
  width: number
  height?: number
}

// An export's own size, from its root element's `width` and `height`, else its view box. Read from
// the head of the file, which is where the root element is: the rest is fonts and strokes.
function exportSize(vault: Vault, file: VaultFile): Required<Size> | null {
  let head = ""
  try {
    const fd = fs.openSync(path.join(vault.root, file.path), "r")
    try {
      const buffer = Buffer.alloc(2048)
      head = buffer.toString("utf8", 0, fs.readSync(fd, buffer, 0, buffer.length, 0))
    } finally {
      fs.closeSync(fd)
    }
  } catch {
    return null // gone since the vault was read
  }
  const root = /<svg\b[^>]*>/.exec(head)?.[0] ?? ""
  const attribute = (name: string) => new RegExp(`\\s${name}="([\\d.]+)(?:px)?"`).exec(root)?.[1]
  const viewBox = /\sviewBox="[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/.exec(root)
  const width = Number(attribute("width") ?? viewBox?.[1])
  const height = Number(attribute("height") ?? viewBox?.[2])
  return width > 0 && height > 0 ? { width, height } : null
}

// What an image is sized to: the embed's size when it gives one, the height kept in proportion when
// it gives only a width, else the export's own, in whole pixels, as HTML writes a size.
function imageSize(own: Required<Size> | null, embed: Size | null): Size | null {
  if (embed?.height !== undefined || (embed && !own)) return embed
  if (embed && own) return { width: embed.width, height: Math.round((embed.width * own.height) / own.width) }
  return own && { width: Math.round(own.width), height: Math.round(own.height) }
}

/**
 * Renders each embed of a drawing as the drawing's exports. It works on an embed as the syntax
 * plugins leave it, so it goes after them and before the resolver, which would make the embed a
 * link to the drawing's note. Any other embed, and a plain link to a drawing, is left for the
 * resolver.
 *
 * Each export is an `<img>` of class `excalidraw-svg`, with `excalidraw-light` or `excalidraw-dark`
 * when it is for one colour scheme, inside a `<span class="excalidraw-embed">`. The site's
 * stylesheet hides the one that is not the reader's. An image that is hidden and loads lazily is
 * never fetched, so a reader downloads one export, not two.
 *
 * An embed of a drawing with no export is an error: there is nothing to show, and a page that
 * silently shows nothing is worse than a build that stops.
 */
export function obsidianExcalidraw(options: ExcalidrawOptions) {
  const { urlFor } = options
  const current = typeof options.vault === "function" ? options.vault : () => options.vault as Vault

  return defineMdastPlugin({
    name: "obsidian-excalidraw",
    custom(custom, ctx) {
      const node = custom as unknown as Node
      if (node.type !== WIKILINK) return
      const wikilink = node.data!.wikilink as WikilinkData
      if (!wikilink.embed) return

      const vault = current()
      const source = ctx.fileURL ? vault.getFileByAbsolutePath(fileURLToPath(ctx.fileURL)) : null
      const linkpath = parseLinktext(wikilink.link).path
      const drawing = linkpath ? vault.metadataCache.getFirstLinkpathDest(linkpath, source?.path ?? "") : null
      if (!drawing || !isExcalidraw(vault.metadataCache.getFileCache(drawing))) return

      const exports = excalidrawExports(vault, drawing)
      if (exports.length === 0) {
        const stem = drawing.name.slice(0, -(drawing.extension.length + 1))
        throw new Error(
          `${source?.path ?? "A note"} embeds the Excalidraw drawing ${drawing.path} (${wikilink.original}), ` +
            `which has no exported SVG beside it: neither ${stem}.svg, nor ${stem}.light.svg with ${stem}.dark.svg. ` +
            `Turn on "Auto-export SVG" in the Excalidraw plugin's settings and save the drawing again.`,
        )
      }

      const size = parseSize(wikilink.alias)
      const alt = size || !wikilink.alias ? drawing.basename : wikilink.alias
      ctx.replaceNode(custom, {
        type: "excalidraw",
        data: {
          hName: "span",
          // A sized embed carries its size, as Obsidian's own embed does, so a stylesheet can tell
          // it from one that takes the room it is given.
          hProperties: { className: ["excalidraw-embed"], "data-src": wikilink.link, ...size },
        },
        children: exports.map(({ file, scheme }) => ({
          type: "excalidrawExport",
          data: {
            hName: "img",
            hProperties: {
              className: ["excalidraw-svg", ...(scheme ? [`excalidraw-${scheme}`] : [])],
              src: urlFor(file, drawing),
              alt,
              // With its size, an image that has not loaded yet already takes its room.
              ...imageSize(exportSize(vault, file), size),
              loading: "lazy",
            },
          },
        })),
      } as never)
    },
  })
}
