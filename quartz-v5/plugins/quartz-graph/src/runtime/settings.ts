// One graph's settings, as its container carries them in `data-cfg`, with every shorthand spelled out
// and every gap filled (v4 adapters/configAdapter.ts). A kind a per-kind map leaves out takes the
// plugin's default for it, as the component's merge already gave it.
import {
  PER_KIND,
  isRange,
  type ContainerConfig,
  type DefaultFilterState,
  type GraphStyle,
  type LineStyle,
  type PerEdge,
  type PerNode,
} from "../options"

export interface Shell {
  radiusBase: number
  radiusScale: number
  pinnedTags: string[]
  showShell: boolean
  zoomMargin: number
  circumferentialRepulsion: number
  /** A colour value, resolved when drawn. */
  color: string
  opacity: number
  lineStyle: LineStyle
  lineWidth: number
}

export interface Settings {
  global: boolean
  privateTags: string[]
  drag: boolean
  zoom: boolean
  depth: number
  scale: number
  repelForce: number
  centerForce: number
  fontSize: number
  opacityScale: number
  removeTags: string[]
  showTags: boolean
  focusOnHover: boolean
  enableRadial: boolean
  graphStyle: GraphStyle
  shell: Shell | null
  linkDistance: PerEdge<number>
  linkStrength: PerEdge<number>
  edgeOpacity: PerEdge<{ min: number; max: number }>
  baseSize: PerNode<number>
  sizeScaling: PerNode<number>
  /** Colour values, resolved when drawn. */
  nodeColors: { public: string | null; private: string | null }
  linkStyle: PerEdge<LineStyle>
  privatePostSizeMultiplier: number
  defaultFilterState: DefaultFilterState | null
  expandSelectedSize: number
  expandSelectedOscillationTime: number
}

const perEdge = <T>(
  value: T | Partial<PerEdge<T>> | undefined,
  fallback: PerEdge<T>,
  isOne: (v: unknown) => v is T,
): PerEdge<T> =>
  isOne(value)
    ? { tagTag: value, tagPost: value, postPost: value }
    : {
        tagTag: (value as Partial<PerEdge<T>> | undefined)?.tagTag ?? fallback.tagTag,
        tagPost: (value as Partial<PerEdge<T>> | undefined)?.tagPost ?? fallback.tagPost,
        postPost: (value as Partial<PerEdge<T>> | undefined)?.postPost ?? fallback.postPost,
      }

const perNode = (
  value: number | Partial<PerNode<number>> | undefined,
  fallback: PerNode<number>,
): PerNode<number> =>
  typeof value === "number"
    ? { tags: value, posts: value }
    : { tags: value?.tags ?? fallback.tags, posts: value?.posts ?? fallback.posts }

const isNumber = (v: unknown): v is number => typeof v === "number"
const never = (_: unknown): _ is never => false

function edgeOpacityRanges(
  value: ContainerConfig["edgeOpacity"],
): PerEdge<{ min: number; max: number }> {
  const fallback = PER_KIND.edgeOpacity
  if (!value) return fallback
  // v4's older form, one range for every kind of edge.
  if (isRange(value)) {
    const { min = 0.2, max = 1.0 } = value
    return { tagTag: { min, max }, tagPost: { min, max }, postPost: { min, max } }
  }
  const perKind = value as Partial<PerEdge<{ min?: number; max?: number }>>
  const range = (kind: keyof PerEdge<unknown>) => ({
    min: perKind[kind]?.min ?? fallback[kind].min,
    max: perKind[kind]?.max ?? fallback[kind].max,
  })
  return { tagTag: range("tagTag"), tagPost: range("tagPost"), postPost: range("postPost") }
}

export function settingsOf(cfg: ContainerConfig): Settings {
  const graphStyle = cfg.graphStyle ?? "freeform"
  const shell = cfg.pseudoShellConfig
  return {
    global: cfg.global,
    privateTags: cfg.privateTags ?? [],
    drag: cfg.drag,
    zoom: cfg.zoom,
    depth: cfg.depth,
    scale: cfg.scale,
    repelForce: cfg.repelForce,
    centerForce: cfg.centerForce,
    fontSize: cfg.fontSize,
    opacityScale: cfg.opacityScale,
    removeTags: cfg.removeTags ?? [],
    showTags: cfg.showTags,
    focusOnHover: cfg.focusOnHover ?? false,
    enableRadial: cfg.enableRadial ?? false,
    graphStyle,
    shell:
      graphStyle === "pseudo-shell"
        ? {
            radiusBase: shell?.radiusBase ?? 200,
            radiusScale: shell?.radiusScale ?? 1.5,
            pinnedTags: shell?.pinnedTags ?? [],
            showShell: shell?.showShell ?? true,
            zoomMargin: shell?.zoomMargin ?? 50,
            circumferentialRepulsion: shell?.circumferentialRepulsion ?? 0.5,
            color: shell?.shellStyle?.color ?? "var(--lightgray)",
            opacity: shell?.shellStyle?.opacity ?? 0.3,
            lineStyle: shell?.shellStyle?.lineStyle ?? "dotted",
            lineWidth: shell?.shellStyle?.lineWidth ?? 2,
          }
        : null,
    linkDistance: perEdge(cfg.linkDistance, PER_KIND.linkDistance, isNumber),
    linkStrength: perEdge(cfg.linkStrength, PER_KIND.linkStrength, never),
    edgeOpacity: edgeOpacityRanges(cfg.edgeOpacity),
    baseSize: perNode(cfg.baseSize, PER_KIND.baseSize),
    sizeScaling: perNode(cfg.sizeScaling, PER_KIND.sizeScaling),
    nodeColors: {
      public: cfg.nodeColors?.public ?? null,
      private: cfg.nodeColors?.private ?? null,
    },
    linkStyle: perEdge(cfg.linkStyle, PER_KIND.linkStyle, never),
    privatePostSizeMultiplier: cfg.privatePostSizeMultiplier ?? 1,
    defaultFilterState: cfg.defaultFilterState ?? null,
    expandSelectedSize: cfg.expandSelectedSize ?? 1.3,
    expandSelectedOscillationTime: cfg.expandSelectedOscillationTime ?? 2.0,
  }
}
