import { QuartzTransformerPlugin } from "../types"
import { Root } from "hast"
import { Element } from "hast"
import { visit } from "unist-util-visit"
import { unified, Processor } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { toHtml } from "hast-util-to-html"
import { BuildCtx } from "../../util/ctx"
import { Root as MDRoot } from "remark-parse/lib"
import { VFile } from "vfile"
import { SimpleSlug, simplifySlug, stripSlashes, splitAnchor, FullSlug } from "../../util/path"
import isAbsoluteUrl from "is-absolute-url"

/**
 * Extracts internal link slugs from a hast tree.
 * This replicates the link extraction logic from CrawlLinks for annotation content.
 * 
 * With markdownLinkResolution: "absolute", all internal links start with "/".
 */
function extractLinksFromHast(hast: Root, _curSlug: SimpleSlug): SimpleSlug[] {
  const outgoing: Set<SimpleSlug> = new Set()
  
  visit(hast, "element", (node: Element) => {
    if (
      node.tagName === "a" &&
      node.properties &&
      typeof node.properties.href === "string"
    ) {
      let dest = node.properties.href
      const isExternal = isAbsoluteUrl(dest, { httpOnly: false })
      const isInternal = !(isExternal || dest.startsWith("#"))
      
      if (isInternal) {
        // With absolute link resolution, all internal links start with /
        if (dest.startsWith("/")) {
          dest = dest.substring(1) // Remove leading /
        }
        
        const [destCanonical, _destAnchor] = splitAnchor(dest)
        let canonical = destCanonical
        if (canonical.endsWith("/")) {
          canonical += "index"
        }
        
        const full = decodeURIComponent(stripSlashes(canonical, true)) as FullSlug
        const simple = simplifySlug(full)
        outgoing.add(simple)
      }
    }
  })
  
  return Array.from(outgoing)
}

/**
 * Creates a unified processor for annotation text processing.
 * 
 * Uses a whitelist of content-level plugins. Annotation text is processed with
 * the parent file's context (path, slug) to enable wikilink resolution.
 * 
 * Included plugins:
 * - SyntaxHighlighting: code block highlighting
 * - Latex: math rendering (KaTeX/MathJax)
 * - GitHubFlavoredMarkdown: tables, strikethrough, task lists, etc.
 * - MDX: JSX syntax support (if configured)
 * - ObsidianFlavoredMarkdown: wikilink resolution using parent file context
 * 
 * Excluded plugins that need document-level structure:
 * - FrontMatter: expects frontmatter at document start
 * - CreatedModifiedDate/Lastmod: require file path for git/fs lookups
 * - CrawlLinks: modifies link structure at document level
 * - TableOfContents: generates document-level ToC
 * - Description: generates page-level meta descriptions
 */
function createAnnotationProcessor(ctx: BuildCtx): Processor<MDRoot, Root, Root> {
  // Whitelist of plugins that work with content fragments
  const contentLevelPlugins = new Set([
    'SyntaxHighlighting',
    'Latex',
    'GitHubFlavoredMarkdown',
    'MDX',
    'ObsidianFlavoredMarkdown',
    'LinkProcessing',
  ])
  
  const transformers = ctx.cfg.plugins.transformers
    .filter(plugin => contentLevelPlugins.has(plugin.name))
  
  return unified()
    // Parse markdown to AST
    .use(remarkParse)
    // Apply content-level markdown transformations
    .use(transformers.flatMap(p => p.markdownPlugins?.(ctx) ?? []))
    // Convert markdown AST to HTML AST
    .use(remarkRehype, { 
      allowDangerousHtml: true,
      // Pass MDX JSX nodes through if MDX plugin is active
      passThrough: [
        'mdxjsEsm',
        'mdxFlowExpression',
        'mdxJsxFlowElement',
        'mdxJsxTextElement',
        'mdxTextExpression',
      ],
    })
    // Apply content-level HTML transformations
    .use(transformers.flatMap(p => p.htmlPlugins?.(ctx) ?? []))
}

export interface AnnotationData {
  id?: string
  created: string
  updated: string
  document: {
    title: string
  }
  uri: string
  target: Array<{
    source: string
    selector: Array<
      | { type: "TextPositionSelector"; start: number; end: number }
      | { type: "TextQuoteSelector"; exact: string; prefix: string; suffix: string }
    >
  }>
  text?: string
  tags?: string[]
}

/**
 * Extracts Obsidian Annotator annotation blocks from markdown content
 * and stores them in fileData for use by the AnnotationViewer component.
 * 
 * This runs during the parse phase, before markdown is converted to HTML,
 * allowing us to access the raw blockquote syntax.
 */
export const Annotations: QuartzTransformerPlugin = () => {
  return {
    name: "Annotations",
    textTransform(_ctx, src) {
      // Extract annotations from raw markdown before it's parsed
      const annotations: AnnotationData[] = []
      
      // Match annotation blocks: >%%\n>```annotation-json\n>{json}\n>```\n>%%\n...\n^id
      const annotationRegex = />%%\s*\n>```annotation-json\s*\n>([\s\S]*?)\n>```\s*\n>%%[\s\S]*?\n\^([a-z0-9]+)/gm
      
      let match: RegExpExecArray | null
      while ((match = annotationRegex.exec(src)) !== null) {
        try {
          // Extract JSON string (remove > prefix from each line)
          const jsonLines = match[1].split('\n')
          const jsonStr = jsonLines.map(line => line.replace(/^>/, '')).join('\n')
          const annotationId = match[2]
          
          const annotation = JSON.parse(jsonStr) as AnnotationData
          annotation.id = annotationId
          annotations.push(annotation)
        } catch (e) {
          console.error(`[Annotations] Failed to parse annotation: ${e}`)
        }
      }
      
      // Remove annotation blocks from source to prevent MDX parsing errors
      // Use a fresh regex instance for replacement since we already consumed the matches above
      const annotationRemovalRegex = />%%\s*\n>```annotation-json\s*\n>([\s\S]*?)\n>```\s*\n>%%[\s\S]*?\n\^([a-z0-9]+)/gm
      src = src.replace(annotationRemovalRegex, '')
      
      // Store annotations in a way that will be accessible in fileData
      // We'll inject this as a special code block that won't be rendered
      // Using a code fence is MDX-compatible unlike HTML comments
      if (annotations.length > 0) {
        const annotationsJson = JSON.stringify(annotations)
        const encoded = Buffer.from(annotationsJson).toString('base64')
        // Use a hidden code block that will be in the tree but not rendered
        src += `\n\n\`\`\`quartz-annotations\n${encoded}\n\`\`\`\n`
      }
      
      return src
    },
    markdownPlugins(ctx) {
      return [
        () => {
          return async (tree: Root, file) => {
            // Extract annotation metadata from the hidden code block we injected
            let annotationsToProcess: any[] = []
            let codeNode: any = null
            
            visit(tree, "code", (node: any) => {
              // Look for our special quartz-annotations code block
              if (node.lang === "quartz-annotations" && node.value) {
                try {
                  const annotationsJson = Buffer.from(node.value.trim(), 'base64').toString('utf-8')
                  const annotations = JSON.parse(annotationsJson)
                  annotationsToProcess = annotations
                  codeNode = node
                } catch (e) {
                  console.error(`[Annotations] Failed to decode annotation metadata: ${e}`)
                }
              }
            })
            
            // Process markdown in annotation text fields (outside of visit callback)
            if (annotationsToProcess.length > 0) {
              // Create processor once for all annotations, using content-level plugins
              const annotationProcessor = createAnnotationProcessor(ctx)
              const annotationLinks: SimpleSlug[] = []
              
              for (const annotation of annotationsToProcess) {
                if (annotation.text) {
                  // Create a VFile for the annotation text that inherits the parent file's path context
                  // This allows ObsidianFlavoredMarkdown to resolve wikilinks correctly
                  const annotationFile = new VFile({
                    value: annotation.text,
                    path: file.path,
                    data: {
                      slug: file.data.slug,
                      filePath: file.data.filePath,
                      relativePath: file.data.relativePath,
                    }
                  })
                  
                  // Parse markdown -> apply transformations -> convert to HTML
                  const tree = annotationProcessor.parse(annotationFile)
                  const hast = await annotationProcessor.run(tree, annotationFile)
                  
                  // Extract internal links from the annotation for graph connectivity
                  const curSlug = simplifySlug(file.data.slug!)
                  const links = extractLinksFromHast(hast as Root, curSlug)
                  annotationLinks.push(...links)
                  
                  annotation.text = toHtml(hast as Root)
                }
              }
              
              // Store in file data for component access
              file.data.annotations = annotationsToProcess
              
              // Store annotation links separately - will be merged by CrawlLinks plugin
              file.data.annotationLinks = annotationLinks
              
              // Remove the code block from output
              if (codeNode) {
                codeNode.type = 'html'
                codeNode.value = ''
                delete codeNode.lang
              }
            }
          }
        }
      ]
    },
  }
}

declare module "vfile" {
  interface DataMap {
    annotations: AnnotationData[]
    annotationLinks: SimpleSlug[]
  }
}

