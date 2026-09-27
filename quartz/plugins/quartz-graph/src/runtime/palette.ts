// The colours a graph is drawn in, resolved for the canvas, which can't use CSS: the theme's, the
// site's colour options (v4 ui/styles.ts), and each tag's (#77). Each is resolved through the family's
// one resolver (tags-core's `resolveColour`), which turns any colour value, `light-dark()` and `var()`
// chains included, into the `rgba()` the page shows in its current scheme (ADR-0003's colour-value
// amendment). A tag's colour is its colour property, `--cgc-tag-…`, which the quartz-tags engine names
// in its tag index and defines in its stylesheet, inherited through the cascade. The scheme can change
// under a loaded page, so the graph makes a new palette on `themechange` (ADR-0003's *the scheme
// changes under a loaded page* amendment).
//
// A node with a tag is drawn as its tag's bubble (#83), the one every badge draws, from the palette
// tags-core's `./bubble` names: a rim in the tag's colour property, a circle in the theme's
// `--lightgray` and the icon in its `--dark` (ADR-0003's tag bubble amendment).
import { BUBBLE_PALETTE, bubblePaletteOf } from "@chaoticgoodcomputing/tags-core/bubble"
import { resolveColour, resolveTagColour } from "@chaoticgoodcomputing/tags-core/colour"
import type { Settings } from "./settings"
import type { NodeColour, NodeData, NodePaint, Tags, ThemeColour } from "./types"

export interface Palette {
  /** A node's colour, resolved. */
  node(colour: NodeColour): string
  gray: string
  lightgray: string
  dark: string
  shell: string
  /** A tag bubble's circle, the theme's `--lightgray`, as tags-core's `BUBBLE_PALETTE` names it. */
  circle: string
  /** A tag bubble's icon, the theme's `--dark`, as tags-core's `BUBBLE_PALETTE` names it. */
  icon: string
  /** The label font, the theme's body font. */
  font: string
}

const theme = (name: string) => resolveColour(`var(--${name})`)
const property = (name: string) => resolveColour(`var(${name})`)

export function paletteOf(settings: Settings): Palette {
  const gray = theme("gray")
  const own: Record<ThemeColour, string> = {
    secondary: theme("secondary"),
    tertiary: theme("tertiary"),
    gray,
    public: settings.nodeColors.public ? resolveColour(settings.nodeColors.public) : gray,
    private: settings.nodeColors.private ? resolveColour(settings.nodeColors.private) : gray,
  }
  // Tags' colours, resolved as the frames first ask for them, and kept for the palette's life.
  const tags = new Map<string, string>()
  return {
    node(colour) {
      if (!colour.startsWith("--")) return own[colour as ThemeColour]
      let resolved = tags.get(colour)
      if (resolved === undefined) tags.set(colour, (resolved = resolveTagColour(colour)))
      return resolved
    },
    gray,
    lightgray: theme("lightgray"),
    dark: theme("dark"),
    shell: resolveColour(settings.shell?.color ?? "var(--lightgray)"),
    circle: property(BUBBLE_PALETTE.circle),
    icon: property(BUBBLE_PALETTE.icon),
    font:
      getComputedStyle(document.documentElement).getPropertyValue("--bodyFont").trim() ||
      "sans-serif",
  }
}

/**
 * How a node is drawn (#77, #83; docs/adr/0004).
 *
 * - A node with a tag, the one that stands for it (a page's primary tag, a tag node's own), is that
 *   tag's bubble: rimmed in its tag's colour, as the tag index names it, with the tag's icon, its own
 *   or inherited. The circle and the icon are the palette's, the same for every bubble.
 * - A note the reader has visited is set apart as a visited link is from an unvisited one: its
 *   bubble's rim is the theme's `tertiary`, v4's visited colour, in place of its tag's or the site's
 *   (the owner's decision of 2026-09-26). A tag's node always keeps its tag's colour, visited or not,
 *   and so does the reader's own page, visited as soon as it loads: it is marked by its swelling
 *   (draw.ts). No node is ringed outside its rim.
 * - The site's private or public node colour, when it sets one, rims every bubble it covers in place
 *   of the tag's, and fills every page with no tags it covers, as v4 filled every node.
 * - A page with no tags has no bubble, and keeps v4's disc: filled with the theme's `secondary` for
 *   the current page, `tertiary` for one the reader has visited, and `gray` for the rest. A tag the
 *   tag index doesn't hold, as when it failed to load, is a bubble rimmed in `tertiary`, the ring it
 *   had before (#77), with no icon.
 */
export function paintOf(
  node: NodeData,
  settings: Settings,
  current: string,
  visited: Set<string>,
  tags: Tags,
): NodePaint {
  const tag = node.tag === null ? undefined : tags.get(node.tag)
  const kind = node.private ? "private" : "public"
  const site: ThemeColour | null = settings.nodeColors[kind] ? kind : null
  const history = node.id === current ? "secondary" : visited.has(node.id) ? "tertiary" : null
  const seen = !node.isTag && node.id !== current && visited.has(node.id) ? "tertiary" : null
  if (tag) {
    const { rim } = bubblePaletteOf(tag.color)
    return { kind: "bubble", rim: seen ?? site ?? (rim as `--${string}`), icon: tag.icon ?? null }
  }
  if (node.isTag) return { kind: "bubble", rim: seen ?? site ?? "tertiary", icon: null }
  return { kind: "disc", fill: site ?? history ?? "gray" }
}
