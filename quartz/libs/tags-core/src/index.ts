// The tag system's shared logic (ADR-0002's worked example, #20, #31): the resolution rule, the
// shapes the `quartz-tags` engine publishes, and the `fileData` augmentation that types them. The
// engine resolves with it, so the rule lives in one place; consumers import its types, which tag a
// tag page is for (`tagOfPage()`) and, for a canvas, its colour resolver (`./colour`). The tag
// hierarchy's tests (`underAny()`) and which pages are private (`privatePageTest()`) live here too,
// for every plugin that needs them, whether or not it consumes the engine. See CONTEXT.md.
//
// Every function here takes tags normalised, as the engine publishes them: slugified, with `/`
// between levels and none at either end. Normalising what a site writes is the engine's job, and
// `normaliseTag()` is how it, and any plugin that takes tags as options, does it.

// The module the `fileData` augmentation below extends. Imported for its types alone, so that the
// augmentation resolves it; nothing of it reaches a bundle.
import type {} from "vfile"

/** One tag as a site writes it in the engine's dictionary. Every field is optional. */
export interface TagDefinition {
  /** A colour value: anything CSS accepts as a colour, `var(--…)` and `light-dark()` included. */
  color?: string
  /** An icon id, `prefix:name`, such as `mdi:robot`. */
  icon?: string
}

/** The engine's dictionary: one flat table of tag definitions, keyed by tag. */
export type TagDictionary = Record<string, TagDefinition>

/**
 * What the engine publishes for one tag, resolved. An interface, so a consumer that merges its own
 * slice into the published structure declares its fields by declaration merging (ADR-0002 rule 5).
 */
export interface TagProperties {
  /**
   * The name of the custom property that carries the tag's colour, as CSS writes it, such as
   * `--cgc-tag-engineering--ai`. Paint with `var(<color>)`; a canvas resolves it through
   * `resolveTagColour()`. The property always exists, since a tag with no colour of its own
   * inherits its parent's through it.
   */
  color: string
  /** The tag's icon id: its own, or its nearest ancestor's. `null` when neither has one. */
  icon: string | null
}

/** The tag that stands for a page, with its properties. */
export interface PrimaryTag extends TagProperties {
  tag: string
}

/** What the engine publishes on each page's `fileData`, under `cgcTags`. */
export interface TagsData {
  /** The page's own tags, in frontmatter order. */
  tags: Record<string, TagProperties>
  /** The page's primary tag (`primaryTagOf()`), or `null` for a page with no tags. */
  primary: PrimaryTag | null
  /**
   * The expanded ancestor set, with each tag's properties: every tag the page is under, that is
   * its own tags and every ancestor of each, sorted. "Is this page under `engineering`?" is
   * `"engineering" in ancestors`. Across every page, these are every tag in the corpus.
   */
  ancestors: Record<string, TagProperties>
}

declare module "vfile" {
  interface DataMap {
    /** Published by the `quartz-tags` engine on every page it transforms. */
    cgcTags: TagsData
  }
}

/** The custom property every tag's colour chain ends at, when no ancestor sets a colour. */
export const DEFAULT_COLOR_PROPERTY = "--cgc-tags-default"

const PROPERTY_PREFIX = "--cgc-tag-"

/** A tag's parent: `engineering/languages` for `engineering/languages/python`, `null` at the top. */
export function parentOf(tag: string): string | null {
  const cut = tag.lastIndexOf("/")
  return cut < 0 ? null : tag.slice(0, cut)
}

/** A tag's name, its last level: `python` for `engineering/languages/python`. */
export const nameOf = (tag: string): string => tag.slice(tag.lastIndexOf("/") + 1)

/** The tag followed by each of its ancestors, nearest first. */
export function lineageOf(tag: string): string[] {
  const lineage = [tag]
  for (let parent = parentOf(tag); parent !== null; parent = parentOf(parent)) lineage.push(parent)
  return lineage
}

/**
 * A tag as a site writes it in an option, normalised the way the engine normalises the tags in its
 * dictionary and on pages: trimmed, each level slugified by `slugTag`, and without a `/` at either
 * end. `slugTag` is the host's, from `@quartz-community/utils/path`, which Quartz slugifies
 * frontmatter tags with: the caller passes it, so this library carries no copy of it. `""` when
 * nothing is left.
 */
export const normaliseTag = (tag: string, slugTag: (tag: string) => string): string =>
  slugTag(tag.trim()).replace(/^\/+|\/+$/g, "")

/**
 * A test of whether a tag is under one of `roots`: is one of them, or a descendant of one at any
 * depth. `private/work` is under `private`; `privateer` only starts with the same letters, and is
 * not.
 */
export function underAny(roots: Iterable<string>): (tag: string) => boolean {
  const set = new Set(roots)
  return (tag) => lineageOf(tag).some((t) => set.has(t))
}

/**
 * A test of whether a page is a **private page**: whether it carries one of `privateTags`, or a tag
 * under one. Give it the page's own tags, or its expanded ancestor set, which gives the same answer.
 * One function, so every plugin that treats private pages differently agrees on which pages those
 * are.
 */
export function privatePageTest(
  privateTags: Iterable<string>,
): (tags: Iterable<string>) => boolean {
  const isPrivateTag = underAny(privateTags)
  return (tags) => {
    for (const tag of tags) if (isPrivateTag(tag)) return true
    return false
  }
}

/**
 * The tag a tag page is for, from the page's slug: `tags/<t>`, or `tags/<t>/index` for a tag's
 * description file in v4's layout. Only a whole `index` segment is dropped, so `tags/reindex` is
 * the page for `reindex`. The index of every tag, `tags` or `tags/index`, is for none, and neither
 * is any other page: `null`.
 */
export function tagOfPage(slug: string | undefined): string | null {
  if (!slug?.startsWith("tags/")) return null
  const tag = slug.slice("tags/".length).replace(/(^|\/)index$/, "")
  return tag || null
}

/**
 * Whether a slug is the page of every tag: `tags`, or `tags/index`, which Quartz generates. It sits
 * with the tag pages, under `tags/`, but it is the page of no tag (`tagOfPage()`).
 */
export const isAllTagsPage = (slug: string | undefined): boolean =>
  slug === "tags" || slug === "tags/index"

// A character a CSS identifier can't hold unescaped. Tags are slugified, so this is rare.
const escapeIdent = (segment: string) =>
  segment.replace(/[^a-zA-Z0-9_\-\u0080-￿]/g, (ch) => `\\${ch}`)

/**
 * The custom property that carries a tag's colour: `--cgc-tag-` and the tag, with `/` written
 * `--`. `engineering/languages/python` is `--cgc-tag-engineering--languages--python`.
 */
export const colorPropertyOf = (tag: string): string =>
  PROPERTY_PREFIX + tag.split("/").map(escapeIdent).join("--")

/**
 * The value a tag's colour property is set to. Its own colour if the dictionary gives it one;
 * otherwise a reference to its parent's property, so it follows whatever the parent resolves to;
 * and at the top, a reference to the default. Colour is inherited through the cascade, not here.
 */
export function colorValueOf(tag: string, dictionary: TagDictionary): string {
  const own = dictionary[tag]?.color
  if (own !== undefined) return own
  const parent = parentOf(tag)
  return `var(${parent === null ? DEFAULT_COLOR_PROPERTY : colorPropertyOf(parent)})`
}

/** A tag's published properties. Its icon is the most specific one its lineage defines. */
export function propertiesOf(tag: string, dictionary: TagDictionary): TagProperties {
  const icon = lineageOf(tag)
    .map((t) => dictionary[t]?.icon)
    .find((i) => i !== undefined)
  return { color: colorPropertyOf(tag), icon: icon ?? null }
}

/**
 * The tag that stands for a page: the first in frontmatter order, as v4's graph took it, however
 * deep the others. Nothing overrides it.
 */
export function primaryTagOf(tags: readonly string[]): string | null {
  return tags[0] ?? null
}

/** Everything the engine publishes on one page's `fileData`. */
export function tagsDataOf(tags: readonly string[], dictionary: TagDictionary): TagsData {
  const own = Object.fromEntries(tags.map((tag) => [tag, propertiesOf(tag, dictionary)]))
  const primary = primaryTagOf(tags)
  return {
    tags: own,
    primary: primary === null ? null : { tag: primary, ...propertiesOf(primary, dictionary) },
    ancestors: Object.fromEntries(
      [...new Set(tags.flatMap(lineageOf))]
        .sort()
        .map((tag) => [tag, propertiesOf(tag, dictionary)]),
    ),
  }
}
