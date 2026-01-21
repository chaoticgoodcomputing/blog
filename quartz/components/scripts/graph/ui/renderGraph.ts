import { removeAllChildren } from "../../util"
import { FullSlug, SimpleSlug, simplifySlug } from "../../../../util/path"
import { IconService } from "../../../../util/iconService"
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
} from "../adapters/configAdapter"

export async function renderGraph(graph: HTMLElement, fullSlug: FullSlug) {
  let slug = simplifySlug(fullSlug)

  if (fullSlug.startsWith("tags/") && !slug.endsWith("/")) {
    slug = (slug + "/") as SimpleSlug
  }

  const visited = getVisited()
  removeAllChildren(graph)

  // Load TagIndex and preload icons
  const tagIndex = await fetchTagIndex()
  await IconService.preloadIcons(getAllIconsFromTagIndex(tagIndex))

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
  } = parseGraphConfig(graph)

  // Normalize configuration
  const linkDistanceConfig = normalizeLinkDistance(linkDistance)
  const linkStrengthConfig = normalizeLinkStrength(linkStrength)
  const edgeOpacityConfig = normalizeEdgeOpacity(edgeOpacity)
  const baseSizeConfig = normalizeBaseSize(baseSize)
  const sizeScalingConfig = normalizeSizeScaling(sizeScaling)
  const labelAnchorConfig = normalizeLabelAnchor(labelAnchor)

  // Fetch and process data
  const data = await fetchAndTransformData()
  const { links, tags } = buildLinksAndTags(data, tagIndex, showTags, removeTags)
  const validLinks = new Set(data.keys())
  const neighbourhood = calculateNeighborhood(slug, links, validLinks, tags, depth, showTags)
  const nodes = constructGraphNodes(neighbourhood, data)
  const graphData = constructGraphData(nodes, links, neighbourhood)

  const tagFileCountMap = buildGraphCountMap(tags, tagIndex)
  const tagColorMap = buildGraphColorMap(tags, tagIndex)

  // Setup dimensions and simulation
  const width = graph.offsetWidth
  const height = Math.max(graph.offsetHeight, 250)
  const nodeRadius = createNodeRadiusFunction(
    graphData,
    baseSizeConfig,
    sizeScalingConfig,
    tagFileCountMap,
    privatePostSizeMultiplier ?? 1,
  )
  const simulation = setupSimulation(
    graphData,
    nodeRadius,
    { repelForce, centerForce },
    linkDistanceConfig,
    linkStrengthConfig,
    enableRadial ?? false,
    width,
    height,
  )

  // Setup rendering infrastructure
  const computedStyleMap = getComputedStyleMap()
  const color = createColorFunction(slug, visited, computedStyleMap, tagColorMap)
  const tweenManager = new TweenManager()

  const hoverState: HoverState = {
    hoveredNodeId: null,
    hoveredNeighbours: new Set(),
    dragStartTime: 0,
    dragging: false,
  }
  const linkRenderData: LinkRenderData[] = []
  const nodeRenderData: NodeRenderData[] = []
  
  // Shared transform state for zoom/pan
  const transform = { x: 0, y: 0, k: 1 }

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

  tweenManager.clear()

  // Create Canvas2D app
  const app = createCanvasApp(width, height)
  graph.appendChild(app.canvas)

  // Create all nodes
  for (const n of graphData.nodes) {
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
  for (const l of graphData.links) {
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
    setupDragBehavior(app.canvas, graphData, hoverState, simulation, transform, renderAll)
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

  // Start animation loop
  return startAnimationLoop(
    nodeRenderData,
    linkRenderData,
    tweenManager,
    app,
    width,
    height,
    linkDistanceConfig,
    edgeOpacityConfig,
    transform,
  )
}
