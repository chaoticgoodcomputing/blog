import type { SimulationLinkDatum, SimulationNodeDatum } from "d3"
import type { SimpleSlug } from "../../../../util/path"

export type LinkType = "tag-tag" | "tag-post" | "post-post"

export type NodeData = {
  id: SimpleSlug
  text: string
  tags: string[]
  external?: string
} & SimulationNodeDatum

export type SimpleLinkData = {
  source: SimpleSlug
  target: SimpleSlug
  type: LinkType
}

export type LinkData = {
  source: NodeData
  target: NodeData
  type: LinkType
} & SimulationLinkDatum<NodeData>
