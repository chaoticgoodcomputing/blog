// Which posts a page lists, and in what order. Pure functions of the pages Quartz hands every
// component, reading tags only from what the cgc-tags engine publishes on each page (ADR-0002).
import type { QuartzPluginData } from "@quartz-community/types"
import { tagOfPage, type TagsData } from "@chaoticgoodcomputing/tags-core"
import { getDate } from "@quartz-community/utils/sort"

export interface Selection {
  /** On a tag page, list only the posts under the tag. */
  filterToCurrentTag: boolean
  /** Count a post under one of the tag's subtags as under the tag. */
  includeSubtags: boolean
  /** Leave out the posts under any of these tags, their subtags included. */
  excludeTags: readonly string[]
  /** Leave out tag pages, such as a tag's description file. */
  excludeTagPages: boolean
}

const tagsOf = (file: QuartzPluginData) => file.cgcTags as TagsData | undefined

/** Whether a page is under a tag: carries it, or with `subtags`, carries one of its subtags. */
export function isUnder(file: QuartzPluginData, tag: string, subtags: boolean): boolean {
  const data = tagsOf(file)
  return tag in ((subtags ? data?.ancestors : data?.tags) ?? {})
}

/** The posts `slug`'s listing shows, newest first, before any limit. */
export function postsFor(
  slug: string,
  allFiles: readonly QuartzPluginData[],
  selection: Selection,
): QuartzPluginData[] {
  const tag = selection.filterToCurrentTag ? tagOfPage(slug) : null
  return allFiles
    .filter((file) => {
      const fileSlug = file.slug ?? ""
      // A virtual page, which no source file backs, is no post: a folder page, a tag page, the
      // 404 page. Quartz sets `filePath` on every page it parses, and cgc-mdx on its .mdx pages.
      if (!file.filePath) return false
      if (file.unlisted === true) return false
      if (selection.excludeTagPages && (fileSlug === "tags" || fileSlug.startsWith("tags/")))
        return false
      if (selection.excludeTags.some((excluded) => isUnder(file, excluded, true))) return false
      return tag === null || isUnder(file, tag, selection.includeSubtags)
    })
    .sort(newestFirst)
}

// The calendar day a date falls on, where the build formats it: the day the reader sees.
const dayOf = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
const titleOf = (file: QuartzPluginData) => String(file.frontmatter?.title ?? "").toLowerCase()

/**
 * Newest first, by the date the listing shows, then A→Z by title among posts of the same date
 * and among posts with none. Posts with a date come before posts without. v4 broke ties Z→A, and
 * only between undated posts; the map restored upstream's A→Z and gave it to same-date posts (#42).
 */
export function newestFirst(a: QuartzPluginData, b: QuartzPluginData): number {
  const [dateA, dateB] = [getDate(a), getDate(b)]
  if (dateA && dateB) {
    const days = dayOf(dateB) - dayOf(dateA)
    if (days !== 0) return days
  } else if (dateA) return -1
  else if (dateB) return 1
  return titleOf(a).localeCompare(titleOf(b))
}
