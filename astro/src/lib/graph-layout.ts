// Laying out a graph (./graph.ts): d3-force's simulation, with the site's forces from a graph's
// settings, and for a graph with a shell, the pinned tags held on a ring and what can't reach one
// kept inside it. Knows no browser: src/lib/graph-drawing.ts ticks it a frame at a time, and a test
// ticks it to rest.

import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force"
import type { GraphSettings, NodeSize, PerEdge, ShellSettings } from "../site.config.types.ts"
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
  /** Each kind of edge's length at rest, in CSS pixels: `linkDistance` times the shell's diameter. */
  linkDistance: PerEdge<number>
  /**
   * Turns the shell so that `node`, if it is a pinned tag, is on the ring towards `x` and `y`, every
   * other pinned tag turning with it, evenly spaced still. Whether `node` is a pinned tag.
   */
  turnShell: (node: PlacedNode, x: number, y: number) => boolean
}

/** A graph laid out with `settings`: its nodes and edges, and the simulation that moves them. */
export function layOut(graph: Graph, settings: GraphSettings): Layout {
  const radius = radii(graph, settings.sizes)
  const nodes: PlacedNode[] = graph.nodes.map((node) => ({ ...node }))
  const edges = graph.edges.map((edge) => ({ ...edge })) as unknown as PlacedEdge[]
  const { charge, center, linkStrength } = settings.forces
  const size = shellRadius(nodes.length, settings.shellSize)
  const linkDistance = Object.fromEntries(
    Object.entries(settings.forces.linkDistance).map(([kind, share]) => [kind, share * 2 * size]),
  ) as PerEdge<number>
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
  if (!settings.shell) return { simulation, nodes, edges, radius, shell: undefined, linkDistance, turnShell: () => false }

  const turnShell = pinOnShell(nodes, settings.shell, size)
  const reached = reaching(graph, settings.shell.pinnedTags.map(tagUrl))
  simulation.force("inside", keepInside(nodes.filter((node) => !reached.has(node.id)), size))
  return { simulation, nodes, edges, radius, shell: size, linkDistance, turnShell }
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

/** The shell's radius, for a graph of `nodes` nodes: the ring's, if the graph draws one. */
export function shellRadius(nodes: number, { base, scaling }: NodeSize): number {
  return base + scaling * Math.sqrt(nodes)
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
 * The pseudo-shell: each pinned tag the graph has is fixed on the ring, evenly spaced round it in
 * the order `pinnedTags` names them. d3-force puts a fixed node back at its `fx` and `fy` on every
 * tick, after the other forces, the centring force among them, have moved it. Returns
 * `Layout.turnShell`, which turns them all together.
 */
function pinOnShell(nodes: PlacedNode[], { pinnedTags }: ShellSettings, radius: number) {
  const pinned = pinnedTags.flatMap((tag) => nodes.find((node) => node.id === tagUrl(tag)) ?? [])
  const step = (2 * Math.PI) / Math.max(pinned.length, 1)
  const place = (turn: number) =>
    pinned.forEach((node, i) => {
      const angle = turn + i * step
      ;[node.fx, node.fy] = [Math.cos(angle) * radius, Math.sin(angle) * radius]
      ;[node.x, node.y] = [node.fx, node.fy]
    })
  place(0)
  return (node: PlacedNode, x: number, y: number) => {
    const i = pinned.indexOf(node)
    if (i < 0) return false
    place(Math.atan2(y, x) - i * step)
    return true
  }
}
