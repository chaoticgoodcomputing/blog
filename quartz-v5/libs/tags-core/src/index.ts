// The tag system's shared logic (ADR-0002's worked example, #20, #31): the resolution rule, the
// shapes the `cgc-tags` engine publishes, and the `fileData` augmentation that types them. The
// engine resolves with it, so the rule lives in one place; consumers import its types and, for a
// canvas, its colour resolver (`./colour`). See CONTEXT.md.
//
// Every function here takes tags as Quartz publishes them in `frontmatter.tags`: slugified, with `/`
// between levels and no trailing slash. Normalising what a site writes is the engine's job.

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
    /** Published by the `cgc-tags` engine on every page it transforms. */
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

/** The tag followed by each of its ancestors, nearest first. */
export function lineageOf(tag: string): string[] {
  const lineage = [tag]
  for (let parent = parentOf(tag); parent !== null; parent = parentOf(parent)) lineage.push(parent)
  return lineage
}

/** How deep a tag sits: 0 for a top-level tag, one more for each `/`. */
export const depthOf = (tag: string): number => tag.split("/").length - 1

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
 * The tag that stands for a page: the most specific of its tags, the deepest one, where the first
 * in frontmatter order breaks a tie. A page's `primaryTag` frontmatter overrides both; the engine
 * checks it is one of the page's tags before it gets here.
 */
export function primaryTagOf(tags: readonly string[], override?: string): string | null {
  if (override !== undefined) return override
  let primary: string | null = null
  for (const tag of tags) if (primary === null || depthOf(tag) > depthOf(primary)) primary = tag
  return primary
}

/** Everything the engine publishes on one page's `fileData`. */
export function tagsDataOf(
  tags: readonly string[],
  dictionary: TagDictionary,
  primaryOverride?: string,
): TagsData {
  const own = Object.fromEntries(tags.map((tag) => [tag, propertiesOf(tag, dictionary)]))
  const primary = primaryTagOf(tags, primaryOverride)
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
