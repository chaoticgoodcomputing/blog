// A note's annotation properties: its target, whether it is a web page's, and its page range. The
// plugin finds them two ways, from Obsidian's index of the note (and Dataview's), and from the
// editor's text; either way they go to web-annotations as one frontmatter-shaped object, which
// alone decides what they say. Nothing here reaches Obsidian, so the tests run it as it is.

import {
  AnnotationPropertyError,
  type PageRange,
  readAnnotationProperties,
} from "@chaoticgoodcomputing/web-annotations"
import { parse as parseYaml } from "yaml"

export const TARGET_PROPERTY = "annotation-target"
export const TYPE_PROPERTY = "annotation-target-type"
export const PAGES_PROPERTY = "annotation-pages"
/** A web page's target type, and the type a page in the browser is. */
export const WEB_TYPE = "web"

const NAMES = [TARGET_PROPERTY, TYPE_PROPERTY, PAGES_PROPERTY]

/** What an annotation note's properties say, as far as they can be read. */
export interface NoteProperties {
  /** The target, as written, even when another property is malformed. */
  target: string | undefined
  web: boolean
  /** Absent means every page. */
  pages: PageRange | undefined
  /** A malformed property: the annotator doesn't open on the note. */
  error: AnnotationPropertyError | undefined
}

/** The annotation properties as one frontmatter-shaped object, each from `valueOf`. */
export function annotationFrontmatter(valueOf: (name: string) => unknown): Record<string, unknown> {
  const frontmatter: Record<string, unknown> = {}
  for (const name of NAMES) {
    const value = valueOf(name)
    if (value !== undefined) frontmatter[name] = value
  }
  return frontmatter
}

const ok = <T>(read: T | AnnotationPropertyError | undefined) => (read instanceof AnnotationPropertyError ? undefined : read)

/** A note's properties, by web-annotations; undefined for a note that names no annotation target. */
export function readProperties(frontmatter: Record<string, unknown>): NoteProperties | undefined {
  const read = readAnnotationProperties(frontmatter)
  if (read === undefined) return undefined
  if (!(read instanceof AnnotationPropertyError)) {
    return { target: read.target, web: read.targetType === "web", pages: read.pages, error: undefined }
  }
  // What can still be known, each property read alone: the vault finds a note by its target.
  const target = ok(readAnnotationProperties({ [TARGET_PROPERTY]: frontmatter[TARGET_PROPERTY] }))?.target
  const type = ok(readAnnotationProperties({ [TARGET_PROPERTY]: "-", [TYPE_PROPERTY]: frontmatter[TYPE_PROPERTY] }))?.targetType
  return { target, web: type === "web", pages: undefined, error: read }
}

/**
 * A Dataview value as frontmatter would have it: a link, as the path it resolves to; a Markdown
 * link, as its address; a list (its DataArray), as an array.
 */
export function dataviewValue(value: unknown, resolve: (path: string) => string | undefined): unknown {
  if (value === null || typeof value !== "object") {
    return typeof value === "string" ? (/^\[.*\]\((.*)\)$/.exec(value)?.[1] ?? value) : value
  }
  const object = value as { path?: unknown; array?: unknown }
  if (typeof object.array === "function") return (object.array as () => unknown[])().map((item) => dataviewValue(item, resolve))
  if (Array.isArray(value)) return value.map((item) => dataviewValue(item, resolve))
  if (typeof object.path === "string") return resolve(object.path)
  return value
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

// Dataview's inline fields: `name:: value` on a line of its own (or a list item's), or
// `[name:: value]` and `(name:: value)` in a line. Not in a quote, so no annotation's comment counts.
const LINE_FIELD = /^[ \t]*(?:(?:[-*+]|\d+\.)[ \t]+)?([\w-]+)::[ \t]*(.*?)[ \t]*$/
const BRACKET_FIELD = /[[(]([\w-]+)::[ \t]*([^\])]*?)[ \t]*[\])]/g
const FENCE = /^[ \t]*(```|~~~)/

/** A Dataview inline field's value, as Dataview reads it: unquoted, a number as a number. */
function inlineValue(text: string): unknown {
  const quoted = /^"(.*)"$/.exec(text)
  if (quoted) return quoted[1]
  if (/^\d+$/.test(text)) return Number(text)
  return dataviewValue(text, () => undefined)
}

/**
 * The annotation properties of a note's text: its frontmatter's, else its Dataview inline fields',
 * as Dataview's index would have them; and where its frontmatter ends (0 with none).
 */
export function frontmatterOfText(text: string): { properties: Record<string, unknown>; end: number } {
  const match = FRONTMATTER.exec(text)
  let yaml: unknown
  try {
    yaml = match ? parseYaml(match[1]!) : undefined
  } catch {}
  const frontmatter = yaml && typeof yaml === "object" && !Array.isArray(yaml) ? (yaml as Record<string, unknown>) : {}
  const end = match?.[0].length ?? 0

  const inline: Record<string, unknown> = {}
  let fenced = false
  for (const line of text.slice(end).split(/\r?\n/)) {
    if (FENCE.test(line)) fenced = !fenced
    if (fenced || /^[ \t]*>/.test(line)) continue
    const fields = [...line.matchAll(BRACKET_FIELD)].map((field) => [field[1]!, field[2]!])
    const whole = LINE_FIELD.exec(line)
    if (whole) fields.push([whole[1]!, whole[2]!])
    for (const [name, value] of fields) {
      const key = name.toLowerCase()
      if (NAMES.includes(key) && !(key in inline) && value) inline[key] = inlineValue(value)
    }
  }
  return { properties: annotationFrontmatter((name) => frontmatter[name] ?? inline[name]), end }
}

/** A note's properties, from its text. */
export const propertiesOfText = (text: string) => readProperties(frontmatterOfText(text).properties)

/** What the user is told when a note's property is malformed: the note, the property, and what is wrong. */
export function propertyProblem(notePath: string, error: AnnotationPropertyError): string {
  return `Annotator can't open ${notePath}: its ${error.property} property is malformed (${error.message}).`
}
