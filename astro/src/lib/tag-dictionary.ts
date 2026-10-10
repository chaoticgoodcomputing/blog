// What a tag is drawn with, from the tag dictionary in site configuration: its colour and its icon,
// each its own or its nearest ancestor's. Pure: every function takes the dictionary, the site's by
// default, so a test or another site can pass its own.

import { tags as siteDictionary } from "../site.config.ts"
import type { TagDictionary, TagDefinition } from "../site.config.types.ts"
import { tagAncestors, withAncestors } from "./tags.ts"

// The tag and then each ancestor, nearest first: the order a tag inherits in.
const lineage = (tag: string): string[] => [tag, ...tagAncestors(tag).reverse()]

// The first of the lineage's entries to say a field.
function inherited(tag: string, field: keyof TagDefinition, dictionary: TagDictionary): string | undefined {
  for (const each of lineage(tag)) {
    const value = Object.hasOwn(dictionary, each) ? dictionary[each]?.[field] : undefined
    if (value !== undefined) return value
  }
  return undefined
}

/** A tag's colour: a colour value, its own or its nearest ancestor's. None when its lineage has none. */
export const tagColor = (tag: string, dictionary: TagDictionary = siteDictionary): string | undefined =>
  inherited(tag, "color", dictionary)

/** A tag's icon: an icon id, its own or its nearest ancestor's. None when its lineage has none. */
export const tagIcon = (tag: string, dictionary: TagDictionary = siteDictionary): string | undefined =>
  inherited(tag, "icon", dictionary)

/**
 * The dictionary's entries that no tag in use is, nor is under: entries that draw nothing. `inUse`
 * is the tags notes carry, with or without their ancestors.
 */
export function unusedEntries(inUse: Iterable<string>, dictionary: TagDictionary = siteDictionary): string[] {
  const used = new Set(withAncestors(inUse))
  return Object.keys(dictionary).filter((tag) => !used.has(tag))
}

/**
 * The tags in use that the dictionary says nothing of: neither the tag nor any tag above it has an
 * entry, so it is drawn with no colour and no icon. Each once, in the order first met.
 */
export function unresolvedTags(inUse: Iterable<string>, dictionary: TagDictionary = siteDictionary): string[] {
  return [...new Set(inUse)].filter((tag) => !lineage(tag).some((each) => Object.hasOwn(dictionary, each)))
}

/**
 * The dictionary's entries whose icon id names no icon, each as its tag and the id. Whether an id
 * names one is `hasIcon`'s to say (src/lib/icons.ts, which reads files, and so is not imported here).
 */
export function unknownIcons(
  hasIcon: (id: string) => boolean,
  dictionary: TagDictionary = siteDictionary,
): [tag: string, icon: string][] {
  return Object.entries(dictionary).flatMap(([tag, { icon }]) =>
    icon === undefined || hasIcon(icon) ? [] : [[tag, icon] as [string, string]],
  )
}

/**
 * The tags a list of tag badges shows for a note's tags: the tags in the order written, or, with
 * `showParents`, each preceded by its ancestors, from the top, every tag once.
 */
export function listedTags(tags: string[], { showParents }: { showParents: boolean }): string[] {
  if (!showParents) return tags
  return [...new Set(tags.flatMap((tag) => [...tagAncestors(tag), tag]))]
}
