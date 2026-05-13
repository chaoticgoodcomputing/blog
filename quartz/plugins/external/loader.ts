import { globby } from "globby"
import matter from "gray-matter"
import { promises as fs } from "fs"
import path from "path"
import { ExternalSource } from "./types"
import { FilePath, FullSlug } from "../../util/path"
import { ProcessedContent, defaultProcessedContent } from "../vfile"

/**
 * One synthetic content node derived from an external source file.
 */
export interface ExternalNode {
  source: ExternalSource
  relativePath: string
  slug: FullSlug
  url: string
  content: ProcessedContent
}

const DEFAULT_INCLUDE = ["**/*.md"]
const DESCRIPTION_MAX_CHARS = 240

function defaultToExternalUrl(relativePath: string, baseUrl: string): string {
  let p = relativePath.replace(/\.mdx?$/i, "")
  p = p.replace(/(^|\/)index$/i, "$1")
  p = p.replace(/\/$/, "")
  return p ? `${baseUrl}/${p}` : baseUrl
}

function relativePathToSlug(prefix: string, relativePath: string): FullSlug {
  let p = relativePath.replace(/\.mdx?$/i, "")
  p = p.replace(/\\/g, "/")
  return `${prefix}/${p}` as FullSlug
}

function deriveTitle(rawBody: string, frontmatterTitle: unknown, fallbackName: string): string {
  if (typeof frontmatterTitle === "string" && frontmatterTitle.trim()) {
    return frontmatterTitle.trim()
  }
  const h1 = rawBody.match(/^#\s+(.+?)\s*$/m)
  if (h1) return h1[1].trim()
  return fallbackName
}

function deriveDescription(
  rawBody: string,
  frontmatterDescription: unknown,
  fallback: string | undefined,
): string {
  if (typeof frontmatterDescription === "string" && frontmatterDescription.trim()) {
    return frontmatterDescription.trim()
  }
  const lines = rawBody.split("\n")
  let firstParagraph = ""
  let inParagraph = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (inParagraph) break
      continue
    }
    if (trimmed.startsWith("#") || trimmed.startsWith("```") || trimmed.startsWith("|")) {
      if (inParagraph) break
      continue
    }
    inParagraph = true
    firstParagraph += (firstParagraph ? " " : "") + trimmed
    if (firstParagraph.length >= DESCRIPTION_MAX_CHARS) break
  }
  if (firstParagraph) {
    return firstParagraph.length > DESCRIPTION_MAX_CHARS
      ? firstParagraph.slice(0, DESCRIPTION_MAX_CHARS).trimEnd() + "…"
      : firstParagraph
  }
  return fallback ?? ""
}

async function deriveDate(absPath: string, source: ExternalSource): Promise<Date> {
  const strategy = source.frontmatter?.dateStrategy ?? "file-mtime"
  if (strategy === "fixed" && source.frontmatter?.fixedDate) {
    return new Date(source.frontmatter.fixedDate)
  }
  const stats = await fs.stat(absPath)
  return new Date(stats.mtimeMs)
}

async function loadFile(
  source: ExternalSource,
  workspaceRoot: string,
  relativePath: string,
): Promise<ExternalNode> {
  const absPath = path.join(workspaceRoot, source.source.path, relativePath)
  const raw = await fs.readFile(absPath, "utf-8")
  const parsed = matter(raw)
  const fmTitle = parsed.data.title
  const fmDescription = parsed.data.description
  const fallbackName = path.basename(relativePath, path.extname(relativePath))

  const title = deriveTitle(parsed.content, fmTitle, fallbackName)
  const description = deriveDescription(
    parsed.content,
    fmDescription,
    source.frontmatter?.fallbackDescription,
  )
  const date = await deriveDate(absPath, source)

  const slugPrefix = source.slugPrefix ?? `external/${source.name}`
  const slug = relativePathToSlug(slugPrefix, relativePath)
  const toUrl = source.toExternalUrl ?? defaultToExternalUrl
  const url = toUrl(relativePath, source.baseUrl)

  const tags = [...(source.frontmatter?.addTags ?? [])]
  // Surface any tags the source file declares so they can join the graph too.
  const fmTags = Array.isArray(parsed.data.tags) ? (parsed.data.tags as string[]) : []
  for (const tag of fmTags) {
    if (!tags.includes(tag)) tags.push(tag)
  }

  const content = defaultProcessedContent({
    slug,
    filePath: `${slugPrefix}/${relativePath}` as FilePath,
    relativePath: `${slugPrefix}/${relativePath}` as FilePath,
    frontmatter: {
      title,
      tags,
      description,
    },
    description,
    text: description,
    dates: { created: date, modified: date, published: date },
    links: [],
    external: url,
  })

  return { source, relativePath, slug, url, content }
}

export async function loadSource(
  source: ExternalSource,
  workspaceRoot: string,
): Promise<ExternalNode[]> {
  const include = source.source.include ?? DEFAULT_INCLUDE
  const exclude = source.source.exclude ?? []
  const cwd = path.join(workspaceRoot, source.source.path)
  const matches = await globby(include, {
    cwd,
    ignore: exclude,
    onlyFiles: true,
  })
  const nodes = await Promise.all(matches.map((rel) => loadFile(source, workspaceRoot, rel)))
  return nodes
}
