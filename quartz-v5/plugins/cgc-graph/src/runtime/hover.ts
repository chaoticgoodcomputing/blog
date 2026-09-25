// What the pointer is over, and what that lights up (v4 core/hoverState.ts). Hovering a page lights
// it and its neighbours; hovering a tag lights its whole subtree of subtags too, and their
// neighbours.
import type { LinkRender, NodeId, NodeRender } from "./types"

export interface HoverState {
  hovered: NodeId | null
  dragStartTime: number
  dragging: boolean
}

// A tag and every subtag under it, down the tag → subtag edges. A page is just itself.
function subtreeOf(root: NodeId, isTag: boolean, links: LinkRender[]): Set<NodeId> {
  const subtree = new Set([root])
  if (!isTag) return subtree
  const stack = [root]
  while (stack.length > 0) {
    const current = stack.pop()!
    for (const { link } of links) {
      if (link.type === "tag-tag" && link.source.id === current && !subtree.has(link.target.id)) {
        subtree.add(link.target.id)
        stack.push(link.target.id)
      }
    }
  }
  return subtree
}

export function hover(
  state: HoverState,
  links: LinkRender[],
  nodes: NodeRender[],
  hovered: NodeRender | null,
) {
  state.hovered = hovered?.node.id ?? null
  if (hovered === null) {
    for (const node of nodes) node.active = false
    for (const link of links) link.active = false
    return
  }
  const lit = subtreeOf(hovered.node.id, hovered.node.tag, links)
  const neighbours = new Set(lit)
  for (const link of links) {
    link.active = lit.has(link.link.source.id) || lit.has(link.link.target.id)
    if (link.active) {
      neighbours.add(link.link.source.id)
      neighbours.add(link.link.target.id)
    }
  }
  for (const node of nodes) node.active = neighbours.has(node.node.id)
}
