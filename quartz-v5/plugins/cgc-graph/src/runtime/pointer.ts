// The pointer on a graph: hovering, dragging and following nodes, panning and zooming (v4
// adapters/d3Behaviors.ts). A click on a node follows it through Quartz's SPA router, as v4's did.
// While the pointer is over a node, its item in the text alternative is marked `data-hovered`
// (docs/adr/0002); the canvas draws its label, as v4's did, with no browser tooltip.
import { drag } from "d3-drag"
import { select } from "d3-selection"
import { zoom, zoomIdentity } from "d3-zoom"
import { fadeForHover, type Scene } from "./draw"
import { hover, type HoverState } from "./hover"
import type { NodeData, NodeRender } from "./types"

declare global {
  interface Window {
    spaNavigate?: (url: URL, isBack?: boolean) => void
    posthog?: { capture?: (event: string, properties: Record<string, unknown>) => void }
  }
}

/** A press shorter than this, on a node, is a click that follows it; a longer one only drags it. */
const CLICK_MS = 500

/**
 * Follows a node to its page. Where the site loads PostHog, it also tells PostHog the navigation came
 * from the graph, with v4's labels, as cgc-posthog does for links. A site without PostHog sends nothing.
 */
export function follow(node: NodeData, source: "graph-click" | "graph-drag-click") {
  const url = new URL(node.href, window.location.toString())
  window.posthog?.capture?.("navigation", {
    source,
    from_page: window.location.pathname,
    to_page: url.pathname,
    url: url.toString(),
    node_type: node.isTag ? "tag" : "page",
  })
  if (window.spaNavigate) window.spaNavigate(url)
  else window.location.assign(url)
}

export function attachPointer(scene: Scene, state: HoverState) {
  const { canvas: view, nodes, links, transform, settings, simulation } = scene
  const { canvas, width, height } = view

  // The node under a point in the canvas, in CSS pixels: the nearest one whose circle holds it.
  const nodeAt = (x: number, y: number): NodeRender | null => {
    const gx = (x - transform.x) / transform.k - width / 2
    const gy = (y - transform.y) / transform.k - height / 2
    let found: NodeRender | null = null
    let nearest = Infinity
    for (const node of nodes) {
      if (node.node.x == null || node.node.y == null) continue
      const distance = Math.hypot(gx - node.node.x, gy - node.node.y)
      if (distance < node.radius && distance < nearest) [found, nearest] = [node, distance]
    }
    return found
  }
  const pointOf = (event: { clientX: number; clientY: number }) => {
    const rect = canvas.getBoundingClientRect()
    return [event.clientX - rect.left, event.clientY - rect.top] as const
  }
  // The text alternative's items, by node id, for marking the one under the pointer.
  const items = new Map<string, HTMLElement>()
  for (const item of canvas.querySelectorAll<HTMLElement>(".cgc-graph__node"))
    items.set(item.dataset.node!, item)
  let marked: HTMLElement | undefined
  const show = (node: NodeRender | null) => {
    hover(state, links, nodes, node)
    canvas.style.cursor = node ? "pointer" : "default"
    marked?.removeAttribute("data-hovered")
    marked = node ? items.get(node.node.id) : undefined
    marked?.setAttribute("data-hovered", "")
    if (!state.dragging) fadeForHover(scene.tweens, links, nodes, state.hovered, settings)
  }

  canvas.addEventListener("mousemove", (event) => {
    const node = nodeAt(...pointOf(event))
    if ((node?.node.id ?? null) !== state.hovered) show(node)
  })
  canvas.addEventListener("mouseleave", () => {
    if (state.hovered !== null) show(null)
  })

  if (settings.drag) {
    select<HTMLCanvasElement, unknown>(canvas).call(
      drag<HTMLCanvasElement, unknown, NodeRender | undefined>()
        .container(() => canvas)
        // Only a press on a node drags; anywhere else, the zoom pans.
        .subject((event) => {
          const source = event.sourceEvent as MouseEvent & TouchEvent
          const point = source.touches?.[0] ?? source
          return nodeAt(...pointOf(point)) ?? undefined
        })
        .on("start", (event) => {
          const node = event.subject!.node
          if (!event.active) simulation.alphaTarget(1)
          node.fx = node.x
          node.fy = node.y
          state.dragStartTime = Date.now()
          state.dragging = true
          // Light it and its neighbours while it moves: on a touch screen there is no hover.
          hover(state, links, nodes, event.subject!)
          canvas.style.cursor = "grabbing"
          fadeForHover(scene.tweens, links, nodes, state.hovered, settings)
        })
        .on("drag", (event) => {
          const node = event.subject!.node
          node.fx = (event.x - transform.x) / transform.k - width / 2
          node.fy = (event.y - transform.y) / transform.k - height / 2
        })
        .on("end", (event) => {
          const node = event.subject!.node
          if (!event.active) simulation.alphaTarget(0)
          node.fx = null
          node.fy = null
          state.dragging = false
          show(null)
          if (Date.now() - state.dragStartTime < CLICK_MS) follow(node, "graph-drag-click")
        }),
    )
  } else {
    canvas.addEventListener("click", (event) => {
      const node = nodeAt(...pointOf(event))
      if (node) follow(node.node, "graph-click")
    })
  }

  if (settings.zoom) {
    const zooming = zoom<HTMLCanvasElement, unknown>()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([0.25, 4])
      .on("zoom", ({ transform: t }) => {
        transform.x = t.x
        transform.y = t.y
        transform.k = t.k
      })
    const selection = select<HTMLCanvasElement, unknown>(canvas)
    selection.call(zooming)
    // Start from the transform the graph already has, such as the pseudo-shell's fit.
    selection.call(
      zooming.transform,
      zoomIdentity.translate(transform.x, transform.y).scale(transform.k),
    )
  }
}
