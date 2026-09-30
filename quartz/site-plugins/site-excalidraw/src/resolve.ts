// Which exported SVGs an embed names. Pure: it reads the content folder's file list, Quartz's
// `ctx.allFiles` (paths relative to the content folder), and asks the caller whether a note is a
// drawing's, so it needs no file system of its own.
//
// Upstream matched only embeds spelled with an `.excalidraw` extension, and probed the disk from the
// content folder. The vault embeds a drawing by its note's path from the vault root, which is one
// folder above the content folder (`![[public/assets/doodles/panic-01-engineering-loop]]`, with
// `content/public` the content folder), and with no extension, since Obsidian names the drawing
// `<name>.md`. So a target is tried as written, then with each leading folder dropped, and then by
// its file name alone, as Obsidian resolves a link, when exactly one drawing has it.

export interface Drawing {
  /** The light and dark exports, when both exist: the theme picks between them. */
  light?: string
  dark?: string
  /** The one export, when there is no light and dark pair. */
  single?: string
}

const EXTENSION = /\.excalidraw(\.md)?$|\.md$/

/**
 * The exports of the drawing an embed target names, or null when it names no drawing. A target
 * spelled with `.excalidraw` is a drawing whenever an export of it exists, as upstream had it. A
 * target without it is a drawing only when its note is a drawing's (`isDrawingNote`) and sits beside
 * an export, so an embed of a plain note is never taken for one because an SVG shares its name.
 */
export function findDrawing(
  target: string,
  files: ReadonlySet<string>,
  isDrawingNote: (file: string) => boolean,
  imgDir?: string,
): Drawing | null {
  const spelled = /\.excalidraw(\.md)?$/.test(target)
  const base = target.replace(/^\/+/, "").replace(EXTENSION, "")
  const hasNote = (b: string) =>
    [`${b}.md`, `${b}.excalidraw.md`].some((note) => files.has(note) && isDrawingNote(note))

  for (const candidate of candidates(base, files, imgDir)) {
    if (!spelled && !hasNote(candidate)) continue
    const found = exportsOf(candidate, files)
    if (found) return found
  }
  return null
}

function* candidates(base: string, files: ReadonlySet<string>, imgDir?: string): Generator<string> {
  const segments = base.split("/")
  for (let i = 0; i < segments.length; i++) yield segments.slice(i).join("/")
  const name = segments[segments.length - 1]
  if (imgDir) yield `${imgDir.replace(/^\/+|\/+$/g, "")}/${name}`
  // Obsidian's shortest-path resolution: the file name alone, when one drawing has it.
  const byName = new Set<string>()
  for (const file of files) {
    const match = file.match(/^(.*?)(\.excalidraw)?\.(light\.svg|dark\.svg|svg)$/)
    if (match && (match[1] === name || match[1].endsWith(`/${name}`))) byName.add(match[1])
  }
  if (byName.size === 1) yield* byName
}

function exportsOf(base: string, files: ReadonlySet<string>): Drawing | null {
  for (const stem of [`${base}.excalidraw`, base]) {
    const light = `${stem}.light.svg`
    const dark = `${stem}.dark.svg`
    if (files.has(light) && files.has(dark)) return { light, dark }
  }
  for (const stem of [`${base}.excalidraw`, base]) {
    if (files.has(`${stem}.svg`)) return { single: `${stem}.svg` }
  }
  return null
}
