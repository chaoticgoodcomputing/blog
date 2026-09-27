// The page type half: an annotation page's body. The Viewer sits beside the annotations, each with
// the passage it quotes and the note written on it. Everything else on the page (backlinks, a
// subscribe box) is the site's to compose in its layout. The page header (title, meta, tags) is the
// site's too, but the body takes it: a frame that hands it over as the body's children has it placed
// at the top of the annotations panel (docs/adr/0003).
import type { ComponentChildren } from "preact"
import { islandAttributes, islandRuntime } from "@chaoticgoodcomputing/island-runtime"
import type { AnnotatorData } from "./transformer"
import { annotationTarget, mirrorName, sourceUrl, Unmirrorable } from "./mirror"
import type { Passage } from "./viewer/anchor"
import Viewer, { type ViewerProps } from "./viewer/Viewer"

// Written in by build.mjs: the Viewer's browser entry, as the emitter lays it out under the site.
declare const __CGC_ANNOTATOR_ENTRY__: string
/** Where the Viewer's browser files are served from, relative to the site root. */
export const STATIC_DIR = "static/cgc-annotator"

/** The class that marks the Viewer's island, and all its runtime selects. */
const VIEWER = "cgc-annotator-viewer"

// An annotation's date as the site writes dates: `Mar 14, 2024` in `en-US`.
const formatDate = (iso: string, locale: string) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit", timeZone: "UTC" })
}

export interface BodyProps {
  fileData: { frontmatter?: Record<string, unknown>; cgcAnnotator?: AnnotatorData }
  cfg: { locale?: string }
  /** The page header, when the frame hands it to the body (docs/adr/0003). */
  children?: ComponentChildren
}

export function Body(mirrorDir: string) {
  const AnnotationPage = ({ fileData, cfg, children }: BodyProps) => {
    const target = annotationTarget(fileData.frontmatter) ?? ""
    const url = sourceUrl(target)
    const linkable = !(url instanceof Unmirrorable)
    const annotations = fileData.cgcAnnotator?.annotations ?? []
    const viewer: ViewerProps = {
      mirror: linkable ? `${mirrorDir}/${mirrorName(url)}` : undefined,
      source: linkable ? url.href : target,
      linkable,
      passages: annotations
        .filter((a) => a.exact)
        // Only the passage: notes and their HTML stay out of the island's serialized props.
        .map(({ id, exact, prefix, suffix, start }): Passage => ({ id, exact, prefix, suffix, start })),
    }
    // Where to read along, for where the Viewer can't say it: a narrow screen, which hides the
    // Viewer, and a reader without JavaScript, whose Viewer never loads. Otherwise hidden.
    const readAlong = (noScript: boolean) =>
      linkable && (
        <p class={noScript ? "cgc-annotator__read-along cgc-annotator__read-along--no-script" : "cgc-annotator__read-along"}>
          You can read along at{" "}
          <a class="cgc-annotator__read-along-link" href={url.href} target="_blank" rel="noopener noreferrer">
            {url.href}
          </a>
          .
        </p>
      )
    return (
      <div class="cgc-annotator" itemscope itemtype="https://schema.org/DigitalDocument">
        <div class="cgc-annotator__split">
          {/* The Viewer's island. It hydrates only once it's on screen, so where a narrow screen hides it,
              PDF.js is never fetched. */}
          <div
            class={`cgc-annotator__viewer ${VIEWER}`}
            {...islandAttributes({ entry: `${STATIC_DIR}/${__CGC_ANNOTATOR_ENTRY__}`, directive: "visible", props: { ...viewer } })}
          >
            <Viewer {...viewer} />
          </div>
          <section class="cgc-annotator__annotations popover-hint" aria-label="Annotations">
            {/* The page's header, handed over by the frame, then where the document comes from. Not a
                popover hint of its own: the panel is one, and a popover shows each hint it finds. */}
            <div class="cgc-annotator__header">
              {children}
              <p class="cgc-annotator__source">
                Source document:{" "}
                {linkable ? (
                  <a class="cgc-annotator__source-link" href={url.href} target="_blank" rel="noopener noreferrer" itemprop="url">
                    {url.hostname}
                  </a>
                ) : (
                  <span class="cgc-annotator__source-link">{target}</span>
                )}
              </p>
              {readAlong(false)}
              <noscript>{readAlong(true)}</noscript>
            </div>
            <h2 class="cgc-annotator__heading">Annotations</h2>
            {annotations.map((a) => (
              <article class="cgc-annotator__annotation" data-annotation={a.id} itemprop="comment" itemscope itemtype="https://schema.org/Comment">
                {a.exact && <blockquote class="cgc-annotator__quote">{a.exact}</blockquote>}
                {a.html && <div class="cgc-annotator__note" itemprop="text" dangerouslySetInnerHTML={{ __html: a.html }} />}
                {a.tags.length > 0 && (
                  <p class="cgc-annotator__tags">
                    {a.tags.map((tag) => (
                      <span class="cgc-annotator__tag">#{tag}</span>
                    ))}
                  </p>
                )}
                {a.created && (
                  <time class="cgc-annotator__date" datetime={a.created} itemprop="dateCreated">
                    {formatDate(a.created, cfg.locale ?? "en-US")}
                  </time>
                )}
              </article>
            ))}
          </section>
        </div>
      </div>
    )
  }
  // The island runtime, hydrating this plugin's Viewer and no one else's islands.
  AnnotationPage.afterDOMLoaded = islandRuntime(`.${VIEWER}`)
  // Tells a frame that this body places the page header itself, given it as children (docs/adr/0003).
  AnnotationPage.takesPageHeader = true
  return AnnotationPage
}
