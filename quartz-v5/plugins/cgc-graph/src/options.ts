// cgc-graph's options: v4's graph options (FORK-LEDGER components/Graph.tsx, layouts/conf/graph.layout.ts),
// with every colour a colour value (ADR-0003's colour-value amendment). Shared by the emitter, which
// checks them, the component, which hands each graph its settings, and the browser runtime, which
// reads them. Types and plain data only: the runtime imports this file too.

/** How the pages are laid out. `pseudo-shell` pins chosen top-level tags to a ring. */
export type GraphStyle = "freeform" | "pseudo-shell"

/** One setting per kind of edge: tag to subtag, tag to page, page to page. */
export interface PerEdge<T> {
  tagTag: T
  tagPost: T
  postPost: T
}

/** One setting per kind of node: tags and pages. */
export interface PerNode<T> {
  tags: T
  posts: T
}

export type LineStyle = "solid" | "dotted"
export type TimePeriod = "all" | "year" | "month"

export interface PseudoShellConfig {
  /** The ring's radius before it grows with the number of nodes. */
  radiusBase: number
  /** How much the ring grows with the square root of the number of nodes. */
  radiusScale: number
  /** The top-level tags pinned to the ring, such as `engineering`. */
  pinnedTags: string[]
  /** Whether to draw the ring. */
  showShell: boolean
  /** Room around the ring, in pixels, when the view zooms to fit it. */
  zoomMargin: number
  /** How strongly pinned tags push each other apart along the ring. */
  circumferentialRepulsion: number
  shellStyle: {
    /** A colour value. Default: the theme's `lightgray`. */
    color?: string
    opacity: number
    lineStyle: LineStyle
    lineWidth: number
  }
}

export interface DefaultFilterState {
  /** Which pages the global graph starts with, by date. */
  timePeriod?: TimePeriod
  /** Whether the global graph starts with private pages shown. */
  includePrivate?: boolean
  /**
   * Start with the narrowest period that holds at least `minPosts` pages, trying `order` from
   * narrowest to widest. Overrides `timePeriod`.
   */
  adaptiveTimePeriod?: { minPosts: number; order?: TimePeriod[] }
}

/** One graph's settings: the local graph's, or the global graph's. */
export interface GraphConfig {
  drag: boolean
  zoom: boolean
  /** How many links away from the current page to draw. -1 draws every page. */
  depth: number
  scale: number
  repelForce: number
  centerForce: number
  linkDistance: number | Partial<PerEdge<number>>
  linkStrength?: Partial<PerEdge<number>>
  fontSize: number
  opacityScale: number
  /** Tags left out of the graph, each with its subtags. */
  removeTags: string[]
  showTags: boolean
  focusOnHover?: boolean
  enableRadial?: boolean
  graphStyle?: GraphStyle
  pseudoShellConfig?: Partial<PseudoShellConfig>
  /** Edge opacity at twice its link distance (`min`) and at half of it (`max`). */
  edgeOpacity?: Partial<PerEdge<{ min?: number; max?: number }>> | { min?: number; max?: number }
  baseSize?: number | Partial<PerNode<number>>
  sizeScaling?: number | Partial<PerNode<number>>
  /** Colour values for page nodes, public and private, in place of the graph's own colours. */
  nodeColors?: { public?: string; private?: string }
  linkStyle?: Partial<PerEdge<LineStyle>>
  /** Private pages' size, as a share of a public page's. */
  privatePostSizeMultiplier?: number
  /** The global graph's filters, as it opens. */
  defaultFilterState?: DefaultFilterState
  /** How far the current page's node swells, as a multiple of its size. */
  expandSelectedSize?: number
  /** How long one swell takes, in seconds. */
  expandSelectedOscillationTime?: number
}

export interface GraphOptions {
  /**
   * The tags that make a page private: a page carrying one of them, or a descendant of one. Private
   * pages are drawn like any other, in `nodeColors.private` when that is set, and the global graph
   * can hide them. Default: none.
   */
  privateTags?: string[]
  /** The heading above the local graph. Default: `Graph View`. */
  title?: string
  localGraph?: Partial<GraphConfig>
  globalGraph?: Partial<GraphConfig>
}

/** What one graph's container carries to the browser, in `data-cfg`. */
export interface ContainerConfig extends GraphConfig {
  privateTags: string[]
  /** Whether this is the global graph, which gets the filters. */
  global: boolean
}

/** The settings that take one value per kind of edge or node, with each kind's default. */
export interface PerKindSettings {
  linkDistance: PerEdge<number>
  linkStrength: PerEdge<number>
  edgeOpacity: PerEdge<{ min: number; max: number }>
  baseSize: PerNode<number>
  sizeScaling: PerNode<number>
  linkStyle: PerEdge<LineStyle>
}

// v4's defaults (components/Graph.tsx).
export const PER_KIND: PerKindSettings = {
  linkDistance: { tagTag: 20, tagPost: 30, postPost: 50 },
  linkStrength: { tagTag: 2.0, tagPost: 1.0, postPost: 1.0 },
  edgeOpacity: {
    tagTag: { min: 0.3, max: 1.0 },
    tagPost: { min: 0.2, max: 1.0 },
    postPost: { min: 0.1, max: 0.8 },
  },
  baseSize: { tags: 4, posts: 2 },
  sizeScaling: { tags: 2, posts: 1 },
  linkStyle: { tagTag: "solid", tagPost: "solid", postPost: "dotted" },
}

// v4's defaults (components/Graph.tsx), without `tagColorGradient` and `labelAnchor`, which its canvas
// renderer never read.
const SHARED: Omit<
  GraphConfig,
  "depth" | "scale" | "centerForce" | "focusOnHover" | "enableRadial"
> = {
  ...PER_KIND,
  drag: true,
  zoom: true,
  repelForce: 0.5,
  fontSize: 0.6,
  opacityScale: 1,
  showTags: true,
  removeTags: [],
  nodeColors: {},
  privatePostSizeMultiplier: 1,
  expandSelectedSize: 1.3,
  expandSelectedOscillationTime: 2.0,
}

export const DEFAULT_LOCAL: GraphConfig = {
  ...SHARED,
  depth: 1,
  scale: 1.1,
  centerForce: 0.3,
  focusOnHover: false,
  enableRadial: false,
}

export const DEFAULT_GLOBAL: GraphConfig = {
  ...SHARED,
  depth: -1,
  scale: 0.9,
  centerForce: 0.2,
  focusOnHover: true,
  enableRadial: true,
  defaultFilterState: { timePeriod: "all", includePrivate: true },
}

export const DEFAULT_TITLE = "Graph View"

const isMap = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

/**
 * One graph's settings: the site's over the defaults, a key at a time, as v4 merged them, except that
 * a per-kind map is merged a kind at a time, so a kind the site leaves out keeps its default. A number,
 * or `edgeOpacity`'s single `{ min, max }` range, stands for every kind and replaces the map.
 */
function merged(defaults: GraphConfig, site: Partial<GraphConfig> = {}): GraphConfig {
  const config: Record<string, unknown> = { ...defaults, ...site }
  for (const key of Object.keys(PER_KIND) as (keyof PerKindSettings)[]) {
    const value = site[key]
    const perKind = isMap(value) && !("min" in value || "max" in value)
    if (perKind && isMap(defaults[key])) config[key] = { ...defaults[key], ...value }
  }
  return config as unknown as GraphConfig
}

/** Each graph's settings, as its container carries them. */
export function containerConfigs(options: GraphOptions = {}): {
  local: ContainerConfig
  global: ContainerConfig
} {
  const privateTags = options.privateTags ?? []
  return {
    local: { ...merged(DEFAULT_LOCAL, options.localGraph), privateTags, global: false },
    global: { ...merged(DEFAULT_GLOBAL, options.globalGraph), privateTags, global: true },
  }
}

/** Every colour option a graph has, by where it is written, for the build to check. */
export function colourOptions(options: GraphOptions = {}): [string, unknown][] {
  const found: [string, unknown][] = []
  for (const graph of ["localGraph", "globalGraph"] as const) {
    const config = options[graph]
    for (const kind of ["public", "private"] as const) {
      const value = config?.nodeColors?.[kind]
      if (value !== undefined) found.push([`${graph}.nodeColors.${kind}`, value])
    }
    const shell = config?.pseudoShellConfig?.shellStyle?.color
    if (shell !== undefined) found.push([`${graph}.pseudoShellConfig.shellStyle.color`, shell])
  }
  return found
}

/** The option keys the plugin reads. Any other is a mistake, and fails the build. */
export const OPTIONS: (keyof GraphOptions)[] = ["privateTags", "title", "localGraph", "globalGraph"]

// The keys of each map of settings, and the values of each setting that takes a word, for the build
// to check. Written as records so the compiler keeps them in step with the types above.
const keys = <T>(record: Record<keyof T, true>) => Object.keys(record) as (keyof T & string)[]

export const GRAPH_SETTINGS = keys<GraphConfig>({
  drag: true,
  zoom: true,
  depth: true,
  scale: true,
  repelForce: true,
  centerForce: true,
  linkDistance: true,
  linkStrength: true,
  fontSize: true,
  opacityScale: true,
  removeTags: true,
  showTags: true,
  focusOnHover: true,
  enableRadial: true,
  graphStyle: true,
  pseudoShellConfig: true,
  edgeOpacity: true,
  baseSize: true,
  sizeScaling: true,
  nodeColors: true,
  linkStyle: true,
  privatePostSizeMultiplier: true,
  defaultFilterState: true,
  expandSelectedSize: true,
  expandSelectedOscillationTime: true,
})
export const SHELL_SETTINGS = keys<PseudoShellConfig>({
  radiusBase: true,
  radiusScale: true,
  pinnedTags: true,
  showShell: true,
  zoomMargin: true,
  circumferentialRepulsion: true,
  shellStyle: true,
})
export const SHELL_STYLE_SETTINGS = keys<PseudoShellConfig["shellStyle"]>({
  color: true,
  opacity: true,
  lineStyle: true,
  lineWidth: true,
})
export const FILTER_SETTINGS = keys<DefaultFilterState>({
  timePeriod: true,
  includePrivate: true,
  adaptiveTimePeriod: true,
})
export const EDGE_KINDS = keys<PerEdge<unknown>>({ tagTag: true, tagPost: true, postPost: true })
export const NODE_KINDS = keys<PerNode<unknown>>({ tags: true, posts: true })
export const GRAPH_STYLES = keys<Record<GraphStyle, true>>({ freeform: true, "pseudo-shell": true })
export const LINE_STYLES = keys<Record<LineStyle, true>>({ solid: true, dotted: true })
export const TIME_PERIODS = keys<Record<TimePeriod, true>>({ all: true, year: true, month: true })
