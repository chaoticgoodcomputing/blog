// The plugin's pages (frames/) are shown as `blob:` documents, not by their addresses in the
// plugin's folder. Obsidian cancels every request for an `app://` address made by a frame whose
// origin isn't Obsidian's own (its main process, `onBeforeRequest` on `app://*/*`), and a page at
// its address in the plugin's folder has that folder's origin: it would load, but none of its
// scripts or styles. A `blob:` document has the origin of the page that made it, Obsidian's, so it
// may load the plugin's files; a `<base>` makes its relative addresses those of the plugin's folder.
//
// The same goes for the sidebar page, which the viewer page makes the same way, and for PDF.js's
// worker, which a page may only start from its own origin.

/** What a page is opened with, in place of the query parameters a `blob:` address can't carry. */
export interface PageOptions {
  /** The annotation to open at (its block id). */
  annotation?: string
  /** The page range to show, as text (src/pages.ts). */
  pages?: string
}

const OPTIONS_ID = "annotator-options"

/**
 * A page's HTML, made to be shown as a `blob:` document: with a `<base>` for `folder`, the address
 * of the folder its files are in, and its options, which `optionsOf` reads back.
 */
export function framePage(html: string, folder: string, options: PageOptions = {}): string {
  const json = JSON.stringify(options).replace(/</g, "\\u003c")
  const head = `<base href="${folder.replace(/"/g, "&quot;")}"><script type="application/json" id="${OPTIONS_ID}">${json}</script>`
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (tag) => `${tag}${head}`) : head + html
}

/** A page's options, as `framePage` gave them. */
export function optionsOf(document: Document): PageOptions {
  try {
    return JSON.parse(document.getElementById(OPTIONS_ID)?.textContent ?? "{}") as PageOptions
  } catch {
    return {}
  }
}

/** A page as a `blob:` address, with the origin of the page calling this. */
export const blobPage = (html: string) => URL.createObjectURL(new Blob([html], { type: "text/html" }))

/** A folder's address, from the address of a file in it: without the file, or the query Obsidian adds. */
export const folderOf = (fileUrl: string) => {
  const url = new URL(fileUrl)
  url.search = ""
  url.hash = ""
  return url.href.slice(0, url.href.lastIndexOf("/") + 1)
}
