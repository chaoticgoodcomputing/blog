import { JSX } from "preact"

/**
 * Node definition for the graph
 */
export interface NodeDefinition {
  /** Unique identifier for the node */
  id: string
  /** X position (0-100 grid coordinates) */
  x: number
  /** Y position (0-100 grid coordinates) */
  y: number
  /** Optional label to display */
  label?: string
  /** Optional color override */
  color?: string
  /** Optional node shape: "circle" (default) or "hexagon" or "pentagon" */
  shape?: "circle" | "hexagon" | "pentagon"
}

/**
 * Edge definition connecting two nodes
 */
export interface EdgeDefinition {
  /** Source node ID */
  from: string
  /** Target node ID */
  to: string
  /** Whether this edge is directional (shows arrow). Default: false */
  directed?: boolean
  /** Optional weight for transition probability. Default: 1 */
  weight?: number
}

/**
 * Props for the Random Walk widget.
 */
export interface RandomWalkProps {
  /** Array of node definitions */
  nodes: NodeDefinition[]
  /** Array of edge definitions */
  edges: EdgeDefinition[]
  /** Starting node ID for the ant */
  startNode: string
  /** Height of the canvas in pixels. @default 400 */
  height?: number
  /** Milliseconds between animation steps. @default 500 */
  stepDelay?: number
  /** Whether to show edge weights. @default false */
  showWeights?: boolean
  /** Whether to show transition probability on edges. @default false */
  showProbabilities?: boolean
  /** Node radius in pixels. @default 20 */
  nodeRadius?: number
  /** Whether to track visit counts. @default true */
  trackVisits?: boolean
}

/**
 * Random Walk widget - displays a graph with an ant that performs random walks.
 *
 * Implements an interactive visualization of Markov chain random walks on a graph.
 * Users can step through the walk manually or auto-play the simulation.
 *
 * @example
 * ```mdx
 * import { RandomWalk } from '@content/widgets/random-walk'
 *
 * <RandomWalk
 *   nodes={[
 *     { id: "A", x: 20, y: 50, label: "A" },
 *     { id: "B", x: 50, y: 20, label: "B" },
 *     { id: "C", x: 80, y: 50, label: "C" },
 *   ]}
 *   edges={[
 *     { from: "A", to: "B" },
 *     { from: "B", to: "C" },
 *     { from: "C", to: "A" },
 *   ]}
 *   startNode="A"
 * />
 * ```
 */
export function RandomWalk(props: RandomWalkProps): JSX.Element {
  const {
    nodes,
    edges,
    startNode,
    height = 400,
    stepDelay = 500,
    showWeights = false,
    showProbabilities = false,
    nodeRadius = 20,
    trackVisits = true,
  } = props

  // Serialize configuration for the client script
  const config = {
    nodes,
    edges,
    startNode,
    height,
    stepDelay,
    showWeights,
    showProbabilities,
    nodeRadius,
    trackVisits,
  }

  return (
    <div
      class="widget-random-walk"
      data-widget="random-walk"
      data-config={JSON.stringify(config)}
      style="background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem; margin: 1rem 0; display: flex; flex-direction: column;"
    >
      <div class="random-walk-controls" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background-color: #ffffff; border-radius: 4px; margin-bottom: 0.5rem;">
        <button class="random-walk-reset" title="Reset to start" style="width: 36px; height: 36px; border: 2px solid #cccccc; background-color: white; border-radius: 4px; cursor: pointer; font-size: 16px; display: inline-flex; align-items: center; justify-content: center; color: #666;">⟲</button>
        <button class="random-walk-step" title="Take one step" style="width: 36px; height: 36px; border: 2px solid #cccccc; background-color: white; border-radius: 4px; cursor: pointer; font-size: 16px; display: inline-flex; align-items: center; justify-content: center; color: #666;">→</button>
        <button class="random-walk-play" title="Auto-play" style="width: 36px; height: 36px; border: 2px solid #cccccc; background-color: white; border-radius: 4px; cursor: pointer; font-size: 16px; display: inline-flex; align-items: center; justify-content: center; color: #666;">▶</button>
        <button class="random-walk-pause" title="Pause" style="display: none; width: 36px; height: 36px; border: 2px solid #cccccc; background-color: white; border-radius: 4px; cursor: pointer; font-size: 16px; align-items: center; justify-content: center; color: #666;">⏸</button>
        <span class="random-walk-step-count" style="margin-left: auto; font-family: monospace; font-size: 14px; color: #333;">Steps: 0</span>
      </div>
      <canvas class="random-walk-canvas" style="width: 100%; display: block; border: 1px solid #ddd; background-color: white; border-radius: 4px;"></canvas>
      <div class="random-walk-info" style="display: flex; justify-content: center; padding: 0.5rem; font-size: 14px; color: #333;">
        <span class="random-walk-current-node" style="font-family: monospace; background-color: white; padding: 0.25rem 0.75rem; border-radius: 4px; border: 1px solid #ddd;">Current: {startNode}</span>
      </div>
    </div>
  )
}
