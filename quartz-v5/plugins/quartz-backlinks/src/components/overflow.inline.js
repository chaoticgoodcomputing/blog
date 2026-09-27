// quartz-backlinks' one script: stock's overflow list, which v4's Backlinks used too. Core scrolls a
// `ul.overflow` in its own box and fades its bottom out while it carries `gradient-active`; this puts
// that class on each list of backlinks while its last item is out of view.
//
// Plain browser script, run once per page load: `serve` wraps it in a function, so it can't be a
// module. `nav` fires on the first load and after every SPA navigation, which brings in a new list.
document.addEventListener("nav", () => {
  for (const list of document.querySelectorAll(".cgc-backlinks__list")) {
    const end = list.querySelector(".cgc-backlinks__end")
    if (!end) continue
    const observer = new IntersectionObserver(([entry]) =>
      list.classList.toggle("gradient-active", !entry.isIntersecting),
    )
    observer.observe(end)
    window.addCleanup(() => observer.disconnect())
  }
})
