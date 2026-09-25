// The colours a graph is drawn in, resolved for the canvas, which can't use CSS: the theme's, and the
// site's colour options (v4 ui/styles.ts). Each is resolved through the family's one resolver
// (tags-core's `resolveColour`), which turns any colour value, `light-dark()` and `var()` chains
// included, into the `rgba()` the page shows in its current scheme (ADR-0003's colour-value
// amendment). The scheme can change under a loaded page, so the graph resolves them again on
// `themechange` (ADR-0003's *the scheme changes under a loaded page* amendment).
import { resolveColour } from "@chaoticgoodcomputing/tags-core/colour"
import type { Settings } from "./settings"
import type { NodeColour } from "./types"

export interface Palette extends Record<NodeColour, string> {
  lightgray: string
  dark: string
  shell: string
  /** The label font, the theme's body font. */
  font: string
}

const theme = (name: string) => resolveColour(`var(--${name})`)

export function paletteOf(settings: Settings): Palette {
  const secondary = theme("secondary")
  const tertiary = theme("tertiary")
  const gray = theme("gray")
  return {
    secondary,
    tertiary,
    gray,
    lightgray: theme("lightgray"),
    dark: theme("dark"),
    public: settings.nodeColors.public ? resolveColour(settings.nodeColors.public) : gray,
    private: settings.nodeColors.private ? resolveColour(settings.nodeColors.private) : gray,
    shell: resolveColour(settings.shell?.color ?? "var(--lightgray)"),
    font:
      getComputedStyle(document.documentElement).getPropertyValue("--bodyFont").trim() ||
      "sans-serif",
  }
}

/**
 * Which colour a node is drawn in: the site's private or public node colour when it sets one;
 * otherwise the theme's `secondary` for the current page, its `tertiary` for a tag or a page the
 * reader has visited, and its `gray` for the rest. A tag is filled `gray` and ringed in its colour.
 */
export function nodeColourOf(
  node: { id: string; tag: boolean; private: boolean },
  settings: Settings,
  current: string,
  visited: Set<string>,
): NodeColour {
  if (node.private && settings.nodeColors.private) return "private"
  if (!node.private && settings.nodeColors.public) return "public"
  if (node.id === current) return "secondary"
  if (node.tag || visited.has(node.id)) return "tertiary"
  return "gray"
}
