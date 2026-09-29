// What the pointer is over, and what that lights up (v4 core/hoverState.ts). Hovering a page lights
// it and its neighbours; hovering a tag lights its whole subtree of subtags too, and their
// neighbours. Each lit edge knows how many hops it is from the hovered node, so the pulse along it
// can run outward from there (draw.ts).
import type { LinkRender, NodeId, NodeRender } from "./types"

export interface HoverState {
  hovered: NodeId | null
  dragStartTime: number
  dragging: boolean
}

// A tag and every subtag under it, down the tag → subtag edges, each by how many edges down it is. A
// page is just itself.
function subtreeOf(root: NodeId, isTag: boolean, links: LinkRender[]): Map<NodeId, number> {
  const subtree = new Map([[root, 0]])
  if (!isTag) return subtree
  const stack = [root]
  while (stack.length > 0) {
    const current = stack.pop()!
    for (const { link } of links) {
      if (link.type === "tagTag" && link.source.id === current && !subtree.has(link.target.id)) {
        subtree.set(link.target.id, subtree.get(current)! + 1)
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
  const lit = subtreeOf(hovered.node.id, hovered.node.isTag, links)
  const neighbours = new Set(lit.keys())
  const now = performance.now()
  for (const link of links) {
    const [source, target] = [lit.get(link.link.source.id), lit.get(link.link.target.id)]
    link.active = source !== undefined || target !== undefined
    if (link.active) {
      link.hops = Math.min(source ?? Infinity, target ?? Infinity)
      link.litAt = now
      neighbours.add(link.link.source.id)
      neighbours.add(link.link.target.id)
    }
  }
  for (const node of nodes) node.active = neighbours.has(node.node.id)
}
