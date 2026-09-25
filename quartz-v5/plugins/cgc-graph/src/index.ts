// cgc-graph: v4's graph view as a plugin (#74; FORK-LEDGER components/Graph.tsx and
// components/scripts/graph/**). The local graph draws the pages around the current one on a canvas,
// and the global graph draws every page, in a dialog with a date filter and a private filter. It is
// ours to ship because stock `@quartz-community/graph` reads only core's `contentIndex.json`, which
// has no dates and none of our artifacts (#20, #21).
//
// This is the plugin's emitter half. It publishes the graph's own content index,
// `static/cgcGraph.json` (docs/adr/0001), with the icons its tags are drawn with (docs/adr/0004), and
// ships the stylesheet in the family layer, `@layer cgc.graph` (ADR-0003 rule 11). The component is
// in ./components, and the script that draws in ./runtime.
//
// A consumer of the `cgc-tags` engine (ADR-0002): a page's tags and its primary tag in the index are
// the ones the engine publishes on its `fileData`, normalised, and the icons are the ones it names
// there, drawn here with @chaoticgoodcomputing/icons, since the engine draws nothing (#29).
import fs from "node:fs/promises"
import path from "node:path"
import type { BuildCtx, FilePath, ProcessedContent } from "@quartz-community/types"
import { getDate } from "@quartz-community/utils/sort"
import { transform } from "lightningcss"
import { createIcons } from "@chaoticgoodcomputing/icons"
import type { TagsData } from "@chaoticgoodcomputing/tags-core"
import { colourValueCheck } from "@chaoticgoodcomputing/tags-core/colour-value"
import style from "./style.css"
import {
  EDGE_KINDS,
  FILTER_SETTINGS,
  GRAPH_SETTINGS,
  GRAPH_STYLES,
  LINE_STYLES,
  NODE_KINDS,
  OPTIONS,
  SHELL_SETTINGS,
  SHELL_STYLE_SETTINGS,
  TIME_PERIODS,
  colourOptions,
  type GraphOptions,
} from "./options"
import { GRAPH_INDEX, type GraphEntry, type GraphIndex } from "./graph-index"

export type { GraphOptions, GraphConfig, PseudoShellConfig } from "./options"
export { GRAPH_INDEX, type GraphEntry, type GraphIndex } from "./graph-index"

class CgcGraphError extends Error {
  constructor(message: string) {
    super(`cgc-graph: ${message}`)
  }
}

const isColourValue = colourValueCheck(transform)
const isStringList = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
const isMap = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const listed = (words: readonly string[]) => words.map((word) => `"${word}"`).join(", ")

// A map of settings whose keys must be among `known`.
function checkMap(where: string, value: unknown, known: readonly string[]) {
  if (!isMap(value)) throw new CgcGraphError(`${where} must be a map of settings`)
  const unknown = Object.keys(value).find((key) => !known.includes(key))
  if (unknown !== undefined)
    throw new CgcGraphError(
      `unknown setting "${where}.${unknown}". The settings of ${where} are ${listed(known)}.`,
    )
}

// A setting that takes one of a few words.
function checkWord(where: string, value: unknown, words: readonly string[]) {
  if (value !== undefined && !words.includes(value as string))
    throw new CgcGraphError(`${where} must be one of ${listed(words)}: ${JSON.stringify(value)}`)
}

// A per-kind setting: one value for every kind (when `one` allows it), or a map by kind.
function checkPerKind(
  where: string,
  value: unknown,
  kinds: readonly string[],
  one: (value: unknown) => boolean,
  each: (where: string, value: unknown) => void = () => {},
) {
  if (value === undefined || one(value)) return
  checkMap(where, value, kinds)
  for (const [kind, v] of Object.entries(value as object)) each(`${where}.${kind}`, v)
}

const never = () => false
const isNumber = (value: unknown) => typeof value === "number"
const isRange = (value: unknown) =>
  isMap(value) && !EDGE_KINDS.some((kind) => kind in (value as object))

// One graph's settings: every key one the graph has, every map's keys too, and every word one the
// setting takes.
function checkGraph(where: string, config: unknown) {
  if (config === undefined) return
  checkMap(where, config, GRAPH_SETTINGS)
  const graph = config as Record<string, any>
  if (graph.removeTags !== undefined && !isStringList(graph.removeTags))
    throw new CgcGraphError(`${where}.removeTags must be a list of tags`)
  checkWord(`${where}.graphStyle`, graph.graphStyle, GRAPH_STYLES)
  checkPerKind(`${where}.linkDistance`, graph.linkDistance, EDGE_KINDS, isNumber)
  checkPerKind(`${where}.linkStrength`, graph.linkStrength, EDGE_KINDS, never)
  checkPerKind(`${where}.linkStyle`, graph.linkStyle, EDGE_KINDS, never, (at, value) =>
    checkWord(at, value, LINE_STYLES),
  )
  const range = (at: string, value: unknown) => checkMap(at, value, ["min", "max"])
  if (isRange(graph.edgeOpacity)) range(`${where}.edgeOpacity`, graph.edgeOpacity)
  else checkPerKind(`${where}.edgeOpacity`, graph.edgeOpacity, EDGE_KINDS, never, range)
  checkPerKind(`${where}.baseSize`, graph.baseSize, NODE_KINDS, isNumber)
  checkPerKind(`${where}.sizeScaling`, graph.sizeScaling, NODE_KINDS, isNumber)
  if (graph.nodeColors !== undefined)
    checkMap(`${where}.nodeColors`, graph.nodeColors, ["public", "private"])
  const shell = graph.pseudoShellConfig
  if (shell !== undefined) {
    checkMap(`${where}.pseudoShellConfig`, shell, SHELL_SETTINGS)
    if (shell.pinnedTags !== undefined && !isStringList(shell.pinnedTags))
      throw new CgcGraphError(`${where}.pseudoShellConfig.pinnedTags must be a list of tags`)
    if (shell.shellStyle !== undefined) {
      const at = `${where}.pseudoShellConfig.shellStyle`
      checkMap(at, shell.shellStyle, SHELL_STYLE_SETTINGS)
      checkWord(`${at}.lineStyle`, shell.shellStyle.lineStyle, LINE_STYLES)
    }
  }
  const filters = graph.defaultFilterState
  if (filters !== undefined) {
    const at = `${where}.defaultFilterState`
    checkMap(at, filters, FILTER_SETTINGS)
    checkWord(`${at}.timePeriod`, filters.timePeriod, TIME_PERIODS)
    const adaptive = filters.adaptiveTimePeriod
    if (adaptive !== undefined) {
      checkMap(`${at}.adaptiveTimePeriod`, adaptive, ["minPosts", "order"])
      if (adaptive.order !== undefined && !Array.isArray(adaptive.order))
        throw new CgcGraphError(`${at}.adaptiveTimePeriod.order must be a list of periods`)
      for (const period of adaptive.order ?? [])
        checkWord(`${at}.adaptiveTimePeriod.order`, period, TIME_PERIODS)
    }
  }
}

// The site's options, checked. Any mistake fails the build: an option or a setting the plugin
// doesn't have, a word a setting doesn't take, a colour CSS can't read (ADR-0003's colour-value
// amendment), a list that isn't one.
function check(options: GraphOptions = {}) {
  const unknown = Object.keys(options).find((key) => !OPTIONS.includes(key as keyof GraphOptions))
  if (unknown !== undefined)
    throw new CgcGraphError(`unknown option "${unknown}". The options are ${listed(OPTIONS)}.`)
  if (options.privateTags !== undefined && !isStringList(options.privateTags))
    throw new CgcGraphError(`privateTags must be a list of tags`)
  if (options.title !== undefined && typeof options.title !== "string")
    throw new CgcGraphError(`title must be a string`)
  const collections = options.iconCollections
  if (
    collections !== undefined &&
    !(isMap(collections) && Object.values(collections).every((dir) => typeof dir === "string"))
  )
    throw new CgcGraphError(`iconCollections must map each prefix to a directory`)
  for (const graph of ["localGraph", "globalGraph"] as const) checkGraph(graph, options[graph])
  for (const [where, value] of colourOptions(options)) {
    if (!isColourValue(value))
      throw new CgcGraphError(`${where} is not a CSS colour: ${JSON.stringify(value)}`)
  }
}

// Checked when a hook first runs, not when the factory does: the loader logs a factory's error and
// builds on without the plugin, where a hook's error fails the build.
function checkedOnce(options?: GraphOptions): () => void {
  let result: Error | true | undefined
  return () => {
    if (result === undefined) {
      try {
        check(options)
        result = true
      } catch (err) {
        result = err as Error
      }
    }
    if (result instanceof Error) throw result
  }
}

function isoDate(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const date = value instanceof Date ? value : new Date(value as string | number)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

/**
 * The index's pages: every page with a file behind it, `.md` or anything a page type renders from a
 * file, such as `.mdx`. The listings Quartz generates, tag pages and folder pages, have none and are
 * left out: the graph draws a tag as a node of its own. So are unlisted pages, as stock
 * content-index leaves them out.
 */
function pagesOf(content: ProcessedContent[]): GraphIndex["pages"] {
  const pages: GraphIndex["pages"] = {}
  for (const [, file] of content) {
    const data = file.data as Record<string, any>
    if (!data.filePath || data.unlisted === true || !data.slug) continue
    const tags = data.cgcTags as TagsData | undefined
    const primary = tags?.primary?.tag
    const date = isoDate(getDate(data as never))
    const entry: GraphEntry = {
      title: data.frontmatter?.title ?? data.slug,
      links: data.links ?? [],
      tags: Object.keys(tags?.tags ?? {}),
      ...(primary !== undefined && { primary }),
      ...(date !== undefined && { date }),
    }
    pages[data.slug] = entry
  }
  return pages
}

// The size, in pixels, an icon's `<svg>` says it is: what a browser that rasterises an image before
// it scales it rasterises at.
const ICON_SIZE = 64

/**
 * The index's icons: the icon of every tag some page is under, each drawn once. The engine names each
 * tag's icon, its own or inherited, on every page under the tag, and the graph draws a tag node, or
 * a page, with it. An id no collection has fails the build.
 */
function iconsOf(content: ProcessedContent[], options: GraphOptions): GraphIndex["icons"] {
  const named = new Map<string, string>()
  for (const [, file] of content) {
    const ancestors = (file.data.cgcTags as TagsData | undefined)?.ancestors ?? {}
    for (const [tag, { icon }] of Object.entries(ancestors)) {
      if (icon !== null && !named.has(icon)) named.set(icon, tag)
    }
  }
  const icons = createIcons({ iconCollections: options.iconCollections })
  const drawn: GraphIndex["icons"] = {}
  for (const [id, tag] of [...named].sort(([a], [b]) => a.localeCompare(b))) {
    try {
      // Drawn at a size a canvas can scale down from, rather than the library's `1em`.
      drawn[id] = icons.svg(id, { width: String(ICON_SIZE), height: String(ICON_SIZE) })
    } catch (err) {
      throw new CgcGraphError(`tag "${tag}": ${(err as Error).message}`)
    }
  }
  return drawn
}

/** The index: the pages every graph is drawn from, and the icons it draws them with. */
export function graphIndexOf(content: ProcessedContent[], options: GraphOptions = {}): GraphIndex {
  return { pages: pagesOf(content), icons: iconsOf(content, options) }
}

async function write(ctx: BuildCtx, file: string, content: string): Promise<FilePath> {
  const dest = path.join(ctx.argv.output, file)
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.writeFile(dest, content)
  return dest as FilePath
}

/** The emitter: publishes the graph's index, and ships the stylesheet. */
export default function CgcGraph(options?: GraphOptions) {
  const checked = checkedOnce(options)
  return {
    name: "CgcGraph",
    externalResources: () => {
      checked()
      return { css: [{ content: style, inline: true }] }
    },
    async emit(ctx: BuildCtx, content: ProcessedContent[]): Promise<FilePath[]> {
      checked()
      return [await write(ctx, GRAPH_INDEX, JSON.stringify(graphIndexOf(content, options)))]
    },
  }
}
