// The graph's data, as the runtime draws it (v4 core/types.ts, core/renderTypes.ts).
import type { TagProperties } from "@chaoticgoodcomputing/tags-core"
import type { PerEdge } from "../options"
import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force"
import type { IconImages } from "./icons"

/**
 * A node's id. A page's is its simple slug: `plain-note`, `/` for the site's index, `notes/` for a
 * folder's. A tag's is `tags/<tag>`, and a page that describes a tag, at `tags/<tag>` or
 * `tags/<tag>/index`, is the tag's own node.
 */
export type NodeId = string

/** One page of the graph's index, keyed by its node id. */
export interface Page {
  id: NodeId
  title: string
  links: NodeId[]
  tags: string[]
  /** Its primary tag, as cgc-tags resolves it, or null for a page with no tags. */
  primary: string | null
  date: Date | null
}

export type Pages = Map<NodeId, Page>

/** The cgc-tags engine's tag index: each tag's colour property and icon id, by tag. */
export type Tags = Map<string, TagProperties>

/** What every graph on a page is drawn from: the graph index's pages and icons, and the tag index. */
export interface Sources {
  pages: Pages
  icons: IconImages
  tags: Tags
}

/** An edge's kind, as the per-kind settings name it: tag → subtag, tag → page, page → page. */
export type LinkType = keyof PerEdge<unknown>

export interface NodeData extends SimulationNodeDatum {
  id: NodeId
  /** Its label: a page's title, or `#` and a tag's last segment. */
  text: string
  /** A page's tags; none for a tag. */
  tags: string[]
  /** Whether the node is a tag. */
  isTag: boolean
  /** Whether the node is a private page (the `privateTags` option). */
  private: boolean
  /**
   * The node's tag, whose bubble it is drawn as: a page's primary tag, or a tag node's own tag. Null
   * for a page with no tags.
   */
  tag: string | null
  /** Where following it leads. */
  href: string
}

/** An edge by its ends' ids, before the nodes exist. */
export interface SimpleLink {
  source: NodeId
  target: NodeId
  type: LinkType
}

export interface LinkData extends SimulationLinkDatum<NodeData> {
  source: NodeData
  target: NodeData
  type: LinkType
}

export interface GraphData {
  nodes: NodeData[]
  links: LinkData[]
}

export interface Label {
  text: string
  alpha: number
  scale: number
  fontSize: number
  initialAlpha: number
}

/** One of the colours the graph takes from the theme or from the site's `nodeColors`. */
export type ThemeColour = "secondary" | "tertiary" | "gray" | "public" | "private"

/** A colour a node is drawn in: one of those, or a tag's, by its colour property (`--cgc-tag-…`). */
export type NodeColour = ThemeColour | `--${string}`

/**
 * How a node is drawn (docs/adr/0004): a node with a tag as its tag's bubble, the one every badge
 * draws (tags-core's `./bubble`, #83), and a page with no tags as v4's disc.
 */
export type NodePaint =
  | {
      kind: "bubble"
      /**
       * Its rim: its tag's colour, or the site's `nodeColors` in its place, or `tertiary` for a note
       * the reader has visited, as a visited link is set apart from an unvisited one.
       */
      rim: NodeColour
      /** The icon drawn in it, by its icon id, if its tag has one. */
      icon: string | null
    }
  | {
      kind: "disc"
      /** Its fill. */
      fill: NodeColour
    }

export interface NodeRender {
  node: NodeData
  label: Label
  paint: NodePaint
  alpha: number
  active: boolean
  radius: number
}

export interface LinkRender {
  link: LinkData
  alpha: number
  active: boolean
  lineStyle: "solid" | "dotted"
}

/** Pan and zoom, shared by the drawing and the pointer. */
export interface Transform {
  x: number
  y: number
  k: number
}
