// Tags as paths: `engineering/ai` is under `engineering`. Pure: it knows no vault and no site.
//
// A tag here is always a tag slug, the full path with no `#`. The library's `normalizeTag` goes the
// other way, to Obsidian's `#tag`, which is why this module's is not called that.

/** A tag's slug, from a tag as written: no `#`, no stray slashes, case kept. */
export function tagSlug(tag: string): string {
  return tag
    .trim()
    .replace(/^#/, "")
    .split("/")
    .map((level) => level.trim())
    .filter(Boolean)
    .join("/")
}

/** A tag's name, the last level of its slug: `typescript` in `engineering/languages/typescript`. */
export function tagName(tag: string): string {
  return tag.slice(tag.lastIndexOf("/") + 1)
}

/** The tags index's address, from the site's root, which every tag page's address is under. */
export const TAGS_INDEX = "/tags"

/** The address of a tag's page, from the site's root. */
export function tagUrl(tag: string): string {
  return `${TAGS_INDEX}/${tag}`
}

/** A tag's ancestors, nearest last: `a/b/c` gives `["a", "a/b"]`. */
export function tagAncestors(tag: string): string[] {
  const levels = tag.split("/")
  return levels.slice(0, -1).map((_, index) => levels.slice(0, index + 1).join("/"))
}

/** Each tag and every ancestor of each, once, sorted. */
export function withAncestors(tags: Iterable<string>): string[] {
  const all = new Set<string>()
  for (const tag of tags) for (const each of [...tagAncestors(tag), tag]) all.add(each)
  return [...all].sort()
}

/** Whether `tag` is `ancestor` or a tag under it, whatever the case. `privateer` is not under `private`. */
export function isUnderTag(tag: string, ancestor: string): boolean {
  const [own, above] = [tag.toLowerCase(), ancestor.toLowerCase()]
  return own === above || own.startsWith(`${above}/`)
}

/** Whether any of `tags` is under any of `ancestors`. */
export function underAny(tags: Iterable<string>, ancestors: Iterable<string>): boolean {
  const above = [...ancestors]
  for (const tag of tags) if (above.some((ancestor) => isUnderTag(tag, ancestor))) return true
  return false
}
