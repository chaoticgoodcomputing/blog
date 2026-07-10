import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/graph/main.inline"
import style from "./styles/graph.scss"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"

export type GraphStyle = "freeform" | "pseudo-shell"

export interface PseudoShellConfig {
  radiusBase: number              // Base radius of the circle
  radiusScale: number             // Scaling factor for radius based on node count
  pinnedTags: string[]            // Tags that should be pinned to the shell (e.g., ["engineering", "writing"])
  showShell: boolean              // Whether to render the shell circle
  zoomMargin?: number             // Additional margin (in pixels) to add when auto-zooming to fit shell (default: 50)
  circumferentialRepulsion?: number  // Strength of angular repulsion between pinned nodes (default: 0.5)
  shellStyle?: {
    color?: string                // Color of the shell (default: CSS --lightgray)
    opacity?: number              // Opacity of the shell line (default: 0.3)
    lineStyle?: "solid" | "dotted"  // Line style (default: "dotted")
    lineWidth?: number            // Width of the shell line (default: 2)
  }
}

export interface D3Config {
  drag: boolean
  zoom: boolean
  depth: number
  scale: number
  repelForce: number
  centerForce: number
  linkDistance: number | {
    tagTag?: number      // Distance for parent-child tag connections
    tagPost?: number     // Distance for tag-to-post connections
    postPost?: number    // Distance for post-to-post connections
  }
  fontSize: number
  opacityScale: number
  removeTags: string[]
  showTags: boolean
  focusOnHover?: boolean
  enableRadial?: boolean
  graphStyle?: GraphStyle         // Graph layout style (default: "freeform")
  pseudoShellConfig?: PseudoShellConfig  // Configuration for pseudo-shell style
  linkStrength?: {
    tagTag?: number      // Parent-child tag connections
    tagPost?: number     // Tag-to-post connections
    postPost?: number    // Post-to-post connections
  }
  tagColorGradient?: string[]  // Array of hex colors for tag gradient
  edgeOpacity?: {
    tagTag?: { min?: number; max?: number }    // Opacity for parent-child tag connections
    tagPost?: { min?: number; max?: number }   // Opacity for tag-to-post connections
    postPost?: { min?: number; max?: number }  // Opacity for post-to-post connections
  } | {
    min?: number    // Legacy: Minimum opacity at 2x linkDistance (applies to all)
    max?: number    // Legacy: Maximum opacity at 0.5x linkDistance (applies to all)
  }
  baseSize?: number | {
    tags?: number    // Base size for tag nodes
    posts?: number   // Base size for post nodes
  }
  sizeScaling?: number | {
    tags?: number    // Scaling factor for tag nodes based on sqrt(connections) (default: 2)
    posts?: number   // Scaling factor for post nodes based on sqrt(connections) (default: 1)
  }
  labelAnchor?: {
    baseY?: number         // Base y-anchor position (default: 1.2)
    scaleFactor?: number   // How much node size affects label position (default: 0.05)
  }
  nodeColors?: {
    public?: string      // Color for public nodes (default: uses CSS --secondary)
    private?: string     // Color for private nodes (nodes with #private tag)
  }
  linkStyle?: {
    tagTag?: 'solid' | 'dotted'      // Line style for tag-tag connections (default: 'solid')
    tagPost?: 'solid' | 'dotted'     // Line style for tag-post connections (default: 'solid')
    postPost?: 'solid' | 'dotted'    // Line style for post-post connections (default: 'dotted')
  }
  privatePostSizeMultiplier?: number  // Size multiplier for private posts (default: 1, e.g., 0.5 for half size)
  defaultFilterState?: {
    timePeriod?: 'all' | 'year' | 'month'  // Default time period filter (default: 'all')
    includePrivate?: boolean               // Default private post visibility (default: true)
    adaptiveTimePeriod?: {                 // When set, resolves timePeriod at runtime from post counts (overrides timePeriod)
      minPosts: number                     // Settle on the narrowest period with at least this many posts
      order?: ('all' | 'year' | 'month')[] // Narrow→wide preference (default: ['month', 'year', 'all'])
    }
  }
  expandSelectedSize?: number             // Percentage multiplier for expanded size (e.g., 1.5 = 150% of base size)
  expandSelectedOscillationTime?: number  // Time in seconds for full expand-contract cycle
}

interface GraphOptions {
  localGraph: Partial<D3Config> | undefined
  globalGraph: Partial<D3Config> | undefined
}

const defaultOptions: GraphOptions = {
  localGraph: {
    drag: true,
    zoom: true,
    depth: 1,
    scale: 1.1,
    repelForce: 0.5,
    centerForce: 0.3,
    linkDistance: {
      tagTag: 20,      // Shorter distance for parent-child tags (keep them close)
      tagPost: 30,     // Normal distance for tag-to-post connections
      postPost: 50,    // Longer distance for post-to-post connections
    },
    fontSize: 0.6,
    opacityScale: 1,
    showTags: true,
    removeTags: [],
    focusOnHover: false,
    enableRadial: false,
    linkStrength: {
      tagTag: 2.0,     // Strong connections between parent-child tags
      tagPost: 1.0,    // Normal connections between tags and posts
      postPost: 1.0,   // Normal connections between posts
    },
    tagColorGradient: ["#FF0000", "#00FF00", "#0000FF"],
    edgeOpacity: {
      tagTag: { min: 0.3, max: 1.0 },   // Parent-child tags: more visible
      tagPost: { min: 0.2, max: 1.0 },  // Tag-post connections: standard
      postPost: { min: 0.1, max: 0.8 }, // Post-post connections: more subtle
    },
    baseSize: {
      tags: 4,
      posts: 2,
    },
    sizeScaling: {
      tags: 2,
      posts: 1,
    },
    labelAnchor: {
      baseY: 1.2,
      scaleFactor: 0.05,
    },
    nodeColors: {
      public: undefined,   // Uses CSS --secondary by default
      private: undefined,  // Will be computed if not specified
    },
    linkStyle: {
      tagTag: 'solid',
      tagPost: 'solid',
      postPost: 'dotted',
    },
    privatePostSizeMultiplier: 1,
    expandSelectedSize: 1.3,
    expandSelectedOscillationTime: 2.0,
  },
  globalGraph: {
    drag: true,
    zoom: true,
    depth: -1,
    scale: 0.9,
    repelForce: 0.5,
    centerForce: 0.2,
    linkDistance: {
      tagTag: 20,      // Shorter distance for parent-child tags (keep them close)
      tagPost: 30,     // Normal distance for tag-to-post connections
      postPost: 50,    // Longer distance for post-to-post connections
    },
    fontSize: 0.6,
    opacityScale: 1,
    showTags: true,
    removeTags: [],
    focusOnHover: true,
    enableRadial: true,
    linkStrength: {
      tagTag: 2.0,     // Strong connections between parent-child tags
      tagPost: 1.0,    // Normal connections between tags and posts
      postPost: 1.0,   // Normal connections between posts
    },
    tagColorGradient: ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3"],  // Rainbow: Red, Orange, Yellow, Green, Blue, Indigo, Violet
    edgeOpacity: {
      tagTag: { min: 0.3, max: 1.0 },   // Parent-child tags: more visible
      tagPost: { min: 0.2, max: 1.0 },  // Tag-post connections: standard
      postPost: { min: 0.1, max: 0.8 }, // Post-post connections: more subtle
    },
    baseSize: {
      tags: 4,
      posts: 2,
    },
    sizeScaling: {
      tags: 2,
      posts: 1,
    },
    labelAnchor: {
      baseY: 1.2,
      scaleFactor: 0.05,
    },
    nodeColors: {
      public: undefined,   // Uses CSS --secondary by default
      private: undefined,  // Will be computed if not specified
    },
    linkStyle: {
      tagTag: 'solid',
      tagPost: 'solid',
      postPost: 'dotted',
    },
    privatePostSizeMultiplier: 1,
    defaultFilterState: {
      timePeriod: 'all',
      includePrivate: true,
    },
    expandSelectedSize: 1.3,
    expandSelectedOscillationTime: 2.0,
  },
}

export default ((opts?: Partial<GraphOptions>) => {
  const Graph: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const localGraph = { ...defaultOptions.localGraph, ...opts?.localGraph }
    const globalGraph = { ...defaultOptions.globalGraph, ...opts?.globalGraph }
    return (
      <div class={classNames(displayClass, "graph")}>
        <h3>{i18n(cfg.locale).components.graph.title}</h3>
        <div class="graph-outer">
          <div class="graph-container" data-cfg={JSON.stringify(localGraph)}></div>
          <button class="global-graph-icon" aria-label="View Global Graph">
            View Global Graph
          </button>
        </div>
        <div class="global-graph-outer">
          <div class="global-graph-container" data-cfg={JSON.stringify(globalGraph)}></div>
        </div>
      </div>
    )
  }

  Graph.css = style
  Graph.afterDOMLoaded = script

  return Graph
}) satisfies QuartzComponentConstructor
