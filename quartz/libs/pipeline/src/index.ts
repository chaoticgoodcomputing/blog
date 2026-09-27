// Pipeline reconstruction: the site's configured transformer pipeline, rebuilt outside Quartz's own
// parser for content Quartz does not parse itself (`.mdx` pages, annotation text). Mirrors
// `quartz/processors/parse.ts` (createFileParser, createMdProcessor, createHtmlProcessor) from
// nothing but `ctx.cfg.plugins.transformers`, so it needs no import of Quartz's core. See CONTEXT.md.
import { unified, type PluggableList } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { VFile } from "vfile"
import type { Root } from "hast"

/**
 * A transformer instance, as Quartz holds it. Its hooks receive the build context the pipeline was
 * created with, unchanged.
 */
export interface Transformer {
  name: string
  textTransform?: (ctx: any, src: string) => string
  markdownPlugins?: (ctx: any) => PluggableList
  htmlPlugins?: (ctx: any) => PluggableList
}

/** The part of Quartz's build context the pipeline reads. */
export interface PipelineContext {
  cfg: { plugins: { transformers?: readonly Transformer[] } }
}

export interface PipelineOptions {
  /**
   * The denylist: transformers to leave out, by transformer name. That is the `name` the instance
   * carries (`TableOfContents`, `Latex`), which is not always the plugin's name: `crawl-links` is
   * `LinkProcessing`. A name no configured transformer carries is ignored, so a denylist can name
   * transformers a site doesn't enable.
   */
  skip?: Iterable<string>
  /** remark plugins of the caller's own, run before or after every transformer's markdown plugins. */
  markdownPlugins?: { before?: PluggableList; after?: PluggableList }
}

/** The data Quartz gives every markdown file before parsing it, which transformers rely on. */
export interface SourceData {
  /** Absolute path of the source file, also the vfile's path. */
  filePath: string
  /** Path relative to the content directory. */
  relativePath: string
  slug: string
}

export interface Pipeline {
  /**
   * Runs one source through the pipeline as Quartz runs a markdown file: trimmed, through every
   * text transform, parsed, then every markdown plugin and every html plugin. Resolves with the
   * HTML tree and the vfile, whose `data` holds what the transformers derived (frontmatter, links,
   * the table of contents).
   */
  run(source: string, data: SourceData): Promise<{ hast: Root; file: VFile }>
}

export function createPipeline(ctx: PipelineContext, options: PipelineOptions = {}): Pipeline {
  const skip = new Set(options.skip)
  const transformers = (ctx.cfg.plugins.transformers ?? []).filter((t) => !skip.has(t.name))

  // Built once and reused for every source, as Quartz reuses its own.
  const markdown = unified()
    .use(remarkParse)
    .use(options.markdownPlugins?.before ?? [])
    .use(transformers.flatMap((t) => t.markdownPlugins?.(ctx) ?? []))
    .use(options.markdownPlugins?.after ?? [])
  const html = unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(transformers.flatMap((t) => t.htmlPlugins?.(ctx) ?? []))

  return {
    async run(source, data) {
      let value = source.trim()
      for (const t of transformers) if (t.textTransform) value = t.textTransform(ctx, value)
      const file = new VFile({ value, path: data.filePath })
      Object.assign(file.data, data)
      const mdast = await markdown.run(markdown.parse(file), file)
      const hast = (await html.run(mdast as any, file)) as unknown as Root
      return { hast, file }
    },
  }
}
