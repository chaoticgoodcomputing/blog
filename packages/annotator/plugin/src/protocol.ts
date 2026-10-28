// What the plugin and its viewer page say to each other. The viewer page is served from the
// plugin's folder, on an origin of its own, so the two never touch each other's DOM: the plugin
// hands the page one MessagePort when it has loaded, and every request goes over it.
//
// The viewer page asks; the plugin answers. The sidebar, inside the viewer page and on its origin,
// asks through the viewer page.

import type { ApiRequest, ApiResponse } from "./service.ts"

/** The message that hands the viewer page its port, posted to it by the plugin. */
export const CONNECT = "annotator:connect"

/** The annotated document, as the plugin gives it to the viewer page. */
export interface DocumentReply {
  /** The PDF's bytes. */
  data: ArrayBuffer
  /** The address the client names the document by: the annotation target, as annotations name it. */
  url: string
}

export type Request = { id: number; kind: "document" } | { id: number; kind: "api"; request: ApiRequest }

export type Reply = { id: number; ok: true; value: DocumentReply | ApiResponse } | { id: number; ok: false; error: string }

/** The query parameter of the viewer page's address that names an annotation to open at. */
export const ANNOTATION_PARAM = "annotation"
