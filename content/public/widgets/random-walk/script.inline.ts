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

  function cleanupInstance(element: HTMLElement): void {
    const cleanup = cleanupHandlers.get(element)
    if (cleanup) {
      cleanup()
      cleanupHandlers.delete(element)
    }
  }

  function initializeAll(): void {
    const elements = document.querySelectorAll<HTMLElement>(config.selector)
    elements.forEach((element) => {
      cleanupInstance(element)
      const cleanup = config.initialize(element)
      if (cleanup) cleanupHandlers.set(element, cleanup)
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

    // Get UI elements
    this.stepCountEl = container.querySelector(".random-walk-step-count")
    this.currentNodeEl = container.querySelector(".random-walk-current-node")
    this.playBtn = container.querySelector(".random-walk-play")
    this.pauseBtn = container.querySelector(".random-walk-pause")

    // Setup
    this.setupResizeObserver()
    this.updateDimensions()
    this.buildGraph()
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
  }

  private updateNodePositions(): void {
    const width = this.canvas.width
    const height = this.canvas.height
    const padding = this.config.nodeRadius + 10

    this.nodes.forEach((node) => {
      node.screenX = padding + (node.x / 100) * (width - 2 * padding)
      node.screenY = padding + (node.y / 100) * (height - 2 * padding)
    })
  }

  private buildGraph(): void {
    const width = this.canvas.width
    const height = this.canvas.height
    const padding = this.config.nodeRadius + 10

    // Create nodes
    for (const nodeDef of this.config.nodes) {
      const node: GraphNode = {
        ...nodeDef,
        screenX: padding + (nodeDef.x / 100) * (width - 2 * padding),
        screenY: padding + (nodeDef.y / 100) * (height - 2 * padding),
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

    for (const edge of this.edges) {
      const from = edge.fromNode
      const to = edge.toNode

      ctx.beginPath()
      ctx.strokeStyle = this.getEdgeColor()
      ctx.lineWidth = 2

      // Calculate edge start/end points (offset from node center)
      const dx = to.screenX - from.screenX
      const dy = to.screenY - from.screenY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const unitX = dx / dist
      const unitY = dy / dist

      const startX = from.screenX + unitX * this.config.nodeRadius
      const startY = from.screenY + unitY * this.config.nodeRadius
      const endX = to.screenX - unitX * this.config.nodeRadius
      const endY = to.screenY - unitY * this.config.nodeRadius

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
        ctx.font = "12px sans-serif"
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
    const arrowSize = 10

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
    const radius = this.config.nodeRadius

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
        ctx.font = "bold 14px sans-serif"
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
          10,
          0,
          Math.PI * 2,
        )
        ctx.fill()

        ctx.fillStyle = "#fff"
        ctx.font = "bold 10px sans-serif"
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
    const antSize = 12
    ctx.save()
    ctx.translate(x, y - this.config.nodeRadius - antSize - 5)

    // Ant body (three ovals)
    ctx.fillStyle = "#2a2a2a"
    
    // Head
    ctx.beginPath()
    ctx.ellipse(0, -8, 4, 3.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Thorax
    ctx.beginPath()
    ctx.ellipse(0, -2, 3.5, 4, 0, 0, Math.PI * 2)
    ctx.fill()

    // Abdomen
    ctx.beginPath()
    ctx.ellipse(0, 6, 5, 6, 0, 0, Math.PI * 2)
    ctx.fill()

    // Legs (6 legs)
    ctx.strokeStyle = "#2a2a2a"
    ctx.lineWidth = 1.5
    const legPositions = [-4, -1, 2]
    legPositions.forEach((yPos) => {
      // Left leg
      ctx.beginPath()
      ctx.moveTo(-3, yPos)
      ctx.quadraticCurveTo(-8, yPos - 2, -10, yPos + 3)
      ctx.stroke()
      // Right leg
      ctx.beginPath()
      ctx.moveTo(3, yPos)
      ctx.quadraticCurveTo(8, yPos - 2, 10, yPos + 3)
      ctx.stroke()
    })

    // Antennae
    ctx.beginPath()
    ctx.moveTo(-2, -10)
    ctx.quadraticCurveTo(-4, -16, -6, -18)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(2, -10)
    ctx.quadraticCurveTo(4, -16, 6, -18)
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

    resetBtn?.addEventListener("click", () => simulation.reset())
    stepBtn?.addEventListener("click", () => simulation.step())
    playBtn?.addEventListener("click", () => simulation.play())
    pauseBtn?.addEventListener("click", () => simulation.pause())

    return () => simulation.destroy()
  },
}).start()
