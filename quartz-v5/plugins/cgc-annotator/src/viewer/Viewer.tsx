// The Viewer (CONTEXT.md): the part of an annotation page that shows the mirror with its passages
// highlighted. An island (@chaoticgoodcomputing/island-runtime): rendered here at build time,
// hydrated in the browser, unmounted before every SPA navigation. The build doesn't know whether
// the mirror exists (docs/adr/0001), so the Viewer finds out, and when it can't show the document
// it says where to read along instead. The annotations beside it are the page's, not the Viewer's:
// they are static HTML that the Viewer only reaches into, to link each one to its highlight.
import { useEffect, useRef, useState } from "preact/hooks"
import type { Passage } from "./anchor"

export interface ViewerProps {
  /** The mirror's path from the site root (`<mirrorDir>/<name>`), or none for a target no mirror can be made of. */
  mirror?: string
  /** The source document's address, as the page gives it. */
  source: string
  /** Whether `source` is a web URL, and so a link. */
  linkable: boolean
  /** The passages to highlight. */
  passages: Passage[]
}

type Status = "loading" | "open" | "failed"

const CLASS = "cgc-annotator-viewer"
// The annotation page's own blocks, which the Viewer reaches into.
const PAGE = "cgc-annotator"
const ACTIVE = `${CLASS}__highlight--active`
const ACTIVE_ANNOTATION = `${PAGE}__annotation--active`
// How far the reader can move the divider, as the document's share of the width (v4's limits).
const SHARE = { min: 30, max: 70 }

// A path from the site root, as a URL: the island runtime addresses its entries the same way.
const siteUrl = (path: string) => new URL(`${document.body.dataset.basepath ?? ""}/${path}`.replace(/^\/+/, "/"), location.href).href

// Scrolls `container`, and only it, so that `el` sits near its top.
function reveal(container: HTMLElement, el: Element) {
  const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
  container.scrollTo({ top: Math.max(0, top - 16), behavior: "smooth" })
}

export default function Viewer({ mirror, source, linkable, passages }: ViewerProps) {
  const documentRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>(mirror ? "loading" : "failed")
  // The annotation the reader last chose, which a redraw keeps highlighted.
  const active = useRef<string>()

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
          opened: () => setStatus("open"),
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

  // The page's annotations, and the page itself, for choosing one and for the divider.
  const page = () => documentRef.current?.closest<HTMLElement>(`.${PAGE}`) ?? null
  const annotations = () => [...(page()?.querySelectorAll<HTMLElement>(`.${PAGE}__annotation`) ?? [])]

  // Marks one annotation and its highlights as chosen, and scrolls whichever side the reader didn't
  // click to it.
  function select(id: string | undefined, side?: "document" | "annotation") {
    active.current = id
    const container = documentRef.current
    if (!container) return
    for (const el of container.querySelectorAll<HTMLElement>(`.${CLASS}__highlight`)) el.classList.toggle(ACTIVE, el.dataset.annotation === id)
    for (const el of annotations()) el.classList.toggle(ACTIVE_ANNOTATION, el.dataset.annotation === id)
    if (side === "document") {
      const first = container.querySelector(`.${CLASS}__highlight[data-annotation="${CSS.escape(id!)}"]`)
      if (first) reveal(container, first)
    } else if (side === "annotation") {
      const item = annotations().find((el) => el.dataset.annotation === id)
      const list = item?.closest<HTMLElement>(`.${PAGE}__annotations`)
      if (item && list) reveal(list, item)
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

  // Dragging the divider sets the document's share of the width; the document redraws to fit.
  const onPointerDown = (event: PointerEvent) => {
    const handle = event.currentTarget as HTMLElement
    const split = handle.closest<HTMLElement>(`.${PAGE}__split`)
    const root = page()
    if (!split || !root) return
    event.preventDefault()
    handle.setPointerCapture(event.pointerId)
    handle.classList.add(`${CLASS}__handle--dragging`)
    const move = (e: PointerEvent) => {
      const box = split.getBoundingClientRect()
      const share = Math.round(((e.clientX - box.left) / box.width) * 100)
      root.style.setProperty("--cgc-annotator-viewer-share", String(Math.max(SHARE.min, Math.min(SHARE.max, share))))
    }
    const up = () => {
      handle.classList.remove(`${CLASS}__handle--dragging`)
      handle.removeEventListener("pointermove", move)
      handle.removeEventListener("pointerup", up)
      handle.removeEventListener("pointercancel", up)
    }
    handle.addEventListener("pointermove", move)
    handle.addEventListener("pointerup", up)
    handle.addEventListener("pointercancel", up)
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
      {status !== "failed" && (
        <div
          class={`${CLASS}__handle`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the document"
          title="Drag to resize"
          onPointerDown={onPointerDown}
        />
      )}
    </>
  )
}
