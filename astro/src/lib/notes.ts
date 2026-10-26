// The notes query: which notes of the vault are published, and what each one knows. Every listing,
// the feed, the sitemap, search, the graph and the tag pages ask here, so a kind of note is taken
// out of publication in one place, and so is where a link to a file of the vault goes.
//
// It reads the vault's metadata cache and nothing of Astro's, so the Astro config and its
// integrations can ask too, where `astro:content` is not to be had (docs/adr/0006). A page that
// renders a note's body joins the note to its collection entry (./entries.ts).

import { createHash } from "node:crypto"
import { getAllTags, isExcalidraw, type CachedMetadata, type Vault, type VaultFile } from "@chaoticgoodcomputing/obsidian-markdown"
import { site } from "../site.config.ts"
import { modifiedTime, resolveDates, vaultDates } from "./dates.ts"
import { sourceDate } from "./resume.ts"
import { tagSlug, tagUrl, underAny, withAncestors } from "./tags.ts"
import { excerptOf } from "./excerpt.ts"
import { getVault, pagePath, slugFor } from "./vault.ts"

/** What the site knows of a note, whether or not the note has a page. */
export interface NoteFacts {
  /** The note's slug, and its collection entry's id. */
  id: string
  /** The note's file in the vault. */
  file: VaultFile
  /** What the vault's metadata cache holds for it: its links, embeds, headings and blocks. */
  cache: CachedMetadata
  /** Its frontmatter as written, for a property this module doesn't read. */
  frontmatter: Record<string, unknown>
  /** Frontmatter's title, else the file's name without its extension. */
  title: string
  /** Frontmatter's description, as written: none where it writes none. */
  description: string | undefined
  /**
   * What the site describes the note by, wherever it does: its description, else its excerpt, its
   * first paragraph cut short (./excerpt.ts). A private page has no excerpt: what the site
   * publishes of it is a stub every private page shares. None for a note with neither.
   */
  summary: string | undefined
  /** Its own tags, as tag slugs, in the order written. */
  tags: string[]
  /** Its own tags and every ancestor of each, sorted. */
  tagsWithAncestors: string[]
  /** The note's date: frontmatter's `date`, then its last commit's, then its file's. */
  date: Date
  /** When it last changed: its last commit's time, then its file's, and never before its date. */
  modified: Date
  /** Whether its page is a private page: one under a private tag. */
  isPrivate: boolean
  /** Whether it is an article: a note under one of the site's article folders, private or not. */
  isArticle: boolean
}

/** A published note: one with a page of its own. */
export interface Note extends NoteFacts {
  /** The address of its page, from the site's root: `/` for the index note. */
  url: string
}

/** A note taken out of publication. */
export interface UnpublishedNote extends NoteFacts {
  /** Why it has no page: its rule's reason. */
  reason: string
  /** Where a link to it goes, when its rule says. With none, a link to it is unresolved. */
  url: string | undefined
}

/** A kind of note that has no page of its own. A ticket that takes a kind out adds one rule. */
export interface Unpublished {
  /** The kind's name, which `getUnpublished` is asked by. */
  reason: string
  test: (file: VaultFile, cache: CachedMetadata) => boolean
  /**
   * Where a link to such a note goes instead of to a page. Asked once every note is indexed, so it
   * may ask what the published notes are.
   */
  url?: (file: VaultFile, cache: CachedMetadata, published: Note[]) => string | undefined
}

// Where the vault keeps its tag description notes: `tags/<tag slug>.md`.
const TAG_DESCRIPTIONS = "tags/"

export const unpublished: Unpublished[] = [
  // A drawing's note holds Excalidraw's scene data, which is no page. A note that embeds it shows
  // the drawing (./drawings.ts), and a link to it goes nowhere.
  { reason: "drawing", test: (_file, cache) => isExcalidraw(cache) },

  // A tag description note, `tags/<tag slug>.md`, is the body of its tag's page, which is at the
  // address the note's own page would have had (src/pages/tags). A link to it goes there, when the
  // tag has a page; a link to the description of a tag no published note carries is unresolved.
  {
    reason: "tag description",
    test: (file) => file.path.startsWith(TAG_DESCRIPTIONS),
    url: (file, _cache, published) => tagPageAt(file.path, published),
  },
]

// The tags each set of published notes gives a page: every tag one carries, and every ancestor of
// one (./tag-pages.ts), by their slugs in lower case, as Obsidian matches a link's path.
const tagPagesOf = new WeakMap<Note[], Map<string, string>>()

/**
 * The address of the tag page a path of the vault names, `tags/<tag slug>` with or without a
 * leading `/` or a note's extension, when that tag has a page among `published`'s tags.
 */
function tagPageAt(linkpath: string, published: Note[]): string | undefined {
  const written = linkpath.replace(/^\//, "").replace(/\.mdx?$/i, "")
  if (!written.startsWith(TAG_DESCRIPTIONS)) return undefined
  let tags = tagPagesOf.get(published)
  if (!tags) {
    tags = new Map([...tagsOf(published).keys()].map((tag) => [tag.toLowerCase(), tag]))
    tagPagesOf.set(published, tags)
  }
  const tag = tags.get(written.slice(TAG_DESCRIPTIONS.length).toLowerCase())
  return tag === undefined ? undefined : tagUrl(tag)
}

/** Whether tags make a page private: one of them is a private tag, or under one. */
export const isPrivate = (tags: Iterable<string>): boolean => underAny(tags, site.private.tags)

export interface NoteIndex {
  /** The published notes, in the vault's order, which is by path. */
  notes: Note[]
  /** The unpublished notes, by reason. */
  unpublished: Map<string, UnpublishedNote[]>
  /** A published note by its slug. */
  byId: Map<string, Note>
  /** Any note by its path in the vault. */
  byPath: Map<string, Note | UnpublishedNote>
  /** The address a link to a file of the vault goes to; undefined for a file with none. */
  urlOf: (file: VaultFile) => string | undefined
  /** The address a link to a path that is no file of the vault goes to: a tag's page, or none. */
  urlOfPath: (linkpath: string) => string | undefined
  /**
   * A digest of everything a rendered link or embed depends on: the vault's own links digest, and
   * the address this index gives each file of the vault. It moves when a note is added, renamed or
   * deleted, when a note another embeds changes, and when an `unpublished` rule or `urlOf` changes
   * its answer for any file.
   */
  linksDigest: string
}

// Whether a path of the vault is under a folder of it: `content/a.md` is under `content`, and
// `contents.md` is not.
const isUnder = (file: string, folder: string): boolean => file.startsWith(`${folder.replace(/\/+$/, "")}/`)

// A frontmatter property as text, when it is text and says something.
const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined

/**
 * The index of a vault: the query's core, and what a test of a rule is written against. Git and
 * the file system are asked for the dates frontmatter doesn't give.
 */
export function indexNotes(vault: Vault, rules: Unpublished[] = unpublished): NoteIndex {
  const { git, sourceOf } = vaultDates(vault.root)
  const index: NoteIndex = {
    notes: [],
    unpublished: new Map(),
    byId: new Map(),
    byPath: new Map(),
    urlOf: (file) => {
      const note = index.byPath.get(file.path)
      if (note) return note.url
      return `/${encodeURI(file.path)}`
    },
    urlOfPath: (linkpath) => tagPageAt(linkpath, index.notes),
    linksDigest: "",
  }

  const ruled: [UnpublishedNote, Unpublished][] = []
  for (const file of vault.getMarkdownFiles()) {
    const cache = vault.metadataCache.getFileCache(file) ?? {}
    const frontmatter = (cache.frontmatter ?? {}) as Record<string, unknown>
    const tags = [...new Set(getAllTags(cache).map(tagSlug))]
    const facts: NoteFacts = {
      id: slugFor(file.path),
      file,
      cache,
      frontmatter,
      title: text(frontmatter.title) ?? file.basename,
      description: text(frontmatter.description),
      summary: undefined,
      tags,
      tagsWithAncestors: withAncestors(tags),
      ...resolveDates({
        // The resume's note is dated by the resume's source, outside the vault (./resume.ts).
        frontmatter: frontmatter.date ?? sourceDate(file.path),
        git: git.get(file.path),
        filesystem: () => modifiedTime(sourceOf(file.path)),
      }),
      isPrivate: isPrivate(tags),
      isArticle: site.articleFolders.some((folder) => isUnder(file.path, folder)),
    }
    facts.summary = facts.description ?? (facts.isPrivate ? undefined : excerptOf(vault.readTextBlocks(file) ?? [], vault.read(file) ?? ""))

    const rule = rules.find((each) => each.test(file, cache))
    if (rule) {
      const note: UnpublishedNote = { ...facts, reason: rule.reason, url: undefined }
      ruled.push([note, rule])
      index.unpublished.set(rule.reason, [...(index.unpublished.get(rule.reason) ?? []), note])
      index.byPath.set(file.path, note)
    } else {
      const note: Note = { ...facts, url: `/${pagePath(facts.id)}` }
      index.notes.push(note)
      index.byId.set(note.id, note)
      index.byPath.set(file.path, note)
    }
  }

  for (const [note, rule] of ruled) note.url = rule.url?.(note.file, note.cache, index.notes)

  const digest = createHash("sha256").update(vault.linksDigest)
  for (const file of vault.getFiles()) digest.update(JSON.stringify([file.path, index.urlOf(file) ?? null]))
  // A link to a path that is no file goes to a tag's page when the tag has one.
  digest.update(JSON.stringify([...tagsOf(index.notes).keys()]))
  index.linksDigest = digest.digest("hex")
  return index
}

// One index per vault as it was last read: the dev server reads the vault again when a file in it
// changes (src/content.config.ts), and the next question is answered from the new one.
const indexes = new WeakMap<Vault, NoteIndex>()
const current = (): NoteIndex => {
  const vault = getVault()
  let index = indexes.get(vault)
  if (!index) indexes.set(vault, (index = indexNotes(vault)))
  return index
}

/**
 * Whether a published note is the index note, whose page is the home page: a page of its own kind,
 * and no tag's post.
 */
export const isHomeNote = (note: Pick<Note, "url">): boolean => note.url === "/"

/** Every published note, by path. */
export const getNotes = (): Note[] => current().notes

/** Every published note whose page is not a private page. */
export const getPublicNotes = (): Note[] => current().notes.filter((note) => !note.isPrivate)

/** A published note by its slug. */
export const getNote = (id: string): Note | undefined => current().byId.get(id)

/** The note a file of the vault is, published or not; undefined for a file that is no note. */
export const noteOf = (file: VaultFile | string): Note | UnpublishedNote | undefined =>
  current().byPath.get(typeof file === "string" ? file : file.path)

/** Whether a file of the vault is a note with a page. */
export const isPublished = (file: VaultFile | string): boolean => {
  const note = noteOf(file)
  return note !== undefined && !("reason" in note)
}

/** The notes taken out of publication for one reason. */
export const getUnpublished = (reason: string): UnpublishedNote[] => current().unpublished.get(reason) ?? []

/**
 * The address a link to a file of the vault goes to, which the Markdown pipeline resolves every
 * link by: a published note's page, where an unpublished note's rule says, an attachment's own
 * path. Undefined for a file with no address, and a link to it is unresolved.
 */
export const urlOf = (file: VaultFile): string | undefined => current().urlOf(file)

/**
 * The address a link to a path that is no file of the vault goes to, which the Markdown pipeline
 * asks of a wikilink no file answers: the page of the tag `tags/<tag slug>` names, when the tag has
 * one and no description note. Undefined for any other path, and a link to it is unresolved.
 */
export const urlOfPath = (linkpath: string): string | undefined => current().urlOfPath(linkpath)

/**
 * A digest of everything a rendered link or embed depends on, which the notes' loader keeps beside
 * the rendered notes: when it has moved, every note is rendered again (src/content.config.ts).
 */
export const getLinksDigest = (): string => current().linksDigest

/** Newest first, then by title. */
export const newestFirst = (a: NoteFacts, b: NoteFacts): number =>
  b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title)

export interface TagUse {
  tag: string
  /** The notes that carry the tag itself. */
  own: Note[]
  /** The notes that carry the tag or a tag under it. */
  under: Note[]
}

/**
 * Every tag one of `notes` carries, and every ancestor of one, sorted, each with its notes. The
 * caller says which notes count: `tagsOf(getPublicNotes())` knows no private page.
 */
export function tagsOf(notes: Note[]): Map<string, TagUse> {
  const uses = new Map<string, TagUse>()
  const use = (tag: string) => {
    let entry = uses.get(tag)
    if (!entry) uses.set(tag, (entry = { tag, own: [], under: [] }))
    return entry
  }
  for (const note of notes) {
    for (const tag of note.tags) use(tag).own.push(note)
    for (const tag of note.tagsWithAncestors) use(tag).under.push(note)
  }
  return new Map([...uses].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
}
