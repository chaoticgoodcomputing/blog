import { D3Config } from "../../components/Graph"

/**
 * Common graph configuration options shared across multiple page types.
 * These can be overridden in individual layouts as needed.
 */
export const defaultGraphOptions: Partial<D3Config> = {
  scale: 0.6,
  linkStrength: {
    tagTag: 1,
    tagPost: 0.2,
    postPost: 0.01,
  },
  edgeOpacity: {
    tagTag: { min: 1, max: 1 },
    tagPost: { min: 0.05, max: 0.8 },
    postPost: { min: 0.01, max: 0.8 },
  },
  repelForce: 3,
  centerForce: 0.25,
  linkDistance: {
    tagTag: 50,
    tagPost: 10,
    postPost: 10,
  },
  baseSize: {
    tags: 14,
    posts: 10,
  },
  sizeScaling: {
    tags: 1.25,
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
    timePeriod: "year",        // Default to showing posts from the last year
    includePrivate: false,     // Exclude private posts by default
  },
}

/**
 * Local graph options optimized for content pages.
 * Shows immediate connections with tighter spacing.
 */
export const defaultLocalGraphOptions: Partial<D3Config> = {
  ...defaultGraphOptions,
  scale: 0.75,
  linkDistance: {
    tagTag: 15,
    tagPost: 15,
    postPost: 15,
  },
  linkStrength: {
    tagTag: 0.3,
    tagPost: 0.3,
    postPost: 0.3,
  },
  repelForce: 3,
  sizeScaling: {
    tags: 0.5,
    posts: 1,
  },
  baseSize: {
    tags: 10,
    posts: 10,
  },
  edgeOpacity: {
    tagTag: { min: 1, max: 1 },
    tagPost: { min: 0.6, max: 0.8 },
    postPost: { min: 0.6, max: 0.8 },
  },
}

/**
 * Common graph configuration options shared across multiple page types.
 * These can be overridden in individual layouts as needed.
 */
export const shellGraphOptions: Partial<D3Config> = {
  ...defaultGraphOptions,
  linkStrength: {
    tagTag: 0.95,
    tagPost: 0.2,
    postPost: 0.2,
  },
  edgeOpacity: {
    tagTag: { min: 1, max: 1 },
    tagPost: { min: 0.1, max: 0.8 },
    postPost: { min: 0.1, max: 0.8 },
  },
  repelForce: 3,
  centerForce: 1.5,
  linkDistance: {
    tagTag: 50,
    tagPost: 1,
    postPost: 1,
  },
  // Pseudo-shell style configuration
  graphStyle: "pseudo-shell",
  pseudoShellConfig: {
    radiusBase: 90,           // Base radius of the shell circle
    radiusScale: 45,            // Multiplier for sqrt(nodeCount) - maintains constant node density
    circumferentialRepulsion: 3,
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
