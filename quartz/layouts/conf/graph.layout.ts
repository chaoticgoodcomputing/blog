import { D3Config } from "../../components/Graph"

/**
 * Common graph configuration options shared across multiple page types.
 * These can be overridden in individual layouts as needed.
 */
export const defaultGraphOptions: Partial<D3Config> = {
  scale: 0.5,
  linkStrength: {
    tagTag: 0.5,
    tagPost: 0.20,
    postPost: 0.03,
  },
  edgeOpacity: {
    tagTag: { min: 0.9, max: 0.9 },
    tagPost: { min: 0.0, max: 0.9 },
    postPost: { min: 0.0, max: 0.9 },
  },
  repelForce: 2.5,
  centerForce: 0.25,
  linkDistance: {
    tagTag: 50,
    tagPost: 75,
    postPost: 100,
  },
  baseSize: {
    tags: 10,
    posts: 10,
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
    private: "#ca7878",  // Pink color for private notes
  },
  linkStyle: {
    tagTag: "solid",
    tagPost: "solid",
    postPost: "dotted",
  },
  privatePostSizeMultiplier: 0.8,  // Private posts are half the size
}

/**
 * Local graph options optimized for content pages.
 * Shows immediate connections with tighter spacing.
 */
export const defaultLocalGraphOptions: Partial<D3Config> = {
  ...defaultGraphOptions,
  scale: 0.5,
  linkDistance: {
    tagTag: 25,
    tagPost: 25,
    postPost: 25,
  },
  sizeScaling: {
    tags: 1,
    posts: 1,
  },
}
