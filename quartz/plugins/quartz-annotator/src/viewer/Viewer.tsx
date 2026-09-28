// The Viewer (CONTEXT.md): the part of an annotation page that shows the mirror with its passages
// highlighted. An island (@chaoticgoodcomputing/island-runtime): rendered here at build time,
// hydrated in the browser, unmounted before every SPA navigation. The build doesn't know whether
// the mirror exists (docs/adr/0001), so the Viewer finds out, and when it can't show the document
// it says where to read along instead. The annotations beside it are the page's, not the Viewer's:
// they are static HTML that the Viewer only reaches into, to link each one to its highlight.
import { useEffect, useRef, useState } from "preact/hooks"
import type { Passage } from "./anchor"
import type { Geometry } from "./pdf"

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
// The annotation page's own blocks, which the Viewer reaches into.
const PAGE = "cgc-annotator"
const ACTIVE = `${CLASS}__highlight--active`
const ACTIVE_ANNOTATION = `${PAGE}__annotation--active`

// A path from the site root, as a URL: the island runtime addresses its entries the same way.
const siteUrl = (path: string) => new URL(`${document.body.dataset.basepath ?? ""}/${path}`.replace(/^\/+/, "/"), location.href).href

// Scrolls the page so that a point `y` pixels down the viewport sits a little below the frame's bar.
function reveal(y: number) {
  const bar = document.querySelector(".cgc-annotator-frame__bar")?.getBoundingClientRect().bottom ?? 0
  window.scrollTo({ top: Math.max(0, window.scrollY + y - bar - 16), behavior: "smooth" })
}

export default function Viewer({ mirror, source, linkable, passages }: ViewerProps) {
  const documentRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>(mirror ? "loading" : "failed")
  // The annotation the reader last chose, which a redraw keeps highlighted.
  const active = useRef<string>()
  // Where each passage is, from the document's text: known before its page is drawn.
  const geometry = useRef<Geometry>()

  // Shows the mirror. Runs only in the browser, after hydration; the cleanup runs when the island
  // unmounts, which the island runtime does before every SPA navigation, and ends the load.
  useEffect(() => {
    if (!mirror) return
    let unmounted = false
    let shown: { destroy(): void } | undefined
    import("./pdf")
      .then(({ show }) => {
        if (unmounted) return
        shown = show(siteUrl(mirror), pagesRef.current!, passages, {
          opened: (found) => {
            geometry.current = found
            setStatus("open")
          },
          drawn: () => select(active.current),
          failed: () => setStatus("failed"),
        })
      })
      .catch(() => !unmounted && setStatus("failed"))
    return () => {
      unmounted = true
      shown?.destroy()
    }
  }, [mirror])

  // The page's annotations, and the page itself, for choosing one.
  const page = () => documentRef.current?.closest<HTMLElement>(`.${PAGE}`) ?? null
  const annotations = () => [...(page()?.querySelectorAll<HTMLElement>(`.${PAGE}__annotation`) ?? [])]

  // Where a passage starts, in viewport pixels: its first highlight once its page is drawn, and
  // until then where the document's text puts it on its page's box.
  function passageY(id: string): number | undefined {
    const container = documentRef.current
    const first = container?.querySelector(`.${CLASS}__highlight[data-annotation="${CSS.escape(id)}"]`)
    if (first) return first.getBoundingClientRect().top
    const place = geometry.current?.places.get(id)
    const page = place && pagesRef.current?.querySelector(`.${CLASS}__page[data-page="${place.page + 1}"]`)
    if (!place || !page) return undefined
    const box = page.getBoundingClientRect()
    return box.top + place.top * box.height
  }

  // Marks one annotation and its highlights as chosen, and scrolls whichever side the reader didn't
  // click to it.
  function select(id: string | undefined, side?: "document" | "annotation") {
    active.current = id
    const container = documentRef.current
    if (!container) return
    for (const el of container.querySelectorAll<HTMLElement>(`.${CLASS}__highlight`)) el.classList.toggle(ACTIVE, el.dataset.annotation === id)
    for (const el of annotations()) el.classList.toggle(ACTIVE_ANNOTATION, el.dataset.annotation === id)
    if (side === "document") {
      const y = passageY(id!)
      if (y !== undefined) reveal(y)
    } else if (side === "annotation") {
      const item = annotations().find((el) => el.dataset.annotation === id)
      if (item) reveal(item.getBoundingClientRect().top)
    }
  }

  // Choosing an annotation beside the document, other than by following a link in it.
  useEffect(() => {
    const root = page()
    if (!root) return
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element
      const item = target.closest<HTMLElement>(`.${PAGE}__annotation`)
      if (!item || target.closest("a")) return
      select(item.dataset.annotation, "document")
    }
    root.addEventListener("click", onClick)
    return () => root.removeEventListener("click", onClick)
  }, [])

  // Choosing a highlight in the document.
  const onDocumentClick = (event: MouseEvent) => {
    const box = (event.target as Element).closest<HTMLElement>(`.${CLASS}__highlight`)
    if (box) select(box.dataset.annotation, "annotation")
  }

  const where = linkable ? (
    <a class={`${CLASS}__source`} href={source} target="_blank" rel="noopener noreferrer">
      {source}
    </a>
  ) : (
    <span class={`${CLASS}__source`}>{source}</span>
  )

  return (
    <>
      <div class={`${CLASS}__document`} ref={documentRef} onClick={onDocumentClick}>
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
