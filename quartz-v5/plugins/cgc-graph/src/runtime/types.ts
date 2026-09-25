// The graph's data, as the runtime draws it (v4 core/types.ts, core/renderTypes.ts).
import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force"

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
  date: Date | null
}

export type Pages = Map<NodeId, Page>

/** tag → subtag, tag → page, page → page. */
export type LinkType = "tag-tag" | "tag-post" | "post-post"

export interface NodeData extends SimulationNodeDatum {
  id: NodeId
  /** Its label: a page's title, or `#` and a tag's last segment. */
  text: string
  /** A page's tags; none for a tag. */
  tags: string[]
  /** Whether the node is a tag. */
  tag: boolean
  /** Whether the node is a private page (the `privateTags` option). */
  private: boolean
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

/** Which of the palette's colours a node is drawn in. */
export type NodeColour = "secondary" | "tertiary" | "gray" | "public" | "private"

export interface NodeRender {
  node: NodeData
  label: Label
  colour: NodeColour
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
