// The vault and its metadata cache: every file, each note's metadata, and the links between notes,
// resolved. Modelled on Obsidian's `Vault` and `MetadataCache`, with the same names where the same
// thing is meant, so backlinks, tag pages and a graph are all queries over this one structure.

import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import GithubSlugger from "github-slugger"
import type { Features } from "satteri"
import { headingKey, isExternalUrl, parseLinktext } from "./linktext.ts"
import { getAllTags, parseFrontMatterAliases, parseNote } from "./metadata.ts"
import type { SyntaxOptions } from "./syntax/index.ts"
import { blockAnchor } from "./syntax/index.ts"
import type { BlockCache, CachedMetadata, HeadingCache, LinkCache, TextBlock, VaultFile } from "./types.ts"

export interface VaultOptions extends SyntaxOptions {
  /** Extensions read as notes. Default `["md"]`; a site that renders MDX adds `"mdx"`. */
  noteExtensions?: string[]
  /** Leaves a file or directory out, by its path from the vault's root. Dotfiles are always out. */
  ignore?: (path: string) => boolean
  /** The host's parser features, so the cache reads a note as the page renders it. */
  features?: Features
  /**
   * Whether a linkpath that names no file names the note that has it as an alias. Obsidian's own
   * answer is no: there an alias is a name the link suggester offers, the link it writes is
   * `[[note|alias]]`, and `[[alias]]` is unresolved. A site that publishes each alias as an address
   * of its note says yes, so a link written to a note's old name still arrives. Default `false`.
   */
  resolveAliases?: boolean
}

/** A link's count per destination, per source: Obsidian's `resolvedLinks` and `unresolvedLinks`. */
export type LinkCounts = Record<string, Record<string, number>>

export type SubpathResult =
  | { type: "heading"; current: HeadingCache; anchor: string }
  | { type: "block"; block: BlockCache; anchor: string }

const toFile = (filePath: string): VaultFile => {
  const name = path.posix.basename(filePath)
  const extension = path.posix.extname(name).slice(1).toLowerCase()
  return {
    path: filePath,
    name,
    basename: extension ? name.slice(0, -(extension.length + 1)) : name,
    extension,
  }
}

const withoutExtension = (file: VaultFile) =>
  file.extension ? file.path.slice(0, -(file.extension.length + 1)) : file.path

// An alias as a linkpath is matched by: whatever its case, and from the vault's root or not.
const aliasKey = (alias: string) => alias.trim().replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase()

/** Every file under `root`, following symlinks, as paths from it. */
function walk(root: string, ignore: (path: string) => boolean): string[] {
  const found: string[] = []
  const visit = (relative: string) => {
    for (const name of fs.readdirSync(path.join(root, relative)).sort()) {
      if (name.startsWith(".")) continue
      const child = relative ? `${relative}/${name}` : name
      if (ignore(child)) continue
      let stats: fs.Stats
      try {
        stats = fs.statSync(path.join(root, child))
      } catch {
        continue // a dangling symlink
      }
      if (stats.isDirectory()) visit(child)
      else if (stats.isFile()) found.push(child)
    }
  }
  visit("")
  return found
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

export class MetadataCache {
  /** How often each note links to each file it links to. Embeds count as links. */
  readonly resolvedLinks: LinkCounts = {}
  /** How often each note links to each linkpath that names no file. */
  readonly unresolvedLinks: LinkCounts = {}

  readonly #vault: Vault
  readonly #caches = new Map<string, CachedMetadata>()
  readonly #byPath = new Map<string, VaultFile>()
  readonly #notesByPath = new Map<string, VaultFile[]>()
  readonly #byName = new Map<string, VaultFile[]>()
  readonly #notesByBasename = new Map<string, VaultFile[]>()
  readonly #notesByAlias = new Map<string, VaultFile[]>()
  readonly #backlinks = new Map<string, Map<string, LinkCache[]>>()

  constructor(vault: Vault, caches: Map<string, CachedMetadata>, options: Pick<VaultOptions, "resolveAliases"> = {}) {
    this.#vault = vault
    this.#caches = caches
    if (options.resolveAliases) {
      for (const file of vault.getMarkdownFiles()) {
        for (const alias of parseFrontMatterAliases(caches.get(file.path)?.frontmatter) ?? []) {
          push(this.#notesByAlias, aliasKey(alias), file)
        }
      }
    }
    for (const file of vault.getFiles()) {
      this.#byPath.set(file.path.toLowerCase(), file)
      push(this.#byName, file.name.toLowerCase(), file)
      if (vault.isNote(file)) {
        push(this.#notesByPath, withoutExtension(file).toLowerCase(), file)
        push(this.#notesByBasename, file.basename.toLowerCase(), file)
      }
    }
    this.#resolveAll()
  }

  /** A note's metadata, or null for a file that isn't a note. */
  getFileCache(file: VaultFile | string): CachedMetadata | null {
    return this.#caches.get(typeof file === "string" ? file : file.path) ?? null
  }

  /**
   * The file a linkpath names, read from the note at `sourcePath`. As Obsidian resolves one: the
   * path from the vault's root, then the path from the note's own folder, then the shortest path
   * that ends with it, a note in the source's folder winning a tie. A note needs no extension; any
   * other file does. A leading `/` holds the linkpath to the vault's root. Case doesn't matter.
   *
   * In a vault opened with `resolveAliases`, a linkpath that names no file names the note that has
   * it as an alias, the closest one when several do.
   */
  getFirstLinkpathDest(linkpath: string, sourcePath: string): VaultFile | null {
    const file = this.#fileNamed(linkpath, sourcePath)
    if (file) return file
    return this.#closest(this.#notesByAlias.get(aliasKey(linkpath)), path.posix.dirname(sourcePath)) ?? null
  }

  #fileNamed(linkpath: string, sourcePath: string): VaultFile | null {
    let wanted = linkpath.trim().replace(/\\/g, "/")
    if (!wanted) return null
    const fromRoot = wanted.startsWith("/")
    wanted = wanted.replace(/^\/+/, "")
    const sourceDir = path.posix.dirname(sourcePath)

    const exact = (candidate: string): VaultFile | undefined => {
      const key = path.posix.normalize(candidate).toLowerCase()
      if (key.startsWith("..")) return undefined
      return this.#byPath.get(key) ?? this.#closest(this.#notesByPath.get(key), sourceDir)
    }

    if (wanted.startsWith("./") || wanted.startsWith("../")) {
      return (fromRoot ? exact(wanted) : exact(path.posix.join(sourceDir, wanted))) ?? null
    }
    const atRoot = exact(wanted)
    if (atRoot || fromRoot) return atRoot ?? null
    const beside = sourceDir === "." ? undefined : exact(path.posix.join(sourceDir, wanted))
    if (beside) return beside

    // The shortest path: by name alone, or by the last few folders and the name.
    const key = wanted.toLowerCase()
    const name = path.posix.basename(key)
    const candidates = [...(this.#byName.get(name) ?? []), ...(this.#notesByBasename.get(name) ?? [])]
    const ending = candidates.filter((file) => {
      const full = file.path.toLowerCase()
      const bare = withoutExtension(file).toLowerCase()
      return full === key || bare === key || full.endsWith(`/${key}`) || bare.endsWith(`/${key}`)
    })
    return this.#closest(ending, sourceDir) ?? null
  }

  /** The heading or block a subpath names in a note, with the anchor it has on the note's page. */
  resolveSubpath(cache: CachedMetadata, subpath: string): SubpathResult | null {
    const parts = subpath.split("#").filter(Boolean)
    const last = parts.at(-1)
    if (!last) return null
    if (last.startsWith("^")) {
      const block = cache.blocks?.[last.slice(1)]
      return block ? { type: "block", block, anchor: blockAnchor(block.id) } : null
    }
    // A heading's anchor is its slug, numbered when an earlier heading has the same one.
    const slugger = new GithubSlugger()
    const wanted = headingKey(last)
    for (const heading of cache.headings ?? []) {
      const anchor = slugger.slug(heading.heading)
      if (headingKey(heading.heading) === wanted) return { type: "heading", current: heading, anchor }
    }
    return null
  }

  /** The notes that link to a file, each with its links to it. */
  getBacklinksForFile(file: VaultFile | string): Map<string, LinkCache[]> {
    return this.#backlinks.get(typeof file === "string" ? file : file.path) ?? new Map()
  }

  /** Every tag in the vault with the number of notes that carry it. */
  getTags(): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const cache of this.#caches.values()) {
      for (const tag of getAllTags(cache)) counts[tag] = (counts[tag] ?? 0) + 1
    }
    return counts
  }

  /** The notes that carry a tag, or with `nested` any tag under it. */
  getFilesWithTag(tag: string, options: { nested?: boolean } = {}): VaultFile[] {
    const wanted = (tag.startsWith("#") ? tag : `#${tag}`).toLowerCase()
    return this.#vault.getMarkdownFiles().filter((file) =>
      getAllTags(this.#caches.get(file.path) ?? {}).some((own) => {
        const lower = own.toLowerCase()
        return lower === wanted || (options.nested === true && lower.startsWith(`${wanted}/`))
      }),
    )
  }

  #closest(files: VaultFile[] | undefined, sourceDir: string): VaultFile | undefined {
    if (!files?.length) return undefined
    return [...files].sort((a, b) => {
      const inDir = (file: VaultFile) => (path.posix.dirname(file.path) === sourceDir ? 0 : 1)
      return (
        inDir(a) - inDir(b) || a.path.length - b.path.length || a.path.localeCompare(b.path)
      )
    })[0]
  }

  #resolveAll(): void {
    for (const [sourcePath, cache] of this.#caches) {
      const links = [...(cache.links ?? []), ...(cache.embeds ?? [])]
      const fromFrontmatter = (cache.frontmatterLinks ?? []).map((link) => ({
        ...link,
        position: cache.frontmatterPosition!,
      }))
      for (const link of [...links, ...fromFrontmatter]) {
        const linkpath = parseLinktext(link.link).path
        // A link with no path points into its own note, and one out of the vault is no link here.
        if (!linkpath || isExternalUrl(linkpath)) continue
        const destination = this.getFirstLinkpathDest(linkpath, sourcePath)
        if (!destination) {
          const counts = (this.unresolvedLinks[sourcePath] ??= {})
          counts[linkpath] = (counts[linkpath] ?? 0) + 1
          continue
        }
        if (destination.path === sourcePath) continue
        const counts = (this.resolvedLinks[sourcePath] ??= {})
        counts[destination.path] = (counts[destination.path] ?? 0) + 1
        let sources = this.#backlinks.get(destination.path)
        if (!sources) this.#backlinks.set(destination.path, (sources = new Map()))
        push(sources, sourcePath, link)
      }
    }
  }
}

export class Vault {
  /** The vault's root, absolute. */
  readonly root: string
  readonly metadataCache: MetadataCache
  /** A hash of every file's path and every note's source: it changes when anything in the vault does. */
  readonly digest: string
  /**
   * A hash of what one note's rendering takes from the rest of the vault: every file's path, every
   * note's heading and block anchors, and the source of every note another note embeds. While it
   * holds, a note whose own source is unchanged renders the same. In a vault that resolves aliases,
   * every note's aliases are in it too.
   */
  readonly linksDigest: string
  /** How the vault's notes were read, so that whatever reads one again reads it the same. */
  readonly parseOptions: SyntaxOptions & { features?: Features }

  readonly #files: VaultFile[]
  readonly #byPath: Map<string, VaultFile>
  readonly #noteExtensions: Set<string>
  readonly #sources: Map<string, string>
  readonly #texts: Map<string, TextBlock[]>

  private constructor(
    root: string,
    files: VaultFile[],
    noteExtensions: Set<string>,
    sources: Map<string, string>,
    texts: Map<string, TextBlock[]>,
    caches: Map<string, CachedMetadata>,
    parseOptions: SyntaxOptions & { features?: Features },
    resolveAliases: boolean,
  ) {
    this.root = root
    this.parseOptions = parseOptions
    this.#files = files
    this.#byPath = new Map(files.map((file) => [file.path, file]))
    this.#noteExtensions = noteExtensions
    this.#sources = sources
    this.#texts = texts
    const hash = createHash("sha256")
    for (const file of files) hash.update(file.path).update("\0").update(sources.get(file.path) ?? "").update("\0")
    this.digest = hash.digest("hex")
    this.metadataCache = new MetadataCache(this, caches, { resolveAliases })

    // A note another note embeds is rendered inside it, so its whole source is part of what that
    // note takes from the rest of the vault.
    const embedded = new Set<string>()
    for (const [sourcePath, cache] of caches) {
      for (const embed of cache.embeds ?? []) {
        const linkpath = parseLinktext(embed.link).path
        const destination = linkpath ? this.metadataCache.getFirstLinkpathDest(linkpath, sourcePath) : null
        if (destination && this.isNote(destination)) embedded.add(destination.path)
      }
    }
    const links = createHash("sha256")
    for (const file of files) {
      const cache = caches.get(file.path)
      const headings = (cache?.headings ?? []).map((heading) => heading.heading)
      const blocks = Object.keys(cache?.blocks ?? {})
      const source = embedded.has(file.path) ? sources.get(file.path) : null
      const aliases = resolveAliases ? (parseFrontMatterAliases(cache?.frontmatter) ?? []) : []
      links.update(JSON.stringify([file.path, headings, blocks, source, ...(aliases.length ? [aliases] : [])]))
    }
    this.linksDigest = links.digest("hex")
  }

  /** Read a vault from disk: list its files, and parse every note's metadata. */
  static async open(root: string, options: VaultOptions = {}): Promise<Vault> {
    const { noteExtensions = ["md"], ignore = () => false, features, resolveAliases = false, ...syntax } = options
    const absolute = path.resolve(root)
    const extensions = new Set(noteExtensions.map((extension) => extension.toLowerCase()))
    const files = walk(absolute, ignore).map(toFile)
    const sources = new Map<string, string>()
    const texts = new Map<string, TextBlock[]>()
    const caches = new Map<string, CachedMetadata>()
    for (const file of files) {
      if (!extensions.has(file.extension)) continue
      const source = fs.readFileSync(path.join(absolute, file.path), "utf8")
      sources.set(file.path, source)
      try {
        const { metadata, blocks } = await parseNote(source, {
          ...syntax,
          ...(features ? { features } : {}),
          format: file.extension === "mdx" ? "mdx" : "md",
        })
        caches.set(file.path, metadata)
        texts.set(file.path, blocks)
      } catch (error) {
        // A note the parser refuses is still a note others can link to.
        console.warn(`[obsidian-markdown] ${file.path}: ${(error as Error).message}`)
        caches.set(file.path, {})
        texts.set(file.path, [])
      }
    }
    return new Vault(
      absolute,
      files,
      extensions,
      sources,
      texts,
      caches,
      { ...syntax, ...(features ? { features } : {}) },
      resolveAliases,
    )
  }

  /** Every file in the vault. */
  getFiles(): VaultFile[] {
    return this.#files
  }

  /** Every note in the vault. */
  getMarkdownFiles(): VaultFile[] {
    return this.#files.filter((file) => this.isNote(file))
  }

  getFileByPath(filePath: string): VaultFile | null {
    return this.#byPath.get(filePath) ?? null
  }

  /** The vault's file at an absolute path on disk, or null for a path outside it. */
  getFileByAbsolutePath(absolutePath: string): VaultFile | null {
    const relative = path.relative(this.root, absolutePath).split(path.sep).join("/")
    return this.getFileByPath(relative)
  }

  isNote(file: VaultFile): boolean {
    return this.#noteExtensions.has(file.extension)
  }

  /** A note's source, as it was when the vault was read. */
  read(file: VaultFile): string | null {
    return this.#sources.get(file.path) ?? null
  }

  /**
   * A note's text as a reader reads it, as it was when the vault was read: the words of its body,
   * a block to a line, without its frontmatter, its comments or its markup, and a link as the text
   * it shows. What a word count or a reading time is counted from. Not in Obsidian's API.
   */
  readText(file: VaultFile): string | null {
    return this.readTextBlocks(file)?.map((block) => block.text).join("\n") ?? null
  }

  /**
   * A note's text block by block (`TextBlock`), as it was when the vault was read: what `readText`
   * joins, each with its type, where it is in the source, and the blocks it is inside. Not in
   * Obsidian's API.
   */
  readTextBlocks(file: VaultFile): TextBlock[] | null {
    return this.#texts.get(file.path) ?? null
  }
}
