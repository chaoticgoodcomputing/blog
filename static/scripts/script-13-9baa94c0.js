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
})(".cgc-annotator-viewer");
"use strict";(()=>{var n="cgc-annotator-frame";function g(){let t=document.querySelector(`.${n}`);if(!t)return;let l=t.querySelector(`.${n}__bar`),a=t.querySelector(`.${n}__menu-button`),o=t.querySelector(`.${n}__menu`),p=t.querySelector(`.${n}__menu-close`),d=t.querySelector(`.${n}__scrim`),f=[],c=(e,s,u)=>{e.addEventListener(s,u),f.push(()=>e.removeEventListener(s,u))},i=()=>o.dataset.open==="true";function m(){i()||(o.dataset.open="true",d.dataset.open="true",a.setAttribute("aria-expanded","true"),o.contains(document.activeElement)||p.focus())}function r(e){i()&&(o.dataset.open="false",d.dataset.open="false",a.setAttribute("aria-expanded","false"),e&&a.focus())}c(a,"click",()=>i()?r(!1):m()),c(p,"click",()=>r(!0)),c(d,"click",()=>r(!1)),c(o,"focusin",m),c(document,"keydown",e=>{if(e.key==="Escape"&&i()){if(document.querySelector(".search-container.active"))return;e.preventDefault(),r(!0)}}),c(o,"click",e=>{e.target.closest("a[href]")&&r(!1)});let v=t.querySelector(`.${n}__top`),E=v?.querySelector("h1")??v;if(E){let e=new IntersectionObserver(([s])=>{let u=!s.isIntersecting&&s.boundingClientRect.bottom<=l.getBoundingClientRect().bottom;l.dataset.title=u?"page":"site"},{rootMargin:`-${l.offsetHeight}px 0px 0px 0px`});e.observe(E),f.push(()=>e.disconnect())}let b=()=>f.splice(0).forEach(e=>e());window.addCleanup?window.addCleanup(b):document.addEventListener("prenav",b,{once:!0})}document.addEventListener("nav",g);})();
