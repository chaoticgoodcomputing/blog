// Annotation pages: a note with an annotation target, shown as its preface, its annotations and its
// epilogue. The library reads Annotator's blocks and puts the annotations in a section of their own
// (`obsidianAnnotator`, astro.config.ts); what is the site's is that the page opens with where the
// annotated document comes from, that the annotations are headed and dated, and how the page is
// laid out (src/styles/prose/annotations.css), as the Quartz annotator laid it out
// (docs/cutover/annotations-audit.md).

import { ANNOTATIONS, annotationTarget, parseAnnotations, type Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { defineMdastPlugin } from "satteri"
import type { AnnotatedPassage } from "./highlights.ts"
import type { Note } from "./notes.ts"
import { getVault } from "./vault.ts"
import { formatDate } from "./dates.ts"
import { site } from "../site.config.ts"

/** Whether a note's page is an annotation page: the note has an annotation target. */
export const isAnnotationPage = (note: Pick<Note, "frontmatter">): boolean => annotationTarget(note.frontmatter) !== undefined

/**
 * The file name a document's address ends in, decoded: `On Meetings.pdf`. Undefined for an
 * address that is no URL, or whose path names no file.
 */
export function documentFileName(target: string): string | undefined {
  let url: URL
  try {
    url = new URL(target)
  } catch {
    return undefined
  }
  return decodeURIComponent(url.pathname.split("/").at(-1) ?? "") || undefined
}

/**
 * The passages an annotation page's annotations are written on, in the order written, read from the
 * note's source as the library reads the page's annotations: each annotation's quote, with its id,
 * the text either side of it and where it starts. An annotation with no quote, a reply, has none.
 */
export function annotatedPassages(note: Pick<Note, "file">, vault: Vault = getVault()): AnnotatedPassage[] {
  return parseAnnotations(vault.read(note.file) ?? "")
    .annotations.filter((annotation) => annotation.exact)
    .map(({ id, exact, prefix, suffix, start }) => ({ id, exact, prefix, suffix, start }))
}

/** An annotation's date, as the site writes every date. */
export const annotationDate = (date: Date): string => formatDate(date, site.locale)

// A document on the web is named by its host, where it comes from; one in the vault by its file's
// name.
const named = (target: string): string => (URL.canParse(target) ? new URL(target).host : (target.split("/").at(-1) ?? target))

/**
 * Opens an annotation page with where the annotated document comes from, a link to it at its
 * target address, and heads the annotations. The link is a Markdown link, so the resolver after it
 * gives a document kept in the vault the address the site publishes it at.
 */
export function annotatedDocument() {
  return defineMdastPlugin({
    name: "annotated-document",
    custom(node, ctx) {
      if (node.type !== ANNOTATIONS) return
      const properties = (node.data as { hProperties?: Record<string, unknown> } | undefined)?.hProperties
      const target = properties?.["data-annotation-target"]
      const parent = ctx.parent(node)
      if (typeof target !== "string" || !parent) return
      ctx.prependChild(node, {
        type: "heading",
        depth: 2,
        data: { hProperties: { className: ["annotations-heading"] } },
        children: [{ type: "text", value: "Annotations" }],
      })
      ctx.prependChild(parent, {
        type: "paragraph",
        data: { hProperties: { className: ["annotated-document"] } },
        children: [
          { type: "text", value: "Source document: " },
          { type: "link", url: encodeURI(decodeURI(target)), children: [{ type: "text", value: named(target) }] },
        ],
      })
    },
  })
}
