import { removeAllChildren } from "../../util"
import { FullSlug, SimpleSlug, simplifySlug } from "../../../../util/path"
import { IconService } from "../../../../util/iconService"
import type { Simulation } from "d3"
import {
  buildLinksAndTags,
  fetchTagIndex,
  buildGraphColorMap,
  buildGraphCountMap,
  getAllIconsFromTagIndex,
  calculateNeighborhood,
  constructGraphData,
  constructGraphNodes,
  createNodeRadiusFunction,
  fetchAndTransformData,
  parseGraphConfig,
  setupSimulation,
  HoverState,
  TweenManager,
  NodeData,
} from "../core"
import { getVisited } from "../adapters/visited"
import { LinkRenderData, NodeRenderData } from "../core/renderTypes"
import { createCanvasApp } from "./canvasSetup"
import { getComputedStyleMap, createColorFunction } from "./styles"
import { createNode, createLink } from "./nodeFactory"
import { updateRenderData, startAnimationLoop } from "./rendering"
import { setupDragBehavior, setupClickBehavior, setupZoomBehavior, setupHoverBehavior } from "../adapters/d3Behaviors"
import {
  normalizeLinkDistance,
  normalizeLinkStrength,
  normalizeEdgeOpacity,
  normalizeBaseSize,
  normalizeSizeScaling,
  normalizeLabelAnchor,
  normalizeTagColorGradient,
  normalizePseudoShellConfig,
} from "../adapters/configAdapter"
import { createFilterControls, FilterState } from "./filters"
import { filterGraphData } from "./filterLogic"

export async function renderGraph(graph: HTMLElement, fullSlug: FullSlug) {
  let slug = simplifySlug(fullSlug)

  if (fullSlug.startsWith("tags/") && !slug.endsWith("/")) {
    slug = (slug + "/") as SimpleSlug
  }

  const visited = getVisited()
  removeAllChildren(graph)

  // Detect if this is a global graph (inside .global-graph-container)
  const isGlobalGraph = graph.classList.contains("global-graph-container")

  // Load TagIndex and preload icons
  const tagIndex = await fetchTagIndex()
  await IconService.preloadIcons(getAllIconsFromTagIndex(tagIndex))

  const graphConfig = parseGraphConfig(graph)
  const {
    drag: enableDrag,
    zoom: enableZoom,
    depth,
    scale,
    repelForce,
    centerForce,
    linkDistance,
    fontSize,
    opacityScale,
    removeTags,
    showTags,
    focusOnHover,
    enableRadial,
    linkStrength,
    tagColorGradient,
    edgeOpacity,
    baseSize,
    sizeScaling,
    labelAnchor,
    nodeColors,
    linkStyle,
    privatePostSizeMultiplier,
    graphStyle,
    pseudoShellConfig,
  } = graphConfig

  // Normalize configuration
  const linkDistanceConfig = normalizeLinkDistance(linkDistance)
  const linkStrengthConfig = normalizeLinkStrength(linkStrength)
  const edgeOpacityConfig = normalizeEdgeOpacity(edgeOpacity)
  const baseSizeConfig = normalizeBaseSize(baseSize)
  const sizeScalingConfig = normalizeSizeScaling(sizeScaling)
  const labelAnchorConfig = normalizeLabelAnchor(labelAnchor)
  
  // Setup dimensions and rendering infrastructure first (needed for shell config)
  const width = graph.offsetWidth
  const height = Math.max(graph.offsetHeight, 250)
  const computedStyleMap = getComputedStyleMap()
  const normalizedPseudoShellConfig = normalizePseudoShellConfig(pseudoShellConfig, computedStyleMap)

  // Fetch and process data
  const data = await fetchAndTransformData()
  const { links, tags } = buildLinksAndTags(data, tagIndex, showTags, removeTags)
  const validLinks = new Set(data.keys())
  const neighbourhood = calculateNeighborhood(slug, links, validLinks, tags, depth, showTags)
  const nodes = constructGraphNodes(neighbourhood, data)
  let graphData = constructGraphData(nodes, links, neighbourhood)

  // Store original graph data for filtering (only for global graphs)
  const originalGraphData = isGlobalGraph ? { nodes: [...graphData.nodes], links: [...graphData.links] } : null

  const tagFileCountMap = buildGraphCountMap(tags, tagIndex)
  const tagColorMap = buildGraphColorMap(tags, tagIndex)

  // Apply initial filter state for global graphs before first render
  // Note: For global graph, graphConfig IS the globalGraph config (parsed from data-cfg)
  const globalGraphConfig = isGlobalGraph ? graphConfig : null
  if (globalGraphConfig?.defaultFilterState) {
    const defaultState = globalGraphConfig.defaultFilterState
    const initialFilterState: FilterState = {
      timePeriod: defaultState.timePeriod ?? "all",
      includePrivate: defaultState.includePrivate ?? true,
    }
    graphData = filterGraphData(graphData.nodes, graphData.links, data, initialFilterState)
  }

  // Setup rendering infrastructure
  const color = createColorFunction(slug, visited, computedStyleMap, tagColorMap)
  const tweenManager = new TweenManager()

  const hoverState: HoverState = {
    hoveredNodeId: null,
    hoveredNeighbours: new Set(),
    dragStartTime: 0,
    dragging: false,
  }

  // Shared transform state for zoom/pan
  const transform = { x: 0, y: 0, k: 1 }

  let linkRenderData: LinkRenderData[] = []
  let nodeRenderData: NodeRenderData[] = []
  let simulation: Simulation<NodeData, undefined> | null = null
  let currentAnimationCleanup: (() => void) | null = null
  let currentCanvas: HTMLCanvasElement | null = null
  let shellRadius: number | undefined = undefined

  // Function to completely tear down and rebuild the graph
  const rebuildGraph = async (currentGraphData: typeof graphData, resetTransform: boolean = false) => {
    // Reset transform if requested (e.g., when filters change)
    if (resetTransform) {
      transform.x = 0
      transform.y = 0
      transform.k = 1
    }
    
    // Stop and cleanup previous animation loop
    if (currentAnimationCleanup) {
      currentAnimationCleanup()
      currentAnimationCleanup = null
    }

    // Stop and clear previous simulation
    if (simulation) {
      simulation.stop()
      simulation = null
    }

    // Remove old canvas
    if (currentCanvas) {
      currentCanvas.remove()
      currentCanvas = null
    }

    // Clear render data
    tweenManager.clear()
    linkRenderData = []
    nodeRenderData = []

    // Create new Canvas2D app
    const app = createCanvasApp(width, height)
    graph.appendChild(app.canvas)
    currentCanvas = app.canvas

    const nodeRadius = createNodeRadiusFunction(
      currentGraphData,
      baseSizeConfig,
      sizeScalingConfig,
      tagFileCountMap,
      privatePostSizeMultiplier ?? 1,
    )

    const setupResult = setupSimulation(
      currentGraphData,
      nodeRadius,
      { repelForce, centerForce },
      linkDistanceConfig,
      linkStrengthConfig,
      enableRadial ?? false,
      width,
      height,
      graphStyle,
      normalizedPseudoShellConfig,
    )
    
    simulation = setupResult.simulation
    shellRadius = setupResult.shellRadius

    const renderAll = () => {
      updateRenderData(
        tweenManager,
        linkRenderData,
        nodeRenderData,
        hoverState.hoveredNodeId,
        computedStyleMap,
        scale,
        focusOnHover ?? false,
      )
    }

    // Create all nodes
    for (const n of currentGraphData.nodes) {
      const result = await createNode(
        {
          node: n,
          nodeRadius,
          color,
          computedStyleMap,
          scale,
          opacityScale,
          fontSize,
          slug,
          labelAnchorConfig,
          tagIndex,
          nodeColorsConfig: nodeColors,
        },
        hoverState,
        linkRenderData,
        nodeRenderData,
        renderAll,
      )
      nodeRenderData.push(result.nodeRenderData)
    }

    // Create all links
    for (const l of currentGraphData.links) {
      const linkRenderDatum = createLink(l, computedStyleMap, linkStyle)
      linkRenderData.push(linkRenderDatum)
    }

    // Setup hover behavior (always active for hover effects)
    setupHoverBehavior(
      app.canvas,
      nodeRenderData,
      linkRenderData,
      hoverState,
      width,
      height,
      transform,
      renderAll,
    )

    // Setup interactions
    if (enableDrag) {
      setupDragBehavior(
        app.canvas,
        currentGraphData,
        hoverState,
        simulation,
        transform,
        renderAll,
        width,
        height,
        nodeRenderData,
      )
    } else {
      setupClickBehavior(app.canvas, nodeRenderData, width, height, transform)
    }

    if (enableZoom) {
      setupZoomBehavior(
        app.canvas,
        width,
        height,
        opacityScale,
        nodeRenderData,
        slug,
        transform,
      )
    }

    // Start animation loop with the current render data
    currentAnimationCleanup = startAnimationLoop(
      nodeRenderData,
      linkRenderData,
      tweenManager,
      app,
      width,
      height,
      linkDistanceConfig,
      edgeOpacityConfig,
      transform,
      graphStyle,
      shellRadius,
      normalizedPseudoShellConfig,
    )
    
    // Force an initial render
    renderAll()
  }

  // Initial render
  await rebuildGraph(graphData)

  // Setup filter controls for global graphs
  let filterCleanup: (() => void) | null = null
  if (isGlobalGraph && originalGraphData) {
    const handleFilterChange = async (filterState: FilterState) => {
      // Apply filtering to the original graph data
      const filtered = filterGraphData(
        originalGraphData.nodes,
        originalGraphData.links,
        data,
        filterState,
      )
      graphData = filtered
      // Reset transform when filter changes to recenter the graph
      await rebuildGraph(graphData, true)
    }

    const filterControls = createFilterControls(graph, handleFilterChange, globalGraphConfig?.defaultFilterState)
    filterCleanup = filterControls.cleanup
  }

  // Return combined cleanup function
  return () => {
    if (currentAnimationCleanup) {
      currentAnimationCleanup()
    }
    if (filterCleanup) {
      filterCleanup()
    }
    if (simulation) {
      simulation.stop()
    }
  }
}
