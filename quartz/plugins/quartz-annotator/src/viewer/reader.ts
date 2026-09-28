// The reader: what an annotation page does in answer to the person reading it. The Viewer mounts it
// when its island hydrates and destroys it when the island unmounts, before every SPA navigation, so
// nothing is left behind on the next page.
//
// Selecting an annotation (docs/adr/0004's page, CONTEXT.md's **Card**):
// - `#<annotation-id>` in the URL selects that annotation on load and scrolls to it;
// - selecting one marks its card and its highlights, and puts its id in the URL with `replaceState`,
//   so the back button isn't cluttered, and only the URL remembers it;
// - clicking a card, other than a link in it, or a highlight selects that annotation;
// - `j` and `k` select the next and previous annotation, in the cards' order; `Esc` clears. None of
//   them fire while the reader is typing, in search say.
import type { Geometry } from "./pdf"

const PAGE = "cgc-annotator"
const VIEWER = "cgc-annotator-viewer"
const FRAME = "cgc-annotator-frame"
const ACTIVE_CARD = `${PAGE}__annotation--active`
const ACTIVE_HIGHLIGHT = `${VIEWER}__highlight--active`

export interface Reader {
  /** The document opened: every page's box is laid out in `pages`. */
  opened(geometry: Geometry, pages: HTMLElement): void
  /** A page was drawn afresh, with its highlights. */
  drawn(page: number): void
  /** Takes back everything the reader set up. */
  destroy(): void
}

// Whether a key press is the reader typing, or meant for something else.
const typing = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return true
  const target = event.target as HTMLElement | null
  return !!target?.closest?.("input, textarea, select, [contenteditable]:not([contenteditable='false'])") || !!document.querySelector(".search-container.active")
}

/** Mounts the reader on the page around `viewer`, the Viewer's island. */
export function mountReader(viewer: HTMLElement): Reader {
  const body = viewer.closest<HTMLElement>(`.${PAGE}`)!
  const cleanups: (() => void)[] = []
  const on = (el: EventTarget, type: string, fn: (event: any) => void) => {
    el.addEventListener(type, fn)
    cleanups.push(() => el.removeEventListener(type, fn))
  }

  let selected: string | undefined
  let geometry: Geometry | undefined
  let pages: HTMLElement | undefined

  const cards = () => [...body.querySelectorAll<HTMLElement>(`.${PAGE}__annotation`)]
  const card = (id: string) => cards().find((el) => el.dataset.annotation === id)

  // Where a passage starts, in viewport pixels: its first highlight once its page is drawn, and
  // until then where the document's text puts it on its page's box.
  function passageY(id: string): number | undefined {
    const first = viewer.querySelector(`.${VIEWER}__highlight[data-annotation="${CSS.escape(id)}"]`)
    if (first) return first.getBoundingClientRect().top
    const place = geometry?.places.get(id)
    const page = place && pages?.querySelector(`.${VIEWER}__page[data-page="${place.page + 1}"]`)
    if (!place || !page) return undefined
    const box = page.getBoundingClientRect()
    return box.top + place.top * box.height
  }

  // Scrolls the page so that a point `y` pixels down the viewport sits a little below the bar.
  function reveal(y: number) {
    const bar = document.querySelector(`.${FRAME}__bar`)?.getBoundingClientRect().bottom ?? 0
    window.scrollTo({ top: Math.max(0, window.scrollY + y - bar - 16), behavior: "smooth" })
  }

  // Whether the document is on screen: once the page has taken the document's layout.
  const documentShown = () => viewer.offsetParent !== null && !!geometry && viewer.querySelector(`.${VIEWER}__page`) !== null

  // Marks the selected annotation's card and highlights.
  function mark() {
    for (const el of viewer.querySelectorAll<HTMLElement>(`.${VIEWER}__highlight`)) el.classList.toggle(ACTIVE_HIGHLIGHT, el.dataset.annotation === selected)
    for (const el of cards()) {
      const on = el.dataset.annotation === selected
      el.classList.toggle(ACTIVE_CARD, on)
      if (on) el.setAttribute("aria-current", "true")
      else el.removeAttribute("aria-current")
    }
  }

  /**
   * Selects an annotation, or clears the selection, and says so in the URL. `go` scrolls to it: to its
   * passage where the document is shown and the passage was found, and to its card otherwise.
   */
  function select(id: string | undefined, go: boolean) {
    selected = id && card(id) ? id : undefined
    mark()
    const url = new URL(location.href)
    url.hash = selected ? `#${selected}` : ""
    if (url.href !== location.href) history.replaceState(history.state, "", url.href.replace(/#$/, ""))
    if (!selected || !go) return
    const y = documentShown() ? passageY(selected) : undefined
    if (y !== undefined) reveal(y)
    else card(selected)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }

  // Clicking a card, other than a link in it, or a highlight.
  on(body, "click", (event: MouseEvent) => {
    const target = event.target as Element
    const highlight = target.closest<HTMLElement>(`.${VIEWER}__highlight`)
    if (highlight) return select(highlight.dataset.annotation, false)
    const item = target.closest<HTMLElement>(`.${PAGE}__annotation`)
    if (item && !target.closest("a")) select(item.dataset.annotation, true)
  })

  on(document, "keydown", (event: KeyboardEvent) => {
    if (typing(event)) return
    if (event.key === "Escape") {
      if (selected) select(undefined, false)
      return
    }
    if (event.key !== "j" && event.key !== "k") return
    const order = cards().map((el) => el.dataset.annotation!)
    const at = selected ? order.indexOf(selected) : -1
    const next = event.key === "j" ? (at === -1 ? 0 : Math.min(order.length - 1, at + 1)) : at === -1 ? order.length - 1 : Math.max(0, at - 1)
    if (order[next] === undefined) return
    event.preventDefault()
    select(order[next], true)
  })

  // The annotation the URL names, on load.
  const hashed = decodeURIComponent(location.hash.slice(1))
  if (hashed && card(hashed)) select(hashed, true)

  return {
    opened(found, into) {
      geometry = found
      pages = into
    },
    drawn() {
      mark()
    },
    destroy() {
      cleanups.splice(0).forEach((fn) => fn())
      for (const el of cards()) {
        el.classList.remove(ACTIVE_CARD)
        el.removeAttribute("aria-current")
      }
    },
  }
}
