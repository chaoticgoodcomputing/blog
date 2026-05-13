import { Simulation, drag, select, zoom, zoomIdentity } from "d3"
import { SimpleSlug } from "../../../../util/path"
import { LinkData, NodeData } from "../core/types"
import { LinkRenderData, NodeRenderData } from "../core/renderTypes"
import { HoverState, updateHoverInfo } from "../core/hoverState"

export function setupDragBehavior(
  canvas: HTMLCanvasElement,
  graphData: { nodes: NodeData[]; links: LinkData[] },
  hoverState: HoverState,
  simulation: Simulation<NodeData, LinkData>,
  transform: { x: number; y: number; k: number },
  renderAll: () => void,
  width: number,
  height: number,
  nodeRenderData: NodeRenderData[],
  linkRenderData: LinkRenderData[],
) {
  // Helper function to find node at coordinates
  const findNodeAtPoint = (x: number, y: number): NodeData | undefined => {
    // Transform coordinates to graph space
    const graphX = (x - transform.x) / transform.k
    const graphY = (y - transform.y) / transform.k
    
    for (const node of nodeRenderData) {
      const nodeX = node.simulationData.x! + width / 2
      const nodeY = node.simulationData.y! + height / 2
      const dx = graphX - nodeX
      const dy = graphY - nodeY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < node.radius) {
        return node.simulationData
      }
    }
    return undefined
  }

  select<HTMLCanvasElement, NodeData | undefined>(canvas).call(
    drag<HTMLCanvasElement, NodeData | undefined>()
      .container(() => canvas)
      .subject(function(event) {
        // For touch events or when hoveredNodeId is not set, find node at event position
        const rect = canvas.getBoundingClientRect()
        const clientX = event.sourceEvent.clientX || event.sourceEvent.touches?.[0]?.clientX
        const clientY = event.sourceEvent.clientY || event.sourceEvent.touches?.[0]?.clientY
        
        if (clientX !== undefined && clientY !== undefined) {
          const x = clientX - rect.left
          const y = clientY - rect.top
          return findNodeAtPoint(x, y)
        }
        
        // Fallback to hover state
        return graphData.nodes.find((n) => n.id === hoverState.hoveredNodeId)
      })
      .on("start", function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(1).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
        event.subject.__initialDragPos = {
          x: event.subject.x,
          y: event.subject.y,
          fx: event.subject.fx,
          fy: event.subject.fy,
        }
        hoverState.dragStartTime = Date.now()
        hoverState.dragging = true
        
        // Highlight the dragged node and its neighbors (mobile-friendly)
        updateHoverInfo(hoverState, linkRenderData, nodeRenderData, event.subject.id)
        canvas.style.cursor = "grabbing"
        renderAll()
      })
      .on("drag", function dragged(event) {
        const initPos = event.subject.__initialDragPos
        event.subject.fx = initPos.x + (event.x - initPos.x) / transform.k
        event.subject.fy = initPos.y + (event.y - initPos.y) / transform.k
      })
      .on("end", function dragended(event) {
        if (!event.active) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
        hoverState.dragging = false
        
        // Clear highlighting when drag ends
        updateHoverInfo(hoverState, linkRenderData, nodeRenderData, null)
        canvas.style.cursor = "default"
        renderAll()

        if (Date.now() - hoverState.dragStartTime < 500) {
          const node = graphData.nodes.find((n) => n.id === event.subject.id) as NodeData
          // node.id already has leading slash for index page ("/"), so don't double up
          const targ = node.id.startsWith("/") ? node.id : "/" + node.id

          // Track graph navigation in PostHog
          if (window.posthog) {
            window.posthog.capture("navigation", {
              source: "graph-drag-click",
              from_page: window.location.pathname,
              to_page: node.external ?? targ,
              node_type: node.external
                ? "external"
                : node.tags && node.tags.length > 0
                  ? "tag"
                  : "page",
            })
          }

          if (node.external) {
            window.open(node.external, "_blank")
          } else {
            window.spaNavigate(new URL(targ, window.location.toString()))
          }
        }
      }),
  )
}

export function setupClickBehavior(
  canvas: HTMLCanvasElement,
  nodeRenderData: NodeRenderData[],
  width: number,
  height: number,
  transform: { x: number; y: number; k: number },
) {
  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    // Transform mouse coordinates to graph space
    const graphX = (mouseX - transform.x) / transform.k
    const graphY = (mouseY - transform.y) / transform.k
    
    // Check if click hit any node
    for (const node of nodeRenderData) {
      const { x, y } = node.simulationData
      if (!x || !y) continue
      
      const nodeX = x + width / 2
      const nodeY = y + height / 2
      const dx = graphX - nodeX
      const dy = graphY - nodeY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < node.radius) {
        // node.id already has leading slash for index page ("/"), so don't double up
        const targ = node.simulationData.id.startsWith("/") ? node.simulationData.id : "/" + node.simulationData.id
        const external = node.simulationData.external

        // Track graph navigation in PostHog
        if (window.posthog) {
          window.posthog.capture("navigation", {
            source: "graph-click",
            from_page: window.location.pathname,
            to_page: external ?? targ,
            node_type: external ? "external" : node.nodeType,
          })
        }

        if (external) {
          window.open(external, "_blank")
        } else {
          window.spaNavigate(new URL(targ, window.location.toString()))
        }
        break
      }
    }
  })
}

export function setupZoomBehavior(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  opacityScale: number,
  nodeRenderData: NodeRenderData[],
  currentPageSlug: SimpleSlug,
  transform: { x: number; y: number; k: number },
) {
  const canvasSelection = select<HTMLCanvasElement, NodeData>(canvas)
  const zoomBehavior = zoom<HTMLCanvasElement, NodeData>()
    .extent([
      [0, 0],
      [width, height],
    ])
    .scaleExtent([0.25, 4])
    .on("zoom", ({ transform: t }) => {
      transform.x = t.x
      transform.y = t.y
      transform.k = t.k
      
      // Removed opacity scaling based on zoom level
    })
  
  // Apply the zoom behavior to the canvas
  canvasSelection.call(zoomBehavior)
  
  // Initialize the zoom behavior with the current transform state
  // This ensures that when rebuilding the graph, the zoom/pan position is preserved
  canvasSelection.call(zoomBehavior.transform, zoomIdentity.translate(transform.x, transform.y).scale(transform.k))
}

export function setupHoverBehavior(
  canvas: HTMLCanvasElement,
  nodeRenderData: NodeRenderData[],
  linkRenderData: LinkRenderData[],
  hoverState: HoverState,
  width: number,
  height: number,
  transform: { x: number; y: number; k: number },
  renderAll: () => void,
) {
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    // Transform mouse coordinates to graph space
    const graphX = (mouseX - transform.x) / transform.k
    const graphY = (mouseY - transform.y) / transform.k
    
    let hoveredNode: string | null = null
    let minDistance = Infinity
    
    // Find closest node within its radius
    for (const node of nodeRenderData) {
      const { x, y } = node.simulationData
      if (!x || !y) continue
      
      const nodeX = x + width / 2
      const nodeY = y + height / 2
      const dx = graphX - nodeX
      const dy = graphY - nodeY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < node.radius && distance < minDistance) {
        hoveredNode = node.simulationData.id
        minDistance = distance
      }
    }
    
    // Update hover state if changed
    if (hoveredNode !== hoverState.hoveredNodeId) {
      hoverState.hoveredNodeId = hoveredNode
      
      // Update active/hover states for nodes and links
      if (hoveredNode) {
        const hoveredNodeData = nodeRenderData.find(n => n.simulationData.id === hoveredNode)
        if (hoveredNodeData) {
          // Calculate neighborhood
          const neighbors = new Set<string>()
          for (const link of linkRenderData) {
            if (link.simulationData.source.id === hoveredNode) {
              neighbors.add(link.simulationData.target.id)
            }
            if (link.simulationData.target.id === hoveredNode) {
              neighbors.add(link.simulationData.source.id)
            }
          }
          hoverState.hoveredNeighbours = neighbors
          
          // Update active states
          for (const node of nodeRenderData) {
            node.active = node.simulationData.id === hoveredNode || neighbors.has(node.simulationData.id)
          }
          for (const link of linkRenderData) {
            link.active = link.simulationData.source.id === hoveredNode || 
                         link.simulationData.target.id === hoveredNode
          }
        }
        canvas.style.cursor = "pointer"
      } else {
        // Clear active states
        for (const node of nodeRenderData) {
          node.active = false
        }
        for (const link of linkRenderData) {
          link.active = false
        }
        hoverState.hoveredNeighbours.clear()
        canvas.style.cursor = "default"
      }
      
      if (!hoverState.dragging) {
        renderAll()
      }
    }
  })
  
  canvas.addEventListener("mouseleave", () => {
    if (hoverState.hoveredNodeId !== null) {
      hoverState.hoveredNodeId = null
      hoverState.hoveredNeighbours.clear()
      
      for (const node of nodeRenderData) {
        node.active = false
      }
      for (const link of linkRenderData) {
        link.active = false
      }
      
      canvas.style.cursor = "default"
      if (!hoverState.dragging) {
        renderAll()
      }
    }
  })
}
