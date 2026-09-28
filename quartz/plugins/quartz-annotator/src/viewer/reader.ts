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
// - **the drawer**, where it doesn't: the document takes the width, and the cards come in from the
//   right, in order, not anchored. On a tablet the drawer is a card's width, and the document stays
//   usable beside it; on a phone, where that would cover more than half the screen, it's 85% of it,
//   and modal. It opens from its tab on the right edge, tapped or dragged, the bar's toggle, or a
//   tapped highlight, which opens it at its card. A swipe only ever starts from the tab or the
//   drawer, never the document. It always starts closed.
//
// Zoom is the Viewer's, not the browser's: the bar's control, and `+`, `-` and `0`. 100% is the
// fitted width, and at zoom `z` the document is `z` times as wide, so zooming in far enough on a
// desktop turns the margin into the drawer. The reading position holds, and the page remembers
// the zoom, never in the URL. On a touch screen, two fingers pinch the document, not the page, as
// canvas-page pinches its canvas: the drawn pages are scaled live around the fingers' midpoint, and
// on release drawn again at the new width, with the point under the fingers kept under them.
import type { Geometry } from "./pdf"
import { fit, stack, toPx, type Fit, type Layout } from "./layout"

const PAGE = "cgc-annotator"
const VIEWER = "cgc-annotator-viewer"
const FRAME = "cgc-annotator-frame"
const ACTIVE_CARD = `${PAGE}__annotation--active`
const ACTIVE_HIGHLIGHT = `${VIEWER}__highlight--active`
const HOVER_HIGHLIGHT = `${VIEWER}__highlight--hover`
const CLIPPED = `${PAGE}__note--clipped`
const FLASH = `${VIEWER}__highlight--flash`
/** How far a drag or swipe must go to open or close the drawer, in pixels. */
const SWIPE = 40
/** Space between two cards in the margin, in pixels. */
const CARD_GAP = 12
/** Where the page remembers the reader's choices. */
const STORE = { marginHidden: "cgc-annotator:margin-hidden", zoom: "cgc-annotator:zoom" }
/** The bar's zoom steps; a pinch may land between them. */
export const ZOOMS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3]
const clampZoom = (z: number) => Math.min(ZOOMS[ZOOMS.length - 1], Math.max(ZOOMS[0], Number.isFinite(z) ? z : 1))

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
  /** The zoom now. */
  zoom(): number
  /** Zooms to `z`, keeping the point of the document at viewport point `around` (the screen's middle by default) where it is. */
  zoomTo(z: number, around?: { x: number; y: number }): void
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
  const tab = body.querySelector<HTMLElement>(`.${PAGE}__tab`)
  const scrim = body.querySelector<HTMLElement>(`.${PAGE}__scrim`)
  const cleanups: (() => void)[] = []
  const on = (el: EventTarget, type: string, fn: (event: any) => void, options?: AddEventListenerOptions) => {
    el.addEventListener(type, fn, options)
    cleanups.push(() => el.removeEventListener(type, fn, options))
  }

  let selected: string | undefined
  let geometry: Geometry | undefined
  let pages: HTMLElement | undefined
  let layout: Layout = "static"
  let current: Fit | undefined
  let marginHidden = recall(STORE.marginHidden) === "true"
  // An annotation the URL named before the document opened, to go to once it has.
  let pending: string | undefined
  let drawerOpen = false
  let zoom = clampZoom(parseFloat(recall(STORE.zoom) ?? "1"))
  const zoomLevel = frame?.querySelector<HTMLElement>(`.${FRAME}__zoom-level`) ?? null
  const scroller = viewer.querySelector<HTMLElement>(`.${VIEWER}__document`)

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

  // Takes the layout that fits the page now.
  function apply() {
    if (!frame || !geometry) return
    const r = rem()
    const next = fit(
      { available: frame.clientWidth, margin: toPx(options.marginWidth, r), minDocument: toPx(options.minDocumentWidth, r), rem: r },
      zoom,
      marginHidden,
    )
    current = next
    if (next.layout !== layout && drawerOpen) setDrawer(false, false)
    layout = next.layout
    frame.dataset.layout = layout
    frame.dataset.margin = marginHidden ? "hidden" : "shown"
    if (layout === "drawer") frame.dataset.drawer = next.mobile ? "mobile" : "tablet"
    else delete frame.dataset.drawer
    body.style.setProperty("--cgc-annotator-document-width", `${next.documentWidth}px`)
    tab?.setAttribute("tabindex", layout === "drawer" ? "0" : "-1")
    if (zoomLevel) zoomLevel.textContent = `${Math.round(zoom * 100)}%`
    showToggle()
    place()
    restore()
  }

  // --- Zoom ------------------------------------------------------------------------------------

  // The point of the document to keep in place across a zoom: a page, where on it, and where on the
  // screen it was. Held until the pages have their new size, or a moment has passed.
  let hold: { page: HTMLElement; size: { width: number }; fx: number; fy: number; x: number; y: number; until: number } | undefined
  function holdAt(x: number, y: number) {
    const boxes = [...(pages?.querySelectorAll<HTMLElement>(`.${VIEWER}__page`) ?? [])]
    if (!boxes.length || !geometry) return
    const page = boxes.find((el) => el.getBoundingClientRect().bottom >= y) ?? boxes[boxes.length - 1]
    const box = page.getBoundingClientRect()
    const size = geometry.pages[Number(page.dataset.page) - 1]
    hold = { page, size, fx: (x - box.left) / box.width, fy: (y - box.top) / box.height, x, y, until: performance.now() + 1500 }
  }
  function restore() {
    if (!hold || !current || !geometry) return
    const box = hold.page.getBoundingClientRect()
    window.scrollBy({ top: box.top + hold.fy * box.height - hold.y, behavior: "instant" })
    if (scroller) scroller.scrollLeft += box.left + hold.fx * box.width - hold.x
    const widest = Math.max(...geometry.pages.map((p) => p.width))
    const sized = Math.abs(box.width - (current.documentWidth * hold.size.width) / widest) < 1
    if (sized || performance.now() > hold.until) hold = undefined
  }

  function zoomTo(z: number, around?: { x: number; y: number }) {
    const next = clampZoom(z)
    if (Math.abs(next - zoom) < 0.001 || layout === "static") return
    const bar = frame?.querySelector(`.${FRAME}__bar`)?.getBoundingClientRect().bottom ?? 0
    holdAt(around?.x ?? window.innerWidth / 2, around?.y ?? bar + (window.innerHeight - bar) / 2)
    zoom = next
    remember(STORE.zoom, Math.abs(zoom - 1) < 0.001 ? null : String(Math.round(zoom * 1000) / 1000))
    apply()
  }
  const step = (by: 1 | -1) => zoomTo(by > 0 ? (ZOOMS.find((z) => z > zoom + 0.001) ?? zoom) : ([...ZOOMS].reverse().find((z) => z < zoom - 0.001) ?? zoom))

  // The bar's toggle says what it does now: nothing of its own before the document, since it's a link
  // to the annotations; then whether the margin is shown, or the drawer open.
  function showToggle() {
    if (!toggle) return
    if (layout === "static") {
      toggle.removeAttribute("role")
      toggle.removeAttribute("aria-expanded")
      return
    }
    toggle.setAttribute("role", "button")
    toggle.setAttribute("aria-expanded", String(layout === "margin" ? !marginHidden : drawerOpen))
  }

  const modal = () => layout === "drawer" && current?.mobile === true

  // Opens or closes the drawer. A phone's drawer takes the focus while it's open, and gives it back.
  let returnFocus: HTMLElement | null = null
  function setDrawer(open: boolean, focus = true) {
    if (open && layout !== "drawer") return
    if (open === drawerOpen) return
    drawerOpen = open
    if (frame) frame.dataset.drawerOpen = String(open)
    tab?.setAttribute("aria-expanded", String(open))
    showToggle()
    if (open && modal() && focus) {
      returnFocus = document.activeElement as HTMLElement | null
      section.focus({ preventScroll: true })
    } else if (!open && returnFocus) {
      if (section.contains(document.activeElement)) returnFocus.focus({ preventScroll: true })
      returnFocus = null
    }
  }

  // The selected annotation's highlight catches the eye a moment, after the drawer closes on it.
  function flash(id: string) {
    const boxes = [...viewer.querySelectorAll<HTMLElement>(`.${VIEWER}__highlight`)].filter((el) => el.dataset.annotation === id)
    for (const el of boxes) {
      el.classList.remove(FLASH)
      void el.offsetWidth
      el.classList.add(FLASH)
      setTimeout(() => el.classList.remove(FLASH), 1300)
    }
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

  // A drag ends in a click on what was dragged, which isn't a tap.
  let dragged = false

  // Clicking a card, other than a link in it, or a highlight. In the drawer, a highlight opens it at
  // its card; a card takes the document to its passage, and on a phone closes the drawer first.
  on(body, "click", (event: MouseEvent) => {
    const target = event.target as Element
    const highlight = target.closest<HTMLElement>(`.${VIEWER}__highlight`)
    if (highlight) {
      select(highlight.dataset.annotation, false)
      if (layout === "drawer" && selected) {
        setDrawer(true)
        card(selected)?.scrollIntoView({ block: "nearest" })
      }
      return
    }
    const item = target.closest<HTMLElement>(`.${PAGE}__annotation`)
    if (!item || target.closest("a") || dragged) return
    const id = item.dataset.annotation
    if (modal()) {
      setDrawer(false)
      select(id, true)
      if (id && geometry?.places.has(id)) flash(id)
    } else select(id, true)
  })

  if (scrim) on(scrim, "click", () => setDrawer(false))

  // Focus stays in a phone's drawer while it's open.
  on(document, "focusin", (event: FocusEvent) => {
    if (drawerOpen && modal() && !section.contains(event.target as Node)) section.focus({ preventScroll: true })
  })

  // The tab: tapped, or dragged out; and the drawer itself, swiped back to the right. The document
  // keeps its own touch.
  function drag(from: HTMLElement, allowOpen: boolean) {
    on(from, "pointerdown", (event: PointerEvent) => {
      if (layout !== "drawer" || event.button !== 0) return
      if (from === section && (!drawerOpen || event.pointerType === "mouse")) return
      const startX = event.clientX
      const startY = event.clientY
      let dx = 0
      let dragging = false
      const width = section.getBoundingClientRect().width
      const move = (e: PointerEvent) => {
        dx = e.clientX - startX
        if (!dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - startY)) {
          dragging = true
          frame?.setAttribute("data-dragging", "")
        }
        // The drawer follows the finger: out from the edge while closed, back towards it while open.
        if (dragging) section.style.transform = `translateX(${drawerOpen ? Math.max(0, dx) : Math.max(0, width + dx)}px)`
      }
      const up = () => {
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
        window.removeEventListener("pointercancel", up)
        section.style.transform = ""
        frame?.removeAttribute("data-dragging")
        if (!dragging) return
        dragged = true
        setTimeout(() => (dragged = false))
        if (!drawerOpen && allowOpen && dx < -SWIPE) setDrawer(true)
        else if (drawerOpen && dx > SWIPE) setDrawer(false)
      }
      // On the window, since the pointer soon leaves a tab this narrow.
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
      window.addEventListener("pointercancel", up)
    })
  }
  if (tab) {
    drag(tab, true)
    on(tab, "click", () => {
      if (!dragged) setDrawer(!drawerOpen)
    })
  }
  drag(section, false)

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
      if (layout === "drawer") return setDrawer(!drawerOpen)
      marginHidden = !marginHidden
      remember(STORE.marginHidden, marginHidden ? "true" : null)
      apply()
      if (selected) go(selected, false)
    })
  }

  on(document, "keydown", (event: KeyboardEvent) => {
    if (event.key === "Tab" && drawerOpen && modal()) return trapTab(event)
    if (typing(event)) return
    if (event.key === "Escape") {
      if (drawerOpen) setDrawer(false)
      else if (selected) select(undefined, false)
      return
    }
    if (layout !== "static" && (event.key === "+" || event.key === "=" || event.key === "-" || event.key === "0")) {
      event.preventDefault()
      if (event.key === "0") zoomTo(1)
      else step(event.key === "-" ? -1 : 1)
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

  // A pinch on the document. Its touch-action leaves the browser vertical scrolling and sideways
  // panning, but not its own pinch, which would zoom the whole page.
  let pinch: { from: number; zoom: number; mid: { x: number; y: number }; scale: number } | undefined
  const spread = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
  // Heard on the document, since a second finger's touch can be given to whatever the hit test
  // finds first; it's a pinch of the document if either finger started on it.
  if (scroller) {
    const onDocument = (t: TouchList) => [...t].some((touch) => scroller.contains(touch.target as Node))
    on(document, "touchstart", (event: TouchEvent) => {
      if (layout === "static" || event.touches.length !== 2 || !pages || !onDocument(event.touches)) return
      const [a, b] = [event.touches[0], event.touches[1]]
      const mid = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
      pinch = { from: spread(event.touches), zoom, mid, scale: 1 }
      const box = pages.getBoundingClientRect()
      pages.style.transformOrigin = `${mid.x - box.left}px ${mid.y - box.top}px`
    })
    on(
      document,
      "touchmove",
      (event: TouchEvent) => {
        if (!pinch || event.touches.length !== 2 || !pages) return
        event.preventDefault()
        pinch.scale = clampZoom(pinch.zoom * (spread(event.touches) / pinch.from)) / pinch.zoom
        pages.style.transform = `scale(${pinch.scale})`
      },
      { passive: false },
    )
    const release = (event: TouchEvent) => {
      if (!pinch || event.touches.length >= 2) return
      const { zoom: z, scale, mid } = pinch
      pinch = undefined
      if (pages) {
        pages.style.transform = ""
        pages.style.transformOrigin = ""
      }
      zoomTo(z * scale, mid)
    }
    on(document, "touchend", release)
    on(document, "touchcancel", release)
  }

  // The bar's zoom: out, the level (back to 100%), in.
  const zoomButton = (name: string, fn: () => void) => {
    const button = frame?.querySelector(`.${FRAME}__zoom-${name}`)
    if (button) on(button, "click", fn)
  }
  zoomButton("out", () => step(-1))
  zoomButton("level", () => zoomTo(1))
  zoomButton("in", () => step(1))

  // Tab and Shift-Tab go round the drawer's own links and cards while a phone's drawer is open.
  function trapTab(event: KeyboardEvent) {
    const focusable = [...section.querySelectorAll<HTMLElement>("a[href], button, [tabindex]:not([tabindex='-1'])")].filter((el) => el.offsetParent !== null)
    if (!focusable.length) return event.preventDefault()
    const at = focusable.indexOf(document.activeElement as HTMLElement)
    const next = event.shiftKey ? (at <= 0 ? focusable.length - 1 : at - 1) : at === -1 || at === focusable.length - 1 ? 0 : at + 1
    event.preventDefault()
    focusable[next].focus()
  }

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
    zoom: () => zoom,
    zoomTo,
    destroy() {
      cleanups.splice(0).forEach((fn) => fn())
      section.style.transform = ""
      for (const el of cards()) {
        el.classList.remove(ACTIVE_CARD)
        el.removeAttribute("aria-current")
      }
    },
  }
}
