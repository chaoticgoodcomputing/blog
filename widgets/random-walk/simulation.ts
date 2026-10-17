// The random walk behind the RandomWalk widget: a graph drawn on a canvas, an ant that walks it
// one weighted-random step at a time, and pan and zoom. Browser-only; the widget starts it once it
// hydrates.
//
// Ported from v4's widget (its script.inline.ts). What changed: the widget, not this class, owns
// the controls and the step and node readouts, and every colour, and the labels' font, comes from
// the palette the widget reads from the page, painted again when it changes.

export interface NodeDefinition {
  /** Unique identifier for the node. */
  id: string
  /** X position, on a 0–100 grid. */
  x: number
  /** Y position, on a 0–100 grid. */
  y: number
  /** A label to draw on the node. */
  label?: string
  /** Its fill: any colour value, e.g. "#FFB6C1" or "var(--light)". */
  color?: string
  /** Its shape. */
  shape?: "circle" | "hexagon" | "pentagon"
}

export interface EdgeDefinition {
  /** Source node id. */
  from: string
  /** Target node id. */
  to: string
  /** Whether the ant may only walk it from `from` to `to` (drawn with an arrow). */
  directed?: boolean
  /** Its weight among the edges the ant can take next. Default 1. */
  weight?: number
}

export interface WalkConfig {
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
  viewportBounds?: { min: [number, number]; max: [number, number] }
}

/** Every colour the canvas paints, resolved for the colour scheme showing now, and its font. */
export interface Palette {
  paper: string
  edge: string
  text: string
  node: string
  nodeBorder: string
  current: string
  currentBorder: string
  badge: string
  badgeText: string
  ant: string
  /** Text on a node's fill: `dark` on a light fill, `light` on a dark one. */
  ink: { dark: string; light: string; on: (fill: string) => string }
  /** Each node's own `color`, resolved. */
  fills: Map<string, string>
  /** The font family every label is drawn in: the page's, never a literal one. */
  font: string
}

/** What the widget shows beside the canvas. */
export interface WalkState {
  steps: number
  current: string
  playing: boolean
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

/** Viewport transform for pan and zoom. */
class ViewportTransform {
  scale = 1
  offsetX = 0
  offsetY = 0

  constructor(
    private canvasWidth: number,
    private canvasHeight: number,
  ) {}

  setCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width
    this.canvasHeight = height
  }

  /** The viewport that fits every node. */
  calculateFitBounds(nodes: NodeDefinition[]): { scale: number; offsetX: number; offsetY: number } {
    if (nodes.length === 0) return { scale: 1, offsetX: 0, offsetY: 0 }
    let [minX, maxX, minY, maxY] = [nodes[0].x, nodes[0].x, nodes[0].y, nodes[0].y]
    for (const node of nodes) {
      minX = Math.min(minX, node.x)
      maxX = Math.max(maxX, node.x)
      minY = Math.min(minY, node.y)
      maxY = Math.max(maxY, node.y)
    }
    const padding = 10
    const width = maxX - minX + 2 * padding
    const height = maxY - minY + 2 * padding
    const scaleX = this.canvasWidth / (width * (this.canvasWidth / 100))
    const scaleY = this.canvasHeight / (height * (this.canvasHeight / 100))
    return { scale: Math.min(scaleX, scaleY), offsetX: 50 - (minX + maxX) / 2, offsetY: 50 - (minY + maxY) / 2 }
  }

  /** The viewport that fits a bounding box. */
  calculateBoundsBounds(bounds: { min: [number, number]; max: [number, number] }): { scale: number; offsetX: number; offsetY: number } {
    const [minX, minY] = bounds.min
    const [maxX, maxY] = bounds.max
    const width = maxX - minX
    const height = maxY - minY
    if (width <= 0 || height <= 0) return { scale: 1, offsetX: 0, offsetY: 0 }
    const scale = Math.min(100 / width, 100 / height)
    return { scale, offsetX: -(minX + maxX) / 2 + 50 / scale, offsetY: -(minY + maxY) / 2 + 50 / scale }
  }

  simToScreen(simX: number, simY: number): { screenX: number; screenY: number } {
    return {
      screenX: (((simX + this.offsetX) * this.scale) / 100) * this.canvasWidth,
      screenY: (((simY + this.offsetY) * this.scale) / 100) * this.canvasHeight,
    }
  }

  screenToSim(screenX: number, screenY: number): { simX: number; simY: number } {
    return {
      simX: ((screenX / this.canvasWidth) * 100) / this.scale - this.offsetX,
      simY: ((screenY / this.canvasHeight) * 100) / this.scale - this.offsetY,
    }
  }

  /** Zoom by `factor`, keeping the point under (centerScreenX, centerScreenY) where it is. */
  zoom(factor: number, centerScreenX: number, centerScreenY: number, minScale: number, maxScale: number): void {
    const { simX, simY } = this.screenToSim(centerScreenX, centerScreenY)
    this.scale = Math.max(minScale, Math.min(maxScale, this.scale * factor))
    this.offsetX = (centerScreenX * 100) / (this.scale * this.canvasWidth) - simX
    this.offsetY = (centerScreenY * 100) / (this.scale * this.canvasHeight) - simY
  }
}

export class RandomWalkSimulation {
  private ctx: CanvasRenderingContext2D
  private nodes = new Map<string, GraphNode>()
  private edges: GraphEdge[] = []
  private adjacencyList = new Map<string, { node: GraphNode; weight: number }[]>()
  private currentNodeId: string
  private stepCount = 0
  private isPlaying = false
  private playInterval: number | null = null
  private resizeObserver: ResizeObserver
  private viewport: ViewportTransform

  // Animation state
  private animating = false
  private animationStart = 0
  private animationDuration = 300
  private animationFromNode: GraphNode | null = null
  private animationToNode: GraphNode | null = null
  private animationFrame: number | null = null

  // Pan state
  private isPanning = false
  private panStartX = 0
  private panStartY = 0
  private panStartOffsetX = 0
  private panStartOffsetY = 0

  private onWheel = (event: WheelEvent) => this.handleWheel(event)
  private onMouseDown = (event: MouseEvent) => this.handleMouseDown(event)
  private onMouseMove = (event: MouseEvent) => this.handleMouseMove(event)
  private onMouseUp = () => this.handleMouseUp()

  constructor(
    private canvas: HTMLCanvasElement,
    private config: WalkConfig,
    private palette: Palette,
    private onChange: (state: WalkState) => void,
  ) {
    this.ctx = canvas.getContext("2d")!
    this.currentNodeId = config.startNode
    this.viewport = new ViewportTransform(canvas.width, canvas.height)
    this.resizeObserver = new ResizeObserver(() => {
      this.updateDimensions()
      this.updateNodePositions()
      this.draw()
    })
    this.resizeObserver.observe(canvas)
    this.updateDimensions()
    this.buildGraph()
    this.applyInitialViewport()
    this.updateNodePositions()
    this.setupMouseHandlers()
    if (config.enableDrag) canvas.style.cursor = "grab"
    this.draw()
  }

  /** Paint again in a new palette, when the reader switches colour scheme. */
  repaint(palette: Palette): void {
    this.palette = palette
    this.draw()
  }

  private updateDimensions(): void {
    this.canvas.width = this.canvas.clientWidth
    this.canvas.height = this.config.height
    this.viewport.setCanvasDimensions(this.canvas.width, this.config.height)
  }

  private applyInitialViewport(): void {
    const { config, viewport } = this
    if (config.viewportBounds) Object.assign(viewport, viewport.calculateBoundsBounds(config.viewportBounds))
    else if (config.fitViewport) Object.assign(viewport, viewport.calculateFitBounds(config.nodes))
    else if (config.centerView) Object.assign(viewport, { offsetX: 0, offsetY: 0 })
    else Object.assign(viewport, { scale: config.initialScale, offsetX: config.initialOffsetX, offsetY: config.initialOffsetY })
  }

  private updateNodePositions(): void {
    for (const node of this.nodes.values()) {
      const { screenX, screenY } = this.viewport.simToScreen(node.x, node.y)
      node.screenX = screenX
      node.screenY = screenY
    }
  }

  private setupMouseHandlers(): void {
    if (this.config.enableZoom) this.canvas.addEventListener("wheel", this.onWheel)
    if (this.config.enableDrag) {
      this.canvas.addEventListener("mousedown", this.onMouseDown)
      document.addEventListener("mousemove", this.onMouseMove)
      document.addEventListener("mouseup", this.onMouseUp)
    }
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault()
    // Zoom towards the centre of the view, gently.
    const rect = this.canvas.getBoundingClientRect()
    this.viewport.zoom(event.deltaY > 0 ? 0.98 : 1.02, rect.width / 2, rect.height / 2, this.config.minScale, this.config.maxScale)
    this.updateNodePositions()
    this.draw()
  }

  private handleMouseDown(event: MouseEvent): void {
    this.isPanning = true
    this.panStartX = event.clientX
    this.panStartY = event.clientY
    this.panStartOffsetX = this.viewport.offsetX
    this.panStartOffsetY = this.viewport.offsetY
    this.canvas.style.cursor = "grabbing"
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isPanning) return
    const rect = this.canvas.getBoundingClientRect()
    this.viewport.offsetX = this.panStartOffsetX + ((event.clientX - this.panStartX) / rect.width) * (100 / this.viewport.scale)
    this.viewport.offsetY = this.panStartOffsetY + ((event.clientY - this.panStartY) / rect.height) * (100 / this.viewport.scale)
    this.updateNodePositions()
    this.draw()
  }

  private handleMouseUp(): void {
    if (!this.isPanning) return
    this.isPanning = false
    this.canvas.style.cursor = "grab"
  }

  private buildGraph(): void {
    for (const nodeDef of this.config.nodes) {
      this.nodes.set(nodeDef.id, { ...nodeDef, screenX: 0, screenY: 0, visitCount: nodeDef.id === this.config.startNode ? 1 : 0 })
      this.adjacencyList.set(nodeDef.id, [])
    }
    for (const edgeDef of this.config.edges) {
      const fromNode = this.nodes.get(edgeDef.from)
      const toNode = this.nodes.get(edgeDef.to)
      if (!fromNode || !toNode) {
        console.warn(`Edge references unknown node: ${edgeDef.from} -> ${edgeDef.to}`)
        continue
      }
      this.edges.push({ ...edgeDef, fromNode, toNode })
      const weight = edgeDef.weight ?? 1
      this.adjacencyList.get(edgeDef.from)!.push({ node: toNode, weight })
      if (!edgeDef.directed) this.adjacencyList.get(edgeDef.to)!.push({ node: fromNode, weight })
    }
  }

  private draw(): void {
    this.ctx.fillStyle = this.palette.paper
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    // Edges first, so nodes sit on top of them.
    this.drawEdges()
    this.drawNodes()
    this.drawAnt()
  }

  private drawEdges(): void {
    const { ctx, palette } = this
    const scale = this.viewport.scale
    const radius = this.config.nodeRadius * scale

    for (const edge of this.edges) {
      const from = edge.fromNode
      const to = edge.toNode
      const dx = to.screenX - from.screenX
      const dy = to.screenY - from.screenY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const unitX = dx / dist
      const unitY = dy / dist
      // From the rim of one node to the rim of the other.
      const startX = from.screenX + unitX * radius
      const startY = from.screenY + unitY * radius
      const endX = to.screenX - unitX * radius
      const endY = to.screenY - unitY * radius

      ctx.beginPath()
      ctx.strokeStyle = palette.edge
      ctx.lineWidth = 2 * scale
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()

      if (edge.directed) this.drawArrowHead(endX, endY, unitX, unitY)

      if (this.config.showWeights || this.config.showProbabilities) {
        let label: string
        if (this.config.showProbabilities) {
          const total = (this.adjacencyList.get(edge.from) ?? []).reduce((sum, n) => sum + n.weight, 0)
          label = ((edge.weight ?? 1) / total).toFixed(2)
        } else {
          label = String(edge.weight ?? 1)
        }
        const midX = (startX + endX) / 2
        const midY = (startY + endY) / 2
        ctx.font = `${12 * scale}px ${palette.font}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        const width = ctx.measureText(label).width
        ctx.fillStyle = palette.paper
        ctx.fillRect(midX - width / 2 - 2, midY - 8, width + 4, 16)
        ctx.fillStyle = palette.text
        ctx.fillText(label, midX, midY)
      }
    }
  }

  private drawArrowHead(x: number, y: number, unitX: number, unitY: number): void {
    const { ctx } = this
    const size = 10 * this.viewport.scale
    const angle = Math.atan2(unitY, unitX)
    ctx.beginPath()
    ctx.fillStyle = this.palette.edge
    ctx.moveTo(x, y)
    ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6))
    ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6))
    ctx.closePath()
    ctx.fill()
  }

  private drawNodes(): void {
    const { ctx, palette } = this
    const scale = this.viewport.scale
    const radius = this.config.nodeRadius * scale

    for (const node of this.nodes.values()) {
      const isCurrent = node.id === this.currentNodeId
      ctx.beginPath()
      if (node.shape === "hexagon") this.tracePolygon(node.screenX, node.screenY, radius, 6, -Math.PI / 6)
      else if (node.shape === "pentagon") this.tracePolygon(node.screenX, node.screenY, radius, 5, -Math.PI / 2)
      else ctx.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2)

      const fill = palette.fills.get(node.id) ?? (isCurrent ? palette.current : palette.node)
      ctx.fillStyle = fill
      ctx.fill()
      ctx.strokeStyle = isCurrent ? palette.currentBorder : palette.nodeBorder
      ctx.lineWidth = isCurrent ? 3 : 2
      ctx.stroke()

      if (node.label) {
        ctx.fillStyle = palette.ink.on(fill)
        ctx.font = `bold ${14 * scale}px ${palette.font}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(node.label, node.screenX, node.screenY)
      }

      if (this.config.trackVisits && node.visitCount > 0) {
        const bx = node.screenX + radius * 0.7
        const by = node.screenY - radius * 0.7
        ctx.fillStyle = palette.badge
        ctx.beginPath()
        ctx.arc(bx, by, 10 * scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = palette.badgeText
        ctx.font = `bold ${10 * scale}px ${palette.font}`
        ctx.fillText(String(node.visitCount), bx, by)
      }
    }
  }

  private tracePolygon(cx: number, cy: number, radius: number, sides: number, rotation: number): void {
    const { ctx } = this
    ctx.beginPath()
    for (let i = 0; i < sides; i++) {
      const angle = ((Math.PI * 2) / sides) * i + rotation
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
  }

  private drawAnt(): void {
    const { ctx } = this
    const s = this.viewport.scale
    let x: number
    let y: number
    if (this.animating && this.animationFromNode && this.animationToNode) {
      const progress = Math.min(1, (performance.now() - this.animationStart) / this.animationDuration)
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
      x = this.animationFromNode.screenX + (this.animationToNode.screenX - this.animationFromNode.screenX) * eased
      y = this.animationFromNode.screenY + (this.animationToNode.screenY - this.animationFromNode.screenY) * eased
    } else {
      const current = this.nodes.get(this.currentNodeId)
      if (!current) return
      x = current.screenX
      y = current.screenY
    }

    // Above the node it stands on.
    ctx.save()
    ctx.translate(x, y - this.config.nodeRadius * s - 12 * s - 5)
    ctx.fillStyle = this.palette.ant
    // Head, thorax and abdomen.
    for (const [cy, rx, ry] of [
      [-8, 4, 3.5],
      [-2, 3.5, 4],
      [6, 5, 6],
    ]) {
      ctx.beginPath()
      ctx.ellipse(0, cy * s, rx * s, ry * s, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    // Six legs.
    ctx.strokeStyle = this.palette.ant
    ctx.lineWidth = 1.5 * s
    for (const legY of [-4, -1, 2]) {
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(side * 3 * s, legY * s)
        ctx.quadraticCurveTo(side * 8 * s, (legY - 2) * s, side * 10 * s, (legY + 3) * s)
        ctx.stroke()
      }
    }
    // Antennae.
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(side * 2 * s, -10 * s)
      ctx.quadraticCurveTo(side * 4 * s, -16 * s, side * 6 * s, -18 * s)
      ctx.stroke()
    }
    ctx.restore()
  }

  private report(): void {
    const node = this.nodes.get(this.currentNodeId)
    this.onChange({ steps: this.stepCount, current: node?.label || this.currentNodeId, playing: this.isPlaying })
  }

  /** Walk to a neighbour, chosen at random by edge weight. */
  step(): void {
    if (this.animating) return
    const neighbors = this.adjacencyList.get(this.currentNodeId)
    if (!neighbors || neighbors.length === 0) {
      console.warn(`Node ${this.currentNodeId} has no neighbors`)
      return
    }
    let random = Math.random() * neighbors.reduce((sum, n) => sum + n.weight, 0)
    let next = neighbors[neighbors.length - 1].node
    for (const { node, weight } of neighbors) {
      random -= weight
      if (random <= 0) {
        next = node
        break
      }
    }
    this.animateTransition(next)
  }

  private animateTransition(toNode: GraphNode): void {
    const fromNode = this.nodes.get(this.currentNodeId)
    if (!fromNode) return
    this.animating = true
    this.animationStart = performance.now()
    this.animationFromNode = fromNode
    this.animationToNode = toNode

    const animate = () => {
      this.draw()
      if (performance.now() - this.animationStart < this.animationDuration) {
        this.animationFrame = requestAnimationFrame(animate)
        return
      }
      this.animating = false
      this.animationFromNode = null
      this.animationToNode = null
      this.animationFrame = null
      this.currentNodeId = toNode.id
      this.stepCount++
      toNode.visitCount++
      this.draw()
      this.report()
    }
    this.animationFrame = requestAnimationFrame(animate)
  }

  play(): void {
    if (this.isPlaying) return
    this.isPlaying = true
    this.playInterval = window.setInterval(() => this.step(), this.config.stepDelay)
    this.report()
  }

  pause(): void {
    if (!this.isPlaying) return
    this.isPlaying = false
    if (this.playInterval !== null) clearInterval(this.playInterval)
    this.playInterval = null
    this.report()
  }

  /** Back to the start node, with no steps taken. */
  reset(): void {
    this.pause()
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame)
    this.animationFrame = null
    this.animating = false
    this.animationFromNode = null
    this.animationToNode = null
    this.currentNodeId = this.config.startNode
    this.stepCount = 0
    this.nodes.forEach((node) => (node.visitCount = node.id === this.config.startNode ? 1 : 0))
    this.draw()
    this.report()
  }

  destroy(): void {
    if (this.playInterval !== null) clearInterval(this.playInterval)
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame)
    this.resizeObserver.disconnect()
    this.canvas.removeEventListener("wheel", this.onWheel)
    this.canvas.removeEventListener("mousedown", this.onMouseDown)
    document.removeEventListener("mousemove", this.onMouseMove)
    document.removeEventListener("mouseup", this.onMouseUp)
  }
}
