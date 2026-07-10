import { LinkRenderData, NodeRenderData } from "./renderTypes"

export type HoverState = {
  hoveredNodeId: string | null
  hoveredNeighbours: Set<string>
  dragStartTime: number
  dragging: boolean
}

function isTagId(id: string): boolean {
  return id.startsWith("tags/")
}

/**
 * Collect a tag node together with all of its descendant subtags by walking
 * the parent→child "tag-tag" links downward (e.g. "tags/economics/" pulls in
 * "tags/economics/strategy/" and everything beneath it). For a non-tag node
 * this is just the node itself, so highlighting behaves as before.
 */
function collectHoverSubtree(rootId: string, linkRenderData: LinkRenderData[]): Set<string> {
  const subtree = new Set<string>([rootId])
  if (!isTagId(rootId)) {
    return subtree
  }

  const stack = [rootId]
  while (stack.length > 0) {
    const current = stack.pop()!
    for (const l of linkRenderData) {
      const link = l.simulationData
      // tag-tag links are directed parent (source) → child (target)
      if (link.type === "tag-tag" && link.source.id === current && !subtree.has(link.target.id)) {
        subtree.add(link.target.id)
        stack.push(link.target.id)
      }
    }
  }

  return subtree
}

export function updateHoverInfo(
  state: HoverState,
  linkRenderData: LinkRenderData[],
  nodeRenderData: NodeRenderData[],
  newHoveredId: string | null,
) {
  state.hoveredNodeId = newHoveredId

  if (newHoveredId === null) {
    state.hoveredNeighbours = new Set()
    for (const n of nodeRenderData) {
      n.active = false
    }
    for (const l of linkRenderData) {
      l.active = false
    }
    return
  }

  // Treat the hovered node — and, for tags, its whole subtree of subtags — as
  // the highlighted set, then extend it with anything directly linked to it.
  const hoveredSet = collectHoverSubtree(newHoveredId, linkRenderData)

  const neighbours = new Set<string>(hoveredSet)
  for (const l of linkRenderData) {
    const linkData = l.simulationData
    const active = hoveredSet.has(linkData.source.id) || hoveredSet.has(linkData.target.id)
    if (active) {
      neighbours.add(linkData.source.id)
      neighbours.add(linkData.target.id)
    }
    l.active = active
  }

  state.hoveredNeighbours = neighbours
  for (const n of nodeRenderData) {
    n.active = neighbours.has(n.simulationData.id)
  }
}
