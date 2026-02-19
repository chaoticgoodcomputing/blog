/** @jsxImportSource preact */
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { readFileSync } from "fs"
import { FilePath, joinSegments } from "../util/path"
// @ts-ignore
import script from "./scripts/annotationViewer/main.inline"
import style from "./styles/annotationViewer.scss"

interface AnnotationData {
  id: string
  text: string
  tags: string[]
  target: Array<{
    source: string
    selector: Array<{
      type: string
      start?: number
      end?: number
      exact?: string
      prefix?: string
      suffix?: string
    }>
  }>
  created: string
  updated: string
}

/**
 * Parses annotation blocks from markdown content.
 * Each annotation is a blockquote containing JSON metadata and formatted text.
 */
function parseAnnotations(content: string): AnnotationData[] {
  const annotations: AnnotationData[] = []

  // Match annotation blocks WITHOUT the > blockquote prefix (it's already stripped from fileData.text)
  // Pattern: %%\n```annotation-json\n{json}\n```\n%%\n...\n^id
  const annotationRegex = /%%\s*\n```annotation-json\s*\n([\s\S]*?)\n```\s*\n%%[\s\S]*?\n\^([a-z0-9]+)/gm

  let match: RegExpExecArray | null
  while ((match = annotationRegex.exec(content)) !== null) {
    try {
      const jsonStr = match[1]
      const annotationId = match[2]

      const annotation = JSON.parse(jsonStr) as AnnotationData
      annotation.id = annotationId
      annotations.push(annotation)
    } catch (e) {
      console.error("Failed to parse annotation:", e, match[0].substring(0, 100))
    }
  }

  return annotations
}

/**
 * Component that displays a PDF with synchronized annotations.
 * 
 * Layout:
 * - Left side: PDF viewer using PDF.js
 * - Right side: Annotations list synced to PDF scroll position
 * 
 * The component uses TextPositionSelector data from annotations to determine
 * which page and position each annotation corresponds to.
 */
export default (() => {
  const AnnotationViewer: QuartzComponent = ({
    fileData,
    displayClass,
  }: QuartzComponentProps) => {
    const pdfUrl = fileData.frontmatter?.["annotation-target"] as string | undefined

    if (!pdfUrl) {
      return null
    }

    // Convert external URL to local asset path
    const getLocalPdfPath = (url: string): string => {
      try {
        const urlObj = new URL(url)
        const filename = urlObj.pathname.split('/').pop() || 'document.pdf'
        return `/assets/annotated-documents/${filename}`
      } catch {
        return url // Fallback to original URL if parsing fails
      }
    }

    // Get source domain for citation
    const getSourceDomain = (url: string): string => {
      try {
        const urlObj = new URL(url)
        return urlObj.hostname
      } catch {
        return url
      }
    }

    const localPdfPath = getLocalPdfPath(pdfUrl)
    const sourceDomain = getSourceDomain(pdfUrl)

    // Get pre-parsed annotations from fileData (populated by Annotations transformer plugin)
    const annotations = (fileData.annotations as AnnotationData[]) || []
    console.log('[AnnotationViewer] Annotations from transformer:', annotations.length)

    // Sort annotations by their position in the document
    const sortedAnnotations = annotations.sort((a, b) => {
      const aPos = a.target?.[0]?.selector?.find(s => s.type === "TextPositionSelector")?.start || 0
      const bPos = b.target?.[0]?.selector?.find(s => s.type === "TextPositionSelector")?.start || 0
      return aPos - bPos
    })

    return (
      <div class={classNames(displayClass, "annotation-viewer")} data-pdf-url={localPdfPath} data-source-url={pdfUrl}>
        <script type="application/json" id="annotations-data" dangerouslySetInnerHTML={{ __html: JSON.stringify(sortedAnnotations) }} />
        <div class="annotation-source-citation">
          Source document retrieved from{" "}
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            {sourceDomain}
          </a>
        </div>

        <div class="annotation-split-view">
          <div class="annotation-pdf-container">
            <div id="pdf-viewer" class="pdf-canvas-wrapper">
              {/* PDF.js will be injected here via client-side script */}
              <div class="pdf-loading">Loading PDF...</div>
            </div>
          </div>

          <div class="annotation-sidebar">
            <div class="annotation-list">
              {sortedAnnotations.map(annotation => {
                const textQuote = annotation.target?.[0]?.selector?.find(
                  s => s.type === "TextQuoteSelector"
                )
                const textPosition = annotation.target?.[0]?.selector?.find(
                  s => s.type === "TextPositionSelector"
                )

                return (
                  <div
                    class="annotation-item"
                    data-annotation-id={annotation.id}
                    data-start={textPosition?.start}
                    data-end={textPosition?.end}
                  >
                    {annotation.text && (
                      <div class="annotation-comment">
                        <div dangerouslySetInnerHTML={{ __html: annotation.text }} />
                      </div>
                    )}

                    {annotation.tags && annotation.tags.length > 0 && (
                      <div class="annotation-tags">
                        {annotation.tags.map(tag => (
                          <span class="annotation-tag">#{tag}</span>
                        ))}
                      </div>
                    )}

                    <div class="annotation-meta">
                      <time datetime={annotation.created}>
                        {new Date(annotation.created).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  AnnotationViewer.css = style
  AnnotationViewer.afterDOMLoaded = script

  return AnnotationViewer
}) satisfies QuartzComponentConstructor
