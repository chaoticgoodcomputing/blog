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
          <button class="global-graph-icon" aria-label="Global Graph">
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              x="0px"
              y="0px"
              viewBox="0 0 55 55"
              fill="currentColor"
              xmlSpace="preserve"
            >
              <path
                d="M49,0c-3.309,0-6,2.691-6,6c0,1.035,0.263,2.009,0.726,2.86l-9.829,9.829C32.542,17.634,30.846,17,29,17
                s-3.542,0.634-4.898,1.688l-7.669-7.669C16.785,10.424,17,9.74,17,9c0-2.206-1.794-4-4-4S9,6.794,9,9s1.794,4,4,4
                c0.74,0,1.424-0.215,2.019-0.567l7.669,7.669C21.634,21.458,21,23.154,21,25s0.634,3.542,1.688,4.897L10.024,42.562
                C8.958,41.595,7.549,41,6,41c-3.309,0-6,2.691-6,6s2.691,6,6,6s6-2.691,6-6c0-1.035-0.263-2.009-0.726-2.86l12.829-12.829
                c1.106,0.86,2.44,1.436,3.898,1.619v10.16c-2.833,0.478-5,2.942-5,5.91c0,3.309,2.691,6,6,6s6-2.691,6-6c0-2.967-2.167-5.431-5-5.91
                v-10.16c1.458-0.183,2.792-0.759,3.898-1.619l7.669,7.669C41.215,39.576,41,40.26,41,41c0,2.206,1.794,4,4,4s4-1.794,4-4
                s-1.794-4-4-4c-0.74,0-1.424,0.215-2.019,0.567l-7.669-7.669C36.366,28.542,37,26.846,37,25s-0.634-3.542-1.688-4.897l9.665-9.665
                C46.042,11.405,47.451,12,49,12c3.309,0,6-2.691,6-6S52.309,0,49,0z M11,9c0-1.103,0.897-2,2-2s2,0.897,2,2s-0.897,2-2,2
                S11,10.103,11,9z M6,51c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S8.206,51,6,51z M33,49c0,2.206-1.794,4-4,4s-4-1.794-4-4
                s1.794-4,4-4S33,46.794,33,49z M29,31c-3.309,0-6-2.691-6-6s2.691-6,6-6s6,2.691,6,6S32.309,31,29,31z M47,41c0,1.103-0.897,2-2,2
                s-2-0.897-2-2s0.897-2,2-2S47,39.897,47,41z M49,10c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S51.206,10,49,10z"
              />
            </svg>
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
