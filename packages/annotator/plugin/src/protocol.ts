// What the plugin and its viewer page say to each other. The viewer page is served from the
// plugin's folder, on an origin of its own, so the two never touch each other's DOM: the plugin
// hands the page one MessagePort when it has loaded, and every request goes over it.
//
// The viewer page asks; the plugin answers. The sidebar, inside the viewer page and on its origin,
// asks through the viewer page. The plugin also tells the page, unasked, when Obsidian's styles
// change.

import type { TextFile } from "@chaoticgoodcomputing/pdf-ocr"
import type { ApiRequest, ApiResponse } from "./service.ts"

/** The message that hands the viewer page its port, posted to it by the plugin. */
export const CONNECT = "annotator:connect"

/** The annotated document, as the plugin gives it to the viewer page. */
export interface DocumentReply {
  /** The PDF's bytes. */
  data: ArrayBuffer
  /** The address the client names the document by: the annotation target, as annotations name it. */
  url: string
  /** The text of its scanned pages, from its text file, when it has one that is this PDF's. */
  text?: TextFile["pages"]
}

/** A comment's Markdown, as Obsidian renders it in the annotation note. */
export interface MarkdownReply {
  html: string
}

/** Obsidian's styles, for the sidebar to show rendered comments as Obsidian does. */
export interface StylesReply {
  /** Every rule of Obsidian's stylesheets but fonts, with its theme's variables on `:host`. */
  css: string
  /** Obsidian's fonts (`@font-face` rules), which apply only from a document's own stylesheets. */
  fonts: string
}

export type Request =
  | { id: number; kind: "document" }
  | { id: number; kind: "api"; request: ApiRequest }
  | { id: number; kind: "markdown"; markdown: string }
  | { id: number; kind: "styles" }
  /** A link in a rendered comment, clicked: `internal` for a link to the vault (its link text), else an address. */
  | { id: number; kind: "open-link"; href: string; internal: boolean }
  /** The document has a scanned page, with no text, and no text file: to recognize. */
  | { id: number; kind: "scanned" }

export type Reply =
  | { id: number; ok: true; value: DocumentReply | ApiResponse | MarkdownReply | StylesReply | null }
  | { id: number; ok: false; error: string }

/** What the plugin tells the viewer page unasked: Obsidian's styles, changed. */
export type Push = { push: "styles"; styles: StylesReply }
