/** A set of pages, numbered from 1: sorted runs `[first, last]` that neither overlap nor touch. */
export type PageRange = readonly (readonly [number, number])[]

export type TargetType = "web" | "document"

/** What a note's frontmatter says about what it annotates. */
export interface AnnotationProperties {
  /** One address: a URL, or a vault path for a local file. */
  readonly target: string
  /** `document` when `annotation-target-type` is absent: a PDF or the like. */
  readonly targetType: TargetType
  /** Absent means every page. */
  readonly pages: PageRange | undefined
}

/** A malformed annotation property, naming the property and the offending part of its value. */
export class AnnotationPropertyError extends Error {
  override readonly name = "AnnotationPropertyError"
  readonly property: string
  readonly part: string

  constructor(property: string, part: string, reason: string) {
    super(`${property}: ${reason}: ${JSON.stringify(part)}`)
    this.property = property
    this.part = part
  }
}

const PAGES = "annotation-pages"
const PART = /^\s*(\d+)\s*(?:[-–]\s*(\d+)\s*)?$/

/**
 * Reads a note's annotation properties from its frontmatter, already parsed into an object.
 * Undefined when it isn't an annotation note (no `annotation-target`).
 */
export function readAnnotationProperties(
  frontmatter: unknown,
): AnnotationProperties | AnnotationPropertyError | undefined {
  if (!isRecord(frontmatter)) return undefined
  let target = frontmatter["annotation-target"]
  if (target === undefined || target === null) return undefined
  if (Array.isArray(target)) target = target[0]
  if (typeof target !== "string" || target.trim() === "") {
    return new AnnotationPropertyError("annotation-target", show(target), "not an address")
  }

  const type = frontmatter["annotation-target-type"]
  let targetType: TargetType
  if (type === undefined || type === null) targetType = "document"
  else if (type === "web") targetType = "web"
  else return new AnnotationPropertyError("annotation-target-type", show(type), "not `web`")

  const value = frontmatter[PAGES]
  let pages: PageRange | undefined
  if (value !== undefined && value !== null) {
    const range = parsePageRange(value)
    if (range instanceof AnnotationPropertyError) return range
    pages = range
  }
  return { target: target.trim(), targetType, pages }
}

/**
 * Reads a page range: a string or a number, or a list of them, each string split on commas into
 * `N` or `N-M` parts. Malformed is an error, never a fallback.
 */
export function parsePageRange(value: unknown): PageRange | AnnotationPropertyError {
  const items = Array.isArray(value) ? value : [value]
  if (items.length === 0) return new AnnotationPropertyError(PAGES, "[]", "no pages")
  const runs: [number, number][] = []
  for (const item of items) {
    if (typeof item === "number") {
      if (!Number.isInteger(item) || item < 1) {
        return new AnnotationPropertyError(PAGES, String(item), "not a page number")
      }
      runs.push([item, item])
    } else if (typeof item === "string") {
      for (const part of item.split(",")) {
        const match = PART.exec(part)
        if (!match) return new AnnotationPropertyError(PAGES, part.trim(), "not a page or pages")
        const first = Number(match[1])
        const last = match[2] === undefined ? first : Number(match[2])
        if (first < 1) return new AnnotationPropertyError(PAGES, part.trim(), "pages start at 1")
        if (last < first) return new AnnotationPropertyError(PAGES, part.trim(), "ends before it starts")
        runs.push([first, last])
      }
    } else {
      return new AnnotationPropertyError(PAGES, show(item), "not a string or a number")
    }
  }
  return normalize(runs)
}

/** The canonical text form: `3-8,9`. */
export function formatPageRange(range: PageRange): string {
  return range.map(([first, last]) => (first === last ? `${first}` : `${first}-${last}`)).join(",")
}

export function pageRangeIncludes(range: PageRange | undefined, page: number): boolean {
  return range === undefined || range.some(([first, last]) => first <= page && page <= last)
}

function normalize(runs: [number, number][]): PageRange {
  runs.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const merged: [number, number][] = []
  for (const [first, last] of runs) {
    const previous = merged.at(-1)
    if (previous && first <= previous[1] + 1) previous[1] = Math.max(previous[1], last)
    else merged.push([first, last])
  }
  return merged
}

function show(value: unknown): string {
  return typeof value === "string" ? value : (JSON.stringify(value) ?? String(value))
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
