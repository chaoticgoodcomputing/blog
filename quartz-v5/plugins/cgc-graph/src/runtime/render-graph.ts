// One graph, drawn into its container: the local graph, or the global graph with its filters (v4
// ui/renderGraph.ts). A filter change draws the graph afresh on a new canvas, as v4's did.
import type { ContainerConfig } from "../options"
import { describe } from "./alternative"
import { animate, canvasOf, fadeForHover, Tweens, type Scene } from "./draw"
import { filterControls } from "./filters"
import {
  adaptivePeriod,
  edgesOf,
  filtered,
  graphDataOf,
  neighbourhoodOf,
  nodesOf,
  tagCountsOf,
  type FilterState,
} from "./graph-data"
import type { HoverState } from "./hover"
import { nodeIdOf, visitedPages } from "./pages"
import { nodeColourOf, paletteOf } from "./palette"
import { attachPointer } from "./pointer"
import { settingsOf, type Settings } from "./settings"
import { edgeKind, radiusOf, simulationOf } from "./simulation"
import type { GraphData, LinkRender, NodeRender, Pages, Transform } from "./types"

export interface DrawnGraph {
  /** Resolves every colour again, for the scheme the page shows now. */
  repaint(): void
  /** Stops drawing, and removes what it added to the page. */
  destroy(): void
}

const NOTHING: DrawnGraph = { repaint() {}, destroy() {} }

// The global graph's filters as it opens: the site's `defaultFilterState`, where an adaptive period
// settles on the narrowest one that holds enough pages.
function initialFilters(settings: Settings, data: GraphData, pages: Pages): FilterState {
  const defaults = settings.defaultFilterState ?? {}
  const includePrivate = defaults.includePrivate ?? true
  const timePeriod = defaults.adaptiveTimePeriod
    ? adaptivePeriod(data, pages, defaults.adaptiveTimePeriod, includePrivate)
    : (defaults.timePeriod ?? "all")
  return { timePeriod, includePrivate }
}

export function renderGraph(container: HTMLElement, slug: string, pages: Pages): DrawnGraph {
  const width = container.offsetWidth
  // Not laid out, as in a sidebar a narrow screen hides: nothing to draw into.
  if (width === 0) return NOTHING
  const height = Math.max(container.offsetHeight, 250)
  const settings = settingsOf(JSON.parse(container.dataset.cfg ?? "{}") as ContainerConfig)
  const current = nodeIdOf(slug)
  const visited = visitedPages()

  const { links, tags } = edgesOf(pages, settings)
  const neighbourhood = neighbourhoodOf(current, links, pages, tags, settings)
  const whole = graphDataOf(nodesOf(neighbourhood, pages, settings), links)

  let palette = paletteOf(settings)
  const transform: Transform = { x: 0, y: 0, k: 1 }
  let stop: (() => void) | null = null

  const draw = (data: GraphData) => {
    stop?.()
    const view = canvasOf(width, height)
    const radius = radiusOf(data, settings, tagCountsOf(data))
    const { simulation, shellRadius } = simulationOf(data, radius, settings, width, height)
    Object.assign(transform, { x: 0, y: 0, k: 1 })
    if (settings.shell && shellRadius !== null) {
      // Zoom to fit the ring, and its margin, in the shorter side, around the centre.
      const k = Math.min(width, height) / (2 * (shellRadius + settings.shell.zoomMargin))
      Object.assign(transform, { k, x: (width / 2) * (1 - k), y: (height / 2) * (1 - k) })
    }

    // Tags' and the current page's labels always show. Other pages' rest at an alpha `scale` and
    // `opacityScale` set, hidden at the defaults, and fade in on hover; zooming doesn't change them,
    // as in v4.
    const resting = Math.max((settings.scale * settings.opacityScale - 1) / 3.75, 0)
    const nodes: NodeRender[] = data.nodes.map((node) => {
      const initialAlpha = node.tag || node.id === current ? 1 : resting
      return {
        node,
        radius: radius(node),
        colour: nodeColourOf(node, settings, current, visited),
        alpha: 1,
        active: false,
        label: {
          text: node.text,
          alpha: initialAlpha,
          initialAlpha,
          scale: 1 / settings.scale,
          fontSize: settings.fontSize * 15,
        },
      }
    })
    const edges: LinkRender[] = data.links.map((link) => ({
      link,
      alpha: 1,
      active: false,
      lineStyle: settings.linkStyle[edgeKind(link.type)],
    }))
    const scene: Scene = {
      canvas: view,
      simulation,
      nodes,
      links: edges,
      tweens: new Tweens(),
      transform,
      settings,
      palette: () => palette,
      current,
      shellRadius,
    }
    const state: HoverState = { hovered: null, dragStartTime: 0, dragging: false }

    describe(view.canvas, data, current, settings.global)
    container.append(view.canvas)
    attachPointer(scene, state)
    fadeForHover(scene.tweens, edges, nodes, null, settings)
    const stopAnimating = animate(scene)
    stop = () => {
      stopAnimating()
      simulation.stop()
      scene.tweens.clear()
      view.canvas.remove()
    }
  }

  let removeFilters: (() => void) | null = null
  if (settings.global) {
    const initial = initialFilters(settings, whole, pages)
    removeFilters = filterControls(container, initial, (state) =>
      draw(filtered(whole, pages, state)),
    )
    draw(filtered(whole, pages, initial))
  } else {
    draw(whole)
  }

  return {
    repaint() {
      palette = paletteOf(settings)
    },
    destroy() {
      stop?.()
      removeFilters?.()
    },
  }
}
