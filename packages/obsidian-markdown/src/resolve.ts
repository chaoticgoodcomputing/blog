// The resolver: the one plugin that knows the vault. It gives each wikilink the page its target is
// published at, and each Markdown link that names a file of the vault the same, turns an embedded
// image into an image, shows an embedded note in place, and marks what resolves to nothing, as
// Obsidian does, with `is-unresolved`. Where a file is published is the site's decision, so the
// site passes that in.

import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import GithubSlugger from "github-slugger"
import { defineMdastPlugin, markdownToHtml, type MdastPluginDefinition } from "satteri"
import {
  EMBED_KEY,
  MAX_EMBED_DEPTH,
  type EmbedState,
  capture,
  noteEmbed,
  splitAtEmbeds,
} from "./embed.ts"
import { decodeLinkUrl, headingKey, isExternalUrl, parseLinktext, parseSize } from "./linktext.ts"
import { type SyntaxOptions, TAG, WIKILINK, obsidianFeatures, obsidianSyntax } from "./syntax/index.ts"
import { type Ctx, type Node, copyOf, mergeData } from "./syntax/node.ts"
import type { VaultFile, WikilinkData } from "./types.ts"
import type { SubpathResult, Vault } from "./vault.ts"

export interface ResolveOptions {
  /**
   * The vault to resolve against. A function is called for each note, so a host that reads the
   * vault again, as a dev server does when a note is added, is resolved against the latest.
   */
  vault: Vault | (() => Vault)
  /**
   * The URL a file of the vault is published at. A file the site publishes nowhere has none, and a
   * link to it is unresolved, as a link to no file is.
   */
  urlFor: (file: VaultFile) => string | undefined
  /** The URL of a tag's page, given the tag without its `#`. Without it a tag links nowhere. */
  tagUrl?: (tag: string) => string
  /**
   * The URL of a page the site publishes that is no file of the vault, given the path a wikilink
   * names when that path is no file: a tag's page, say. A link to it resolves there. Default: none,
   * and such a link is unresolved, as it is in Obsidian.
   */
  urlForPath?: (linkpath: string) => string | undefined
  /** The URL a link that resolves to no file gets. Default: the linkpath as written. */
  unresolvedUrl?: (linkpath: string) => string
  /**
   * The host's plugins that go between the syntax and the resolver, such as `obsidianExcalidraw`.
   * An embedded note is compiled on its own, and runs them there too, so an embed inside it is
   * shown as it would be on the note's own page. Each must be synchronous. Default: none.
   */
  beforeResolve?: MdastPluginDefinition[]
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "bmp"])

/** Whether an embed of a file is an image. An embed of an attachment that is no image, video or audio is a link to it. */
export const isImageFile = (file: VaultFile): boolean => IMAGE_EXTENSIONS.has(file.extension)

// What Obsidian plays in place when a note embeds it (Obsidian's help, "Accepted file formats").
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "ogv", "mov", "mkv"])
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "ogg", "3gp", "flac"])

/** Whether an embed of a file is a video, played in place. */
export const isVideoFile = (file: VaultFile): boolean => VIDEO_EXTENSIONS.has(file.extension)

/** Whether an embed of a file is audio, played in place. */
export const isAudioFile = (file: VaultFile): boolean => AUDIO_EXTENSIONS.has(file.extension)

/**
 * The anchor a subpath has on its file's page, with its `#`, given the heading or block the file's
 * cache found for it. Empty for no subpath. A file that is no note has no headings or blocks: its
 * subpath is the file's own fragment, such as a PDF's `#page=2`, and is kept as written.
 */
function anchorOf(subpath: string, target: SubpathResult | null, note = true): string {
  if (!subpath) return ""
  if (!note) return encodeURI(subpath)
  // A heading or block the cache doesn't know still gets the anchor it would have.
  const last = subpath.split("#").filter(Boolean).at(-1) ?? ""
  return `#${target ? target.anchor : last.startsWith("^") ? last : headingKey(last)}`
}

/** The path from a note to a file of the vault, as a URL: how a host finds a local image to optimize. */
function relativeUrl(notePath: string, filePath: string): string {
  const relative = path.posix.relative(path.posix.dirname(notePath), filePath)
  return encodeURI(relative.startsWith(".") ? relative : `./${relative}`)
}

/** What a heading reads as, for its slug. */
const textOf = (node: Node): string => (node.value ?? "") + (node.children ?? []).map(textOf).join("")

function eachNode(nodes: Node[], visit: (node: Node) => void): void {
  for (const node of nodes) {
    visit(node)
    eachNode(node.children ?? [], visit)
  }
}

/** Where a wikilink goes, read from the note it is written in. */
interface Destination {
  /** The file the link names, or null. A link with no path names its own note. */
  file: VaultFile | null
  /** The heading or block its subpath names, when the file's cache knows it. */
  target: SubpathResult | null
  /** Whether the link names a subpath at all. */
  hasSubpath: boolean
  href: string
  resolved: boolean
}

export function obsidianResolve(options: ResolveOptions) {
  const { urlFor, urlForPath, tagUrl, unresolvedUrl = (linkpath) => linkpath } = options
  const latest = typeof options.vault === "function" ? options.vault : () => options.vault as Vault
  // One vault for the whole of a note's compile, asked for once: the data bag is the compile's own.
  const vaults = new WeakMap<object, Vault>()
  const current = (ctx: Ctx): Vault => {
    let vault = vaults.get(ctx.data)
    if (!vault) vaults.set(ctx.data, (vault = latest()))
    return vault
  }

  const sourceOf = (ctx: Ctx, vault: Vault) =>
    ctx.fileURL ? vault.getFileByAbsolutePath(fileURLToPath(ctx.fileURL)) : null

  // A note rendered as its own page has no state; one compiled to be embedded is told its depth.
  const stateOf = (ctx: Ctx, source: VaultFile | null): EmbedState =>
    (ctx.data[EMBED_KEY] as EmbedState | undefined) ?? { depth: 0, host: source?.path ?? "" }

  function locate(wikilink: WikilinkData, vault: Vault, source: VaultFile | null, state: EmbedState): Destination {
    const cache = vault.metadataCache
    const { path: linkpath, subpath } = parseLinktext(wikilink.link)
    // A link with no path points into the note it is written in.
    const file = linkpath ? cache.getFirstLinkpathDest(linkpath, source?.path ?? "") : source

    const fileCache = file && cache.getFileCache(file)
    const target = (subpath && fileCache && cache.resolveSubpath(fileCache, subpath)) || null
    const anchor = anchorOf(subpath, target, !file || vault.isNote(file))
    // A link into its own note needs no address, unless the note is shown on another's page. Any
    // other resolves when its file has one.
    const within = !linkpath && state.depth === 0
    const address = within ? undefined : file ? urlFor(file) : linkpath ? urlForPath?.(linkpath) : undefined
    return {
      file,
      target,
      hasSubpath: subpath !== "",
      href: (within ? "" : (address ?? unresolvedUrl(linkpath))) + anchor,
      resolved: within || address !== undefined,
    }
  }

  /**
   * What an embed of a note shows, compiled as the note it comes from; null when there is nothing to
   * show. Its footnotes are named with `prefix`, which is the embed's own on the page.
   */
  function embedded(
    vault: Vault,
    file: VaultFile,
    target: SubpathResult | null,
    state: EmbedState,
    prefix: string,
  ): Node[] | null {
    const source = vault.read(file)
    if (source === null) return null
    const out: { nodes?: Node[] } = {}
    const { features, ...syntax } = vault.parseOptions
    // Every plugin here is synchronous, and so is the compile.
    markdownToHtml(source, {
      features: { ...features, ...obsidianFeatures },
      mdastPlugins: [
        ...obsidianSyntax(syntax),
        ...(options.beforeResolve ?? []),
        obsidianResolve({ ...options, vault }),
        capture(target, out, prefix),
      ],
      fileURL: pathToFileURL(path.join(vault.root, file.path)),
      data: { [EMBED_KEY]: { depth: state.depth + 1, host: state.host } satisfies EmbedState },
    })
    return out.nodes?.length ? out.nodes : null
  }

  return defineMdastPlugin({
    name: "obsidian-resolve",
    before(root, ctx) {
      const vault = current(ctx)
      const source = sourceOf(ctx, vault)
      const state = stateOf(ctx, source)
      const tree = root as unknown as Node

      if (source) {
        // A Markdown image's path is written from its own note, and is read from the host's. One
        // that starts with `/` is from the vault's root, as Obsidian reads it, and is handed to the
        // host from the note whose page shows it; one that names no file of the vault is the host's.
        eachNode([tree], (node) => {
          const url = node.type === "image" ? (node.url as string | undefined) : undefined
          if (!url || isExternalUrl(url)) return
          const written = decodeLinkUrl(url)
          let file: string
          if (written.startsWith("/")) {
            const named = vault.getFileByPath(written.replace(/^\/+/, ""))
            if (!named) return
            file = named.path
          } else if (state.depth > 0) {
            file = path.posix.join(path.posix.dirname(source.path), written)
          } else return
          ctx.replaceNode(node as never, copyOf(node, { url: relativeUrl(state.host, file) }) as never)
        })
      }

      if (state.depth >= MAX_EMBED_DEPTH || !ctx.source.includes("![[")) return

      // A heading's anchor on a page is its slug, numbered among the note's own headings, which is
      // what a link to it is given (`resolveSubpath`). So an embedded heading takes an id here,
      // after every one of the page's own: it never takes a number from one of them.
      let slugger: GithubSlugger | undefined
      const identify = (nodes: Node[]) => {
        if (!slugger) {
          slugger = new GithubSlugger()
          const own = (source && vault.metadataCache.getFileCache(source)?.headings) ?? []
          for (const heading of own) slugger.slug(heading.heading)
        }
        eachNode(nodes, (node) => {
          if (node.type !== "heading") return
          node.data = mergeData(node, { hProperties: { id: slugger!.slug(textOf(node)) } })
        })
      }

      // Each embed on the page names its footnotes apart: `embed1-a`, `embed2-a`. An embed inside an
      // embedded note was named in that note's compile, and is named again here, so it stays apart.
      let embeds = 0
      const embed = (node: Node): Node | null => {
        const wikilink = node.data!.wikilink as WikilinkData
        if (!wikilink.embed || node.data!.embedded) return null
        const { file, target, hasSubpath, href, resolved } = locate(wikilink, vault, source, state)
        // An MDX note is a program, with imports and components of its own: it stays a link.
        if (!file || !vault.isNote(file) || file.extension === "mdx") return null
        if (hasSubpath && !target) return null
        const content = embedded(vault, file, target, state, `embed${++embeds}-`)
        if (!content) return null
        if (state.depth === 0) identify(content)
        return noteEmbed(wikilink, content, resolved ? href : undefined)
      }

      eachNode([tree], (node) => {
        if (node.type !== "paragraph") return
        const pieces = splitAtEmbeds(node, embed)
        if (pieces) ctx.replaceNode(node as never, pieces as never)
      })
    },
    // A Markdown link that names a file of the vault is a link like a wikilink, and goes where one
    // would. One that names none is left as written: it may be an address of the site's own.
    link(link, ctx) {
      const node = link as unknown as Node
      // A link in embedded content was resolved in the note it comes from.
      if (node.data?.embedded) return
      const url = (node.url as string | undefined) ?? ""
      if (!url || isExternalUrl(url)) return
      const written = decodeLinkUrl(url)
      const { path: linkpath, subpath } = parseLinktext(written)
      if (!linkpath) return

      const vault = current(ctx)
      const source = sourceOf(ctx, vault)
      const cache = vault.metadataCache
      const destination = cache.getFirstLinkpathDest(linkpath, source?.path ?? "")
      if (!destination) return

      const address = urlFor(destination)
      if (address !== undefined) {
        const fileCache = subpath ? cache.getFileCache(destination) : null
        const target = (fileCache && cache.resolveSubpath(fileCache, subpath)) || null
        ctx.setProperty(link, "url", address + anchorOf(subpath, target, vault.isNote(destination)))
      }
      ctx.setProperty(
        link,
        "data",
        mergeData(node, {
          hProperties: {
            className: ["internal-link", ...(address === undefined ? ["is-unresolved"] : [])],
            "data-href": written,
          },
        }),
      )
    },
    custom(custom, ctx) {
      const node = custom as unknown as Node
      const vault = current(ctx)

      if (node.type === TAG) {
        if (!tagUrl) return
        const tag = (node.data!.tag as { tag: string }).tag.replace(/^#/, "")
        ctx.setProperty(custom, "data", mergeData(node, { hProperties: { href: tagUrl(tag) } }))
        return
      }
      // A link in embedded content was resolved in the note it comes from.
      if (node.type !== WIKILINK || node.data!.embedded) return

      const wikilink = node.data!.wikilink as WikilinkData
      const source = sourceOf(ctx, vault)
      const state = stateOf(ctx, source)
      const { file, target, hasSubpath, href, resolved } = locate(wikilink, vault, source, state)

      if (wikilink.embed && file && isImageFile(file)) {
        const size = parseSize(wikilink.alias)
        ctx.replaceNode(custom, {
          type: "image",
          // Written from the note whose page the image ends up on.
          url: relativeUrl(state.host, file.path),
          alt: size || !wikilink.alias ? file.basename : wikilink.alias,
          ...(size ? { data: { hProperties: size } } : {}),
        } as never)
        return
      }

      // A video or audio, with an address, is played in place, from its address: its controls the
      // browser's, a video as wide as the alias says, as an image is (`![[clip.mp4|400]]`). Inside
      // the player is what a browser that plays neither shows: the embed's text.
      const media = wikilink.embed && file && resolved ? (isVideoFile(file) ? "video" : isAudioFile(file) ? "audio" : undefined) : undefined
      if (media) {
        const size = media === "video" ? parseSize(wikilink.alias) : null
        ctx.setProperty(
          custom,
          "data",
          mergeData(node, {
            hName: media,
            hProperties: {
              src: href,
              controls: true,
              preload: "metadata",
              ...(media === "video" ? { playsInline: true } : {}),
              ...(size ?? {}),
              className: ["internal-embed", `${media}-embed`],
              "data-href": wikilink.link,
            },
          }),
        )
        return
      }

      // An embed of a heading or block its note doesn't have shows nothing, and says so.
      const missing = wikilink.embed && hasSubpath && !target && file !== null && vault.isNote(file)

      ctx.setProperty(
        custom,
        "data",
        mergeData(node, {
          hName: "a",
          hProperties: {
            href,
            // An embed that is neither an image nor a note shown in place stays a link to what it
            // embeds, marked as an embed.
            className: [
              wikilink.embed ? "internal-embed" : "internal-link",
              ...(resolved && !missing ? [] : ["is-unresolved"]),
            ],
            "data-href": wikilink.link,
          },
        }),
      )
    },
  })
}

export type ObsidianOptions = ResolveOptions & SyntaxOptions

/**
 * Everything a site needs to render a vault's notes: the syntax, then the plugins in
 * `beforeResolve`, then the resolver.
 */
export function obsidian(options: ObsidianOptions): MdastPluginDefinition[] {
  const { tags, ...resolve } = options
  return [
    ...obsidianSyntax(tags === undefined ? {} : { tags }),
    ...(resolve.beforeResolve ?? []),
    obsidianResolve(resolve),
  ]
}
