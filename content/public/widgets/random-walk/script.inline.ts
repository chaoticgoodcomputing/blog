/**
 * Client-side script for Random Walk widget.
 *
 * Implements a graph visualization with random walk simulation.
 */

// === Widget Script Helper (inlined to avoid import issues) ===
interface WidgetScriptConfig {
  selector: string
  initialize: (element: HTMLElement) => (() => void) | void
}

function createWidgetScript(config: WidgetScriptConfig) {
  const cleanupHandlers = new WeakMap<HTMLElement, () => void>()
  const elementCleanupKey = "__randomWalkCleanup"

  function cleanupInstance(element: HTMLElement): void {
    const cleanup = cleanupHandlers.get(element)
    if (cleanup) {
      cleanup()
      cleanupHandlers.delete(element)
    }
    if (elementCleanupKey in element) {
      delete (element as unknown as Record<string, unknown>)[elementCleanupKey]
    }
  }

  function initializeAll(): void {
    const elements = document.querySelectorAll<HTMLElement>(config.selector)
    elements.forEach((element) => {
      // Clean up any prior instance registered on the element (even across script reloads)
      const existingCleanup = (element as unknown as Record<string, unknown>)[elementCleanupKey]
      if (typeof existingCleanup === "function") {
        existingCleanup()
        delete (element as unknown as Record<string, unknown>)[elementCleanupKey]
      }
      cleanupInstance(element)
      const cleanup = config.initialize(element)
      if (cleanup) {
        cleanupHandlers.set(element, cleanup)
        ;(element as unknown as Record<string, unknown>)[elementCleanupKey] = cleanup
      }
    })
  }

  return {
    start() {
      document.addEventListener("nav", initializeAll)
      window.addEventListener("load", initializeAll)
      window.addCleanup(() => {
        document.removeEventListener("nav", initializeAll)
        window.removeEventListener("load", initializeAll)
      })
      initializeAll()
    },
  }
}
// === End Widget Script Helper ===

interface NodeDefinition {
  id: string
  x: number
  y: number
  label?: string
  color?: string
  shape?: "circle" | "hexagon" | "pentagon"
}

interface EdgeDefinition {
  from: string
  to: string
  directed?: boolean
  weight?: number
}

interface RandomWalkConfig {
  nodes: NodeDefinition[]
  edges: EdgeDefinition[]
  startNode: string
  height: number
  stepDelay: number
  showWeights: boolean
  showProbabilities: boolean
  nodeRadius: number
  trackVisits: boolean
  enableDrag: boolean
  enableZoom: boolean
  minScale: number
  maxScale: number
  initialScale: number
  initialOffsetX: number
  initialOffsetY: number
  fitViewport: boolean
  centerView: boolean
  viewportBounds?: {
    min: [number, number]  // [x, y]
    max: [number, number]  // [x, y]
  }
}

interface GraphNode extends NodeDefinition {
  screenX: number
  screenY: number
  visitCount: number
}

interface GraphEdge extends EdgeDefinition {
  fromNode: GraphNode
  toNode: GraphNode
}

/**
 * Viewport transform for pan and zoom operations
 */
class ViewportTransform {
  // Viewport state (pan and zoom)
  scale: number = 1
  offsetX: number = 0
  offsetY: number = 0

  constructor(
    private canvasWidth: number,
    private canvasHeight: number,
  ) {}

  /**
   * Update canvas dimensions
   */
  setCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width
    this.canvasHeight = height
  }

  /**
   * Calculate the viewport bounds that should fit all nodes
   */
  calculateFitBounds(nodes: NodeDefinition[]): { scale: number; offsetX: number; offsetY: number } {
    if (nodes.length === 0) {
      return { scale: 1, offsetX: 0, offsetY: 0 }
    }

    // Find bounds of all nodes in simulation space
    let minX = nodes[0].x
    let maxX = nodes[0].x
    let minY = nodes[0].y
    let maxY = nodes[0].y

    for (const node of nodes) {
      minX = Math.min(minX, node.x)
      maxX = Math.max(maxX, node.x)
      minY = Math.min(minY, node.y)
      maxY = Math.max(maxY, node.y)
    }

    // Add padding around nodes
    const padding = 10
    const width = maxX - minX + 2 * padding
    const height = maxY - minY + 2 * padding

    // Calculate scale to fit
    const scaleX = this.canvasWidth / (width * (this.canvasWidth / 100))
    const scaleY = this.canvasHeight / (height * (this.canvasHeight / 100))
    const scale = Math.min(scaleX, scaleY)

    // Center the bounds
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    return {
      scale,
      offsetX: 50 - centerX,
      offsetY: 50 - centerY,
    }
  }

  /**
   * Calculate viewport to fit a specific bounding box
   */
  calculateBoundsBounds(bounds: { min: [number, number]; max: [number, number] }): { scale: number; offsetX: number; offsetY: number } {
    const [minX, minY] = bounds.min
    const [maxX, maxY] = bounds.max

    // Calculate the size of the region in simulation space
    const width = maxX - minX
    const height = maxY - minY

    if (width <= 0 || height <= 0) {
      return { scale: 1, offsetX: 0, offsetY: 0 }
    }

    // Calculate scale to fit the region to the canvas
    // The region should fill the canvas
    const scaleX = 100 / width
    const scaleY = 100 / height
    const scale = Math.min(scaleX, scaleY)

    // Calculate offsets to position the region
    // We want minX to map to the left edge (screen 0) and maxX to the right edge (screen width)
    // simToScreen equation: screenX = ((simX + offsetX) * scale / 100) * canvasWidth
    // For left edge: 0 = ((minX + offsetX) * scale / 100) * canvasWidth
    // Solving: offsetX = -minX
    // But we want to center it, so we add half the difference
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    return {
      scale,
      offsetX: -centerX + (50 / scale),
      offsetY: -centerY + (50 / scale),
    }
  }

  /**
   * Calculate center offset for the graph
   */
  calculateCenterOffset(): { offsetX: number; offsetY: number } {
    return {
      offsetX: 0,
      offsetY: 0,
    }
  }

  /**
   * Transform simulation coordinates to screen coordinates
   */
  simToScreen(simX: number, simY: number): { screenX: number; screenY: number } {
    // Apply viewport transform: offset then scale
    const transformedX = (simX + this.offsetX) * this.scale
    const transformedY = (simY + this.offsetY) * this.scale

    // Map from simulation space (0-100) to canvas space
    const screenX = (transformedX / 100) * this.canvasWidth
    const screenY = (transformedY / 100) * this.canvasHeight

    return { screenX, screenY }
  }

  /**
   * Transform screen coordinates to simulation coordinates
   */
  screenToSim(screenX: number, screenY: number): { simX: number; simY: number } {
    // Map from canvas space to simulation space (0-100)
    const simX = (screenX / this.canvasWidth) * 100 / this.scale - this.offsetX
    const simY = (screenY / this.canvasHeight) * 100 / this.scale - this.offsetY

    return { simX, simY }
  }

  /**
   * Zoom by a scale factor (center on a point)
   */
  zoom(factor: number, centerScreenX: number, centerScreenY: number, minScale: number, maxScale: number): void {
    // Convert center point to sim coordinates BEFORE zoom
    const { simX: centerSimX, simY: centerSimY } = this.screenToSim(centerScreenX, centerScreenY)

    // Apply zoom
    const newScale = Math.max(minScale, Math.min(maxScale, this.scale * factor))
    this.scale = newScale

    // Recalculate what the offset should be to keep the center point at the same screen position
    // simToScreen equation: screenX = ((simX + offsetX) * scale / 100) * canvasWidth
    // Solving for offsetX: offsetX = (screenX * 100) / (scale * canvasWidth) - simX
    this.offsetX = (centerScreenX * 100) / (this.scale * this.canvasWidth) - centerSimX
    this.offsetY = (centerScreenY * 100) / (this.scale * this.canvasHeight) - centerSimY
  }

  /**
   * Pan by simulation space units
   */
  pan(deltaSimX: number, deltaSimY: number): void {
    this.offsetX += deltaSimX
    this.offsetY += deltaSimY
  }
}

/**
 * Random Walk simulation class
 */
class RandomWalkSimulation {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: RandomWalkConfig
  private nodes: Map<string, GraphNode> = new Map()
  private edges: GraphEdge[] = []
  private adjacencyList: Map<string, { node: GraphNode; weight: number }[]> = new Map()
  private currentNodeId: string
  private stepCount: number = 0
  private isPlaying: boolean = false
  private playInterval: number | null = null
  private resizeObserver: ResizeObserver | null = null
  private viewport: ViewportTransform

  // UI elements
  private stepCountEl: HTMLElement | null = null
  private currentNodeEl: HTMLElement | null = null
  private playBtn: HTMLElement | null = null
  private pauseBtn: HTMLElement | null = null

  // Animation state
  private animating: boolean = false
  private animationStart: number = 0
  private animationDuration: number = 300
  private animationFromNode: GraphNode | null = null
  private animationToNode: GraphNode | null = null
  private animationFrame: number | null = null

  // Pan and zoom state
  private isPanning: boolean = false
  private panStartX: number = 0
  private panStartY: number = 0
  private panStartOffsetX: number = 0
  private panStartOffsetY: number = 0

  // Bound event handlers (for reliable add/remove)
  private onWheel: (event: WheelEvent) => void
  private onMouseDown: (event: MouseEvent) => void
  private onMouseMove: (event: MouseEvent) => void
  private onMouseUp: () => void

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    config: RandomWalkConfig,
  ) {
    this.canvas = canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not get 2D context")
    this.ctx = ctx
    this.config = config
    this.currentNodeId = config.startNode

    // Initialize viewport transform
    this.viewport = new ViewportTransform(canvas.width, canvas.height)

    this.onWheel = (event: WheelEvent) => this.handleWheel(event)
    this.onMouseDown = (event: MouseEvent) => this.handleMouseDown(event)
    this.onMouseMove = (event: MouseEvent) => this.handleMouseMove(event)
    this.onMouseUp = () => this.handleMouseUp()

    // Get UI elements
    this.stepCountEl = container.querySelector(".random-walk-step-count")
    this.currentNodeEl = container.querySelector(".random-walk-current-node")
    this.playBtn = container.querySelector(".random-walk-play")
    this.pauseBtn = container.querySelector(".random-walk-pause")

    // Setup
    this.setupResizeObserver()
    this.updateDimensions()
    this.buildGraph()
    this.applyInitialViewport()
    this.setupMouseHandlers()
    canvas.style.cursor = 'grab'
    this.draw()
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateDimensions()
      this.updateNodePositions()
      this.draw()
    })

    if (this.canvas.parentElement) {
      this.resizeObserver.observe(this.canvas.parentElement)
    }
  }

  private updateDimensions(): void {
    const parent = this.canvas.parentElement
    if (!parent) return

    const parentWidth = parent.clientWidth
    this.canvas.width = parentWidth
    this.canvas.height = this.config.height

    // Update viewport canvas dimensions
    this.viewport.setCanvasDimensions(parentWidth, this.config.height)
  }

  private applyInitialViewport(): void {
    if (this.config.viewportBounds) {
      const bounds = this.viewport.calculateBoundsBounds(this.config.viewportBounds)
      this.viewport.scale = bounds.scale
      this.viewport.offsetX = bounds.offsetX
      this.viewport.offsetY = bounds.offsetY
    } else if (this.config.fitViewport) {
      const bounds = this.viewport.calculateFitBounds(this.config.nodes)
      this.viewport.scale = bounds.scale
      this.viewport.offsetX = bounds.offsetX
      this.viewport.offsetY = bounds.offsetY
    } else if (this.config.centerView) {
      const center = this.viewport.calculateCenterOffset()
      this.viewport.offsetX = center.offsetX
      this.viewport.offsetY = center.offsetY
    } else {
      // Use explicit initial values
      this.viewport.scale = this.config.initialScale
      this.viewport.offsetX = this.config.initialOffsetX
      this.viewport.offsetY = this.config.initialOffsetY
    }
  }

  private updateNodePositions(): void {
    // Transform simulation coordinates to screen coordinates using viewport
    for (const node of this.nodes.values()) {
      const { screenX, screenY } = this.viewport.simToScreen(node.x, node.y)
      node.screenX = screenX
      node.screenY = screenY
    }
  }

  private setupMouseHandlers(): void {
    if (!this.config.enableDrag && !this.config.enableZoom) {
      return
    }

    if (this.config.enableZoom) {
      this.canvas.addEventListener("wheel", this.onWheel)
    }

    if (this.config.enableDrag) {
      this.canvas.addEventListener("mousedown", this.onMouseDown)
      document.addEventListener("mousemove", this.onMouseMove)
      document.addEventListener("mouseup", this.onMouseUp)
    }
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault()

    // Zoom towards center of viewport
    const rect = this.canvas.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Smaller zoom factor for smoother control (5% instead of 10%)
    const factor = event.deltaY > 0 ? 0.98 : 1.02
    this.viewport.zoom(factor, centerX, centerY, this.config.minScale, this.config.maxScale)

    this.updateNodePositions()
    this.draw()
  }

  private handleMouseDown(event: MouseEvent): void {
    this.isPanning = true
    this.panStartX = event.clientX
    this.panStartY = event.clientY
    this.panStartOffsetX = this.viewport.offsetX
    this.panStartOffsetY = this.viewport.offsetY
    this.canvas.style.cursor = 'grabbing'
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isPanning) return

    const deltaX = event.clientX - this.panStartX
    const deltaY = event.clientY - this.panStartY

    // Convert screen delta to simulation delta
    const rect = this.canvas.getBoundingClientRect()
    const simDeltaX = (deltaX / rect.width) * (100 / this.viewport.scale)
    const simDeltaY = (deltaY / rect.height) * (100 / this.viewport.scale)

    this.viewport.offsetX = this.panStartOffsetX + simDeltaX
    this.viewport.offsetY = this.panStartOffsetY + simDeltaY

    this.updateNodePositions()
    this.draw()
  }

  private handleMouseUp(): void {
    this.isPanning = false
    this.canvas.style.cursor = 'grab'
  }

  private buildGraph(): void {
    // Create nodes
    for (const nodeDef of this.config.nodes) {
      const node: GraphNode = {
        ...nodeDef,
        screenX: 0,  // Will be set by updateNodePositions
        screenY: 0,  // Will be set by updateNodePositions
        visitCount: nodeDef.id === this.config.startNode ? 1 : 0,
      }
      this.nodes.set(nodeDef.id, node)
      this.adjacencyList.set(nodeDef.id, [])
    }

    // Create edges and build adjacency list
    for (const edgeDef of this.config.edges) {
      const fromNode = this.nodes.get(edgeDef.from)
      const toNode = this.nodes.get(edgeDef.to)

      if (!fromNode || !toNode) {
        console.warn(`Edge references unknown node: ${edgeDef.from} -> ${edgeDef.to}`)
        continue
      }

      const edge: GraphEdge = {
        ...edgeDef,
        fromNode,
        toNode,
      }
      this.edges.push(edge)

      // Add to adjacency list
      const weight = edgeDef.weight ?? 1
      this.adjacencyList.get(edgeDef.from)!.push({ node: toNode, weight })

      // If undirected, add reverse edge
      if (!edgeDef.directed) {
        this.adjacencyList.get(edgeDef.to)!.push({ node: fromNode, weight })
      }
    }
  }

  private draw(): void {
    const ctx = this.ctx
    const width = this.canvas.width
    const height = this.canvas.height

    // Clear canvas and draw background
    ctx.fillStyle = this.getCanvasBackgroundColor()
    ctx.fillRect(0, 0, width, height)

    // Draw edges first (so nodes appear on top)
    this.drawEdges()

    // Draw nodes
    this.drawNodes()

    // Draw ant
    this.drawAnt()
  }

  private drawEdges(): void {
    const ctx = this.ctx
    const scaledRadius = this.config.nodeRadius * this.viewport.scale

    for (const edge of this.edges) {
      const from = edge.fromNode
      const to = edge.toNode

      ctx.beginPath()
      ctx.strokeStyle = this.getEdgeColor()
      ctx.lineWidth = 2 * this.viewport.scale

      // Calculate edge start/end points (offset from node center)
      const dx = to.screenX - from.screenX
      const dy = to.screenY - from.screenY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const unitX = dx / dist
      const unitY = dy / dist

      const startX = from.screenX + unitX * scaledRadius
      const startY = from.screenY + unitY * scaledRadius
      const endX = to.screenX - unitX * scaledRadius
      const endY = to.screenY - unitY * scaledRadius

      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()

      // Draw arrow if directed
      if (edge.directed) {
        this.drawArrowHead(endX, endY, unitX, unitY)
      }

      // Draw weight/probability label
      if (this.config.showWeights || this.config.showProbabilities) {
        const midX = (startX + endX) / 2
        const midY = (startY + endY) / 2
        let label = ""

        if (this.config.showProbabilities) {
          const neighbors = this.adjacencyList.get(edge.from) || []
          const totalWeight = neighbors.reduce((sum, n) => sum + n.weight, 0)
          const prob = ((edge.weight ?? 1) / totalWeight).toFixed(2)
          label = prob
        } else if (this.config.showWeights) {
          label = String(edge.weight ?? 1)
        }

        ctx.fillStyle = this.getTextColor()
        ctx.font = `${12 * this.viewport.scale}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        // Draw label with background
        const textMetrics = ctx.measureText(label)
        ctx.fillStyle = this.getBackgroundColor()
        ctx.fillRect(
          midX - textMetrics.width / 2 - 2,
          midY - 8,
          textMetrics.width + 4,
          16,
        )
        ctx.fillStyle = this.getTextColor()
        ctx.fillText(label, midX, midY)
      }
    }
  }

  private drawArrowHead(x: number, y: number, unitX: number, unitY: number): void {
    const ctx = this.ctx
    const arrowSize = 10 * this.viewport.scale

    ctx.beginPath()
    ctx.fillStyle = this.getEdgeColor()

    // Arrow head points
    const angle = Math.atan2(unitY, unitX)
    const x1 = x - arrowSize * Math.cos(angle - Math.PI / 6)
    const y1 = y - arrowSize * Math.sin(angle - Math.PI / 6)
    const x2 = x - arrowSize * Math.cos(angle + Math.PI / 6)
    const y2 = y - arrowSize * Math.sin(angle + Math.PI / 6)

    ctx.moveTo(x, y)
    ctx.lineTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.closePath()
    ctx.fill()
  }

  private drawNodes(): void {
    const ctx = this.ctx
    const radius = this.config.nodeRadius * this.viewport.scale

    for (const node of this.nodes.values()) {
      const isCurrent = node.id === this.currentNodeId

      // Draw shape based on node type
      ctx.beginPath()

      switch (node.shape) {
        case "hexagon":
          this.drawHexagon(node.screenX, node.screenY, radius)
          break
        case "pentagon":
          this.drawPentagon(node.screenX, node.screenY, radius)
          break
        default:
          ctx.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2)
      }

      // Fill color
      if (node.color) {
        ctx.fillStyle = node.color
      } else if (isCurrent) {
        ctx.fillStyle = this.getHighlightColor()
      } else {
        ctx.fillStyle = this.getNodeColor()
      }
      ctx.fill()

      // Stroke
      ctx.strokeStyle = isCurrent ? this.getHighlightBorderColor() : this.getNodeBorderColor()
      ctx.lineWidth = isCurrent ? 3 : 2
      ctx.stroke()

      // Draw label
      if (node.label) {
        ctx.fillStyle = this.getNodeTextColor()
        ctx.font = `bold ${14 * this.viewport.scale}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(node.label, node.screenX, node.screenY)
      }

      // Draw visit count if tracking
      if (this.config.trackVisits && node.visitCount > 0) {
        ctx.fillStyle = this.getBadgeColor()
        ctx.beginPath()
        ctx.arc(
          node.screenX + radius * 0.7,
          node.screenY - radius * 0.7,
          10 * this.viewport.scale,
          0,
          Math.PI * 2,
        )
        ctx.fill()

        ctx.fillStyle = "#fff"
        ctx.font = `bold ${10 * this.viewport.scale}px sans-serif`
        ctx.fillText(
          String(node.visitCount),
          node.screenX + radius * 0.7,
          node.screenY - radius * 0.7,
        )
      }
    }
  }

  private drawHexagon(cx: number, cy: number, radius: number): void {
    const ctx = this.ctx
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
  }

  private drawPentagon(cx: number, cy: number, radius: number): void {
    const ctx = this.ctx
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
  }

  private drawAnt(): void {
    const ctx = this.ctx
    let x: number, y: number

    if (this.animating && this.animationFromNode && this.animationToNode) {
      // Interpolate position during animation
      const progress = Math.min(
        1,
        (performance.now() - this.animationStart) / this.animationDuration,
      )
      const eased = this.easeInOutQuad(progress)
      x = this.animationFromNode.screenX + 
          (this.animationToNode.screenX - this.animationFromNode.screenX) * eased
      y = this.animationFromNode.screenY + 
          (this.animationToNode.screenY - this.animationFromNode.screenY) * eased
    } else {
      const currentNode = this.nodes.get(this.currentNodeId)
      if (!currentNode) return
      x = currentNode.screenX
      y = currentNode.screenY
    }

    // Draw ant body
    const antSize = 12 * this.viewport.scale
    const scaledNodeRadius = this.config.nodeRadius * this.viewport.scale
    ctx.save()
    ctx.translate(x, y - scaledNodeRadius - antSize - 5)

    // Ant body (three ovals)
    ctx.fillStyle = "#2a2a2a"
    
    // Head
    ctx.beginPath()
    ctx.ellipse(0, -8 * this.viewport.scale, 4 * this.viewport.scale, 3.5 * this.viewport.scale, 0, 0, Math.PI * 2)
    ctx.fill()

    // Thorax
    ctx.beginPath()
    ctx.ellipse(0, -2 * this.viewport.scale, 3.5 * this.viewport.scale, 4 * this.viewport.scale, 0, 0, Math.PI * 2)
    ctx.fill()

    // Abdomen
    ctx.beginPath()
    ctx.ellipse(0, 6 * this.viewport.scale, 5 * this.viewport.scale, 6 * this.viewport.scale, 0, 0, Math.PI * 2)
    ctx.fill()

    // Legs (6 legs)
    ctx.strokeStyle = "#2a2a2a"
    ctx.lineWidth = 1.5 * this.viewport.scale
    const legPositions = [-4, -1, 2]
    legPositions.forEach((yPos) => {
      // Left leg
      ctx.beginPath()
      ctx.moveTo(-3 * this.viewport.scale, yPos * this.viewport.scale)
      ctx.quadraticCurveTo(-8 * this.viewport.scale, (yPos - 2) * this.viewport.scale, -10 * this.viewport.scale, (yPos + 3) * this.viewport.scale)
      ctx.stroke()
      // Right leg
      ctx.beginPath()
      ctx.moveTo(3 * this.viewport.scale, yPos * this.viewport.scale)
      ctx.quadraticCurveTo(8 * this.viewport.scale, (yPos - 2) * this.viewport.scale, 10 * this.viewport.scale, (yPos + 3) * this.viewport.scale)
      ctx.stroke()
    })

    // Antennae
    ctx.beginPath()
    ctx.moveTo(-2 * this.viewport.scale, -10 * this.viewport.scale)
    ctx.quadraticCurveTo(-4 * this.viewport.scale, -16 * this.viewport.scale, -6 * this.viewport.scale, -18 * this.viewport.scale)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(2 * this.viewport.scale, -10 * this.viewport.scale)
    ctx.quadraticCurveTo(4 * this.viewport.scale, -16 * this.viewport.scale, 6 * this.viewport.scale, -18 * this.viewport.scale)
    ctx.stroke()

    ctx.restore()
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }

  public step(): void {
    if (this.animating) return

    const neighbors = this.adjacencyList.get(this.currentNodeId)
    if (!neighbors || neighbors.length === 0) {
      console.warn(`Node ${this.currentNodeId} has no neighbors`)
      return
    }

    // Calculate total weight for probability distribution
    const totalWeight = neighbors.reduce((sum, n) => sum + n.weight, 0)

    // Pick random neighbor weighted by edge weights
    let random = Math.random() * totalWeight
    let nextNode: GraphNode | null = null

    for (const { node, weight } of neighbors) {
      random -= weight
      if (random <= 0) {
        nextNode = node
        break
      }
    }

    if (!nextNode) {
      nextNode = neighbors[neighbors.length - 1].node
    }

    // Animate transition
    this.animateTransition(nextNode)
  }

  private animateTransition(toNode: GraphNode): void {
    const fromNode = this.nodes.get(this.currentNodeId)
    if (!fromNode) return

    this.animating = true
    this.animationStart = performance.now()
    this.animationFromNode = fromNode
    this.animationToNode = toNode

    const animate = () => {
      const elapsed = performance.now() - this.animationStart
      this.draw()

      if (elapsed < this.animationDuration) {
        this.animationFrame = requestAnimationFrame(animate)
      } else {
        // Animation complete
        this.animating = false
        this.animationFromNode = null
        this.animationToNode = null
        this.currentNodeId = toNode.id
        this.stepCount++
        toNode.visitCount++
        this.updateUI()
        this.draw()
      }
    }

    this.animationFrame = requestAnimationFrame(animate)
  }

  private updateUI(): void {
    if (this.stepCountEl) {
      this.stepCountEl.textContent = `Steps: ${this.stepCount}`
    }
    if (this.currentNodeEl) {
      const node = this.nodes.get(this.currentNodeId)
      this.currentNodeEl.textContent = `Current: ${node?.label || this.currentNodeId}`
    }
  }

  public play(): void {
    if (this.isPlaying) return
    this.isPlaying = true

    if (this.playBtn) this.playBtn.style.display = "none"
    if (this.pauseBtn) this.pauseBtn.style.display = "inline-flex"

    this.playInterval = window.setInterval(() => {
      if (!this.animating) {
        this.step()
      }
    }, this.config.stepDelay)
  }

  public pause(): void {
    if (!this.isPlaying) return
    this.isPlaying = false

    if (this.playBtn) this.playBtn.style.display = "inline-flex"
    if (this.pauseBtn) this.pauseBtn.style.display = "none"

    if (this.playInterval) {
      clearInterval(this.playInterval)
      this.playInterval = null
    }
  }

  public reset(): void {
    this.pause()

    // Cancel any ongoing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
    this.animating = false
    this.animationFromNode = null
    this.animationToNode = null

    // Reset state
    this.currentNodeId = this.config.startNode
    this.stepCount = 0

    // Reset visit counts
    this.nodes.forEach((node) => {
      node.visitCount = node.id === this.config.startNode ? 1 : 0
    })

    this.updateUI()
    this.draw()
  }

  public destroy(): void {
    this.pause()
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    // Clean up event listeners
    if (this.config.enableZoom) {
      this.canvas.removeEventListener("wheel", this.onWheel)
    }
    if (this.config.enableDrag) {
      this.canvas.removeEventListener("mousedown", this.onMouseDown)
      document.removeEventListener("mousemove", this.onMouseMove)
      document.removeEventListener("mouseup", this.onMouseUp)
    }
  }

  // Color helpers for theming
  private isDarkMode(): boolean {
    return document.documentElement.getAttribute("saved-theme") === "dark"
  }

  private getNodeColor(): string {
    return this.isDarkMode() ? "#f0f0f0" : "#ffffff"
  }

  private getNodeBorderColor(): string {
    return this.isDarkMode() ? "#cccccc" : "#333333"
  }

  private getNodeTextColor(): string {
    return this.isDarkMode() ? "#1a1a1a" : "#333333"
  }

  private getHighlightColor(): string {
    return this.isDarkMode() ? "#90EE90" : "#90EE90"
  }

  private getHighlightBorderColor(): string {
    return this.isDarkMode() ? "#228B22" : "#228B22"
  }

  private getEdgeColor(): string {
    return this.isDarkMode() ? "#aaaaaa" : "#666666"
  }

  private getTextColor(): string {
    return this.isDarkMode() ? "#f0f0f0" : "#333333"
  }

  private getBackgroundColor(): string {
    return this.isDarkMode() ? "#2a2a2a" : "#ffffff"
  }

  private getBadgeColor(): string {
    return this.isDarkMode() ? "#6495ED" : "#4169E1"
  }

  private getCanvasBackgroundColor(): string {
    return "#ffffff"
  }
}

// Initialize widget
createWidgetScript({
  selector: ".widget-random-walk",
  initialize: (element: HTMLElement) => {
    const configAttr = element.getAttribute("data-config")
    if (!configAttr) {
      console.error("Random Walk widget missing data-config")
      return
    }

    const config: RandomWalkConfig = JSON.parse(configAttr)
    const canvas = element.querySelector<HTMLCanvasElement>(".random-walk-canvas")
    if (!canvas) {
      console.error("Random Walk widget missing canvas")
      return
    }

    const simulation = new RandomWalkSimulation(element, canvas, config)

    // Wire up controls
    const resetBtn = element.querySelector(".random-walk-reset")
    const stepBtn = element.querySelector(".random-walk-step")
    const playBtn = element.querySelector(".random-walk-play")
    const pauseBtn = element.querySelector(".random-walk-pause")

    const onReset = () => simulation.reset()
    const onStep = () => simulation.step()
    const onPlay = () => simulation.play()
    const onPause = () => simulation.pause()

    resetBtn?.addEventListener("click", onReset)
    stepBtn?.addEventListener("click", onStep)
    playBtn?.addEventListener("click", onPlay)
    pauseBtn?.addEventListener("click", onPause)

    return () => {
      resetBtn?.removeEventListener("click", onReset)
      stepBtn?.removeEventListener("click", onStep)
      playBtn?.removeEventListener("click", onPlay)
      pauseBtn?.removeEventListener("click", onPause)
      simulation.destroy()
    }
  },
}).start()
