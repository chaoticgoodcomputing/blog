// What cgc-seo reads of a page: Quartz's per-file data, as the stock transformers leave it, and the
// rules the head, the sitemap and the feed share about it. The terms are CONTEXT.md's. Which pages are
// private, and which tag a tag page is for, are tags-core's rules, which the plugin inlines: a
// library, not the cgc-tags engine, which this plugin doesn't depend on (#28).
import { simplifySlug, slugTag, stripSlashes } from "@quartz-community/utils/path"
import {
  isAllTagsPage,
  normaliseTag,
  privatePageTest,
  tagOfPage,
  underAny,
} from "@chaoticgoodcomputing/tags-core"

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

/**
 * A test of whether a page asks not to be indexed (#28): a **private page** (tags-core), which carries
 * one of `noindexTags` or a descendant of one, or a **private tag page**, the page of such a tag
 * (`tags/private`, `tags/private/work`, or a description note at `tags/private/index`). A tag that
 * only shares a prefix with one (`privateer`) is not a descendant.
 */
export function noindexTest(noindexTags: string[]): (page: PageData) => boolean {
  const normalise = (tag: string) => normaliseTag(tag, slugTag)
  const privateTags = noindexTags.map(normalise)
  const isPrivatePage = privatePageTest(privateTags)
  const isPrivateTag = underAny(privateTags)
  return (page) => {
    if (isPrivatePage((page.frontmatter?.tags ?? []).map(normalise))) return true
    const tag = tagOfPage(page.slug)
    return tag !== null && isPrivateTag(tag)
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
export function articleTest(folders: string[] | undefined): (page: PageData) => boolean {
  const within = folders?.map((folder) => stripSlashes(folder))
  return (page) =>
    page.slug !== "404" &&
    page.filePath !== undefined &&
    (!within || within.some((folder) => folder === "" || page.slug!.startsWith(`${folder}/`)))
}

/**
 * The path a crawler is given for a page: its simple slug (`a/index` is `a/`), except that a tag's
 * page is always `tags/<t>`, the canonical tag URL (#43), whichever page Quartz renders for it there,
 * and the page of every tag keeps its own slug, `tags/index`, as v4 listed it.
 */
export function crawlPath(slug: string): string {
  if (isAllTagsPage(slug)) return slug
  const tag = tagOfPage(slug)
  return tag !== null ? `tags/${tag}` : simplifySlug(slug)
}

/**
 * A date Quartz or the frontmatter gives, as a `Date`, or nothing when there is none or it doesn't
 * parse: an invalid date would throw on `toISOString()`.
 */
export function toDate(value: unknown): Date | undefined {
  if (value === undefined || value === null) return undefined
  const date = value instanceof Date ? value : new Date(value as string)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/** The page's own date, of the kind the site shows (`defaultDateType`), if it has one. */
export function dateOf(page: PageData): Date | undefined {
  const type = page.defaultDateType as keyof NonNullable<PageData["dates"]> | undefined
  return toDate(type ? page.dates?.[type] : undefined)
}
