// The shapes of a vault's metadata, named after Obsidian's own (`CachedMetadata`, `LinkCache`, …) so
// that anything written against Obsidian's `MetadataCache` reads the same here.

export interface Point {
  line: number
  column: number
  /** An index into the file's source, in UTF-16 code units, as `String.prototype.slice` takes it. */
  offset: number
}

export interface Position {
  start: Point
  end: Point
}

/**
 * One block of a note's text, as a reader reads it (`Vault.readTextBlocks`): a paragraph, a
 * heading, a code block, a formula, a table's cell or a callout's title. Not in Obsidian's API.
 */
export interface TextBlock {
  /** The block's type in the note's tree: `paragraph`, `heading`, `code`, `math`, `tableCell`, `calloutTitle`. */
  type: string
  /** Its words, without markup, and a link as the text it shows. */
  text: string
  /** The types of the blocks it is inside, outermost first: none for a block at the note's top. */
  within: string[]
  /** Where it is in the note's source. */
  position?: Position
}

/** A file in the vault, of any kind. Obsidian's `TFile`. */
export interface VaultFile {
  /** Path from the vault's root, with `/` separators and no leading one: `content/notes/a.md`. */
  path: string
  /** File name with its extension: `a.md`. */
  name: string
  /** File name without its extension: `a`. */
  basename: string
  /** Extension, lower-cased, without the dot: `md`. */
  extension: string
}

/** A link from a note, as written. */
export interface LinkCache {
  /** The link's target, as written: a linkpath and an optional subpath, `note#Heading`. */
  link: string
  /** The link's whole source text: `[[note#Heading|alias]]`. */
  original: string
  /** What the reader sees: the alias, or the target as Obsidian displays it. */
  displayText: string
  position: Position
}

/** An embed, `![[…]]` or `![](…)`. Shaped as a link. */
export type EmbedCache = LinkCache

export interface TagCache {
  /** The tag with its `#`: `#engineering/ai`. */
  tag: string
  position: Position
}

export interface HeadingCache {
  heading: string
  level: number
  position: Position
}

export interface BlockCache {
  id: string
  position: Position
}

/** A wikilink inside a frontmatter value. */
export interface FrontmatterLinkCache {
  /** The frontmatter key the link was found under; `related.0` for an entry of a list. */
  key: string
  link: string
  original: string
  displayText: string
}

export type FrontMatterCache = Record<string, unknown>

/** Everything known about one note without rendering it. Obsidian's `CachedMetadata`. */
export interface CachedMetadata {
  frontmatter?: FrontMatterCache
  frontmatterPosition?: Position
  frontmatterLinks?: FrontmatterLinkCache[]
  links?: LinkCache[]
  embeds?: EmbedCache[]
  /** Tags written in the note's body. Frontmatter tags are in `frontmatter.tags`; `getAllTags` merges both. */
  tags?: TagCache[]
  headings?: HeadingCache[]
  blocks?: Record<string, BlockCache>
}

/** What a wikilink node carries in `data.wikilink` between the syntax plugins and the resolver. */
export interface WikilinkData {
  link: string
  original: string
  displayText: string
  /** The alias as written, when there is one. An embed reads an image's size from it. */
  alias?: string
  embed: boolean
  position: Position
}

/** What a callout node carries in `data.callout`. */
export interface CalloutData {
  /** The callout's type, lower-cased: `note`, `warning`. */
  type: string
  /** `+` for a callout that folds and starts open, `-` for one that starts closed. */
  fold?: "+" | "-"
}
