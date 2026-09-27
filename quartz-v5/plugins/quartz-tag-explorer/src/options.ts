// The plugin's options, shared by its two halves: the component, which renders the tree, and the
// emitter, which writes the pages under each tag. Both get the site's options as the config gives
// them, since Quartz merges no defaults into either, and both read them through `settingsOf()`.
import { slugTag } from "@quartz-community/utils/path"
import type { IconCollections } from "@chaoticgoodcomputing/icons"
import { normaliseTag, privatePageTest, underAny } from "@chaoticgoodcomputing/tags-core"

export type TagSort = "count-desc" | "count-asc" | "alphabetical" | "alphabetical-reverse"

export interface TagExplorerOptions {
  /** The explorer's heading. Default: "Tag Explorer", in the site's locale where the plugin has it. */
  title?: string
  /** Whether a tag the reader hasn't opened or closed starts open or closed. Default: `collapsed`. */
  defaultState?: "collapsed" | "open"
  /** Remember, in the reader's browser, which tags they opened. Default: true. */
  useSavedState?: boolean
  /**
   * The order of a tag's subtags, and of the top-level tags: by how many pages are under each, most
   * or fewest first, or by name. Ties go A→Z. Default: `count-desc`.
   */
  tagSort?: TagSort
  /** Tags left out of the tree, each with its subtags. Their pages stay under their other tags. Default: none. */
  excludeTags?: string[]
  /**
   * The private tags: a **private page** (tags-core) carries one of them, or a subtag of one, and is
   * listed after a tag's public pages, with a lock. Default: none.
   */
  privateTags?: string[]
  /**
   * Leave every private page out of the explorer, rather than list it with a lock: out of every
   * tag's count and listing, and out of the pages index the browser loads. The private tags and their
   * subtags leave the tree, as does any tag only private pages carry. Default: false.
   */
  excludePrivate?: boolean
  /** After each tag, the number of pages under it, its subtags' included. Default: true. */
  showCount?: boolean
  /**
   * The site's own icon collections, each prefix and its directory of SVG files, resolved against
   * the Quartz root: `{ custom: "../icons" }` draws `custom:d20` from `../icons/d20.svg`. Installed
   * Iconify sets, such as `mdi`, need no entry. Default: none.
   */
  iconCollections?: IconCollections
  /**
   * The viewport width, in pixels, at and below which the explorer is a drawer, opened from a
   * button. Default: 800, core's mobile breakpoint. A site that moves its breakpoints sets its own.
   */
  drawerBreakpoint?: number
}

export interface Settings {
  title: string | undefined
  defaultState: "collapsed" | "open"
  useSavedState: boolean
  tagSort: TagSort
  showCount: boolean
  iconCollections: IconCollections
  drawerBreakpoint: number
  /** Whether a tag is left out of the tree: an excluded tag, or a subtag of one. */
  excluded(tag: string): boolean
  /** Whether a page is a private page, from every tag it is under (the engine's `ancestors`). */
  isPrivate(under: Record<string, unknown>): boolean
  /** Whether private pages are left out of the explorer altogether. */
  excludePrivate: boolean
}

const TAG_SORTS: TagSort[] = ["count-desc", "count-asc", "alphabetical", "alphabetical-reverse"]
const STATES = ["collapsed", "open"]
const OPTIONS = [
  "title",
  "defaultState",
  "useSavedState",
  "tagSort",
  "excludeTags",
  "privateTags",
  "excludePrivate",
  "showCount",
  "iconCollections",
  "drawerBreakpoint",
]

export class TagExplorerError extends Error {
  constructor(message: string) {
    super(`cgc-tag-explorer: ${message}`)
  }
}

const quoted = (values: string[]) => values.map((v) => `"${v}"`).join(", ")

function tagList(name: string, value: unknown): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || !value.every((tag) => typeof tag === "string")) {
    throw new TagExplorerError(`${name} must be a list of tags`)
  }
  // Tags as the corpus writes them: normalised, as the engine does (tags-core).
  return value.map((tag) => normaliseTag(tag, slugTag)).filter(Boolean)
}

/** The site's options, checked, with every default filled in. Any mistake fails the build. */
export function settingsOf(options: TagExplorerOptions = {}): Settings {
  const unknown = Object.keys(options).filter((key) => !OPTIONS.includes(key))
  if (unknown.length) {
    throw new TagExplorerError(
      `unknown option "${unknown[0]}". The options are ${quoted(OPTIONS)}.`,
    )
  }
  const {
    title,
    defaultState = "collapsed",
    useSavedState = true,
    tagSort = "count-desc",
  } = options
  const { showCount = true, excludePrivate = false } = options
  const { iconCollections = {}, drawerBreakpoint = 800 } = options
  if (title !== undefined && typeof title !== "string")
    throw new TagExplorerError("title must be text")
  if (!STATES.includes(defaultState)) {
    throw new TagExplorerError(
      `defaultState must be one of ${quoted(STATES)}, not "${defaultState}"`,
    )
  }
  if (!TAG_SORTS.includes(tagSort)) {
    throw new TagExplorerError(`tagSort must be one of ${quoted(TAG_SORTS)}, not "${tagSort}"`)
  }
  for (const [name, value] of Object.entries({ useSavedState, showCount, excludePrivate })) {
    if (typeof value !== "boolean") throw new TagExplorerError(`${name} must be true or false`)
  }
  if (!Number.isFinite(drawerBreakpoint) || drawerBreakpoint <= 0) {
    throw new TagExplorerError(`drawerBreakpoint must be a width in pixels, such as 800`)
  }
  // A tag is under a root when it is the root or one of its subtags (tags-core): `privateer` is not
  // under `private`.
  const privateTags = tagList("privateTags", options.privateTags)
  const isPrivatePage = privatePageTest(privateTags)
  // Left out of the tree: the excluded tags, and, with private pages left out, the private tags. A
  // private tag's every page is private, so it would have none left anyway.
  const excluded = underAny([
    ...tagList("excludeTags", options.excludeTags),
    ...(excludePrivate ? privateTags : []),
  ])
  return {
    title,
    defaultState,
    useSavedState,
    tagSort,
    showCount,
    iconCollections,
    drawerBreakpoint,
    excluded,
    isPrivate: (ancestors) => isPrivatePage(Object.keys(ancestors)),
    excludePrivate,
  }
}

// Checked when a hook first needs them, not when the factory runs: the loader logs a factory's error
// and builds on without the plugin, where a hook's error fails the build.
export function lazySettings(options?: TagExplorerOptions): () => Settings {
  let settings: Settings | Error | undefined
  return () => {
    if (settings === undefined) {
      try {
        settings = settingsOf(options)
      } catch (err) {
        settings = err as Error
      }
    }
    if (settings instanceof Error) throw settings
    return settings
  }
}
