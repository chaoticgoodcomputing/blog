// The tag pages: which tags have one, the description note each shows, and the tags each links to.
// A tag page is at `tagUrl(tag)`, and the tags index, which lists the top-level tags, at
// `TAGS_INDEX` (src/pages/tags).

import { tagList } from "../site.config.ts"
import { getNotes, isPrivate, noteOf, tagsOf, type Note, type UnpublishedNote } from "./notes.ts"
import { postCounts } from "./post-listing.ts"
import { tagAncestors, tagName } from "./tags.ts"

/**
 * A tag page's title and description, which its head and its share card both say: the description
 * note's, or with none `#<tag name>` and no description. The tags index, with no tag, is `Tags`.
 */
export function tagPageTitle(tag: string | undefined): { title: string; description?: string } {
  if (tag === undefined) return { title: "Tags" }
  const note = descriptionOf(tag)
  return {
    title: note?.title ?? `#${tagName(tag)}`,
    ...(note?.description !== undefined && { description: note.description }),
  }
}

/**
 * The tags that have a tag page, sorted: every tag a published note carries, private pages
 * included, and every ancestor of one. A private page's tag badges link to its tags' pages too.
 */
export function tagPages(notes: Note[] = getNotes()): string[] {
  return [...tagsOf(notes).keys()]
}

/** A tag's description note, `tags/<tag slug>.md`: the body of its tag page. */
export function descriptionOf(
  tag: string,
  find: (file: string) => Note | UnpublishedNote | undefined = noteOf,
): UnpublishedNote | undefined {
  const note = find(`tags/${tag}.md`) ?? find(`tags/${tag}.mdx`)
  return note && "reason" in note ? note : undefined
}

/** A tag a tag page links to, with how many posts are under it. */
export interface LinkedTag {
  tag: string
  count: number
}

/**
 * The tags a tag page links to, each with how many posts are under it: with `showParents` the tags
 * above it, from the top, then its subtags. The tags index, with no tag, links to the top-level
 * tags. A private tag's page is linked from none: it is a private tag page, and lists no posts.
 */
export function tagPageTags(
  tag: string | undefined,
  { showParents }: { showParents: boolean } = tagList,
  notes: Note[] = getNotes(),
): LinkedTag[] {
  const counts = postCounts(notes)
  const above = tag !== undefined && showParents ? tagAncestors(tag) : []
  const under = tagPages(notes).filter((each) =>
    tag === undefined ? tagAncestors(each).length === 0 : tagAncestors(each).at(-1) === tag,
  )
  return [...above, ...under]
    .filter((each) => !isPrivate([each]))
    .map((each) => ({ tag: each, count: counts.get(each) ?? 0 }))
}
