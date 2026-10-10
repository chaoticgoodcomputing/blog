// A tag bubble's proportions, written once for everything that draws one: the badge's stylesheet
// (src/components/TagBubble.astro), the tag explorer's smaller bubble, the canvas of a graph and the
// share card. Numbers, since Satori and a canvas take numbers, not CSS.

/** A tag bubble as a badge draws it: its diameter, and its rim and icon as shares of that. */
export const TAG_BUBBLE = {
  /** In CSS pixels: 2rem. */
  diameter: 32,
  /** The rim's width. */
  rim: 2.5 / 32,
  /** The icon's width and height. */
  icon: 18 / 32,
}

/** A tag bubble's rim and icon, in the unit `diameter` is in. */
export function bubbleParts(diameter: number): { rim: number; icon: number } {
  return { rim: diameter * TAG_BUBBLE.rim, icon: diameter * TAG_BUBBLE.icon }
}
