// cgc-tags: the tag engine (ADR-0002's worked example, #20, #31). It owns the site's one tag
// dictionary and publishes it resolved, through the two channels ADR-0002 allows:
//
// - per page, on `fileData.cgcTags`: the page's own tags, its primary tag and its expanded ancestor
//   set (`TagsData` in @chaoticgoodcomputing/tags-core);
// - for the browser, `static/cgcTags.json`: every tag in the corpus, with its colour property's name
//   and its icon id;
//
// and, since a tag colour is a CSS colour value, a stylesheet in the family layer, `cgc.tags`, that
// defines one `--cgc-tag-<tag>` property per tag. A tag with no colour of its own points at its
// parent's property, so inheritance runs through the cascade and a site can restyle any tag, with
// its descendants following. The engine draws nothing: no badge, no icon (rule 7).
//
// Two factories, one per category, so Quartz collects the stylesheet once: core gathers
// `externalResources()` from transformers and emitters alike, and one factory would be instantiated
// as both. The loader picks each by its shape.
import fs from "node:fs/promises"
import path from "node:path"
import type { BuildCtx, FilePath, ProcessedContent } from "@quartz-community/types"
import { slugTag } from "@quartz-community/utils/path"
import {
  DEFAULT_COLOR_PROPERTY,
  colorPropertyOf,
  colorValueOf,
  lineageOf,
  propertiesOf,
  tagsDataOf,
  type TagDefinition,
  type TagDictionary,
  type TagsData,
} from "@chaoticgoodcomputing/tags-core"
import { isColourValue } from "./colour"

export type {
  TagDefinition,
  TagDictionary,
  TagProperties,
  TagsData,
  PrimaryTag,
} from "@chaoticgoodcomputing/tags-core"

export interface CgcTagsOptions {
  /** The dictionary: one entry per tag that differs from its parent. Every other tag inherits. */
  tags?: Record<string, TagDefinition>
  /** The colour a tag gets when neither it nor any ancestor has one. A colour value; `var(--darkgray)`. */
  defaultColor?: string
}

/** Where the engine's two files land, relative to the site's output. Part of its published contract. */
export const TAGS_JSON = "static/cgcTags.json"
export const TAGS_CSS = "static/cgcTags.css"

const DEFAULT_COLOR = "var(--darkgray)"
const FIELDS: (keyof TagDefinition)[] = ["color", "icon"]
const OPTIONS = ["tags", "defaultColor"]
// An icon id as Iconify writes one: a collection prefix and an icon name.
const ICON_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/

class CgcTagsError extends Error {
  constructor(message: string) {
    super(`cgc-tags: ${message}`)
  }
}

interface Table {
  dictionary: TagDictionary
  defaultColor: string
}

// A tag as the corpus writes it: slugified by Quartz, and here also freed of stray slashes.
const normalise = (tag: string) => slugTag(tag.trim()).replace(/^\/+|\/+$/g, "")

// The site's options, checked. Any mistake fails the build: an unparseable colour, an icon id that
// isn't one, a key the dictionary doesn't have (a consumer's field included: ADR-0002 rule 5).
function compile(options: CgcTagsOptions = {}): Table {
  const unknown = Object.keys(options).filter((key) => !OPTIONS.includes(key))
  if (unknown.length)
    throw new CgcTagsError(
      `unknown option "${unknown[0]}". The options are ${OPTIONS.map((o) => `"${o}"`).join(" and ")}.`,
    )
  const defaultColor = options.defaultColor ?? DEFAULT_COLOR
  if (!isColourValue(defaultColor))
    throw new CgcTagsError(`defaultColor is not a CSS colour: ${JSON.stringify(defaultColor)}`)

  const dictionary: TagDictionary = {}
  const writtenAs: Record<string, string> = {}
  for (const [key, definition] of Object.entries(options.tags ?? {})) {
    const tag = normalise(key)
    if (!tag) throw new CgcTagsError(`${JSON.stringify(key)} is not a tag`)
    if (writtenAs[tag] !== undefined)
      throw new CgcTagsError(`"${writtenAs[tag]}" and "${key}" are the same tag, "${tag}"`)
    writtenAs[tag] = key
    if (definition === null || typeof definition !== "object" || Array.isArray(definition)) {
      throw new CgcTagsError(`tag "${key}" must be a map of ${FIELDS.join(" and ")}`)
    }
    const stray = Object.keys(definition).find(
      (field) => !FIELDS.includes(field as keyof TagDefinition),
    )
    if (stray)
      throw new CgcTagsError(
        `tag "${key}" has "${stray}", which is not a tag's field. A tag has ${FIELDS.map((f) => `"${f}"`).join(" and ")}.`,
      )
    const { color, icon } = definition
    if (color !== undefined && !isColourValue(color))
      throw new CgcTagsError(
        `the colour of tag "${key}" is not a CSS colour: ${JSON.stringify(color)}`,
      )
    if (icon !== undefined && (typeof icon !== "string" || !ICON_ID.test(icon))) {
      throw new CgcTagsError(
        `the icon of tag "${key}" is not an icon id, prefix:name: ${JSON.stringify(icon)}`,
      )
    }
    dictionary[tag] = { ...(color !== undefined && { color }), ...(icon !== undefined && { icon }) }
  }
  return { dictionary, defaultColor }
}

// Checked when a hook first needs it, not when the factory runs: the loader logs a factory's error
// and builds on without the plugin, where a hook's error fails the build.
function tableOf(options?: CgcTagsOptions): () => Table {
  let table: Table | Error | undefined
  return () => {
    if (table === undefined) {
      try {
        table = compile(options)
      } catch (err) {
        table = err as Error
      }
    }
    if (table instanceof Error) throw table
    return table
  }
}

// A page's tags as its frontmatter lists them, in order, each once.
function pageTags(data: Record<string, any>): string[] {
  const tags = data.frontmatter?.tags
  if (!Array.isArray(tags)) return []
  return [
    ...new Set(
      tags
        .filter((tag): tag is string => typeof tag === "string")
        .map(normalise)
        .filter(Boolean),
    ),
  ]
}

function publish(data: Record<string, any>, dictionary: TagDictionary): TagsData {
  const tags = pageTags(data)
  const primaryTag = data.frontmatter?.primaryTag
  if (primaryTag === undefined || primaryTag === null) return tagsDataOf(tags, dictionary)
  const primary = typeof primaryTag === "string" ? normalise(primaryTag) : ""
  if (!tags.includes(primary)) {
    const page = data.relativePath ?? data.slug
    throw new CgcTagsError(
      `${page}: primaryTag ${JSON.stringify(primaryTag)} is not one of the page's tags (${tags.join(", ") || "none"})`,
    )
  }
  return tagsDataOf(tags, dictionary, primary)
}

/** The transformer: publishes each page's tags on `fileData.cgcTags`. */
export function transformer(options?: CgcTagsOptions) {
  const table = tableOf(options)
  return {
    name: "CgcTags",
    // After every markdown plugin, so the frontmatter has been parsed, whatever this plugin's order.
    htmlPlugins: () => {
      const { dictionary } = table()
      return [
        () => (_tree: unknown, file: { data: Record<string, any> }) =>
          void (file.data.cgcTags = publish(file.data, dictionary)),
      ]
    },
  }
}

// Every tag in the corpus and every ancestor of one, sorted, so a parent precedes its children.
function corpusTags(content: ProcessedContent[]): string[] {
  const tags = new Set<string>()
  for (const [, file] of content)
    for (const tag of pageTags(file.data as Record<string, any>))
      lineageOf(tag).forEach((t) => tags.add(t))
  return [...tags].sort()
}

// Two tags whose properties would be one, such as `a/b` and `a--b`, can't both have a colour.
function refuseCollisions(tags: string[]) {
  const owner = new Map<string, string>()
  for (const tag of tags) {
    const property = colorPropertyOf(tag)
    const other = owner.get(property)
    if (other !== undefined)
      throw new CgcTagsError(
        `tags "${other}" and "${tag}" would share the custom property ${property}. Rename one.`,
      )
    owner.set(property, tag)
  }
}

function stylesheet(tags: string[], { dictionary, defaultColor }: Table): string {
  const declarations = [
    `${DEFAULT_COLOR_PROPERTY}: ${defaultColor};`,
    ...tags.map((tag) => `${colorPropertyOf(tag)}: ${colorValueOf(tag, dictionary)};`),
  ]
  return [
    "/* cgc-tags: one colour property per tag. A tag with no colour of its own takes its parent's. */",
    "@layer cgc.tags {",
    "  :root {",
    ...declarations.map((line) => `    ${line}`),
    "  }",
    "}",
    "",
  ].join("\n")
}

// Where the stylesheet is linked from, on every page: the site's base path, as core computes it for
// `data-basepath` (renderPage.tsx), and nothing under `serve`, which serves from the root.
function stylesheetHref(ctx: BuildCtx): string {
  const { baseUrl } = ctx.cfg.configuration
  const basePath =
    ctx.argv.serve || !baseUrl ? "" : new URL(`https://${baseUrl}`).pathname.replace(/\/$/, "")
  return `${basePath}/${TAGS_CSS}`
}

async function write(ctx: BuildCtx, file: string, content: string): Promise<FilePath> {
  const dest = path.join(ctx.argv.output, file)
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.writeFile(dest, content)
  return dest as FilePath
}

/**
 * The emitter: writes `static/cgcTags.json` and the `cgc.tags` stylesheet, and links the stylesheet
 * from every page. It sees every page, those that page types generate (`.mdx` pages) included.
 */
export function emitter(options?: CgcTagsOptions) {
  const table = tableOf(options)
  return {
    name: "CgcTags",
    // A link, not an inline sheet: the properties depend on the corpus, which only `emit` sees.
    externalResources: (ctx: BuildCtx) => {
      table()
      return { css: [{ content: stylesheetHref(ctx) }] }
    },
    async emit(ctx: BuildCtx, content: ProcessedContent[]): Promise<FilePath[]> {
      const compiled = table()
      const tags = corpusTags(content)
      refuseCollisions(tags)
      const index = Object.fromEntries(
        tags.map((tag) => [tag, propertiesOf(tag, compiled.dictionary)]),
      )
      return Promise.all([
        write(ctx, TAGS_JSON, JSON.stringify(index)),
        write(ctx, TAGS_CSS, stylesheet(tags, compiled)),
      ])
    },
  }
}
