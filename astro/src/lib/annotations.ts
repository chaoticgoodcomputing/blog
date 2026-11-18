// Annotation pages: a note with an annotation target, shown as its preface, its annotations and its
// epilogue. The notes are W3C Web Annotations as `web-annotations` reads and writes them (MIT, its
// SPEC in packages/annotator/web-annotations): this module reads them through it, puts the
// annotations in a section of their own in place of their blocks (`annotationSection`,
// astro.config.ts), opens the page with where the annotated document comes from, and lays the page
// out (src/styles/prose/annotations.css), as the Quartz annotator laid it out
// (docs/cutover/annotations-audit.md).

import { fileURLToPath } from "node:url"
import { blockAnchor, obsidianFeatures, obsidianSyntax, type Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import {
  AnnotationPropertyError,
  readAnnotationProperties,
  readNote,
  tagsOf,
  type AnnotationProperties,
  type Selector,
} from "@chaoticgoodcomputing/web-annotations"
import { defineHastPlugin, defineMdastPlugin, markdownToHtml } from "satteri"
import type { AnnotatedPassage } from "./highlights.ts"
import type { Note } from "./notes.ts"
import { formatDate } from "./dates.ts"
import { calloutLook } from "./callouts.ts"
import { markQuote } from "./quotes.ts"
import { noteIcon } from "./icons.ts"
import { site } from "../site.config.ts"

/** A note as its annotation properties are read: its frontmatter, and its file, which names it. */
export type AnnotatedNote = Pick<Note, "frontmatter"> & { file?: { path: string } | undefined }

/**
 * A note's annotation properties: what it annotates, what kind of document that is, and which of its
 * pages. Undefined for a note that is no annotation note, with no `annotation-target`. A property
 * that can't be read, a malformed page range among them, fails the build, naming the note.
 */
export function annotationPropertiesOf(note: AnnotatedNote): AnnotationProperties | undefined {
  const properties = readAnnotationProperties(note.frontmatter)
  if (properties instanceof AnnotationPropertyError) throw new Error(`${note.file?.path ?? "A note"}: ${properties.message}`)
  return properties
}

/** Whether a note's page is an annotation page: the note has an annotation target. */
export const isAnnotationPage = (note: AnnotatedNote): boolean => annotationPropertiesOf(note) !== undefined

/**
 * The web page a note's annotations were made on, in the browser (`annotation-target-type: web`):
 * what its page links passage by passage, and answers by webmention. Undefined for any other note,
 * a PDF's among them.
 */
export function webAnnotationTarget(note: AnnotatedNote): string | undefined {
  const properties = annotationPropertiesOf(note)
  return properties?.targetType === "web" && URL.canParse(properties.target) ? properties.target : undefined
}

/**
 * The kind of file a page's annotated document is, by its file name's extension, as a search
 * engine marks a result that is one: `pdf`; or `web`, for a web page annotated in the browser
 * (`annotation-target-type: web`). None for a note that isn't an annotation page, a private page,
 * which says nothing of what it is, or a document whose address names no extension.
 */
export function annotatedFileType(note: AnnotatedNote & Pick<Note, "isPrivate">): string | undefined {
  const target = annotationPropertiesOf(note)?.target
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

/** One annotation, as a page shows it: a passage of the annotated document, and what was written on it. */
export interface Annotation {
  /** Its block id, without its `^`. */
  id: string
  /** The passage, its `TextQuoteSelector`'s quote. Empty for an annotation of no passage, a reply. */
  exact: string
  /** The text just before and just after the passage, which tell one quote of it from another. */
  prefix?: string
  suffix?: string
  /** Where the passage starts in the document's text, in characters: its `TextPositionSelector`'s. */
  start?: number
  /** The comment written on it, in Markdown; empty for none. */
  comment: string
  tags: string[]
  /** When it was written: an ISO 8601 instant. */
  created: string
}

export interface ReadAnnotations {
  /**
   * In the order their passages come in the document, each reply directly after what it answers;
   * one with no place in it, and no annotation of the note's to answer, comes last.
   */
  annotations: Annotation[]
  /** Where each block is in the source, read or not, in source order: `[start, end)` offsets. */
  blocks: { start: number; end: number }[]
  /** Why each block that can't be read can't be. */
  unreadable: string[]
}

const selectorOf = (selectors: readonly Selector[] | undefined, type: string) => selectors?.find((selector) => selector.type === type)
const string = (value: unknown) => (typeof value === "string" ? value : undefined)

/** The annotation blocks of a note's source, read by `web-annotations`. */
export function readAnnotations(source: string): ReadAnnotations {
  const note = readNote(source)
  const blockIdOf = new Map(note.annotations.map(({ record, blockId }) => [record.id, blockId]))
  // What each reply answers: its target, which is its parent's id.
  const answers = new Map<string, string>()
  const annotations = note.annotations.map(({ blockId, record, comment }): Annotation => {
    const passage = typeof record.target === "string" ? undefined : record.target
    if (typeof record.target === "string") {
      const answered = blockIdOf.get(record.target)
      if (answered !== undefined) answers.set(blockId, answered)
    }
    const quote = selectorOf(passage?.selector, "TextQuoteSelector")
    const place = selectorOf(passage?.selector, "TextPositionSelector")
    const annotation: Annotation = { id: blockId, exact: string(quote?.exact)?.trim() ?? "", comment, tags: tagsOf(record), created: record.created }
    if (string(quote?.prefix) !== undefined) annotation.prefix = string(quote?.prefix)
    if (string(quote?.suffix) !== undefined) annotation.suffix = string(quote?.suffix)
    if (typeof place?.start === "number") annotation.start = place.start
    return annotation
  })
  // The note has its annotations in the order they were written; a reader reads them in the order
  // of the document. A reply has no passage of its own, and is read directly after what it answers,
  // its replies after it, each in the order written.
  const repliesTo = Map.groupBy(
    annotations.filter((annotation) => answers.has(annotation.id)),
    (annotation) => answers.get(annotation.id)!,
  )
  const thread = (annotation: Annotation): Annotation[] => [annotation, ...(repliesTo.get(annotation.id) ?? []).flatMap(thread)]
  const ordered = annotations
    .filter((annotation) => !answers.has(annotation.id))
    .sort((a, b) => (a.start ?? Infinity) - (b.start ?? Infinity))
    .flatMap(thread)
  // Replies that answer each other and nothing else reach no annotation with a place; they go last.
  const placed = new Set(ordered)
  return {
    annotations: [...ordered, ...annotations.filter((annotation) => !placed.has(annotation))],
    blocks: [...note.annotations.map(({ span }) => span), ...note.errors.map(({ span }) => span)]
      .map(({ start, end }) => ({ start, end }))
      .sort((a, b) => a.start - b.start),
    unreadable: note.errors.map(({ message, blockId }) => (blockId === undefined ? message : `^${blockId}: ${message}`)),
  }
}

/**
 * The passages an annotation page's annotations are written on, read from the note's source as its
 * page reads its annotations: each annotation's quote, with its id, the text either side of it and
 * where it starts. An annotation with no quote, a reply, has none.
 */
export function annotatedPassages(note: Pick<Note, "file">, vault: Vault): AnnotatedPassage[] {
  return readAnnotations(vault.read(note.file) ?? "")
    .annotations.filter((annotation) => annotation.exact)
    .map(({ id, exact, prefix, suffix, start }) => ({ id, exact, prefix, suffix, start }))
}

/**
 * The address of a passage in a web page: the page's, with a text fragment for the passage, which
 * a browser that has them scrolls to and marks
 * (https://wicg.github.io/scroll-to-text-fragment/). A long passage is named by its first and last
 * words; the words either side of it tell one quote of it from another.
 */
export function passageAddress(target: string, annotation: Pick<Annotation, "exact" | "prefix" | "suffix">): string {
  const words = (text: string | undefined) => (text ?? "").trim().split(/\s+/).filter(Boolean)
  // A text fragment's own delimiters, `-`, `,` and `&`, are written percent-encoded.
  const encode = (list: string[]) => encodeURIComponent(list.join(" ")).replace(/-/g, "%2D")
  const exact = words(annotation.exact)
  if (exact.length === 0) return target
  const quote = exact.length > 10 ? `${encode(exact.slice(0, 5))},${encode(exact.slice(-5))}` : encode(exact)
  const prefix = words(annotation.prefix).slice(-3)
  const suffix = words(annotation.suffix).slice(0, 3)
  const text = [prefix.length ? `${encode(prefix)}-` : "", quote, suffix.length ? `-${encode(suffix)}` : ""].filter(Boolean).join(",")
  return `${target.replace(/#.*$/, "")}#:~:text=${text}`
}

// ─── The section of annotations ─────────────────────────────────────────────────────────────────

/** The node that holds a note's annotations, in the order of the document. */
export const ANNOTATIONS = "annotations"
/** The node of one annotation. */
export const ANNOTATION = "annotation"

interface Node {
  type: string
  children?: Node[]
  value?: string
  data?: Record<string, any> | null
  position?: { start: { offset?: number } }
  [key: string]: unknown
}

const text = (value: string): Node => ({ type: "text", value })

// The fields mdast nodes carry besides `type`, `children` and `position`. A node Sätteri hands a
// plugin has internals of its own beside these, so a copy takes the fields by name.
const FIELDS = [
  "value", "depth", "ordered", "start", "spread", "checked", "url", "title", "alt", "lang", "meta",
  "align", "identifier", "label", "referenceType", "name", "attributes", "data",
] as const

// A copy of a node and everything under it that belongs to no tree, so it can be placed in another.
function detached(node: Node): Node {
  const copy: Node = { type: node.type }
  for (const field of FIELDS) if (node[field] !== undefined && node[field] !== null) (copy as Record<string, unknown>)[field] = node[field]
  if (Array.isArray(node.children)) copy.children = node.children.map(detached)
  return copy
}

/**
 * A comment, read as the vault reads a note, by the syntax plugins alone. Its links are left for the
 * resolver of the note it is placed in, since that is the note it was written in.
 */
function commentNodes(markdown: string, vault: Vault): Node[] {
  const { features, ...syntax } = vault.parseOptions
  const out: { nodes: Node[] } = { nodes: [] }
  markdownToHtml(markdown, {
    features: { ...features, ...obsidianFeatures },
    mdastPlugins: [
      ...obsidianSyntax(syntax),
      defineMdastPlugin({
        name: "annotation-comment",
        after(root) {
          out.nodes = ((root as unknown as Node).children ?? []).map(detached)
        },
      }),
    ],
  })
  return out.nodes
}

function element(type: string, hName: string, className: string, children: Node[], properties = {}): Node {
  return { type, data: { hName, hProperties: { className: [className], ...properties } }, children }
}

/**
 * One annotation as a page shows it: the passage, then the comment, then the tags, then the date it
 * was written, where the host writes dates. It carries its block id, as a block of the note does, so
 * a link to `#^id` lands on it and an embed of `^id` shows it.
 */
function annotationNode(annotation: Annotation, vault: Vault, formatDate?: (date: Date) => string, web?: string): Node {
  const children: Node[] = []
  if (annotation.exact) {
    children.push(
      element(
        "annotationHighlight",
        "blockquote",
        "annotation-highlight",
        [{ type: "paragraph", children: [text(annotation.exact)] }],
        // A web page's passage is quoted from an address of its own, as a quotation's `cite` names one.
        web === undefined ? {} : { cite: passageAddress(web, annotation) },
      ),
    )
  }
  if (annotation.comment.trim()) {
    children.push(element("annotationComment", "div", "annotation-comment", commentNodes(annotation.comment, vault)))
  }
  if (annotation.tags.length) {
    const tags = annotation.tags.map((tag) => element("annotationTag", "li", "annotation-tag", [text(`#${tag}`)]))
    children.push(element("annotationTags", "ul", "annotation-tags", tags))
  }
  const created = new Date(annotation.created)
  if (formatDate && !Number.isNaN(created.getTime())) {
    children.push(element("annotationDate", "time", "annotation-date", [text(formatDate(created))], { dateTime: created.toISOString() }))
  }
  return {
    type: ANNOTATION,
    data: { hName: "article", hProperties: { className: ["annotation"], id: blockAnchor(annotation.id) }, block: { id: annotation.id } },
    children,
  }
}

export interface AnnotationSectionOptions {
  /** The vault the notes are in: what says whether a note is an annotation note, and how a comment is read. */
  vault: Vault | (() => Vault)
  /** How a date is written, for the date each annotation was written. Without it, no dates are shown. */
  formatDate?: (date: Date) => string
}

/**
 * Shows the annotations of an annotation note in place of their blocks. The note becomes what was
 * written before its first block, its preface; then a `<section class="annotations">` holding the
 * annotations in the order of the document, which names the annotated document in
 * `data-annotation-target`, and its kind in `data-annotation-target-type` for a web page; then
 * everything after, its epilogue. A web page's passages each `cite` their own address in it
 * (`passageAddress`). Nothing of a block is left: one that can't be read is left out, with a
 * warning.
 *
 * It goes after the syntax plugins and before the resolver, which resolves a comment's links from
 * the note, as it does the note's own. Pass it to the resolver's `beforeResolve` too, so that an
 * embed of an annotation shows it.
 */
export function annotationSection(options: AnnotationSectionOptions) {
  const current = typeof options.vault === "function" ? options.vault : () => options.vault as Vault

  return defineMdastPlugin({
    name: "annotation-section",
    options: { position: true },
    before(root, ctx) {
      const vault = current()
      const file = ctx.fileURL ? vault.getFileByAbsolutePath(fileURLToPath(ctx.fileURL)) : null
      const frontmatter = file && vault.metadataCache.getFileCache(file)?.frontmatter
      const properties = file ? annotationPropertiesOf({ frontmatter: frontmatter ?? {}, file }) : undefined
      if (!properties) return

      const { annotations, unreadable, blocks } = readAnnotations(ctx.source)
      for (const reason of unreadable) ctx.report({ message: `An annotation block can't be read, and is left out: ${reason}`, severity: "warning" })

      // A node is part of a block when it starts inside one: the callout, and the `^id` line after
      // it, which the syntax plugins have already folded into the callout. A callout is a node the
      // syntax plugins made, and keeps its quote's place in its data.
      const first = blocks[0]?.start ?? Infinity
      const preface: Node[] = []
      const epilogue: Node[] = []
      for (const node of (root as unknown as Node).children ?? []) {
        const start = (node.position ?? node.data?.sourcePosition)?.start.offset
        if (start !== undefined && blocks.some((block) => start >= block.start && start < block.end)) continue
        ;(start !== undefined && start > first ? epilogue : preface).push(node)
      }

      const web = properties.targetType === "web" && URL.canParse(properties.target) ? properties.target : undefined
      const shown = annotations.map((annotation) => annotationNode(annotation, vault, options.formatDate, web))
      const section = element(ANNOTATIONS, "section", "annotations", shown, {
        "data-annotation-target": properties.target,
        ...(properties.targetType === "web" ? { "data-annotation-target-type": "web" } : {}),
      })
      ctx.setProperty(root as never, "children", [...preface, section, ...epilogue] as never)
    },
  })
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
 * a web page's "From <host>", so it stands over the document once the viewer draws it; and heads
 * the annotations. The link is a Markdown link, so the resolver after it gives a document kept in
 * the vault the address the site publishes it at.
 */
export function annotatedDocument() {
  return defineMdastPlugin({
    name: "annotated-document",
    custom(node, ctx) {
      if (node.type !== ANNOTATIONS) return
      const properties = (node.data as { hProperties?: Record<string, unknown> } | undefined)?.hProperties
      const target = properties?.["data-annotation-target"]
      const web = properties?.["data-annotation-target-type"] === "web" && typeof target === "string" && URL.canParse(target)
      const parent = ctx.parent(node)
      if (typeof target !== "string" || !parent) return
      ctx.prependChild(node, {
        type: "heading",
        depth: 2,
        data: { hProperties: { className: ["annotations-heading"] } },
        children: [{ type: "text", value: "Annotations" }],
      })
      const link = (value: string) => ({ type: "link", url: encodeURI(decodeURI(target)), children: [{ type: "text", value }] })
      const source = {
        type: "paragraph",
        data: { hProperties: { className: ["annotated-document"] } },
        children: [{ type: "text", value: web ? "From " : "Source document: " }, link(named(target))],
      }
      const children = [...parent.children]
      const at = ctx.indexOf(node)
      if (at === undefined) return
      // A footnote's or a link's definition is no block of the text: the note's footnotes are drawn
      // under the body, or beside the blocks that cite them (src/lib/sidenotes.ts), wherever their
      // definitions are written.
      const isDefinition = (child: (typeof children)[number]) => child.type === "footnoteDefinition" || child.type === "definition"
      const column = (className: string, nodes: typeof children) => {
        const blocks = nodes.filter((child) => !isDefinition(child))
        return blocks.length ? [{ type: className, data: { hName: "div", hProperties: { className: [className] } }, children: blocks }] : []
      }
      ctx.setProperty(parent, "children", [
        ...column("annotation-preface", children.slice(0, at)),
        source,
        node,
        ...column("annotation-epilogue", children.slice(at + 1)),
        ...children.filter(isDefinition),
      ] as never)
    },
  })
}

/**
 * Shows a web page's passage, in its card, as a quote callout, `[!QUOTE]`, the whole box a link to
 * the passage in the page itself: the address its quote cites, whose text fragment a browser that
 * has them scrolls to and marks, with a quote callout's icon (src/lib/callouts.ts). A PDF's passage
 * cites none and stays a quote: the viewer shows it in its document. Either is a quote whose words
 * are set as every quote's are (src/lib/quotes.ts).
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
        markQuote(callout as never)
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
