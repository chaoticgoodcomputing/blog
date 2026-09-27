// quartz-post-listing's one script, v4's PostListing long press, as quartz-tag-list carries v4's TagList
// one. On a narrow screen a post's tag badge shows only its bubble. Pressing and holding one expands
// it to show the tag's name, and the press doesn't follow the link; a tap still does. Tapping anywhere
// else, leaving the badge or navigating collapses it again.
//
// Plain browser script, run once per page load: `serve` wraps it in a function, so it can't be a
// module. The listeners sit on the document, so they reach badges that SPA navigation brings in.
;(() => {
  const NARROW = window.matchMedia("(max-width: 1000px)")
  const LINK = ".cgc-post-listing__tag-link"
  const EXPANDED = "cgc-post-listing__tag-link--expanded"
  const LONG_PRESS_MS = 500
  const LEAVE_MS = 300

  let timer
  let expanded = null
  // The link a press has just expanded, whose click the press ends with and must not follow.
  let held = null

  const linkOf = (event) => (event.target instanceof Element ? event.target.closest(LINK) : null)
  const collapse = () => {
    expanded?.classList.remove(EXPANDED)
    expanded = null
  }
  const expand = (link) => {
    if (expanded !== link) collapse()
    link.classList.add(EXPANDED)
    expanded = link
  }

  document.addEventListener("pointerdown", (event) => {
    const link = linkOf(event)
    held = null
    clearTimeout(timer)
    if (!link || !NARROW.matches || event.button !== 0) return
    timer = setTimeout(() => {
      expand(link)
      held = link
    }, LONG_PRESS_MS)
  })
  for (const type of ["pointerup", "pointercancel"])
    document.addEventListener(type, () => clearTimeout(timer))

  // Captured on the document, ahead of the SPA router's listener on the window.
  document.addEventListener(
    "click",
    (event) => {
      const link = linkOf(event)
      if (link && link === held) {
        event.preventDefault()
        event.stopPropagation()
        held = null
        return
      }
      if (link !== expanded) collapse()
    },
    true,
  )

  document.addEventListener("pointerout", (event) => {
    const link = linkOf(event)
    if (!link || link !== expanded || link.contains(event.relatedTarget)) return
    setTimeout(() => expanded === link && !link.matches(":hover") && collapse(), LEAVE_MS)
  })

  // A long press on a touch screen would otherwise open the browser's own menu for the link.
  document.addEventListener("contextmenu", (event) => {
    if (linkOf(event) && NARROW.matches) event.preventDefault()
  })

  document.addEventListener("nav", collapse)
})()
