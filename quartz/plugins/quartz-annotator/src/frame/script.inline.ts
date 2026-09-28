// The frame's own script: the ☰ drawer, and the bar's title. Shipped as the page body's
// `afterDOMLoaded`, so it runs once per document; it sets itself up on every navigation to an
// annotation page (`nav`), and Quartz runs its cleanups before the next one (`addCleanup`).
//
// - The ☰ drawer opens from the left on its button, and closes on the button, its own close
//   button, `Esc`, or a tap outside it. Focus moving into it, as a keyboard reader tabbing, opens it.
// - The bar shows the site's name until the top section's title has scrolled away under the bar, and
//   the page's title from then on.
const FRAME = "cgc-annotator-frame"

declare global {
  interface Window {
    addCleanup?(fn: () => void): void
  }
}

function setUp() {
  const frame = document.querySelector<HTMLElement>(`.${FRAME}`)
  if (!frame) return
  const bar = frame.querySelector<HTMLElement>(`.${FRAME}__bar`)!
  const button = frame.querySelector<HTMLElement>(`.${FRAME}__menu-button`)!
  const menu = frame.querySelector<HTMLElement>(`.${FRAME}__menu`)!
  const close = frame.querySelector<HTMLElement>(`.${FRAME}__menu-close`)!
  const scrim = frame.querySelector<HTMLElement>(`.${FRAME}__scrim`)!
  const cleanups: (() => void)[] = []
  const on = <K extends keyof HTMLElementEventMap>(el: EventTarget, type: K | string, fn: (event: any) => void) => {
    el.addEventListener(type, fn)
    cleanups.push(() => el.removeEventListener(type, fn))
  }

  const isOpen = () => menu.dataset.open === "true"
  function open() {
    if (isOpen()) return
    menu.dataset.open = "true"
    scrim.dataset.open = "true"
    button.setAttribute("aria-expanded", "true")
    if (!menu.contains(document.activeElement)) close.focus()
  }
  function shut(returnFocus: boolean) {
    if (!isOpen()) return
    menu.dataset.open = "false"
    scrim.dataset.open = "false"
    button.setAttribute("aria-expanded", "false")
    if (returnFocus) button.focus()
  }

  on(button, "click", () => (isOpen() ? shut(false) : open()))
  on(close, "click", () => shut(true))
  on(scrim, "click", () => shut(false))
  on(menu, "focusin", open)
  on(document, "keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && isOpen()) {
      // A search opened from the drawer takes its own Esc first.
      if (document.querySelector(".search-container.active")) return
      // Handled: the page behind the drawer doesn't hear it too.
      event.preventDefault()
      shut(true)
    }
  })
  // A link followed from the drawer leaves it closed on the next page.
  on(menu, "click", (event: MouseEvent) => {
    if ((event.target as Element).closest("a[href]")) shut(false)
  })

  // The bar's title: the page's own once the top section's title is gone under the bar.
  const top = frame.querySelector<HTMLElement>(`.${FRAME}__top`)
  const heading = top?.querySelector("h1") ?? top
  if (heading) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const gone = !entry.isIntersecting && entry.boundingClientRect.bottom <= bar.getBoundingClientRect().bottom
        bar.dataset.title = gone ? "page" : "site"
      },
      { rootMargin: `-${bar.offsetHeight}px 0px 0px 0px` },
    )
    observer.observe(heading)
    cleanups.push(() => observer.disconnect())
  }

  const cleanup = () => cleanups.splice(0).forEach((fn) => fn())
  if (window.addCleanup) window.addCleanup(cleanup)
  else document.addEventListener("prenav", cleanup, { once: true })
}

document.addEventListener("nav", setUp)

export {}
