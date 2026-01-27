import { SimpleSlug } from "../../../../util/path"
import { IconService } from "../../../../util/iconService"
import type { TagIndex } from "../../../../util/tags"
import { getTagIcon } from "../core/tagIndex"
import { NodeData } from "../core/types"
import { LinkRenderData, NodeRenderData, LabelData } from "../core/renderTypes"
import { HoverState, updateHoverInfo } from "../core/hoverState"
import { loadIconImage } from "./canvasSetup"

export type NodeCreationParams = {
  node: NodeData
  nodeRadius: (n: NodeData) => number
  color: (d: NodeData) => string
  computedStyleMap: Record<string, string>
  scale: number
  opacityScale: number
  fontSize: number
  slug: SimpleSlug
  labelAnchorConfig: { baseY: number; scaleFactor: number }
  tagIndex: TagIndex
  nodeColorsConfig?: { public?: string; private?: string }
}

export type NodeCreationResult = {
  nodeRenderData: NodeRenderData
}

export async function createNode(
  params: NodeCreationParams,
  hoverState: HoverState,
  linkRenderData: LinkRenderData[],
  nodeRenderData: NodeRenderData[],
  renderAll: () => void,
): Promise<NodeCreationResult> {
  const {
    node: n,
    nodeRadius,
    color,
    computedStyleMap,
    scale,
    opacityScale,
    fontSize,
    slug,
    labelAnchorConfig,
    tagIndex,
    nodeColorsConfig,
  } = params

  const nodeId = n.id
  const isTagNode = nodeId.startsWith("tags/")
  const isCurrentPage = nodeId === slug

  // Check if node has #private tag
  const isPrivate = n.tags.includes("private")

  const initialOpacity =
    isTagNode || isCurrentPage ? 1 : Math.max((scale * opacityScale - 1) / 3.75, 0)

  const radius = nodeRadius(n)
  const yAnchor = labelAnchorConfig.baseY + (radius - 2) * labelAnchorConfig.scaleFactor

  const label: LabelData = {
    text: n.text,
    alpha: initialOpacity,
    scale: 1 / scale,
    fontSize: fontSize * 15,
    color: computedStyleMap["--dark"],
    fontFamily: computedStyleMap["--bodyFont"],
    anchor: { x: 0.5, y: yAnchor },
    x: 0,
    y: 0,
    initialAlpha: initialOpacity,
  }

  let oldLabelOpacity = initialOpacity
  
  // Determine node color based on privacy status
  let nodeColor: string
  if (isPrivate && nodeColorsConfig?.private) {
    nodeColor = nodeColorsConfig.private
  } else if (!isPrivate && nodeColorsConfig?.public) {
    nodeColor = nodeColorsConfig.public
  } else {
    nodeColor = color(n)
  }
  
  const fillColor = isTagNode ? computedStyleMap["--gray"] : nodeColor

  const nodeRenderDatum: NodeRenderData = {
    simulationData: n,
    label,
    color: nodeColor,
    alpha: 1,
    active: false,
    radius,
    fillColor,
    strokeColor: isTagNode ? nodeColor : undefined,
    strokeWidth: isTagNode ? 2 : undefined,
  }

  // Handle icon asynchronously
  let iconId: string | null = null
  if (isTagNode) {
    let tag = nodeId.substring(5)
    if (tag.endsWith("/")) {
      tag = tag.substring(0, tag.length - 1)
    }
    iconId = getTagIcon(tag, tagIndex)
  } else if (n.tags && n.tags.length > 0) {
    // Use icon from first tag in frontmatter
    iconId = getTagIcon(n.tags[0], tagIndex)
  }

  if (iconId) {
    const currentIconId = iconId
    IconService.getIcon(currentIconId).then((iconData) => {
      if (!iconData) return
      loadIconImage(iconData.dataUri, currentIconId).then((img) => {
        if (!img) return
        const iconSize = radius * 1.4
        nodeRenderDatum.iconImage = img
        nodeRenderDatum.iconSize = iconSize
        nodeRenderDatum.baseIconSize = iconSize
      })
    })
  }

  return { nodeRenderData: nodeRenderDatum }
}

export function createLink(
  linkData: any,
  computedStyleMap: Record<string, string>,
  linkStyleConfig?: {
    tagTag?: 'solid' | 'dotted'
    tagPost?: 'solid' | 'dotted'
    postPost?: 'solid' | 'dotted'
  },
): LinkRenderData {
  // Determine line style based on link type
  let lineStyle: 'solid' | 'dotted' = 'solid'
  if (linkStyleConfig) {
    const linkType = linkData.type
    if (linkType === 'tag-tag' && linkStyleConfig.tagTag) {
      lineStyle = linkStyleConfig.tagTag
    } else if (linkType === 'tag-post' && linkStyleConfig.tagPost) {
      lineStyle = linkStyleConfig.tagPost
    } else if (linkType === 'post-post' && linkStyleConfig.postPost) {
      lineStyle = linkStyleConfig.postPost
    }
  }

  const linkRenderDatum: LinkRenderData = {
    simulationData: linkData,
    color: computedStyleMap["--lightgray"],
    alpha: 1,
    active: false,
    lineStyle,
  }

  return linkRenderDatum
}
