;(function islandRuntime(selector) {
  let generation = 0
  const mounted = new Map()
  const observers = new Set()
  const stylesheets = new Map()

  // Entries are addressed from the site root, never relative to this script: in production this
  // script is itself loaded from static/scripts/.
  const url = (path) => `${document.body.dataset.basepath ?? ""}/${path}`.replace(/^\/+/, "/")

  // Persisted, so the SPA head patch leaves it alone on later navigations.
  function stylesheet(path) {
    const href = new URL(url(path), location.href).href
    // Already in the served <head>: it blocked first paint, so it has loaded.
    if (
      !stylesheets.has(path) &&
      [...document.querySelectorAll('link[rel="stylesheet"]')].some((l) => l.href === href)
    ) {
      stylesheets.set(path, Promise.resolve())
    }
    if (!stylesheets.has(path)) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = url(path)
      link.setAttribute("data-persist", "")
      stylesheets.set(
        path,
        new Promise((done) => {
          link.onload = link.onerror = done
        }),
      )
      document.head.appendChild(link)
    }
    return stylesheets.get(path)
  }

  async function hydrate(el, gen) {
    el.setAttribute("data-cgc-mounting", "")
    const { cgcEntry, cgcCss, cgcProps } = el.dataset
    const [entry] = await Promise.all([import(url(cgcEntry)), cgcCss && stylesheet(cgcCss)])
    el.removeAttribute("data-cgc-mounting")
    // A newer navigation overtook this one, or the element left the page while loading.
    if (gen !== generation || !el.isConnected) return
    entry.hydrate(entry.h(entry.default, JSON.parse(cgcProps)), el)
    mounted.set(el, entry.render)
    el.setAttribute("data-cgc-hydrated", "")
  }

  function whenVisible(el, gen) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      observers.delete(observer)
      hydrate(el, gen)
    })
    observers.add(observer)
    observer.observe(el)
  }

  function scan() {
    const gen = generation
    for (const el of document.querySelectorAll(selector)) {
      // Popovers show another page's markup; it stays static.
      if (
        mounted.has(el) ||
        el.hasAttribute("data-cgc-mounting") ||
        el.hasAttribute("data-cgc-waiting")
      )
        continue
      if (el.closest(".popover")) continue
      if (el.dataset.cgcHydrate === "visible") {
        el.setAttribute("data-cgc-waiting", "")
        whenVisible(el, gen)
      } else hydrate(el, gen)
    }
  }

  function unmountAll() {
    generation++
    for (const [el, render] of mounted) {
      render(null, el)
      el.removeAttribute("data-cgc-hydrated")
    }
    mounted.clear()
    for (const observer of observers) observer.disconnect()
    observers.clear()
    for (const el of document.querySelectorAll(selector)) el.removeAttribute("data-cgc-waiting")
  }

  document.addEventListener("nav", scan)
  document.addEventListener("render", scan)
  document.addEventListener("prenav", unmountAll)
})(".cgc-mdx-island");
