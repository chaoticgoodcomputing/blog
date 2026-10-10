// Annotations written with Obsidian's Annotator plugin. A note whose `annotation-target` property
// names a document is the plugin's annotation note, and each annotation in it is a block quote: the
// record as JSON in a code block that a comment hides, then the plugin's view of it for Obsidian, and
// the block's id on the line after.
//
//   >%%
//   >```annotation-json
//   >{"text":"…","target":[{"source":"…","selector":[…]}],"tags":[…],"created":"…",…}
//   >```
//   >%%
//   >*%%PREFIX%%…%%HIGHLIGHT%% ==…== %%POSTFIX%%…*
//   >%%LINK%%[[#^id|show annotation]]
//   >%%COMMENT%%
//   >…
//   >%%TAGS%%
//   >#tag, #tag
//   ^id
//
// The JSON is the record, and the only part read; the rest is the plugin's own view of it, and never
// reaches a page. The plugin writes a block in `makeAnnotationString` and finds one with
// `makeAnnotationBlockRegex`:
// https://github.com/elias-sundqvist/obsidian-annotator/blob/3647dd92d0d803bae9a3f34a1aac19eacb2fd52d/src/annotationUtils.tsx

import { fileURLToPath } from "node:url"
import { defineMdastPlugin, markdownToHtml } from "satteri"
import { blockAnchor, obsidianFeatures, obsidianSyntax } from "./syntax/index.ts"
import { type Node, copyOf, isParent, text } from "./syntax/node.ts"
import type { Vault } from "./vault.ts"

/** The node that holds a note's annotations, in the order of the document. */
export const ANNOTATIONS = "annotations"
/** The node of one annotation. */
export const ANNOTATION = "annotation"

/** The document a note's annotations were written against: its non-empty `annotation-target`. */
export function annotationTarget(frontmatter: Record<string, unknown> | null | undefined): string | undefined {
  const target = frontmatter?.["annotation-target"]
  return typeof target === "string" && target.trim() !== "" ? target.trim() : undefined
}

/** One annotation: a passage of the annotated document, and what was written about it. */
export interface Annotation {
  /** The block id Annotator gives it, without its `^`. */
  id: string
  /** The passage, as the document's text has it. Empty for an annotation of no passage. */
  exact: string
  /** The text just before and just after the passage, which tell one quote of it from another. */
  prefix?: string
  suffix?: string
  /** Where the passage starts in the document's text, in characters. */
  start?: number
  /** The comment written on the passage, in Markdown. */
  text?: string
  tags: string[]
  /** When it was written, as the record has it: an ISO 8601 instant. */
  created?: string
  /** Where its block is in the note's source: `[start, end)` offsets, the `^id` line included. */
  position: { start: number; end: number }
}

export interface ParsedAnnotations {
  /**
   * In the order their passages come in the document, each reply directly after what it answers;
   * one with no place in it, and no annotation of the note's to answer, comes last.
   */
  annotations: Annotation[]
  /** The ids of blocks whose JSON does not parse. */
  unreadable: string[]
  /** Where each block is in the source, read or not, in source order. */
  blocks: { start: number; end: number }[]
}

// A block: its quoted JSON, then any quoted lines up to the `^id` line that closes it. Annotator's own
// expression asks for a blank line before the block, which a quote at the start of a body has none of.
const BLOCK =
  /^>%%[ \t]*\r?\n>```annotation-json[ \t]*\r?\n((?:>.*\r?\n)*?)>```[ \t]*\r?\n(?:>.*\r?\n)*?\^([a-zA-Z0-9]+)[ \t]*(?:\r?\n|$)/gm

interface Selector {
  type?: unknown
  exact?: unknown
  prefix?: unknown
  suffix?: unknown
  start?: unknown
}

const string = (value: unknown) => (typeof value === "string" ? value : undefined)

/** Every annotation block in a note's source. */
export function parseAnnotations(source: string): ParsedAnnotations {
  const parsed: ParsedAnnotations = { annotations: [], unreadable: [], blocks: [] }
  // What each reply answers: the last of its `references`, Hypothesis's thread from its root down.
  const answers = new Map<string, string>()
  for (const match of source.matchAll(BLOCK)) {
    const [block, json, id] = match as unknown as [string, string, string]
    const position = { start: match.index, end: match.index + block.length }
    parsed.blocks.push(position)
    let record: any
    try {
      record = JSON.parse(json.replace(/^>/gm, ""))
    } catch {
      parsed.unreadable.push(id)
      continue
    }
    const selectors: Selector[] = Array.isArray(record?.target?.[0]?.selector) ? record.target[0].selector : []
    const quote = selectors.find((selector) => selector?.type === "TextQuoteSelector")
    const place = selectors.find((selector) => selector?.type === "TextPositionSelector")
    const text = string(record?.text)
    const annotation: Annotation = {
      id,
      exact: string(quote?.exact)?.trim() ?? "",
      tags: Array.isArray(record?.tags) ? record.tags.filter((tag: unknown) => typeof tag === "string") : [],
      position,
    }
    if (string(quote?.prefix) !== undefined) annotation.prefix = string(quote?.prefix)
    if (string(quote?.suffix) !== undefined) annotation.suffix = string(quote?.suffix)
    if (typeof place?.start === "number") annotation.start = place.start
    if (text !== undefined && text.trim() !== "") annotation.text = text
    if (string(record?.created) !== undefined) annotation.created = string(record?.created)
    const references: unknown[] = Array.isArray(record?.references) ? record.references : []
    const answered = string(references.at(-1))
    if (answered !== undefined) answers.set(id, answered)
    parsed.annotations.push(annotation)
  }
  // Annotator appends each new annotation to the note, so the note has them in the order they were
  // written; a reader reads them in the order of the document. A reply has no passage of its own,
  // and is read directly after what it answers, its replies after it, each in the order written.
  const ids = new Set(parsed.annotations.map((annotation) => annotation.id))
  const repliesTo = new Map<string, Annotation[]>()
  for (const annotation of parsed.annotations) {
    const answered = answers.get(annotation.id)
    if (answered !== undefined && ids.has(answered)) repliesTo.set(answered, [...(repliesTo.get(answered) ?? []), annotation])
  }
  const isReply = (annotation: Annotation) => ids.has(answers.get(annotation.id) ?? "")
  const thread = (annotation: Annotation): Annotation[] => [annotation, ...(repliesTo.get(annotation.id) ?? []).flatMap(thread)]
  const ordered = parsed.annotations
    .filter((annotation) => !isReply(annotation))
    .sort((a, b) => (a.start ?? Infinity) - (b.start ?? Infinity))
    .flatMap(thread)
  // Replies that answer each other and nothing else reach no annotation with a place; they go last.
  const placed = new Set(ordered)
  parsed.annotations = [...ordered, ...parsed.annotations.filter((annotation) => !placed.has(annotation))]
  return parsed
}

export interface AnnotatorOptions {
  /**
   * The vault the notes are in: what says whether a note has an annotation target, and how a
   * comment is read. A function is called for each note, as the resolver's is.
   */
  vault: Vault | (() => Vault)
  /**
   * How the host writes a date, for the date each annotation was written, shown after its tags. A
   * host that gives none shows no dates.
   */
  formatDate?: (date: Date) => string
}

// A copy of a node and everything under it that belongs to no tree, so it can be placed in another.
const detached = (node: Node): Node =>
  copyOf(node, isParent(node) ? { children: node.children.map(detached) } : {})

/**
 * A comment, read as the vault reads a note, by the syntax plugins alone. Its links are left for the
 * resolver of the note it is placed in, since that is the note it was written in.
 */
function comment(markdown: string, vault: Vault): Node[] {
  const { features, ...syntax } = vault.parseOptions
  const out: { nodes: Node[] } = { nodes: [] }
  markdownToHtml(markdown, {
    features: { ...features, ...obsidianFeatures },
    mdastPlugins: [
      ...obsidianSyntax(syntax),
      defineMdastPlugin({
        name: "obsidian-annotator-comment",
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
function annotationNode(annotation: Annotation, vault: Vault, formatDate?: (date: Date) => string): Node {
  const children: Node[] = []
  if (annotation.exact) {
    children.push(
      element("annotationHighlight", "blockquote", "annotation-highlight", [
        { type: "paragraph", children: [text(annotation.exact)] },
      ]),
    )
  }
  if (annotation.text) {
    children.push(element("annotationComment", "div", "annotation-comment", comment(annotation.text, vault)))
  }
  if (annotation.tags.length) {
    const tags = annotation.tags.map((tag) => element("annotationTag", "li", "annotation-tag", [text(`#${tag}`)]))
    children.push(element("annotationTags", "ul", "annotation-tags", tags))
  }
  const created = annotation.created === undefined ? undefined : new Date(annotation.created)
  if (formatDate && created && !Number.isNaN(created.getTime())) {
    children.push(
      element("annotationDate", "time", "annotation-date", [text(formatDate(created))], { dateTime: created.toISOString() }),
    )
  }
  return {
    type: ANNOTATION,
    data: {
      hName: "article",
      hProperties: { className: ["annotation"], id: blockAnchor(annotation.id) },
      block: { id: annotation.id },
    },
    children,
  }
}

/**
 * Shows the annotations of a note with an annotation target in place of Annotator's blocks. The note
 * becomes what was written before its first block, its preface; then a `<section
 * class="annotations">` holding the annotations in the order of the document, which names the
 * annotated document in `data-annotation-target`; then everything after, its epilogue. Of a block
 * only its record is read, and nothing of it is left: a block whose JSON does not parse is left out,
 * with a warning.
 *
 * It goes after the syntax plugins and before the resolver, which resolves a comment's links from
 * the note, as it does the note's own. Pass it to the resolver's `beforeResolve` too, so that an
 * embed of an annotation shows it.
 */
export function obsidianAnnotator(options: AnnotatorOptions) {
  const current = typeof options.vault === "function" ? options.vault : () => options.vault as Vault

  return defineMdastPlugin({
    name: "obsidian-annotator",
    options: { position: true },
    before(root, ctx) {
      const vault = current()
      const file = ctx.fileURL ? vault.getFileByAbsolutePath(fileURLToPath(ctx.fileURL)) : null
      const target = annotationTarget(file && vault.metadataCache.getFileCache(file)?.frontmatter)
      if (!target) return

      const { annotations, unreadable, blocks } = parseAnnotations(ctx.source)
      for (const id of unreadable) {
        ctx.report({ message: `The annotation ^${id} has a record that is not JSON, and is left out.`, severity: "warning" })
      }

      // A node is part of a block when it starts inside one: the quote, and the `^id` line after it,
      // which the syntax plugins have already folded into the quote.
      const first = blocks[0]?.start ?? Infinity
      const preface: Node[] = []
      const epilogue: Node[] = []
      for (const node of (root as unknown as Node).children ?? []) {
        const start = node.position?.start.offset
        if (start !== undefined && blocks.some((block) => start >= block.start && start < block.end)) continue
        ;(start !== undefined && start > first ? epilogue : preface).push(node)
      }

      const shown = annotations.map((annotation) => annotationNode(annotation, vault, options.formatDate))
      const section = element(ANNOTATIONS, "section", "annotations", shown, { "data-annotation-target": target })
      ctx.setProperty(root as never, "children", [...preface, section, ...epilogue] as never)
    },
  })
}
