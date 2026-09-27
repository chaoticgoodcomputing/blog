// The tag bubble and the badges that hold it, as the specs of tags-core and its consumers read them.
// Not a spec: shared by the ones that import it.

// The bubble's classes, tags-core's `./bubble` (TAG_BUBBLE there).
export const BUBBLE = ".cgc-tag-bubble"
export const BUBBLE_ICON = ".cgc-tag-bubble__icon"

// Each plugin that draws badges: where one tag's badge is, and its name and count inside it.
export const BADGES = {
  "cgc-tag-list": {
    badge: (page, tag) => page.locator(`.cgc-tag-list__item[data-tag="${tag}"]`).first(),
    name: ".cgc-tag-list__name",
    count: ".cgc-tag-list__count",
  },
  "cgc-post-listing": {
    badge: (page, tag) =>
      page.locator(`.cgc-post-listing .cgc-post-listing__tag[data-tag="${tag}"]`).first(),
    name: ".cgc-post-listing__tag-name",
    count: ".cgc-post-listing__tag-count",
  },
}

/** The bubble in one badge. */
export const bubbleOf = (badge) => badge.locator(BUBBLE)

/**
 * The vertical centre of each part of a badge, in page pixels, as a reader's eye finds it: the
 * bubble's is the middle of its circle, and a line of text's is the middle of its capital height,
 * from its baseline up. Both are read from what the browser drew, not from the boxes the stylesheet
 * sets, so a font whose metrics put its text high or low in its line shows as off-centre. Resolves
 * to `{ bubble, name, count }`, a part the badge doesn't show being left out.
 */
export const centresOf = (badge, { name, count }) =>
  badge.evaluate(
    (badge, { bubble, parts }) => {
      const middle = (rect) => rect.top + rect.height / 2
      const centres = { bubble: middle(badge.querySelector(bubble).getBoundingClientRect()) }
      for (const [part, selector] of Object.entries(parts)) {
        const text = badge.querySelector(selector)
        if (!text || text.getClientRects().length === 0) continue
        // The baseline: the bottom of an empty inline-block set on it, which is where one sits.
        const marker = text.appendChild(document.createElement("span"))
        marker.style.cssText = "display: inline-block; width: 0; height: 0"
        const baseline = marker.getBoundingClientRect().bottom
        marker.remove()
        // The capital height, in the font the text is drawn in.
        const context = document.createElement("canvas").getContext("2d")
        context.font = getComputedStyle(text).font
        const cap = context.measureText("H").actualBoundingBoxAscent
        centres[part] = baseline - cap / 2
      }
      return centres
    },
    { bubble: BUBBLE, parts: { name, count } },
  )
