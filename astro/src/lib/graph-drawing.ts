// Drawing a graph (./graph.ts) on a canvas, in the browser: laid out by d3-force (./graph-layout.ts),
// each tag and each note with a tag drawn as its tag bubble, panned and zoomed by d3-zoom, a node
// dragged by d3-drag and followed to its page with a click. Inside the canvas, where only assistive
// technology reads it, a list says what the canvas shows.
//
// What it draws is its caller's: the local graph passes a page's neighbourhood and its settings, the
// global graph the whole graph, filtered, and its own, with a shell and a hover pulse.
//
// A tag bubble is drawn as the page draws one: the caller hands over a `<TagBubble>` the page
// rendered (src/components/TagBubble.astro), and its rim, circle and icon are copied from it, in
// whatever colours the page's scheme gives them now. The canvas can't follow the scheme by itself,
// so `repaint()` copies them again.

import { drag } from "d3-drag"
import { select } from "d3-selection"
import { zoom, zoomIdentity, type ZoomTransform } from "d3-zoom"
import type { GraphSettings } from "../site.config.types.ts"
import { edgeOpacity, labelled, litBy, pulseOpacity, type Graph, type GraphEdge, type Lit } from "./graph.ts"
import { fittedView, labelBox, layOut, LABEL_PAD, type PlacedNode } from "./graph-layout.ts"
import { bubbleParts } from "./tag-bubble.ts"

export interface DrawingOptions {
  graph: Graph
  /** The id of the page's own node, which swells and shrinks. */
  current: string
  settings: GraphSettings
  /** The tag bubble a tag is drawn as: a `.tag-bubble` the page holds. */
  bubble: (tag: string) => HTMLElement | null
  /** Goes to a node's page. */
  follow: (url: string) => void
  /** What the canvas is: its text alternative's name. */
  label: string
  /**
   * PROTOTYPE (stacked notes): the ids of the notes a reader went through, in order, drawn as one
   * line through them over the edges. A step between two nodes with no edge is dashed.
   */
  path?: string[]
}

export interface DrawnGraph {
  /** Takes every colour again from the page, as its colour scheme is now. */
  repaint(): void
  /** Stops drawing, and takes the canvas out of the page. */
  destroy(): void
}

/** A press on a node shorter than this is a click, which follows it; a longer one only drags it. */
const CLICK_MS = 500

/** How long the page's own node takes to swell and shrink once, in milliseconds. */
const SWELL_MS = 2000

/** The room left between the graph and the edge of its box while the view follows it, in CSS pixels. */
const MARGIN = 8

/** How a tag's bubble is painted, copied from the page's. */
interface BubblePaint {
  rim: string
  circle: string
  icon: HTMLImageElement | undefined
}

/** The colours drawn with that are not a tag's, from the palette (src/styles/global.css). */
interface Palette {
  edge: string
  litEdge: string
  label: string
  /** The box behind a label: the page's background. */
  labelBox: string
  /** A note with no tag. */
  disc: string
  /** The page's own note, with no tag. */
  currentDisc: string
  font: string
}

/** A colour as the browser resolves it at `element`, for the scheme the page is in now. */
function resolve(element: Element, colour: string): string {
  const probe = element.appendChild(document.createElement("span"))
  probe.style.color = colour
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved
}

/** An icon as an image, painted in `colour`, the SVG the page drew it with. */
function iconImage(svg: SVGSVGElement, colour: string): HTMLImageElement {
  const copy = svg.cloneNode(true) as SVGSVGElement
  copy.setAttribute("color", colour)
  copy.setAttribute("fill", "currentColor")
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`
  return image
}

/** The width of the outline round a label's box, in the label's colour, in the graph's pixels. */
const LABEL_OUTLINE = 0.5

/** How opaque a node is drawn while another is hovered that doesn't light it. */
const UNLIT = 0.2

// What a node's edges of each kind are, as its text alternative names them: the notes a note links
// to, the tags it carries, the tags under a tag.
const EDGES_NAMED: Record<GraphEdge["kind"], (label: string) => string> = {
  noteNote: (label) => `${label} links to`,
  tagNote: (label) => `${label} is tagged`,
  tagTag: (label) => `Tags under ${label}`,
}

/**
 * The list inside the canvas of every node it draws, each with the nodes it has an edge to, a list
 * for each kind of edge.
 */
function describe(canvas: HTMLCanvasElement, graph: Graph, current: string, label: string) {
  canvas.setAttribute("aria-label", label)
  const list = document.createElement("ul")
  for (const node of graph.nodes) {
    const item = list.appendChild(document.createElement("li"))
    item.dataset.node = node.id
    // Out of the tab order: nothing shows a sighted reader where it is.
    const link = item.appendChild(document.createElement("a"))
    link.href = node.id
    link.tabIndex = -1
    link.textContent = node.label
    if (node.id === current) link.setAttribute("aria-current", "page")
    if (node.private) item.append(" (private page)")
    for (const [kind, named] of Object.entries(EDGES_NAMED) as [GraphEdge["kind"], (label: string) => string][]) {
      const targets = graph.edges.filter((edge) => edge.source === node.id && edge.kind === kind)
      if (targets.length === 0) continue
      const edges = item.appendChild(document.createElement("ul"))
      edges.setAttribute("aria-label", named(node.label))
      for (const edge of targets) {
        const target = edges.appendChild(document.createElement("li"))
        target.dataset.node = edge.target
        target.textContent = graph.nodes.find((each) => each.id === edge.target)?.label ?? edge.target
      }
    }
  }
  canvas.replaceChildren(list)
}

/** Draws a graph into `container`, filling it, until destroyed. */
export function drawGraph(container: HTMLElement, options: DrawingOptions): DrawnGraph {
  const { graph, current, settings } = options
  const canvas = document.createElement("canvas")
  describe(canvas, graph, current, options.label)
  container.append(canvas)
  const context = canvas.getContext("2d")!
  // d3-force's own timer is stopped: the frames tick the layout while it is warm. Its tags' labels
  // take the room the canvas measures them at.
  context.font = `${settings.sizes.label}px ${getComputedStyle(container).fontFamily}`
  const { simulation, nodes, edges, radius, shell, linkDistance, turnShell } = layOut(graph, settings, (label) => context.measureText(label).width)
  let [width, height] = [0, 0]
  const fit = () => {
    const dpr = window.devicePixelRatio || 1
    ;[width, height] = [container.clientWidth, container.clientHeight]
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
  }
  fit()
  const resized = new ResizeObserver(fit)
  resized.observe(container)

  // The colours, copied from the page, and again on `repaint()`.
  let palette: Palette
  const bubbles = new Map<string, BubblePaint>()
  const paint = () => {
    palette = {
      edge: resolve(container, "var(--lightgray)"),
      litEdge: resolve(container, "var(--gray)"),
      label: resolve(container, "var(--dark)"),
      labelBox: resolve(container, "var(--light)"),
      disc: resolve(container, "var(--gray)"),
      currentDisc: resolve(container, "var(--secondary)"),
      font: getComputedStyle(container).fontFamily,
    }
    bubbles.clear()
    for (const node of graph.nodes) {
      const bubble = node.tag === undefined ? null : options.bubble(node.tag)
      if (!bubble || bubbles.has(node.tag!)) continue
      const style = getComputedStyle(bubble)
      const svg = bubble.querySelector("svg")
      bubbles.set(node.tag!, {
        rim: style.borderTopColor,
        circle: style.backgroundColor,
        icon: svg ? iconImage(svg, style.color) : undefined,
      })
    }
  }
  paint()

  // Panned and zoomed: where a point of the graph is drawn, its middle at the canvas's.
  let view: ZoomTransform = zoomIdentity
  const toGraph = (x: number, y: number): [number, number] => {
    const [gx, gy] = view.invert([x, y])
    return [gx - width / 2, gy - height / 2]
  }
  // The node at a point: one whose label shows there, the label drawn last if two do, since labels
  // are drawn over every node; else the nearest whose circle it is in.
  const nodeAt = (x: number, y: number): PlacedNode | undefined => {
    const [gx, gy] = toGraph(x, y)
    for (const node of nodes.toReversed()) {
      if (!labelled(node, hovered?.id, lit)) continue
      const width = context.measureText(node.label).width
      const box = labelBox(node.x ?? 0, node.y ?? 0, radius.get(node.id) ?? 0, width, settings.sizes.label)
      if (gx >= box.left && gx <= box.right && gy >= box.top && gy <= box.bottom) return node
    }
    let found: PlacedNode | undefined
    let nearest = Infinity
    for (const node of nodes) {
      const distance = Math.hypot(gx - (node.x ?? 0), gy - (node.y ?? 0))
      if (distance < (radius.get(node.id) ?? 0) && distance < nearest) [found, nearest] = [node, distance]
    }
    return found
  }

  // The node under the pointer, and what it lights, marked in the text alternative as the drawing
  // lights them up: the node `data-hovered`, and it and every node it lights `data-lit`.
  let hovered: PlacedNode | undefined
  let lit: Lit = { nodes: new Set(), edges: new Map() }
  // When it was hovered, which its edges' pulse runs from.
  let litAt = 0
  // A node's own item, not an item that lists an edge to it.
  const itemOf = (id: string) => canvas.querySelector(`:scope > ul > li[data-node="${CSS.escape(id)}"]`)
  const hover = (node: PlacedNode | undefined) => {
    if (node === hovered) return
    canvas.querySelector("li[data-hovered]")?.removeAttribute("data-hovered")
    canvas.querySelectorAll("li[data-lit]").forEach((item) => item.removeAttribute("data-lit"))
    hovered = node
    lit = node ? litBy(graph, node.id) : { nodes: new Set(), edges: new Map() }
    litAt = performance.now()
    if (node) itemOf(node.id)?.setAttribute("data-hovered", "")
    for (const id of lit.nodes) itemOf(id)?.setAttribute("data-lit", "")
    canvas.style.cursor = node ? "pointer" : ""
  }
  // How many hops down a hovered tag's subtags each edge is lit, by its place in the graph's edges.
  const hopsOf = (index: number) => lit.edges.get(graph.edges[index]!)
  const point = (event: { clientX: number; clientY: number }): [number, number] => {
    const box = canvas.getBoundingClientRect()
    return [event.clientX - box.left, event.clientY - box.top]
  }
  canvas.addEventListener("mousemove", (event) => hover(nodeAt(...point(event))))
  canvas.addEventListener("mouseleave", () => hover(undefined))

  // Until the reader pans, zooms or drags a node, the view follows the graph as it settles, so that
  // the whole of it is in the box, and never drawn larger than it is.
  let following = true
  const zoomer = zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([0.25, 4])
    .on("zoom", (event) => {
      view = event.transform
      if (event.sourceEvent) following = false
    })
  // What is fitted is the graph at rest, with its tags' labels, so the view doesn't move on a hover:
  // the page's own node as large as it swells.
  const fitted = (): ZoomTransform => {
    const placed = nodes.map((node) => ({
      x: node.x ?? 0,
      y: node.y ?? 0,
      r: (radius.get(node.id) ?? 0) * (node.id === current ? settings.sizes.current : 1),
      labelWidth: node.kind === "tag" ? context.measureText(node.label).width : undefined,
    }))
    const ring = shell === undefined || !settings.shell ? undefined : { radius: shell, margin: settings.shell.zoomMargin }
    const { k, x, y } = fittedView(placed, { width, height, margin: MARGIN }, settings, ring)
    return zoomIdentity.translate(x, y).scale(k)
  }

  const selection = select(canvas)
  let pressed = 0
  selection.call(
    drag<HTMLCanvasElement, unknown, PlacedNode | undefined>()
      // A press on a node drags it; anywhere else, the zoom pans. A pinned tag stays on the shell,
      // and dragging one turns the shell, every pinned tag with it.
      .subject((event) => nodeAt(...point(event.sourceEvent.touches?.[0] ?? event.sourceEvent)))
      .on("start", (event) => {
        const node = event.subject!
        if (!event.active) simulation.alphaTarget(0.3)
        if (!turnShell(node, node.x ?? 0, node.y ?? 0)) [node.fx, node.fy] = [node.x, node.y]
        pressed = performance.now()
        following = false
        hover(node)
      })
      .on("drag", (event) => {
        const node = event.subject!
        const [x, y] = toGraph(...point(event.sourceEvent.touches?.[0] ?? event.sourceEvent))
        if (!turnShell(node, x, y)) [node.fx, node.fy] = [x, y]
      })
      .on("end", (event) => {
        const node = event.subject!
        if (!event.active) simulation.alphaTarget(0)
        if (!turnShell(node, node.x ?? 0, node.y ?? 0)) [node.fx, node.fy] = [null, null]
        if (performance.now() - pressed < CLICK_MS) options.follow(node.id)
      }),
  )
  selection.call(zoomer)

  const still = window.matchMedia("(prefers-reduced-motion: reduce)")
  let frame = requestAnimationFrame(function draw(time) {
    if (simulation.alpha() >= simulation.alphaMin() || simulation.alphaTarget() > 0) simulation.tick()
    context.font = `${settings.sizes.label}px ${palette.font}`
    if (following) selection.call(zoomer.transform, fitted())
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    const dpr = canvas.width / Math.max(width, 1)
    context.setTransform(dpr * view.k, 0, 0, dpr * view.k, dpr * view.x, dpr * view.y)
    context.translate(width / 2, height / 2)

    if (shell !== undefined && settings.shell) {
      const { opacity, lineStyle, lineWidth } = settings.shell.style
      context.globalAlpha = opacity
      context.strokeStyle = palette.edge
      context.lineWidth = lineWidth
      context.setLineDash(lineStyle === "dotted" ? [5, 5] : [])
      context.beginPath()
      context.arc(0, 0, shell, 0, 2 * Math.PI)
      context.stroke()
    }

    edges.forEach((edge, index) => {
      const { source, target, kind } = edge
      const length = Math.hypot((target.x ?? 0) - (source.x ?? 0), (target.y ?? 0) - (source.y ?? 0))
      // While a node is hovered, the edges it lights are lit, pulsing if the graph's do and the
      // reader allows motion, and every other is put out.
      const hops = hopsOf(index)
      context.globalAlpha = !hovered
        ? edgeOpacity(length, linkDistance[kind], settings.edges.opacity[kind])
        : hops === undefined
          ? 0
          : settings.hoverPulse && !still.matches
            ? pulseOpacity(time - litAt, hops, settings.hoverPulse)
            : 1
      if (context.globalAlpha === 0) return
      context.strokeStyle = hops !== undefined ? palette.litEdge : palette.edge
      context.lineWidth = 2
      context.setLineDash(settings.edges.style[kind] === "dotted" ? [2, 2] : [])
      context.beginPath()
      context.moveTo(source.x ?? 0, source.y ?? 0)
      context.lineTo(target.x ?? 0, target.y ?? 0)
      context.stroke()
    })
    context.setLineDash([])

    // PROTOTYPE (stacked notes): the reader's path, over the edges and under the nodes.
    if (options.path && options.path.length > 1) {
      const placed = new Map(nodes.map((node) => [node.id, node]))
      const linked = (a: string, b: string) =>
        graph.edges.some((edge) => (edge.source === a && edge.target === b) || (edge.source === b && edge.target === a))
      context.globalAlpha = hovered ? 0.35 : 1
      context.strokeStyle = palette.currentDisc
      context.lineWidth = 4
      context.lineCap = "round"
      for (let i = 1; i < options.path.length; i++) {
        const [from, to] = [placed.get(options.path[i - 1]!), placed.get(options.path[i]!)]
        if (!from || !to) continue
        context.setLineDash(linked(from.id, to.id) ? [] : [2, 8])
        context.beginPath()
        context.moveTo(from.x ?? 0, from.y ?? 0)
        context.lineTo(to.x ?? 0, to.y ?? 0)
        context.stroke()
      }
      context.setLineDash([])
      context.lineCap = "butt"
    }

    for (const node of nodes) {
      const [x, y] = [node.x ?? 0, node.y ?? 0]
      // While a node is hovered, what it doesn't light is faded.
      context.globalAlpha = hovered && !lit.nodes.has(node.id) ? UNLIT : 1
      let r = radius.get(node.id) ?? 0
      if (node.id === current && !still.matches) {
        r *= 1 + ((1 - Math.cos(((time % SWELL_MS) / SWELL_MS) * 2 * Math.PI)) / 2) * (settings.sizes.current - 1)
      }
      const bubble = node.tag === undefined ? undefined : bubbles.get(node.tag)
      context.beginPath()
      context.arc(x, y, r, 0, 2 * Math.PI)
      if (!bubble) {
        // A note with no tag, or a tag the page drew no bubble for: a disc.
        context.fillStyle = node.id === current ? palette.currentDisc : palette.disc
        context.fill()
        continue
      }
      context.fillStyle = bubble.circle
      context.fill()
      // A badge's bubble at this node's size (src/lib/tag-bubble.ts).
      const parts = bubbleParts(2 * r)
      const rim = Math.max(1, parts.rim)
      context.beginPath()
      context.arc(x, y, r - rim / 2, 0, 2 * Math.PI)
      context.strokeStyle = bubble.rim
      context.lineWidth = rim
      context.stroke()
      if (bubble.icon?.complete && bubble.icon.naturalWidth > 0) {
        const size = parts.icon
        context.drawImage(bubble.icon, x - size / 2, y - size / 2, size, size)
      }
    }

    // A tag's label always shows; while a node is hovered, its own and the lit tags' (`labelled`).
    // Each on a box of the page's background, over every node and edge, and over the labels before it.
    context.globalAlpha = 1
    context.textAlign = "center"
    context.textBaseline = "top"
    const size = settings.sizes.label
    const pad = size * LABEL_PAD
    for (const node of nodes) {
      if (!labelled(node, hovered?.id, lit)) continue
      const [x, y, r] = [node.x ?? 0, node.y ?? 0, radius.get(node.id) ?? 0]
      const box = labelBox(x, y, r, context.measureText(node.label).width, size)
      context.fillStyle = palette.labelBox
      context.beginPath()
      context.roundRect(box.left, box.top, box.right - box.left, box.bottom - box.top, pad)
      context.fill()
      context.strokeStyle = palette.label
      context.lineWidth = LABEL_OUTLINE
      context.stroke()
      context.fillStyle = palette.label
      context.fillText(node.label, x, y + r + 2)
    }
    frame = requestAnimationFrame(draw)
  })

  return {
    repaint: paint,
    destroy() {
      cancelAnimationFrame(frame)
      simulation.stop()
      resized.disconnect()
      selection.on(".drag", null).on(".zoom", null)
      canvas.remove()
    },
  }
}
