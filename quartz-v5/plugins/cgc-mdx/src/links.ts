// `.mdx` pages at their clean URLs, for the whole site (docs/adr/0004). Quartz files every content
// file in `ctx.allSlugs` through `slugifyFilePath`, which drops only a `.md` or `.html` extension,
// so `lab/life.mdx` is listed as `lab/life.mdx` while its page lives at `lab/life`. A link written
// with the extension keeps it as well. crawl-links resolves links against both, so without this a
// link to an `.mdx` page misses it, and so do the backlinks and graph edges built from links.
import { visit } from "unist-util-visit"
import { slugifyFilePath } from "@quartz-community/utils/path"

export const EXT = ".mdx"

/** Where an `.mdx` file's page lives: its path without the extension, slugified as a `.md` file's. */
export function mdxSlug(relativePath: string): string {
  return slugifyFilePath((relativePath.slice(0, -EXT.length) + ".md") as any)
}

/** The part of Quartz's build context this reads and corrects. */
interface SlugContext {
  allFiles?: readonly string[]
  allSlugs?: string[]
}

/**
 * Lists every `.mdx` page in `ctx.allSlugs` under the slug it lives at. In place, because Quartz's
 * transformers keep a reference to the array (note-properties adds aliases to it). Idempotent,
 * because every copy of the build context needs it once: the main thread's, and each parse
 * worker's, which gets a fresh copy for each parse phase. A watch rebuild lists the slugs afresh.
 */
export function listMdxSlugs(ctx: SlugContext): void {
  const { allFiles = [], allSlugs } = ctx
  if (!allSlugs) return
  const moved = new Map<string, string>()
  for (const file of allFiles) if (file.endsWith(EXT)) moved.set(slugifyFilePath(file as any), mdxSlug(file))
  if (moved.size === 0) return
  allSlugs.forEach((slug, i) => {
    const page = moved.get(slug)
    if (page !== undefined) allSlugs[i] = page
  })
}

// is-absolute-url's test, which crawl-links uses to tell an external link from an internal one.
const ABSOLUTE = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/

/** An internal link's target without an `.mdx` extension, keeping its query and anchor. */
export function withoutMdx(href: string): string {
  if (ABSOLUTE.test(href) || href.startsWith("#")) return href
  const end = href.search(/[?#]/)
  const target = end < 0 ? href : href.slice(0, end)
  return target.endsWith(EXT) ? target.slice(0, -EXT.length) + href.slice(target.length) : href
}

/**
 * rehype plugin: points every internal link to an `.mdx` file at its page, as v4's slugifier did.
 * It has to run before crawl-links resolves the link, which this plugin's order (45, below
 * crawl-links' 60) ensures.
 */
export function mdxLinks() {
  return (tree: any) => {
    visit(tree, "element", (el: any) => {
      if (el.tagName === "a" && typeof el.properties?.href === "string") el.properties.href = withoutMdx(el.properties.href)
    })
  }
}
