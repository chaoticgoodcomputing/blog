// The page type half: an annotation page's body, the Viewer and the annotations. The frame
// (./frame, docs/adr/0004) places it between the top section, with the page header, where the
// document comes from and the preface, and the bottom section, with the epilogue.
//
// Each annotation is a **card**: the passage it quotes and the note written on it. As rendered here,
// before any script, the cards are the page, in one column in document order, and the Viewer is out
// of sight. The Viewer switches the page to the document's layout once it has opened the mirror.
import { islandAttributes, islandRuntime } from "@chaoticgoodcomputing/island-runtime"
import { ANNOTATIONS } from "./frame"
import type { AnnotatorData } from "./transformer"
import { annotationTarget, mirrorName, sourceUrl, Unmirrorable } from "./mirror"
import type { Passage } from "./viewer/anchor"
import Viewer, { type ViewerProps } from "./viewer/Viewer"
import { DEFAULT_WIDTHS } from "./widths"

// Written in by build.mjs: the Viewer's browser entry, as the emitter lays it out under the site,
// and the page's own script, which works the frame's bar and ☰ drawer.
declare const __CGC_ANNOTATOR_ENTRY__: string
declare const __CGC_ANNOTATOR_FRAME_SCRIPT__: string
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
}

export function Body(mirrorDir: string) {
  const AnnotationPage = ({ fileData, cfg }: BodyProps) => {
    const target = annotationTarget(fileData.frontmatter) ?? ""
    const url = sourceUrl(target)
    const linkable = !(url instanceof Unmirrorable)
    // In document order, and those that quote nothing, which have no place in it, last.
    const annotations = [...(fileData.cgcAnnotator?.annotations ?? [])].sort((a, b) => Number(!a.exact) - Number(!b.exact))
    const widths = fileData.cgcAnnotator?.widths ?? DEFAULT_WIDTHS
    const viewer: ViewerProps = {
      mirror: linkable ? `${mirrorDir}/${mirrorName(url)}` : undefined,
      source: linkable ? url.href : target,
      linkable,
      passages: annotations
        .filter((a) => a.exact)
        // Only the passage: notes and their HTML stay out of the island's serialized props.
        .map(({ id, exact, prefix, suffix, start }): Passage => ({ id, exact, prefix, suffix, start })),
      marginWidth: widths.marginWidth,
      minDocumentWidth: widths.minDocumentWidth,
    }
    return (
      <div class="cgc-annotator" itemscope itemtype="https://schema.org/DigitalDocument">
        {/* The Viewer's island. It hydrates as soon as the page is shown, and stays out of sight until
            it has a document, or a notice, to show. */}
        <div
          class={`cgc-annotator__viewer ${VIEWER}`}
          {...islandAttributes({ entry: `${STATIC_DIR}/${__CGC_ANNOTATOR_ENTRY__}`, directive: "load", props: { ...viewer } })}
        >
          <Viewer {...viewer} />
        </div>
        <section class="cgc-annotator__annotations popover-hint" id={ANNOTATIONS} aria-label="Annotations" tabindex={-1}>
          <h2 class="cgc-annotator__heading">Annotations</h2>
          {annotations.map((a) => (
            <article class="cgc-annotator__annotation" id={a.id} data-annotation={a.id} itemprop="comment" itemscope itemtype="https://schema.org/Comment">
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
          {/* Where the Viewer finds no place for some, they go last, under this. */}
          <h3 class="cgc-annotator__unplaced" hidden>
            Not found in the document
          </h3>
        </section>
        {/* The drawer's tab, on the right edge, and what dims the document behind a phone's drawer:
            both out of sight but in the drawer's layout. */}
        <button class="cgc-annotator__tab" type="button" aria-controls={ANNOTATIONS} aria-expanded="false" aria-label="Annotations" tabindex={-1}>
          <span class="cgc-annotator__tab-grip" aria-hidden="true" />
        </button>
        <div class="cgc-annotator__scrim" aria-hidden="true" />
      </div>
    )
  }
  // The island runtime, hydrating this plugin's Viewer and no one else's islands, and the frame's
  // own script.
  AnnotationPage.afterDOMLoaded = islandRuntime(`.${VIEWER}`) + __CGC_ANNOTATOR_FRAME_SCRIPT__
  return AnnotationPage
}
