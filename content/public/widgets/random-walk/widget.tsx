// A random walk on a graph, as a cgc-mdx island: an ant steps from node to node, choosing each next
// edge at random by weight, which is a Markov chain the reader can step through or play.
//
// Ported from v4's component.tsx and script.inline.ts beside this file, which Quartz 4 reads until
// cutover. The controls and readouts render at build time; the canvas is drawn in the browser, in
// colours from the theme (widget.css), and a node's own `color` may be any colour value.
import { useEffect, useRef, useState } from "preact/hooks"
import { RandomWalkSimulation, type EdgeDefinition, type NodeDefinition, type Palette, type WalkConfig, type WalkState } from "./simulation"
import { isLight, onSchemeChange, resolveColour, skin } from "../scheme"
import "./widget.css"

export type { EdgeDefinition, NodeDefinition }

export interface RandomWalkProps {
  nodes: NodeDefinition[]
  edges: EdgeDefinition[]
  /** The node the ant starts on. */
  startNode: string
  /** Canvas height in pixels. */
  height?: number
  /** Milliseconds between steps while playing. */
  stepDelay?: number
  /** Label each edge with its weight. */
  showWeights?: boolean
  /** Label each edge with the chance the ant takes it from its source. */
  showProbabilities?: boolean
  /** Node radius in pixels. */
  nodeRadius?: number
  /** Count each node's visits. */
  trackVisits?: boolean
  /** Pan by dragging. */
  enableDrag?: boolean
  /** Zoom with the mouse wheel. */
  enableZoom?: boolean
  minScale?: number
  maxScale?: number
  /** The starting zoom. */
  initialScale?: number
  /** The starting pan, in the nodes' 0–100 coordinates. */
  initialOffsetX?: number
  initialOffsetY?: number
  /** Start zoomed to fit every node. */
  fitViewport?: boolean
  /** Start centred. */
  centerView?: boolean
  /** Start zoomed to this box, which overrides `fitViewport` and `centerView`. */
  viewportBounds?: { min: [number, number]; max: [number, number] }
}

// The canvas's colours, from the skin in widget.css and each node's own `color`, as they resolve now.
function readPalette(root: HTMLElement, nodes: NodeDefinition[]): Palette {
  const colour = (name: string) => skin(root, `--random-walk-${name}`)
  const [one, other] = [colour("ink-dark"), colour("ink-light")]
  const [dark, light] = isLight(one) ? [other, one] : [one, other]
  return {
    paper: colour("paper"),
    edge: colour("edge"),
    text: colour("text"),
    node: colour("node"),
    nodeBorder: colour("node-border"),
    current: colour("current"),
    currentBorder: colour("current-border"),
    badge: colour("badge"),
    badgeText: colour("badge-text"),
    ant: colour("ant"),
    ink: { dark, light, on: (fill) => (isLight(fill) ? dark : light) },
    fills: new Map(nodes.filter((node) => node.color).map((node) => [node.id, resolveColour(root, node.color!)])),
  }
}

export function RandomWalk({
  nodes,
  edges,
  startNode,
  height = 400,
  stepDelay = 500,
  showWeights = false,
  showProbabilities = false,
  nodeRadius = 20,
  trackVisits = true,
  enableDrag = true,
  enableZoom = true,
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
  initialOffsetX = 0,
  initialOffsetY = 0,
  fitViewport = false,
  centerView = false,
  viewportBounds,
}: RandomWalkProps) {
  const start = nodes.find((node) => node.id === startNode)
  const [state, setState] = useState<WalkState>({ steps: 0, current: start?.label || startNode, playing: false })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const walk = useRef<RandomWalkSimulation | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const root = canvas.parentElement!
    const config: WalkConfig = {
      nodes,
      edges,
      startNode,
      height,
      stepDelay,
      showWeights,
      showProbabilities,
      nodeRadius,
      trackVisits,
      enableDrag,
      enableZoom,
      minScale,
      maxScale,
      initialScale,
      initialOffsetX,
      initialOffsetY,
      fitViewport,
      centerView,
      viewportBounds,
    }
    const simulation = new RandomWalkSimulation(canvas, config, readPalette(root, nodes), setState)
    walk.current = simulation
    const stopWatching = onSchemeChange(() => simulation.repaint(readPalette(root, nodes)))
    return () => {
      stopWatching()
      simulation.destroy()
      walk.current = null
    }
  }, [])

  return (
    <div class="random-walk">
      <div class="random-walk__controls">
        <button class="random-walk__button" type="button" title="Reset to start" aria-label="Reset to start" onClick={() => walk.current?.reset()}>
          ⟲
        </button>
        <button class="random-walk__button" type="button" title="Take one step" aria-label="Take one step" onClick={() => walk.current?.step()}>
          →
        </button>
        {state.playing ? (
          <button class="random-walk__button" type="button" title="Pause" aria-label="Pause" onClick={() => walk.current?.pause()}>
            ⏸
          </button>
        ) : (
          <button class="random-walk__button" type="button" title="Auto-play" aria-label="Auto-play" onClick={() => walk.current?.play()}>
            ▶
          </button>
        )}
        <span class="random-walk__steps">Steps: {state.steps}</span>
      </div>
      {/* Its width is the column's, set once it hydrates; its height holds from the start. */}
      <canvas class="random-walk__canvas" ref={canvasRef} height={height} style={{ height: `${height}px` }} />
      <div class="random-walk__info">
        <span class="random-walk__current">Current: {state.current}</span>
      </div>
    </div>
  )
}
