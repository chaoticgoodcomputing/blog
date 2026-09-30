// A drawing's export without its background. Obsidian's Excalidraw plugin paints the canvas colour,
// white in the light export and near-black in the dark, as one `<rect>` at the origin spanning the
// whole viewBox, the first rect in the file. Pure: the emitter reads and writes the files.

/** Where the background-free copy of an export is written: beside it, `<name>.transparent.svg`. */
export const transparentCopy = (file: string) => file.replace(/\.svg$/, ".transparent.svg")

/**
 * Whether an SVG in the content folder is a drawing's export, so the emitter writes its copy and an
 * embed may name that copy. One is spelled with `.excalidraw`, as upstream had it, or sits beside
 * a drawing's note (`isDrawingNote`).
 */
export function isDrawingExport(file: string, isDrawingNote: (file: string) => boolean): boolean {
  const match = file.match(/^(.*?)(\.excalidraw)?\.(?:light\.|dark\.)?svg$/)
  if (!match) return false
  if (match[2]) return true
  return [`${match[1]}.md`, `${match[1]}.excalidraw.md`].some(isDrawingNote)
}

/** The SVG with its background rect removed, or as it was when its first rect is not one. */
export function withoutBackground(svg: string): string {
  const viewBox = svg.match(/<svg\b[^>]*?\sviewBox="([^"]*)"/)?.[1].trim().split(/[\s,]+/).map(Number)
  const rect = svg.match(/<rect\b([^>]*?)\/?>(?:\s*<\/rect>)?/)
  if (!viewBox || viewBox.length !== 4 || !rect || rect.index === undefined) return svg
  const attribute = (name: string) => rect[1].match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1]
  const is = (name: string, value: number, fallback?: number) => {
    const found = attribute(name)
    const n = found === undefined ? fallback : Number(found)
    return n !== undefined && Math.abs(n - value) < 0.01
  }
  const [x, y, width, height] = viewBox
  const spans = is("x", x, 0) && is("y", y, 0) && is("width", width) && is("height", height)
  return spans ? svg.slice(0, rect.index) + svg.slice(rect.index + rect[0].length) : svg
}
