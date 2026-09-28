// The reader: what an annotation page does in answer to the person reading it. The Viewer mounts it
// when its island hydrates and destroys it when the island unmounts, before every SPA navigation, so
// nothing is left behind on the next page.
//
// Selecting an annotation (CONTEXT.md's **Card**):
// - `#<annotation-id>` in the URL selects that annotation on load and scrolls to it;
// - selecting one marks its card and its highlights, and puts its id in the URL with `replaceState`,
//   so the back button isn't cluttered, and only the URL remembers it;
// - clicking a card, other than a link in it, or a highlight selects that annotation;
// - `j` and `k` select the next and previous annotation, in the cards' order; `Esc` clears. None of
//   them fire while the reader is typing, in search say.
//
// The layout (./layout, docs/adr/0004): the page is sent in the static layout, the cards alone. Once
// the document opens, the page takes the layout that fits its width:
// - **the margin**, where the document fits beside the cards: each card level with its passage, or
//   just below the card above; all but the selected one shortened. Those the Viewer found no place
//   for go last, under "Not found in the document". The bar's toggle hides and shows the margin, and
//   the page remembers which.
import type { Geometry } from "./pdf"
import { fit, stack, toPx, type Fit, type Layout } from "./layout"

const PAGE = "cgc-annotator"
const VIEWER = "cgc-annotator-viewer"
const FRAME = "cgc-annotator-frame"
const ACTIVE_CARD = `${PAGE}__annotation--active`
const ACTIVE_HIGHLIGHT = `${VIEWER}__highlight--active`
const HOVER_HIGHLIGHT = `${VIEWER}__highlight--hover`
const CLIPPED = `${PAGE}__note--clipped`
/** Space between two cards in the margin, in pixels. */
const CARD_GAP = 12
/** Where the page remembers the reader's choices. */
const STORE = { marginHidden: "cgc-annotator:margin-hidden" }

export interface ReaderOptions {
  /** A card's width, and the narrowest the document may be beside the cards: `px` or `rem`. */
  marginWidth: string
  minDocumentWidth: string
}

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

// The page's memory, which a private window or blocked storage can take away.
const recall = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const remember = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {}
}

/** Mounts the reader on the page around `viewer`, the Viewer's island. */
export function mountReader(viewer: HTMLElement, options: ReaderOptions): Reader {
  const body = viewer.closest<HTMLElement>(`.${PAGE}`)!
  const frame = body.closest<HTMLElement>(`.${FRAME}`)
  const section = body.querySelector<HTMLElement>(`.${PAGE}__annotations`)!
  const unplacedHeading = body.querySelector<HTMLElement>(`.${PAGE}__unplaced`)
  const toggle = frame?.querySelector<HTMLAnchorElement>(`.${FRAME}__toggle`) ?? null
  const cleanups: (() => void)[] = []
  const on = (el: EventTarget, type: string, fn: (event: any) => void) => {
    el.addEventListener(type, fn)
    cleanups.push(() => el.removeEventListener(type, fn))
  }

  let selected: string | undefined
  let geometry: Geometry | undefined
  let pages: HTMLElement | undefined
  let layout: Layout = "static"
  let current: Fit | undefined
  let marginHidden = recall(STORE.marginHidden) === "true"
  // An annotation the URL named before the document opened, to go to once it has.
  let pending: string | undefined

  const cards = () => [...section.querySelectorAll<HTMLElement>(`.${PAGE}__annotation`)]
  const card = (id: string) => cards().find((el) => el.dataset.annotation === id)
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

  // Where a passage starts, in viewport pixels, from where the document's text puts it on its page's
  // box: known before the page is drawn, and the same once it is.
  function passageY(id: string): number | undefined {
    const place = geometry?.places.get(id)
    const page = place && pages?.querySelector(`.${VIEWER}__page[data-page="${place.page + 1}"]`)
    if (!place || !page) return undefined
    const box = page.getBoundingClientRect()
    return box.top + place.top * box.height
  }

  // Scrolls the page so that a point `y` pixels down the viewport sits a little below the bar.
  function reveal(y: number, smooth = true) {
    const bar = frame?.querySelector(`.${FRAME}__bar`)?.getBoundingClientRect().bottom ?? 0
    window.scrollTo({ top: Math.max(0, window.scrollY + y - bar - 32), behavior: smooth ? "smooth" : "instant" })
  }

  // Whether the document is on screen: once the page has taken the document's layout.
  const documentShown = () => layout !== "static" && !!geometry

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

  // Goes to an annotation: its passage where the document is shown and has one, its card otherwise.
  function go(id: string, smooth = true) {
    const y = documentShown() ? passageY(id) : undefined
    if (y !== undefined) reveal(y, smooth)
    else card(id)?.scrollIntoView({ block: "nearest", behavior: smooth ? "smooth" : "instant" })
  }

  /** Selects an annotation, or clears the selection, and says so in the URL; goes to it if `going`. */
  function select(id: string | undefined, going: boolean) {
    selected = id && card(id) ? id : undefined
    mark()
    const url = new URL(location.href)
    url.hash = selected ? `#${selected}` : ""
    if (url.href !== location.href) history.replaceState(history.state, "", url.href.replace(/#$/, ""))
    // The margin lays the selected card out expanded, level with its passage, before it's gone to.
    place()
    if (selected && going) go(selected)
  }

  // --- The layout ------------------------------------------------------------------------------

  // Takes the layout that fits the page now. Until the drawer, a page the margin doesn't fit keeps
  // the static layout.
  function apply() {
    if (!frame || !geometry) return
    const r = rem()
    const next = fit(
      { available: frame.clientWidth, margin: toPx(options.marginWidth, r), minDocument: toPx(options.minDocumentWidth, r), rem: r },
      1,
      marginHidden,
    )
    current = next
    layout = next.layout === "margin" ? "margin" : "static"
    frame.dataset.layout = layout
    frame.dataset.margin = marginHidden ? "hidden" : "shown"
    body.style.setProperty("--cgc-annotator-document-width", `${next.documentWidth}px`)
    if (toggle) {
      if (layout === "static") {
        toggle.removeAttribute("role")
        toggle.removeAttribute("aria-expanded")
      } else {
        toggle.setAttribute("role", "button")
        toggle.setAttribute("aria-expanded", String(!marginHidden))
      }
    }
    place()
  }

  // Puts every card where it goes: in the margin, beside its passage; elsewhere, in the flow.
  function place() {
    const inMargin = layout === "margin" && !marginHidden
    const all = cards()
    if (!inMargin) {
      for (const el of all) el.style.top = ""
      if (unplacedHeading) unplacedHeading.style.top = ""
      section.style.height = ""
      return
    }
    const sectionTop = section.getBoundingClientRect().top
    const placed = all.filter((el) => geometry!.places.has(el.dataset.annotation!))
    const unplaced = all.filter((el) => !geometry!.places.has(el.dataset.annotation!))
    // Shortened cards fade where their note is cut.
    for (const el of all) {
      const note = el.querySelector<HTMLElement>(`.${PAGE}__note`)
      if (note) note.classList.toggle(CLIPPED, note.scrollHeight > note.clientHeight + 1)
    }
    const tops = stack(
      placed.map((el) => passageY(el.dataset.annotation!)! - sectionTop),
      placed.map((el) => el.offsetHeight),
      placed.findIndex((el) => el.dataset.annotation === selected),
      CARD_GAP,
    )
    placed.forEach((el, i) => (el.style.top = `${tops[i]}px`))
    let y = placed.length ? tops[placed.length - 1] + placed[placed.length - 1].offsetHeight + CARD_GAP : 0
    if (unplaced.length) {
      // At the margin's end, after the last page.
      const end = (pages?.getBoundingClientRect().bottom ?? sectionTop) - sectionTop
      y = Math.max(y + 2 * CARD_GAP, end)
      if (unplacedHeading) {
        unplacedHeading.style.top = `${y}px`
        y += unplacedHeading.offsetHeight + CARD_GAP
      }
      for (const el of unplaced) {
        el.style.top = `${y}px`
        y += el.offsetHeight + CARD_GAP
      }
    }
    section.style.height = `${y}px`
  }

  // Once per frame at most, however many things change at once.
  let queued = 0
  const soon = (fn: () => void) => {
    if (queued) return
    queued = requestAnimationFrame(() => {
      queued = 0
      fn()
    })
  }
  cleanups.push(() => cancelAnimationFrame(queued))
  const relayout = () => soon(apply)

  const resizes = new ResizeObserver(relayout)
  cleanups.push(() => resizes.disconnect())

  // --- The reader's hands ----------------------------------------------------------------------

  // Clicking a card, other than a link in it, or a highlight.
  on(body, "click", (event: MouseEvent) => {
    const target = event.target as Element
    const highlight = target.closest<HTMLElement>(`.${VIEWER}__highlight`)
    if (highlight) return select(highlight.dataset.annotation, false)
    const item = target.closest<HTMLElement>(`.${PAGE}__annotation`)
    if (item && !target.closest("a")) select(item.dataset.annotation, true)
  })

  // Hovering a card tints its highlights.
  const hover = (id: string | undefined) => {
    for (const el of viewer.querySelectorAll<HTMLElement>(`.${VIEWER}__highlight`)) el.classList.toggle(HOVER_HIGHLIGHT, el.dataset.annotation === id)
  }
  on(section, "mouseover", (event: MouseEvent) => hover((event.target as Element).closest<HTMLElement>(`.${PAGE}__annotation`)?.dataset.annotation))
  on(section, "mouseleave", () => hover(undefined))

  // The bar's toggle hides and shows the margin, once there's a document; until then it's a link to
  // the annotations.
  if (toggle) {
    on(toggle, "click", (event: MouseEvent) => {
      if (layout === "static") return
      event.preventDefault()
      marginHidden = !marginHidden
      remember(STORE.marginHidden, marginHidden ? "true" : null)
      apply()
      if (selected) go(selected, false)
    })
  }

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
  if (hashed && card(hashed)) {
    select(hashed, true)
    pending = hashed
  }

  return {
    opened(found, into) {
      geometry = found
      pages = into
      // The cards in the order their passages come in the document, and those it has no place for
      // last, after their heading.
      const all = cards()
      const at = (el: HTMLElement) => {
        const place = found.places.get(el.dataset.annotation!)
        return place ? place.page + place.top : Infinity
      }
      const placed = all.filter((el) => found.places.has(el.dataset.annotation!)).sort((a, b) => at(a) - at(b))
      const unplaced = all.filter((el) => !found.places.has(el.dataset.annotation!))
      section.append(...placed)
      if (unplacedHeading && unplaced.length) {
        unplacedHeading.hidden = false
        section.append(unplacedHeading)
      }
      section.append(...unplaced)
      if (frame) resizes.observe(frame)
      resizes.observe(into)
      for (const el of all) resizes.observe(el)
      apply()
      // Once the document has its boxes, to the annotation the URL named.
      if (pending) {
        const id = pending
        pending = undefined
        requestAnimationFrame(() => selected === id && go(id, false))
      }
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
