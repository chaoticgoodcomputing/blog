// The layout: d3's force simulation, with v4's per-edge distances and strengths and its pseudo-shell
// style, which pins chosen top-level tags to a ring (v4 core/simulation.ts).
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  type Simulation,
} from "d3-force"
import { tagNodeId } from "./pages"
import type { Settings, Shell } from "./settings"
import type { GraphData, LinkData, LinkType, NodeData, NodeId } from "./types"

const EDGE_KIND: Record<LinkType, "tagTag" | "tagPost" | "postPost"> = {
  "tag-tag": "tagTag",
  "tag-post": "tagPost",
  "post-post": "postPost",
}
export const edgeKind = (type: LinkType) => EDGE_KIND[type]

/**
 * Each node's radius: a tag's grows with the pages under it, a page's with its edges, and a private
 * page's is scaled by `privatePostSizeMultiplier`.
 */
export function radiusOf(data: GraphData, settings: Settings, tagCounts: Map<NodeId, number>) {
  const degree = new Map<NodeId, number>()
  for (const { source, target } of data.links) {
    degree.set(source.id, (degree.get(source.id) ?? 0) + 1)
    degree.set(target.id, (degree.get(target.id) ?? 0) + 1)
  }
  return (node: NodeData): number => {
    if (node.tag) {
      return (
        settings.baseSize.tags + settings.sizeScaling.tags * Math.sqrt(tagCounts.get(node.id) ?? 0)
      )
    }
    const radius =
      settings.baseSize.posts + settings.sizeScaling.posts * Math.sqrt(degree.get(node.id) ?? 0)
    return node.private ? radius * settings.privatePostSizeMultiplier : radius
  }
}

/** The ring's radius: it grows with the square root of the node count, so density stays even. */
export const shellRadiusOf = (nodeCount: number, shell: Shell) =>
  shell.radiusBase + shell.radiusScale * Math.sqrt(nodeCount)

export function simulationOf(
  data: GraphData,
  radius: (node: NodeData) => number,
  settings: Settings,
  width: number,
  height: number,
): { simulation: Simulation<NodeData, LinkData>; shellRadius: number | null } {
  // Start the nodes spread along the longer axis, to fill the view sooner.
  const long = Math.max(width, height)
  const short = Math.min(width, height)
  for (const node of data.nodes) {
    const along = (Math.random() - 0.5) * long * 0.8
    const across = (Math.random() - 0.5) * short * 0.3
    ;[node.x, node.y] = width > height ? [along, across] : [across, along]
  }

  const simulation = forceSimulation<NodeData>(data.nodes)
    .force("charge", forceManyBody().strength(-100 * settings.repelForce))
    .force("center", forceCenter().strength(settings.centerForce))
    .force(
      "link",
      forceLink<NodeData, LinkData>(data.links)
        .distance((link) => settings.linkDistance[edgeKind(link.type)])
        .strength((link) => settings.linkStrength[edgeKind(link.type)]),
    )
    .force("collide", forceCollide<NodeData>(radius).iterations(3))

  let shellRadius: number | null = null
  if (settings.shell) {
    shellRadius = shellRadiusOf(data.nodes.length, settings.shell)
    pinToShell(simulation, data, settings.shell, shellRadius)
  } else if (settings.enableRadial) {
    simulation.force(
      "radial",
      forceRadial<NodeData>((Math.min(width, height) / 2) * 0.8).strength(0.2),
    )
  }
  return { simulation, shellRadius }
}

// The pseudo-shell: each pinned tag is snapped to the ring on every tick, keeping only its motion
// along the ring, and pinned tags push each other apart along it, so they settle evenly spaced.
function pinToShell(
  simulation: Simulation<NodeData, LinkData>,
  data: GraphData,
  shell: Shell,
  radius: number,
) {
  const pinnedIds = shell.pinnedTags.map(tagNodeId)
  const pinned = pinnedIds
    .map((id) => data.nodes.find((node) => node.id === id))
    .filter((node): node is NodeData => node !== undefined)

  // Start them evenly round the ring.
  pinned.forEach((node, i) => {
    const angle = (i * 2 * Math.PI) / pinned.length
    node.x = Math.cos(angle) * radius
    node.y = Math.sin(angle) * radius
  })

  simulation.force("shell", () => {
    for (const node of pinned) {
      const [x, y] = [node.x ?? 0, node.y ?? 0]
      const distance = Math.hypot(x, y)
      if (distance > 0.01) {
        const [dx, dy] = [x / distance, y / distance]
        node.x = dx * radius
        node.y = dy * radius
        // Drop the motion towards or away from the centre, and keep the motion along the ring.
        const [vx, vy] = [node.vx ?? 0, node.vy ?? 0]
        const outward = vx * dx + vy * dy
        node.vx = vx - outward * dx
        node.vy = vy - outward * dy
      } else {
        const angle = Math.random() * 2 * Math.PI
        node.x = Math.cos(angle) * radius
        node.y = Math.sin(angle) * radius
        node.vx = 0
        node.vy = 0
      }
    }
    if (shell.circumferentialRepulsion <= 0) return
    const ideal = (2 * Math.PI) / pinned.length
    for (let i = 0; i < pinned.length; i++) {
      for (let j = i + 1; j < pinned.length; j++) {
        const [a, b] = [pinned[i], pinned[j]]
        let apart = Math.atan2(b.y ?? 0, b.x ?? 0) - Math.atan2(a.y ?? 0, a.x ?? 0)
        if (apart > Math.PI) apart -= 2 * Math.PI
        if (apart < -Math.PI) apart += 2 * Math.PI
        // Inverse-square falloff, with no cut-off, so they settle smoothly.
        const ratio = Math.abs(apart) / ideal
        const strength = shell.circumferentialRepulsion / Math.max(ratio * ratio, 0.01)
        const direction = apart > 0 ? -1 : 1
        a.vx = (a.vx ?? 0) + (-(a.y ?? 0) / radius) * strength * direction
        a.vy = (a.vy ?? 0) + ((a.x ?? 0) / radius) * strength * direction
        b.vx = (b.vx ?? 0) - (-(b.y ?? 0) / radius) * strength * direction
        b.vy = (b.vy ?? 0) - ((b.x ?? 0) / radius) * strength * direction
      }
    }
  })
}
