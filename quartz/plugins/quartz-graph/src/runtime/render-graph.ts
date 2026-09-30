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
import { paintOf, paletteOf } from "./palette"
import { attachPointer } from "./pointer"
import { settingsOf, type Settings } from "./settings"
import { radiusOf, simulationOf, type Positions } from "./simulation"
import type { GraphData, LinkRender, NodeRender, Pages, Sources, Transform } from "./types"

/** Where a graph's nodes are and how it is panned and zoomed, for a graph drawn again to start from. */
export interface Layout {
  positions: Positions
  transform: Transform
}

export interface DrawnGraph {
  /** Resolves every colour again, for the scheme the page shows now. */
  repaint(): void
  /** Where its nodes are now, and its pan and zoom. */
  layout(): Layout | null
  /** Stops drawing, and removes what it added to the page. */
  destroy(): void
}

const NOTHING: DrawnGraph = { repaint() {}, layout: () => null, destroy() {} }

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

/** How the debug panel draws a graph: with its own settings, and the filters it last had. */
export interface Redraw {
  /** Settings in place of the container's: either graph's, as edited, into the global graph's. */
  cfg: ContainerConfig
  /** The filters as the reader last set them, in place of `defaultFilterState`'s. */
  filters?: FilterState
  /** Told of each change to the filters, to pass back as `filters` next time. */
  onFilters?: (state: FilterState) => void
  /**
   * The graph this one replaces, as it was: each node still in the graph starts where it was, and
   * the view keeps its pan and zoom, so a change of settings resettles the graph rather than laying
   * it out anew. Only for the first draw: a filter change after it lays out afresh, as ever.
   */
  from?: Layout
}

/** Draws a graph into `container`, with the settings it carries, or as `redraw` asks. */
export function renderGraph(
  container: HTMLElement,
  slug: string,
  sources: Sources,
  redraw?: Redraw,
): DrawnGraph {
  const cfg: ContainerConfig = redraw?.cfg ?? JSON.parse(container.dataset.cfg ?? "{}")
  const { pages, icons, tags } = sources
  const width = container.offsetWidth
  // Not laid out, as in a sidebar a narrow screen hides: nothing to draw into.
  if (width === 0) return NOTHING
  const height = Math.max(container.offsetHeight, 250)
  const settings = settingsOf(cfg)
  const current = nodeIdOf(slug)
  const visited = visitedPages()

  const { links, tags: tagNodes } = edgesOf(pages, settings)
  const neighbourhood = neighbourhoodOf(current, links, pages, tagNodes, settings)
  const whole = graphDataOf(nodesOf(neighbourhood, pages, settings), links)

  let palette = paletteOf(settings)
  const transform: Transform = { x: 0, y: 0, k: 1 }
  let stop: (() => void) | null = null
  let drawn: GraphData | null = null
  let from = redraw?.from

  const draw = (data: GraphData) => {
    stop?.()
    const view = canvasOf(width, height)
    const radius = radiusOf(data, settings, tagCountsOf(data))
    const seed = from?.positions
    const { simulation, shellRadius } = simulationOf(data, radius, settings, width, height, seed)
    Object.assign(transform, from?.transform ?? { x: 0, y: 0, k: 1 })
    drawn = data
    from = undefined
    // The pseudo-shell fits its ring to the view, unless the view is carried over.
    if (settings.shell && shellRadius !== null && !seed) {
      // Zoom to fit the ring, and its margin, in the shorter side, around the centre.
      const k = Math.min(width, height) / (2 * (shellRadius + settings.shell.zoomMargin))
      Object.assign(transform, { k, x: (width / 2) * (1 - k), y: (height / 2) * (1 - k) })
    }

    // Tags' labels always show, and the current page's does with `labelCurrentPage` (v4 always showed
    // it), even when the current page is a tag's. Other pages' rest at an alpha `scale` and
    // `opacityScale` set, hidden at the defaults, and fade in on hover; zooming doesn't change them,
    // as in v4.
    const resting = Math.max((settings.scale * settings.opacityScale - 1) / 3.75, 0)
    const nodes: NodeRender[] = data.nodes.map((node) => {
      const initialAlpha =
        node.id === current ? (settings.labelCurrentPage ? 1 : resting) : node.isTag ? 1 : resting
      return {
        node,
        radius: radius(node),
        paint: paintOf(node, settings, current, visited, tags),
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
      hops: 0,
      litAt: 0,
      lineStyle: settings.linkStyle[link.type],
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
      icons,
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
    const initial = redraw?.filters ?? initialFilters(settings, whole, pages)
    removeFilters = filterControls(container, initial, (state) => {
      redraw?.onFilters?.(state)
      draw(filtered(whole, pages, state))
    })
    draw(filtered(whole, pages, initial))
  } else {
    draw(whole)
  }

  return {
    repaint() {
      palette = paletteOf(settings)
    },
    layout() {
      if (!drawn) return null
      const positions: Positions = new Map()
      for (const node of drawn.nodes)
        if (node.x != null && node.y != null) positions.set(node.id, { x: node.x, y: node.y })
      return { positions, transform: { ...transform } }
    },
    destroy() {
      stop?.()
      removeFilters?.()
    },
  }
}
