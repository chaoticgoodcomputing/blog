// The transformer half: it takes an annotation page's annotations out of its markdown, renders each
// note through the site's own pipeline minus a denylist (docs/adr/0002), and publishes what they
// link to and say to the page's `links` and `text`, as a note's body would.
//
// It runs after `crawl-links` and `description` (defaultOrder 75, above their 60 and 70), because
// those set the page's `links` and `text` outright, and the annotations are added to what they set.
// Its markdown plugin runs before either of theirs all the same: every markdown plugin runs before
// any html plugin, so the Annotator markup is gone before they read the page.
import { createPipeline, type Pipeline, type PipelineContext } from "@chaoticgoodcomputing/pipeline"
import { toHtml } from "hast-util-to-html"
import { toString } from "hast-util-to-string"
import { styleText } from "node:util"
import { findAnnotations, type Annotation, type RenderedAnnotation } from "./annotations"
import { annotationTarget } from "./mirror"

/** The name this plugin's transformer carries, which its own pipeline always leaves out. */
export const NAME = "cgc-annotator"

/**
 * Transformers that act on a whole page rather than on a passage of markdown, by transformer name.
 * A note is rendered without them, as v4 rendered one with only what works on a fragment.
 */
export const DEFAULT_DENYLIST = [
  "NoteProperties",
  "CreatedModifiedDate",
  "TableOfContents",
  "Description",
  "BasesTransformer",
  "UnlistedPages",
  "EncryptedPages",
]

/** What an annotation page carries on its `fileData`, as `cgcAnnotator`, for the page type to render. */
export interface AnnotatorData {
  annotations: RenderedAnnotation[]
}

/** Every warning this plugin prints, in one format. It never fails the build. */
export const warn = (message: string) => console.warn(styleText("yellow", "⚠") + ` ${NAME}: ${message}`)

// The same text Quartz's `description` transformer puts in `text`.
const escapeHTML = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")

interface Position {
  start?: { offset?: number }
  end?: { offset?: number }
}

export function Transformer(denylist: string[]) {
  // One pipeline per build context, built on first use: the site's transformers are loaded by then.
  const pipelines = new WeakMap<object, Pipeline>()
  const pipelineFor = (ctx: PipelineContext) => {
    if (!pipelines.has(ctx)) pipelines.set(ctx, createPipeline(ctx, { skip: [...denylist, NAME] }))
    return pipelines.get(ctx)!
  }

  return {
    // Takes the annotation blocks out of the page's markdown and keeps their JSON for the html pass.
    markdownPlugins: () => [
      () => (tree: { children: { position?: Position }[] }, file: any) => {
        if (!annotationTarget(file.data.frontmatter)) return
        const found = findAnnotations(String(file.value))
        for (const id of found.unreadable) warn(`${file.data.relativePath}: annotation ^${id} has JSON that doesn't parse, so it's left out.`)
        const inBlock = (node: { position?: Position }) => {
          const start = node.position?.start?.offset
          const end = node.position?.end?.offset
          return start !== undefined && end !== undefined && found.spans.some(([from, to]) => start >= from && end <= to)
        }
        tree.children = tree.children.filter((node) => !inBlock(node))
        file.data.cgcAnnotator = { annotations: found.annotations }
      },
    ],
    // Renders each note, and adds what the notes link to and say to the page's own.
    htmlPlugins: (ctx: PipelineContext) => [
      () => async (_tree: unknown, file: any) => {
        const data: AnnotatorData | undefined = file.data.cgcAnnotator
        if (!data) return
        // Each note is rendered as a passage of this page, so its links resolve from here.
        const source = { filePath: file.data.filePath, relativePath: file.data.relativePath, slug: file.data.slug }
        const rendered = await Promise.all(
          data.annotations.map(async (annotation: Annotation) => {
            if (!annotation.text) return { annotation, links: [], text: "" }
            const { hast, file: note } = await pipelineFor(ctx).run(annotation.text, source)
            return {
              annotation: { ...annotation, html: toHtml(hast as any, { allowDangerousHtml: true }) } as RenderedAnnotation,
              links: ((note.data as { links?: string[] }).links ?? []) as string[],
              text: toString(hast as any),
            }
          }),
        )
        data.annotations = rendered.map((r) => r.annotation)
        file.data.links = [...new Set([...(file.data.links ?? []), ...rendered.flatMap((r) => r.links)])]
        // Searched and timed like the rest of the page: each passage, then what was written on it.
        const said = rendered.flatMap((r) => [r.annotation.exact, r.text]).filter((t) => t.trim() !== "")
        file.data.text = [file.data.text ?? "", ...said.map(escapeHTML)].filter(Boolean).join(" ")
      },
    ],
  }
}
