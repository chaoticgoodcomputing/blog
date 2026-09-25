// The colours a graph is drawn in, resolved for the canvas, which can't use CSS: the theme's, the
// site's colour options (v4 ui/styles.ts), and each tag's (#77). Each is resolved through the family's
// one resolver (tags-core's `resolveColour`), which turns any colour value, `light-dark()` and `var()`
// chains included, into the `rgba()` the page shows in its current scheme (ADR-0003's colour-value
// amendment). A tag's colour is its colour property, `--cgc-tag-…`, which the cgc-tags engine names
// in its tag index and defines in its stylesheet, inherited through the cascade. The scheme can change
// under a loaded page, so the graph makes a new palette on `themechange` (ADR-0003's *the scheme
// changes under a loaded page* amendment).
import { resolveColour, resolveTagColour } from "@chaoticgoodcomputing/tags-core/colour"
import type { Settings } from "./settings"
import type { NodeColour, NodeData, Tags, ThemeColour } from "./types"

export interface Palette {
  /** A node's colour, resolved. */
  node(colour: NodeColour): string
  gray: string
  lightgray: string
  dark: string
  shell: string
  /** The colour icons are cut out of their nodes in: the page's background, the theme's `light`. */
  icon: string
  /** The label font, the theme's body font. */
  font: string
}

const theme = (name: string) => resolveColour(`var(--${name})`)

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
    icon: theme("light"),
    font:
      getComputedStyle(document.documentElement).getPropertyValue("--bodyFont").trim() ||
      "sans-serif",
  }
}

/**
 * How a node is drawn: its fill, its ring and its icon, all its tag's, the tag that stands for it (a
 * page's primary tag, a tag node's own), as the tag index names them (#77).
 *
 * - The site's private or public node colour, when it sets one, fills every node it covers, as in
 *   v4. Otherwise a node is filled with its tag's colour.
 * - A page with no tags keeps v4's colours: the theme's `secondary` for the current page, `tertiary`
 *   for one the reader has visited, and `gray` for the rest. A tag the tag index doesn't hold, as
 *   when it failed to load, keeps v4's too: filled `gray` and ringed in `tertiary`.
 * - The icon is its tag's, its own or inherited, whatever colour fills it.
 */
export function paintOf(
  node: NodeData,
  settings: Settings,
  current: string,
  visited: Set<string>,
  tags: Tags,
): { colour: NodeColour; ring: NodeColour | null; icon: string | null } {
  const tag = node.primary === null ? undefined : tags.get(node.primary)
  const icon = tag?.icon ?? null
  const plain = (colour: NodeColour) => ({ colour, ring: null, icon })
  if (node.private && settings.nodeColors.private) return plain("private")
  if (!node.private && settings.nodeColors.public) return plain("public")
  if (tag) return plain(tag.color as NodeColour)
  if (node.tag) return { colour: "gray", ring: "tertiary", icon }
  if (node.id === current) return plain("secondary")
  return plain(visited.has(node.id) ? "tertiary" : "gray")
}
