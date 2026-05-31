import { D3Config } from "../../components/Graph"

/**
 * Common graph configuration options shared across multiple page types.
 * These can be overridden in individual layouts as needed.
 */
export const defaultGraphOptions: Partial<D3Config> = {
  scale: 1,
  linkStrength: {
    tagTag: 1,
    tagPost: 0.5,
    postPost: 0.05,
  },
  edgeOpacity: {
    tagTag: { min: 0.8, max: 1 },
    tagPost: { min: 0.2, max: 1 },
    postPost: { min: 0.2, max: 1 },
  },
  repelForce: 3,
  centerForce: 1.75,
  linkDistance: {
    tagTag: 50,
    tagPost: 10,
    postPost: 10,
  },
  baseSize: {
    tags: 15,
    posts: 10,
  },
  sizeScaling: {
    tags: 1.2,
    posts: 1,
  },
  labelAnchor: {
    baseY: 1.2,
    scaleFactor: 0.05,
  },
  nodeColors: {
    public: undefined,   // Uses CSS --secondary by default
    private: "#c54040",  // Pink color for private notes
  },
  linkStyle: {
    tagTag: "solid",
    tagPost: "solid",
    postPost: "dotted",
  },
  privatePostSizeMultiplier: 0.8,  // Private posts are half the size
  removeTags: ["private"],
  defaultFilterState: {
    timePeriod: "month",        // Static fallback (ignored when adaptiveTimePeriod resolves)
    includePrivate: false,     // Exclude private posts by default
    adaptiveTimePeriod: {       // Auto-widen the span until at least minPosts are in view
      minPosts: 3,              // Narrowest period with ≥1 visible post wins
      // order defaults to month→year→all
    },
  },
  expandSelectedSize: 1.4,
  expandSelectedOscillationTime: 2,
}

/**
 * Local graph options optimized for content pages.
 * Shows immediate connections with tighter spacing.
 */
export const defaultLocalGraphOptions: Partial<D3Config> = {
  ...defaultGraphOptions,
  scale: 1,
  linkDistance: {
    tagTag: 50,
    tagPost: 50,
    postPost: 50,
  },
  linkStrength: {
    tagTag: 0.3,
    tagPost: 0.3,
    postPost: 0.3,
  },
  edgeOpacity: {
    tagTag: { min: 1, max: 1 },
    tagPost: { min: 0.75, max: 1 },
    postPost: { min: 0.5, max: 1 },
  },
  baseSize: {
    tags: 10,
    posts: 10,
  },
}

/**
 * Shell-based global graph config
 */
export const shellGraphOptions: Partial<D3Config> = {
  ...defaultGraphOptions,
  // Pseudo-shell style configuration
  graphStyle: "pseudo-shell",
  pseudoShellConfig: {
    radiusBase: 90,           // Base radius of the shell circle
    radiusScale: 40,            // Multiplier for sqrt(nodeCount) - maintains constant node density
    circumferentialRepulsion: 4,
    zoomMargin: 80,
    pinnedTags: [              // Top-level tags pinned to the shell
      "engineering",
      "writing",
      "horticulture",
      "projects",
      "economics"
    ],
    showShell: true,           // Render the shell circle
    shellStyle: {
      color: undefined,        // Uses CSS --lightgray by default
      opacity: 0.5,
      lineStyle: "dotted",
      lineWidth: 2,
    },
  },
}
