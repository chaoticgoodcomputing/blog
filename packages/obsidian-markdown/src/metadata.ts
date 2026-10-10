// A note's metadata, read from its tree once the syntax plugins have run: what Obsidian keeps in
// `CachedMetadata`. The same plugins that render a note produce what is read here, so the cache and
// the page can't disagree about what a link or a comment is.

import { defineMdastPlugin, markdownToHtml, mdxToJs, type Features } from "satteri"
import { parse as parseYaml } from "yaml"
import { decodeLinkUrl, isExternalUrl, normalizeTag, parseWikilink } from "./linktext.ts"
import { type SyntaxOptions, TAG, WIKILINK, obsidianFeatures, obsidianSyntax } from "./syntax/index.ts"
import type { Node } from "./syntax/node.ts"
import type {
  CachedMetadata,
  FrontMatterCache,
  FrontmatterLinkCache,
  LinkCache,
  WikilinkData,
} from "./types.ts"

/** The key the metadata plugin leaves a note's metadata under, in the compile's data bag. */
export const METADATA_KEY = "obsidian"

/** The key the metadata plugin leaves a note's text under, beside its metadata. */
const TEXT_KEY = "obsidianText"

// The blocks whose text a reader reads as one run. Every other block holds these, or no text.
const TEXT_BLOCKS = new Set(["paragraph", "heading", "code", "math", "tableCell", "calloutTitle"])

function frontmatterLinks(frontmatter: FrontMatterCache): FrontmatterLinkCache[] {
  const found: FrontmatterLinkCache[] = []
  const visit = (value: unknown, key: string) => {
    if (typeof value === "string") {
      const parsed = parseWikilink(value.trim())
      if (parsed && !parsed.embed) {
        found.push({ key, link: parsed.link, original: value.trim(), displayText: parsed.displayText })
      }
    } else if (Array.isArray(value)) value.forEach((item, index) => visit(item, `${key}.${index}`))
  }
  for (const [key, value] of Object.entries(frontmatter)) visit(value, key)
  return found
}

/**
 * The plugin that reads a note's metadata, after every plugin before it has finished. It changes
 * nothing, and leaves a `CachedMetadata` in the data bag under `METADATA_KEY`.
 */
export function obsidianMetadata() {
  return defineMdastPlugin({
    name: "obsidian-metadata",
    options: { position: true },
    after(root, ctx) {
      const metadata: CachedMetadata = {}
      const source = ctx.source

      const visit = (node: Node) => {
        const position = node.position
        switch (node.type) {
          case "yaml": {
            try {
              const parsed = parseYaml(node.value ?? "")
              if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                metadata.frontmatter = parsed as FrontMatterCache
                if (position) metadata.frontmatterPosition = position
                const links = frontmatterLinks(metadata.frontmatter)
                if (links.length) metadata.frontmatterLinks = links
              }
            } catch {
              // Frontmatter that isn't YAML is no frontmatter, as in Obsidian.
            }
            return
          }
          case "heading":
            if (position) {
              ;(metadata.headings ??= []).push({
                heading: ctx.textContent(node as never).trim(),
                level: node.depth as number,
                position,
              })
            }
            break
          case WIKILINK: {
            const { link, original, displayText, embed, position: at } = node.data!.wikilink as WikilinkData
            const entry: LinkCache = { link, original, displayText, position: at }
            ;(embed ? (metadata.embeds ??= []) : (metadata.links ??= [])).push(entry)
            return
          }
          case "link":
          case "image": {
            // A Markdown link into the vault is a link like any other. One out of it isn't.
            const url = (node.url as string | undefined) ?? ""
            if (!position || !url || isExternalUrl(url)) break
            const entry: LinkCache = {
              link: decodeLinkUrl(url),
              original: source.slice(position.start.offset, position.end.offset),
              displayText:
                node.type === "image" ? ((node.alt as string) ?? "") : ctx.textContent(node as never),
              position,
            }
            ;(node.type === "image" ? (metadata.embeds ??= []) : (metadata.links ??= [])).push(entry)
            break
          }
          case TAG: {
            const { tag, position: at } = node.data!.tag as { tag: string; position?: typeof position }
            if (at) (metadata.tags ??= []).push({ tag: normalizeTag(tag), position: at })
            return
          }
        }
        const block = node.data?.block as { id: string; position?: typeof position } | undefined
        const blockPosition = block?.position ?? position
        if (block && blockPosition) {
          ;(metadata.blocks ??= {})[block.id] = { id: block.id, position: blockPosition }
        }
        node.children?.forEach(visit)
      }

      visit(root as unknown as Node)
      ctx.data[METADATA_KEY] = metadata

      // The note's text, a block to a line, so that the last word of one block and the first of
      // the next stay two words. Frontmatter, a comment and an MDX note's `import` lines are no
      // block of text, and a link is the text it shows.
      const lines: string[] = []
      const read = (node: Node) => {
        // A code block's or a formula's text is its value, which it holds in place of children.
        if (TEXT_BLOCKS.has(node.type)) lines.push(node.children ? ctx.textContent(node as never) : (node.value ?? ""))
        else node.children?.forEach(read)
      }
      read(root as unknown as Node)
      ctx.data[TEXT_KEY] = lines.join("\n")
    },
  })
}

export interface ParseOptions extends SyntaxOptions {
  /** `mdx` reads the source as MDX, where `{…}`, JSX and `import` lines are syntax. Default `md`. */
  format?: "md" | "mdx"
  /** Parser features beside the ones Obsidian's syntax needs. Give the host's, so both read alike. */
  features?: Features
}

/** Read one note's metadata from its source. */
export async function parseMetadata(source: string, options: ParseOptions = {}): Promise<CachedMetadata> {
  return (await parseNote(source, options)).metadata
}

/**
 * Read one note's metadata, and its text as a reader reads it: the words of its body, without its
 * frontmatter, its comments or its markup. The vault keeps both (`Vault.readText`).
 */
export async function parseNote(
  source: string,
  options: ParseOptions = {},
): Promise<{ metadata: CachedMetadata; text: string }> {
  const { format = "md", features, ...syntax } = options
  const data: Record<string, unknown> = {}
  const compile = {
    features: { ...features, ...obsidianFeatures },
    mdastPlugins: [...obsidianSyntax(syntax), obsidianMetadata()],
    data,
  }
  if (format === "mdx") await mdxToJs(source, compile)
  else await markdownToHtml(source, compile)
  return {
    metadata: (data[METADATA_KEY] as CachedMetadata | undefined) ?? {},
    text: (data[TEXT_KEY] as string | undefined) ?? "",
  }
}

/** Every tag of a note, frontmatter's and the body's, each once, with its `#`. Obsidian's `getAllTags`. */
export function getAllTags(cache: CachedMetadata): string[] {
  const frontmatter = cache.frontmatter?.tags
  const fromFrontmatter = Array.isArray(frontmatter)
    ? frontmatter
    : typeof frontmatter === "string"
      ? frontmatter.split(/[,\s]+/)
      : []
  const tags = [
    ...fromFrontmatter.filter((tag): tag is string => typeof tag === "string" && tag.trim() !== ""),
    ...(cache.tags ?? []).map((tag) => tag.tag),
  ]
  return [...new Set(tags.map(normalizeTag))]
}

/**
 * A note's aliases, the other names its frontmatter gives it, each once: a list under `aliases`, or
 * one line with commas between them, and `alias` is read the same. Null for a note with none.
 * Obsidian's `parseFrontMatterAliases`.
 */
export function parseFrontMatterAliases(frontmatter: FrontMatterCache | null | undefined): string[] | null {
  const written = [frontmatter?.aliases, frontmatter?.alias].flatMap((value) =>
    Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [],
  )
  const aliases = written
    .filter((alias) => typeof alias === "string" || typeof alias === "number")
    .map((alias) => String(alias).trim())
    .filter(Boolean)
  return aliases.length ? [...new Set(aliases)] : null
}
