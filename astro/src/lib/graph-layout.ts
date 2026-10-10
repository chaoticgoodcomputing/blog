// Laying out a graph (./graph.ts): d3-force's simulation, with the site's forces from a graph's
// settings, and for a graph with a shell, the pinned tags held on a ring and what can't reach one
// kept inside it. Knows no browser: src/lib/graph-drawing.ts ticks it a frame at a time, and a test
// ticks it to rest.

import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force"
import type { GraphSettings, ShellSettings } from "../site.config.types.ts"
import { radii, type Graph, type GraphEdge, type GraphNode } from "./graph.ts"
import { tagUrl } from "./tags.ts"

/** A node as d3-force moves it. */
export interface PlacedNode extends GraphNode, SimulationNodeDatum {}
/** An edge as d3-force holds it, between two placed nodes. */
export interface PlacedEdge extends Omit<GraphEdge, "source" | "target">, SimulationLinkDatum<PlacedNode> {
  source: PlacedNode
  target: PlacedNode
}

export interface Layout {
  /** Stopped: its caller ticks it. */
  simulation: Simulation<PlacedNode, PlacedEdge>
  /** The graph's nodes and edges, in its order, as the simulation moves them. */
  nodes: PlacedNode[]
  edges: PlacedEdge[]
  /** Each node's radius, by its id (`radii`). */
  radius: Map<string, number>
  /** The shell's radius, around the middle of the graph; none for a graph with no shell. */
  shell: number | undefined
}

/** A graph laid out with `settings`: its nodes and edges, and the simulation that moves them. */
export function layOut(graph: Graph, settings: GraphSettings): Layout {
  const radius = radii(graph, settings.sizes)
  const nodes: PlacedNode[] = graph.nodes.map((node) => ({ ...node }))
  const edges = graph.edges.map((edge) => ({ ...edge })) as unknown as PlacedEdge[]
  const { charge, center, linkDistance, linkStrength } = settings.forces
  const simulation = forceSimulation(nodes)
    .stop()
    .force("charge", forceManyBody<PlacedNode>().strength(charge))
    .force("center", forceCenter<PlacedNode>().strength(center))
    .force(
      "link",
      forceLink<PlacedNode, PlacedEdge>(edges)
        .id((node) => node.id)
        .distance((edge) => linkDistance[edge.kind])
        .strength((edge) => linkStrength[edge.kind]),
    )
    .force("collide", forceCollide<PlacedNode>((node) => radius.get(node.id) ?? 0).iterations(3))
  if (!settings.shell) return { simulation, nodes, edges, radius, shell: undefined }

  const shell = shellRadius(nodes.length, settings.shell)
  simulation.force("shell", pinToShell(nodes, settings.shell, shell))
  const reached = reaching(graph, settings.shell.pinnedTags.map(tagUrl))
  simulation.force("inside", keepInside(nodes.filter((node) => !reached.has(node.id)), shell))
  return { simulation, nodes, edges, radius, shell }
}

/** A node at rest as a view is fitted to it: where it is, its radius, and its label's width if shown. */
export interface FittedNode {
  x: number
  y: number
  r: number
  labelWidth?: number
}

/** A view of a graph, as d3-zoom holds one: drawn at scale `k`, moved by `x` and `y`. */
export interface View {
  k: number
  x: number
  y: number
}

/** The ring a shell holds its pinned tags on, and the room the view keeps round it. */
export interface FittedRing {
  /** The ring's radius: `shellRadius()`. */
  radius: number
  /** The shell's `zoomMargin`. */
  margin: number
}

/**
 * The view that fits a graph at rest in a box, `margin` in from its edges: every node, a node with
 * a label with the label under it at `sizes.label`, and a shell's ring, round the graph's middle,
 * with its margin round it, as the Quartz site fitted its view to the ring. It is never larger than
 * the graph is (docs/adr/2201): where the Quartz site would have zoomed a ring in to fill a large
 * box, this leaves it at its size. A node's place is from the middle of the box.
 */
export function fittedView(
  nodes: FittedNode[],
  { width, height, margin }: { width: number; height: number; margin: number },
  { sizes }: Pick<GraphSettings, "sizes">,
  ring?: FittedRing,
): View {
  const reach = ring === undefined ? undefined : ring.radius + ring.margin
  let [left, top, right, bottom] =
    reach === undefined ? [Infinity, Infinity, -Infinity, -Infinity] : [-reach, -reach, reach, reach]
  for (const { x, y, r, labelWidth } of nodes) {
    const half = labelWidth === undefined ? r : Math.max(r, labelWidth / 2)
    const below = labelWidth === undefined ? r : r + 2 + sizes.label
    ;[left, right, top, bottom] = [Math.min(left, x - half), Math.max(right, x + half), Math.min(top, y - r), Math.max(bottom, y + below)]
  }
  const k = Math.min(1, (width - 2 * margin) / Math.max(right - left, 1), (height - 2 * margin) / Math.max(bottom - top, 1))
  const [middleX, middleY] = [(left + right) / 2 + width / 2, (top + bottom) / 2 + height / 2]
  return { k, x: width / 2 - k * middleX, y: height / 2 - k * middleY }
}

/** The radius of the ring the pinned tags are held on, for a graph of `nodes` nodes. */
export function shellRadius(nodes: number, { radiusBase, radiusScale }: Pick<ShellSettings, "radiusBase" | "radiusScale">): number {
  return radiusBase + radiusScale * Math.sqrt(nodes)
}

/** The ids of the nodes that have a way to one of `ids` along the graph's edges, either way round. */
function reaching(graph: Graph, ids: string[]): Set<string> {
  const neighbours = new Map<string, string[]>()
  const neighbour = (from: string, to: string) => {
    if (!neighbours.has(from)) neighbours.set(from, [])
    neighbours.get(from)!.push(to)
  }
  for (const { source, target } of graph.edges) {
    neighbour(source, target)
    neighbour(target, source)
  }
  const reached = new Set(ids.filter((id) => graph.nodes.some((node) => node.id === id)))
  const stack = [...reached]
  while (stack.length > 0) {
    for (const other of neighbours.get(stack.pop()!) ?? []) {
      if (reached.has(other)) continue
      reached.add(other)
      stack.push(other)
    }
  }
  return reached
}

/**
 * Keeps `nodes` inside the ring: one that has gone past it is put back on it, keeping only its
 * motion along it or inwards. For what has no way along its edges to a pinned tag, a node with no
 * edges above all: nothing pulls it back in while every other node pushes it out, and it would
 * drift so far that the view, fitting the whole graph, would draw the rest of it small.
 */
function keepInside(nodes: PlacedNode[], radius: number) {
  return () => {
    for (const node of nodes) {
      const [x, y] = [node.x ?? 0, node.y ?? 0]
      const distance = Math.hypot(x, y)
      if (distance <= radius) continue
      const [dx, dy] = [x / distance, y / distance]
      ;[node.x, node.y] = [dx * radius, dy * radius]
      const [vx, vy] = [node.vx ?? 0, node.vy ?? 0]
      const outward = Math.max(0, vx * dx + vy * dy)
      ;[node.vx, node.vy] = [vx - outward * dx, vy - outward * dy]
    }
  }
}

/**
 * The pseudo-shell, as a force: each pinned tag the graph has starts evenly round the ring, and on
 * every tick is put back on it, keeping only its motion along it, while the pinned tags push each
 * other apart along it, so that they settle evenly spaced. Registered after the centring force, so a
 * tag is on the ring after the graph is moved to the middle.
 */
function pinToShell(nodes: PlacedNode[], { pinnedTags, circumferentialRepulsion }: ShellSettings, radius: number) {
  const pinned = pinnedTags.flatMap((tag) => nodes.find((node) => node.id === tagUrl(tag)) ?? [])
  pinned.forEach((node, i) => {
    const angle = (i * 2 * Math.PI) / pinned.length
    ;[node.x, node.y] = [Math.cos(angle) * radius, Math.sin(angle) * radius]
  })
  const ideal = (2 * Math.PI) / Math.max(pinned.length, 1)

  return () => {
    for (const node of pinned) {
      const [x, y] = [node.x ?? 0, node.y ?? 0]
      const distance = Math.hypot(x, y)
      // At the very middle, a tag has no way out to the ring but a direction of its own.
      const [dx, dy] = distance > 0.01 ? [x / distance, y / distance] : [1, 0]
      ;[node.x, node.y] = [dx * radius, dy * radius]
      const [vx, vy] = [node.vx ?? 0, node.vy ?? 0]
      const outward = vx * dx + vy * dy
      ;[node.vx, node.vy] = [vx - outward * dx, vy - outward * dy]
    }
    // Two tags nearer than the ideal angle apart push each other along the ring, by the inverse
    // square of how near, with no cut-off, so that they settle smoothly.
    for (let i = 0; i < pinned.length; i++) {
      for (let j = i + 1; j < pinned.length; j++) {
        const [a, b] = [pinned[i]!, pinned[j]!]
        let apart = Math.atan2(b.y ?? 0, b.x ?? 0) - Math.atan2(a.y ?? 0, a.x ?? 0)
        if (apart > Math.PI) apart -= 2 * Math.PI
        if (apart < -Math.PI) apart += 2 * Math.PI
        const ratio = Math.abs(apart) / ideal
        const push = (circumferentialRepulsion / Math.max(ratio * ratio, 0.01)) * (apart > 0 ? -1 : 1)
        // Along the ring at each tag: its position turned a quarter.
        a.vx = (a.vx ?? 0) + (-(a.y ?? 0) / radius) * push
        a.vy = (a.vy ?? 0) + ((a.x ?? 0) / radius) * push
        b.vx = (b.vx ?? 0) - (-(b.y ?? 0) / radius) * push
        b.vy = (b.vy ?? 0) - ((b.x ?? 0) / radius) * push
      }
    }
  }
}
