// What cgc-seo reads of a page: Quartz's per-file data, as the stock transformers leave it.
import { slugTag } from "@quartz-community/utils/path"

export interface PageData {
  slug?: string
  /** Set on a page built from a file of its own; absent on tag listings and the 404 page. */
  filePath?: string
  description?: string
  frontmatter?: {
    title?: string
    tags?: string[]
    author?: unknown
    description?: string
    socialDescription?: string
    socialImage?: string
  }
  dates?: { created?: unknown; modified?: unknown; published?: unknown }
}

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
    const listing = /^tags\/(.+?)(?:\/index)?$/.exec(page.slug ?? "")
    return listing !== null && isPrivateTag(listing[1])
  }
}
