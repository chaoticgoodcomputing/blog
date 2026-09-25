// What cgc-seo reads of a page: Quartz's per-file data, as the stock transformers leave it, and the
// rules the head, the sitemap and the feed share about it. The terms are CONTEXT.md's.
import { simplifySlug, slugTag, stripSlashes } from "@quartz-community/utils/path"

export interface PageData {
  slug?: string
  /** Set on a page built from a file of its own; absent on pages Quartz generates (tag listings, the 404 page). */
  filePath?: string
  description?: string
  /** The page's text, which its reading time is counted from. */
  text?: string
  unlisted?: boolean
  /** v4's mark of an external page, kept in case one comes back as data rather than frontmatter. */
  external?: string
  defaultDateType?: string
  frontmatter?: {
    title?: string
    tags?: string[]
    author?: unknown
    description?: string
    socialDescription?: string
    socialImage?: string
    external?: string
  }
  dates?: { created?: unknown; modified?: unknown; published?: unknown }
}

// The tag a tag page is for: `tags/<t>` is Quartz's listing or, after #43's rename, the tag's
// description note; `tags/<t>/index` is a description note in the vault's older shape.
const TAG_PAGE = /^tags\/(.+?)(?:\/index)?$/
const tagOfPage = (slug: string | undefined) => TAG_PAGE.exec(slug ?? "")?.[1]

/**
 * Whether a page is a **private page** (CONTEXT.md): it carries one of `noindexTags` or a
 * descendant of one, or it is the listing page of such a tag (`tags/private`, `tags/private/work`,
 * or a description note at `tags/private/index`). A tag that only shares a prefix with one
 * (`privateer`) is not a descendant.
 */
export function privatePages(noindexTags: string[]): (page: PageData) => boolean {
  const roots = noindexTags.map(slugTag)
  const isPrivateTag = (tag: string) => roots.some((root) => tag === root || tag.startsWith(`${root}/`))
  return (page) => {
    if ((page.frontmatter?.tags ?? []).some(isPrivateTag)) return true
    const tag = tagOfPage(page.slug)
    return tag !== undefined && isPrivateTag(tag)
  }
}

/**
 * Whether a page is an **external page** (CONTEXT.md): a stub for a page on another site, which
 * names that page's URL as `external`, in its frontmatter as the vault writes one, or in its data
 * as v4 set it.
 */
export const isExternal = (page: PageData) => Boolean(page.external || page.frontmatter?.external)

/**
 * Whether a page is an **article** (CONTEXT.md): built from a file of its own, not the 404 page, and
 * in one of `folders` when there are any.
 */
export function articles(folders: string[] | undefined): (page: PageData) => boolean {
  const within = folders?.map((folder) => stripSlashes(folder))
  return (page) =>
    page.slug !== "404" &&
    page.filePath !== undefined &&
    (!within || within.some((folder) => folder === "" || page.slug!.startsWith(`${folder}/`)))
}

/**
 * The path a crawler is given for a page: its simple slug (`a/index` is `a/`), except that a tag's
 * page is always `tags/<t>`, the canonical tag URL (#43), whichever page Quartz renders for it there.
 */
export function crawlPath(slug: string): string {
  const tag = tagOfPage(slug)
  return tag !== undefined ? `tags/${tag}` : simplifySlug(slug)
}

/** The tag a page lists, when it is a tag's page. */
export const tagOf = (page: PageData) => tagOfPage(page.slug)

/** The page's own date, of the kind the site shows (`defaultDateType`), if it has one. */
export function dateOf(page: PageData): Date | undefined {
  const type = page.defaultDateType as keyof NonNullable<PageData["dates"]> | undefined
  const value = type ? page.dates?.[type] : undefined
  if (value === undefined || value === null) return undefined
  const date = value instanceof Date ? value : new Date(value as string)
  return Number.isNaN(date.getTime()) ? undefined : date
}
