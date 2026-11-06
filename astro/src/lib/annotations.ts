// Annotation pages: a note with an annotation target, shown as its preface, its annotations and its
// epilogue. The library reads Annotator's blocks and puts the annotations in a section of their own
// (`obsidianAnnotator`, astro.config.ts); what is the site's is that the page opens with where the
// annotated document comes from, that the annotations are headed and dated, and how the page is
// laid out (src/styles/prose/annotations.css), as the Quartz annotator laid it out
// (docs/cutover/annotations-audit.md).

import { ANNOTATIONS, annotationTarget, annotationTargetType, parseAnnotations, type Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { defineHastPlugin, defineMdastPlugin } from "satteri"
import type { AnnotatedPassage } from "./highlights.ts"
import type { Note } from "./notes.ts"
import { getVault } from "./vault.ts"
import { formatDate } from "./dates.ts"
import { calloutLook } from "./callouts.ts"
import { noteIcon } from "./icons.ts"
import { site } from "../site.config.ts"

/** Whether a note's page is an annotation page: the note has an annotation target. */
export const isAnnotationPage = (note: Pick<Note, "frontmatter">): boolean => annotationTarget(note.frontmatter) !== undefined

/**
 * The web page a note's annotations were made on, in the browser (`annotation-target-type: web`):
 * what its page cites by title, links passage by passage, and answers by webmention. Undefined for
 * any other note, a PDF's among them.
 */
export function webAnnotationTarget(note: Pick<Note, "frontmatter">): string | undefined {
  const target = annotationTarget(note.frontmatter)
  return target !== undefined && annotationTargetType(note.frontmatter) === "web" && URL.canParse(target) ? target : undefined
}

/**
 * The kind of file a page's annotated document is, by its file name's extension, as a search
 * engine marks a result that is one: `pdf`; or `web`, for a web page annotated in the browser
 * (`annotation-target-type: web`). None for a note that isn't an annotation page, a private page,
 * which says nothing of what it is, or a document whose address names no extension.
 */
export function annotatedFileType(note: Pick<Note, "frontmatter" | "isPrivate">): string | undefined {
  const target = annotationTarget(note.frontmatter)
  if (note.isPrivate || !target) return undefined
  if (webAnnotationTarget(note) !== undefined) return "web"
  return /\.([a-z0-9]+)$/i.exec(documentFileName(target) ?? "")?.[1]?.toLowerCase()
}

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
 * Lays out an annotation page's body: its preface and its epilogue each in a column of their own,
 * read as a note is (annotation-viewer.css centres them beside a wide document), then where the
 * annotated document comes from, a link to it at its target address, just before the annotations:
 * a web page's cited by its title, "From <title> on <host>", where its annotations kept one,
 * so it stands over the document once the viewer draws it; and heads the annotations. The link is
 * a Markdown link, so the resolver after it gives a document kept in the vault the address the
 * site publishes it at.
 */
export function annotatedDocument() {
  return defineMdastPlugin({
    name: "annotated-document",
    custom(node, ctx) {
      if (node.type !== ANNOTATIONS) return
      const properties = (node.data as { hProperties?: Record<string, unknown> } | undefined)?.hProperties
      const target = properties?.["data-annotation-target"]
      const web = properties?.["data-annotation-target-type"] === "web" && typeof target === "string" && URL.canParse(target)
      const title = properties?.["data-annotation-title"]
      const parent = ctx.parent(node)
      if (typeof target !== "string" || !parent) return
      ctx.prependChild(node, {
        type: "heading",
        depth: 2,
        data: { hProperties: { className: ["annotations-heading"] } },
        children: [{ type: "text", value: "Annotations" }],
      })
      const link = (value: string) => ({ type: "link", url: encodeURI(decodeURI(target)), children: [{ type: "text", value }] })
      const cited = typeof title === "string" && title !== ""
      const source = {
        type: "paragraph",
        data: { hProperties: { className: ["annotated-document"] } },
        children: !web
          ? [{ type: "text", value: "Source document: " }, link(named(target))]
          : cited
            ? [{ type: "text", value: "From " }, link(title), { type: "text", value: ` on ${named(target)}` }]
            : [{ type: "text", value: "From " }, link(named(target))],
      }
      const children = [...parent.children]
      const at = ctx.indexOf(node)
      if (at === undefined) return
      const column = (className: string, nodes: typeof children) =>
        nodes.length ? [{ type: className, data: { hName: "div", hProperties: { className: [className] } }, children: nodes }] : []
      ctx.setProperty(parent, "children", [
        ...column("annotation-preface", children.slice(0, at)),
        source,
        node,
        ...column("annotation-epilogue", children.slice(at + 1)),
      ] as never)
    },
  })
}

/**
 * Shows a web page's passage, in its card, as a quote callout, `[!QUOTE]`, the whole box a link to
 * the passage in the page itself: the address its quote cites, whose text fragment a browser that
 * has them scrolls to and marks, with a quote callout's icon (src/lib/callouts.ts). A PDF's passage
 * cites none and stays a quote: the viewer shows it in its document.
 */
export function passageLinks() {
  return defineHastPlugin({
    name: "passage-links",
    element: {
      filter: ["blockquote"],
      visit(node, ctx) {
        const { className, cite } = node.properties ?? {}
        if (!Array.isArray(className) || !className.includes("annotation-highlight") || typeof cite !== "string") return
        const { kind, icon } = calloutLook("quote")
        const callout = {
          type: "element",
          tagName: "div",
          properties: { className: ["callout"], dataCallout: "quote", dataCalloutKind: kind },
          children: [
            { type: "element", tagName: "div", properties: { className: ["callout-title"] }, children: [icon, { type: "text", value: "Quote" }] },
            { type: "element", tagName: "div", properties: { className: ["callout-content"] }, children: node.children },
          ],
        }
        ctx.replaceNode(node, {
          type: "element",
          tagName: "a",
          properties: { className: ["annotation-passage"], href: cite, target: "_blank", rel: ["noopener"], title: "Read it in context" },
          children: [callout],
        } as never)
      },
    },
  })
}

/**
 * Ends each annotation's card with a link to itself, `#^id`, for a reader to copy the address of
 * one annotation, as a heading's link to itself is for a section (src/lib/heading-anchors.ts): the
 * same icon, for the pointer alone, shown while the pointer is on the card
 * (src/styles/prose/annotations.css). Following it selects the annotation where the viewer draws
 * the document, as a link to it from anywhere does.
 */
export function annotationAnchors() {
  return defineHastPlugin({
    name: "annotation-anchors",
    element: {
      filter: ["article"],
      visit(node, ctx) {
        const { id, className } = node.properties ?? {}
        if (typeof id !== "string" || !Array.isArray(className) || !className.includes("annotation")) return
        ctx.appendChild(node, {
          type: "element",
          tagName: "a",
          properties: { className: ["annotation-anchor"], href: `#${id}`, ariaHidden: "true", tabIndex: -1 },
          children: [noteIcon("link-variant")],
        })
      },
    },
  })
}
