// The tag bubble (#82): the circle that holds a tag's icon, drawn the same wherever the family shows
// one. Its markup is here, as the attributes a consumer puts on one element; its structure is
// `./bubble.css`, which the consumer ships in its own family layer; and its palette is here too, as
// the names of the properties that paint it, so a canvas, which CSS can't reach, paints a bubble
// from the same three.
//
// The palette is the owner's (review notes of 2026-09-26; ADR-0003's bubble amendment): the tag
// colour paints only the rim, the circle is the theme's `--lightgray` and the icon its `--dark`, so a
// bubble is light with a black icon in the light scheme, and dark with a white one in the dark.
// In a badge, whose own background is `--lightgray`, the circle is the page's `--light` instead, so
// it stands out from the badge (the owner's decision of the same day, in the same amendment).
//
// Runs anywhere: no DOM, no Preact, no imports, so a server-side component, a browser script and the
// library's lint (which strips its types) can all read it.

/** The bubble's classes: the circle, and the drawn icon inside it. */
export const TAG_BUBBLE = {
  block: "cgc-tag-bubble",
  icon: "cgc-tag-bubble__icon",
  /** A bubble in a badge, whose circle stands out from the badge's `--lightgray` background. */
  badge: "cgc-tag-bubble--badge",
} as const

/** The theme's properties that paint every bubble alike: its circle, and its icon. */
export const BUBBLE_PALETTE = {
  circle: "--lightgray",
  icon: "--dark",
} as const

/** What a bubble in a badge paints differently: its circle, the page's `--light`. */
export const BADGE_PALETTE = {
  circle: "--light",
} as const

/**
 * The properties that paint one tag's bubble, by the part each paints. `rim` is the tag's colour
 * property, as the engine publishes it (`TagProperties.color`). A canvas resolves each as
 * `resolveColour(\`var(${name})\`)`, with `./colour`, and again on `themechange`.
 */
export interface BubblePalette {
  rim: string
  circle: string
  icon: string
}

/** One tag's bubble palette, from the colour property the engine publishes for it. */
export const bubblePaletteOf = (colorProperty: string): BubblePalette => ({
  rim: colorProperty,
  ...BUBBLE_PALETTE,
})

/** What a consumer knows of the tag whose bubble it draws. */
export interface TagBubbleOf {
  /** The tag, normalised. The bubble's tooltip names it, whole. */
  tag: string
  /** The tag's colour property, as the engine publishes it. */
  color: string
  /**
   * The tag's icon, drawn, with `TAG_BUBBLE.icon` as its class: `@chaoticgoodcomputing/icons`'
   * `svg(id, { class: TAG_BUBBLE.icon })`. Absent for a tag with no icon in its lineage, whose
   * bubble is empty.
   */
  icon?: string
  /** Whether the bubble sits in a badge, which paints its circle `BADGE_PALETTE.circle`. */
  badge?: boolean
}

/** The attributes of one bubble's element, a `<span>`, for a consumer to render. */
export interface TagBubbleAttributes {
  class: string
  style: string
  title: string
  dangerouslySetInnerHTML?: { __html: string }
}

/**
 * One tag's bubble, as the attributes of the `<span>` that draws it: `<span {...tagBubble(…)} />` in
 * a Preact component. The rim takes the tag colour inline, as the one property that differs from
 * tag to tag; the stylesheet paints the rest. The bubble holds no text, only the icon.
 */
export const tagBubble = ({ tag, color, icon, badge }: TagBubbleOf): TagBubbleAttributes => ({
  class: badge ? `${TAG_BUBBLE.block} ${TAG_BUBBLE.badge}` : TAG_BUBBLE.block,
  style: `border-color: var(${color})`,
  title: tag,
  ...(icon === undefined ? {} : { dangerouslySetInnerHTML: { __html: icon } }),
})
