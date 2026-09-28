// The Viewer (CONTEXT.md): the part of an annotation page that shows the mirror with its passages
// highlighted. An island (@chaoticgoodcomputing/island-runtime): rendered here at build time,
// hydrated in the browser, unmounted before every SPA navigation. The build doesn't know whether
// the mirror exists (docs/adr/0001), so the Viewer finds out, and when it can't show the document
// it says where to read along instead. The annotations beside it are the page's, not the Viewer's:
// they are static HTML that the reader (./reader), which the Viewer mounts, reaches into.
import { useLayoutEffect, useRef, useState } from "preact/hooks"
import type { Passage } from "./anchor"
import { mountReader } from "./reader"

export interface ViewerProps {
  /** The mirror's path from the site root (`<mirrorDir>/<name>`), or none for a target no mirror can be made of. */
  mirror?: string
  /** The source document's address, as the page gives it. */
  source: string
  /** Whether `source` is a web URL, and so a link. */
  linkable: boolean
  /** The passages to highlight. */
  passages: Passage[]
  /** A card's width, and the narrowest the document may be beside them: `px` or `rem` lengths. */
  marginWidth: string
  minDocumentWidth: string
}

type Status = "loading" | "open" | "failed"

const CLASS = "cgc-annotator-viewer"

// A path from the site root, as a URL: the island runtime addresses its entries the same way.
const siteUrl = (path: string) => new URL(`${document.body.dataset.basepath ?? ""}/${path}`.replace(/^\/+/, "/"), location.href).href

export default function Viewer({ mirror, source, linkable, passages, marginWidth, minDocumentWidth }: ViewerProps) {
  const documentRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>(mirror ? "loading" : "failed")

  // Mounts the reader on the page, and shows the mirror. Runs only in the browser, after hydration;
  // the cleanup runs when the island unmounts, which the island runtime does before every SPA
  // navigation, and takes the reader down and ends the load. A layout effect, so the reader is up by
  // the time the island says it's hydrated.
  useLayoutEffect(() => {
    const island = documentRef.current!.closest<HTMLElement>(`.${CLASS}`)!
    const reader = mountReader(island, { marginWidth, minDocumentWidth })
    let unmounted = false
    let shown: { destroy(): void } | undefined
    if (mirror) {
      import("./pdf")
        .then(({ show }) => {
          if (unmounted) return
          shown = show(siteUrl(mirror), pagesRef.current!, passages, {
            opened: (geometry) => {
              setStatus("open")
              reader.opened(geometry, pagesRef.current!)
            },
            drawn: (page) => reader.drawn(page),
            failed: () => setStatus("failed"),
          })
        })
        .catch(() => !unmounted && setStatus("failed"))
    }
    return () => {
      unmounted = true
      shown?.destroy()
      reader.destroy()
    }
  }, [mirror])

  const where = linkable ? (
    <a class={`${CLASS}__source`} href={source} target="_blank" rel="noopener noreferrer">
      {source}
    </a>
  ) : (
    <span class={`${CLASS}__source`}>{source}</span>
  )

  return (
    <>
      <div class={`${CLASS}__document`} ref={documentRef}>
        {status === "loading" && <p class={`${CLASS}__status`}>Loading the document…</p>}
        {status === "failed" && (
          <p class={`${CLASS}__notice`}>
            We couldn't show the PDF here, but you can read along at {where}.
          </p>
        )}
        {/* Drawn into by PDF.js, outside Preact's reach: its vnode never has children. */}
        <div class={`${CLASS}__pages`} ref={pagesRef} />
      </div>
    </>
  )
}
