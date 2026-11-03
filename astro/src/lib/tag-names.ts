// Tag names: the last level of a tag, `ai` in `engineering/ai`. The feed lists a note's tags by
// name alone (src/lib/feed.ts), so a name must say which tag it is: no two tags share one, whatever
// the case. `nx run site:tag-names` refuses a vault where two do, and git:commit runs it.
//
// So each nested tag's page is also at its name's address, `/tags/ai` forwarding to
// `/tags/engineering/ai`, as an alias redirect (src/lib/aliases.ts). A top-level tag's page is
// already there.

import { tagName, tagUrl } from "./tags.ts"

/** Each tag name more than one tag has, lower case, with those tags, sorted. */
export function tagNameClashes(tags: Iterable<string>): Map<string, string[]> {
  const byName = new Map<string, Set<string>>()
  for (const tag of tags) {
    const name = tagName(tag).toLowerCase()
    byName.set(name, (byName.get(name) ?? new Set()).add(tag))
  }
  return new Map(
    [...byName]
      .filter(([, holders]) => holders.size > 1)
      .map(([name, holders]) => [name, [...holders].sort()] as [string, string[]])
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  )
}

/**
 * The address of each nested tag's name, and its page's address: `/tags/ai` and
 * `/tags/engineering/ai`. A name more than one tag has has none, since it says no one tag.
 */
export function tagNameAddresses(tags: Iterable<string>): Map<string, string> {
  const all = [...tags]
  const clashes = tagNameClashes(all)
  const addresses = new Map<string, string>()
  for (const tag of all) {
    if (!tag.includes("/") || clashes.has(tagName(tag).toLowerCase())) continue
    addresses.set(tagUrl(tagName(tag)), tagUrl(tag))
  }
  return addresses
}
