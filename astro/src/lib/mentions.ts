// A note's mentions: the pages on other sites that link to it and told the site so, by webmention.
// webmention.io receives them (Webmention.astro names its endpoint); the `mentions` collection
// reads them back as the site builds (src/content.config.ts), and the Mentions section under a
// note shows its own (Mentions.astro). A daily deploy picks up the new ones.
//
// Every kind of webmention with something to say is a mention here. One that only likes or
// reposts a page says nothing: it is a reaction, kept with who made it, and shown apart from the
// mentions, as who liked or reposted the note (`reactionsOf`); Bridgy sends Bluesky's. What a mention shows of its page is that page's
// paragraphs that link to the note, as the site's own mention excerpts are (./mention-excerpts.ts),
// as text: what another site wrote is never put on a page as HTML.

import fs from "node:fs"
import type { Loader } from "astro/loaders"
import { z } from "astro/zod"
import { parse } from "node-html-parser"
import { getAddressMap, type Resolve } from "./addresses.ts"
import { mentionSourceOf } from "./discussion.ts"
import type { WebmentionsConfig } from "../site.config.types.ts"

/** A mention, as the collection holds it. */
export const mentionSchema = z.object({
  /** The source of the discussion it came from (src/lib/discussion.ts). */
  source: z.enum(["webmentions", "bluesky", "hackerNews"]),
  /** For a reaction, a like or a repost of the note, which says nothing; absent for a mention. */
  reaction: z.enum(["like", "repost"]).optional(),
  /** The page on the site it mentions, as the sender wrote it. */
  target: z.string(),
  /**
   * The address of the note that page is, from the site's root, through an alias or a former
   * address (`noteAddressOf`). Worked out as the mentions are loaded, where the address map is known.
   */
  note: z.string(),
  /** The page that mentions it. */
  url: z.string(),
  /** That page's title, when it has one apart from its text. */
  title: z.string().optional(),
  /** Who wrote it, or made the reaction: their name, their address, and their picture. */
  author: z.object({ name: z.string().optional(), url: z.string().optional(), photo: z.string().optional() }),
  published: z.coerce.date().optional(),
  /** What it says of the note: its paragraphs that link there, or the start of its text. */
  excerpt: z.array(z.string()),
})
export type Mention = z.infer<typeof mentionSchema>

/** A webmention as webmention.io's JF2 API gives it: only what is read here. */
export interface Jf2Entry {
  "wm-id"?: number
  "wm-property"?: string
  "wm-target"?: string
  "wm-source"?: string
  "wm-private"?: boolean
  "wm-received"?: string
  url?: string
  name?: string
  published?: string | null
  author?: { name?: string; url?: string; photo?: string }
  content?: { html?: string; text?: string }
}

/** The kinds of webmention that say nothing of a page but that they were made: reactions. */
const REACTIONS: Record<string, Mention["reaction"]> = { "like-of": "like", "repost-of": "repost" }

/** The most a mention's excerpt holds: its paragraphs, each cut at this many characters. */
export const EXCERPT_BLOCKS = 3
const EXCERPT_CHARS = 400

/** A block of a mention's excerpt, its space squeezed and cut at the most an excerpt holds. */
export const cut = (text: string): string => {
  const squeezed = text.replace(/\s+/g, " ").trim()
  return squeezed.length <= EXCERPT_CHARS ? squeezed : `${squeezed.slice(0, EXCERPT_CHARS - 1).trimEnd()}…`
}

/** An address as two pages are compared by: without its fragment, a trailing slash, or `.html`. */
export function pageKey(address: string): string | undefined {
  if (!URL.canParse(address)) return undefined
  const url = new URL(address)
  let pathname = decodeURIComponent(url.pathname)
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "")
  pathname = pathname.replace(/\.html$/, "") || "/"
  return `${url.host}${pathname === "/index" ? "/" : pathname}`
}

/**
 * What a mentioning page says of the target: the blocks of its content that link to it, as text, or
 * the start of its text when none does (or it gave no HTML).
 */
export function excerptOf(content: Jf2Entry["content"], target: string, base: string | undefined): string[] {
  const key = pageKey(target)
  if (content?.html) {
    const body = parse(content.html)
    const blocks: string[] = []
    const seen = new Set<unknown>()
    for (const link of body.querySelectorAll("a[href]")) {
      const href = link.getAttribute("href")!
      if (!URL.canParse(href, base) || pageKey(new URL(href, base).href) !== key) continue
      const block = link.closest("p, li, blockquote, dd, dt, td, th, figcaption") ?? link
      if (seen.has(block)) continue
      seen.add(block)
      const text = cut(block.text)
      if (text) blocks.push(text)
    }
    if (blocks.length > 0) return blocks.slice(0, EXCERPT_BLOCKS)
  }
  const text = content?.text ?? (content?.html ? parse(content.html).text : "")
  return text.trim() ? [cut(text)] : []
}

/**
 * A webmention as a mention of the note it names, through `resolve`, or as a reaction to it for a
 * like or a repost; undefined for one that is private, or names no page of the site.
 */
export function toMention(entry: Jf2Entry, resolve: Resolve = (address) => address): Mention | undefined {
  const target = entry["wm-target"]
  const url = entry.url ?? entry["wm-source"]
  if (!target || !url || entry["wm-private"]) return undefined
  const note = noteAddressOf(target, resolve)
  if (note === undefined) return undefined
  const reaction = REACTIONS[entry["wm-property"] ?? ""]
  return {
    source: mentionSourceOf(url, entry["wm-source"]),
    ...(reaction ? { reaction } : {}),
    target,
    note,
    url,
    ...(entry.name ? { title: entry.name.trim() } : {}),
    author: {
      ...(entry.author?.name ? { name: entry.author.name } : {}),
      ...(entry.author?.url ? { url: entry.author.url } : {}),
      ...(entry.author?.photo ? { photo: entry.author.photo } : {}),
    },
    ...((entry.published ?? entry["wm-received"]) ? { published: new Date((entry.published ?? entry["wm-received"])!) } : {}),
    excerpt: reaction ? [] : excerptOf(entry.content, target, url),
  }
}

/**
 * The note address a mention's target is, from the site's root: its page, followed by `resolve`
 * (an alias, a former address) to the note's own. Its host is not asked: webmention.io gives the
 * site only the webmentions of its own domain.
 */
export function noteAddressOf(target: string, resolve: Resolve = (address) => address): string | undefined {
  const key = pageKey(target)
  if (key === undefined) return undefined
  return resolve(key.slice(key.indexOf("/")))
}

/**
 * A mentioning page as two mentions are told apart by: its `pageKey` and its query, since a page of
 * some sites is named by its query alone, as Hacker News's comments are (`item?id=…`).
 */
function mentionKey(url: string): string {
  const key = pageKey(url)
  return key === undefined ? url : `${key}${new URL(url).search}`
}

/** Whether a page is on a blocked domain: a host in `blocked`, or a host under one. */
export function isBlocked(url: string, blocked: string[]): boolean {
  if (!URL.canParse(url)) return true
  const host = new URL(url).host.toLowerCase()
  return blocked.some((domain) => host === domain.toLowerCase() || host.endsWith(`.${domain.toLowerCase()}`))
}

/**
 * Whether a mention is by a blocked author: one whose address is in `blocked`, its author's or the
 * page's own, or the page under it, as a Bluesky account's posts are under its profile. A Bluesky
 * account is named by its handle's profile (`https://bsky.app/profile/<handle>`) or by its DID
 * (`did:plc:…`), which Bridgy names it by where it has no handle, and which a new handle keeps.
 */
export function isBlockedAuthor(mention: Pick<Mention, "url" | "author">, blocked: string[] = []): boolean {
  const pages = [mention.author.url, mention.url].flatMap((address) => (address ? [pageKey(address)] : [])).filter((key) => key !== undefined)
  return blocked.some((author) => {
    const key = author.startsWith("did:") ? `bsky.app/profile/${author}` : pageKey(author)
    return key !== undefined && pages.some((page) => page === key || page.startsWith(`${key}/`))
  })
}

/** What leaves a mention out of every note's: its site's domain, or its author. */
export type MentionBlocks = Pick<WebmentionsConfig, "blockedDomains"> & Partial<Pick<WebmentionsConfig, "blockedAuthors">>

const isShown = (mention: Mention, blocks: MentionBlocks): boolean =>
  !isBlocked(mention.url, blocks.blockedDomains) && !isBlockedAuthor(mention, blocks.blockedAuthors)

/**
 * The mentions of the note at `noteUrl`, newest first, one for each page that mentions it, and none
 * from a blocked domain or by a blocked author.
 */
export function mentionsOf(noteUrl: string, mentions: Mention[], blocks: MentionBlocks): Mention[] {
  const byPage = new Map<string, Mention>()
  for (const mention of mentions) {
    if (mention.note !== noteUrl || mention.reaction || !isShown(mention, blocks)) continue
    const page = mentionKey(mention.url)
    const kept = byPage.get(page)
    if (!kept || (mention.published?.getTime() ?? 0) > (kept.published?.getTime() ?? 0)) byPage.set(page, mention)
  }
  return [...byPage.values()].sort((a, b) => (b.published?.getTime() ?? 0) - (a.published?.getTime() ?? 0))
}

/**
 * How many mentions each note has, as `mentionsOf` counts them: one for each page, and none from a
 * blocked domain or by a blocked author. Keyed by the note's address; a note with none has no entry.
 */
export function mentionCounts(mentions: Mention[], blocks: MentionBlocks): Map<string, number> {
  const pages = new Map<string, Set<string>>()
  for (const mention of mentions) {
    if (mention.reaction || !isShown(mention, blocks)) continue
    const seen = pages.get(mention.note) ?? new Set<string>()
    seen.add(mentionKey(mention.url))
    pages.set(mention.note, seen)
  }
  return new Map([...pages].map(([note, seen]) => [note, seen.size]))
}


/** A note's reactions: who liked it, and who reposted it. */
export interface Reactions {
  likes: Mention[]
  reposts: Mention[]
}

/**
 * The reactions to the note at `noteUrl`: its likes and its reposts, each newest first, one for each
 * person, as Bridgy sends one for each of the site's posts of the note they liked, and none from a
 * blocked domain or by a blocked author.
 */
export function reactionsOf(noteUrl: string, mentions: Mention[], blocks: MentionBlocks): Reactions {
  const of = (reaction: Mention["reaction"]) => {
    const byPerson = new Map<string, Mention>()
    for (const mention of mentions) {
      if (mention.note !== noteUrl || mention.reaction !== reaction || !isShown(mention, blocks)) continue
      const person = mention.author.url ? mentionKey(mention.author.url) : mention.url
      const kept = byPerson.get(person)
      if (!kept || (mention.published?.getTime() ?? 0) > (kept.published?.getTime() ?? 0)) byPerson.set(person, mention)
    }
    return [...byPerson.values()].sort((a, b) => (b.published?.getTime() ?? 0) - (a.published?.getTime() ?? 0))
  }
  return { likes: of("like"), reposts: of("repost") }
}

/** How many webmentions one request to the API asks for. */
const PAGE_SIZE = 100

/** Every webmention the endpoint received, a page of them at a time. */
async function fetchAll(api: string, token: string): Promise<Jf2Entry[]> {
  const entries: Jf2Entry[] = []
  for (let page = 0; ; page++) {
    const url = new URL(api)
    url.searchParams.set("token", token)
    url.searchParams.set("per-page", String(PAGE_SIZE))
    url.searchParams.set("page", String(page))
    const response = await fetch(url)
    if (!response.ok) throw new Error(`webmention.io answered ${response.status} ${response.statusText}`)
    const { children = [] } = (await response.json()) as { children?: Jf2Entry[] }
    entries.push(...children)
    if (children.length < PAGE_SIZE) return entries
  }
}

/**
 * The `mentions` collection's loader: every webmention the endpoint received, as a mention, read
 * from webmention.io's API with the token in `WEBMENTION_IO_TOKEN`. Without the token, as on a
 * machine that has none, the collection is empty. Read afresh on each build, all of them: there
 * are few, and one the sender deleted should go.
 *
 * With `WEBMENTIONS_FILE`, they are read from that file instead, a JF2 feed as the API gives one:
 * the dev server's made-up webmentions (scripts/mock-mentions.ts).
 *
 * With `enabled` false, it reads nothing, and the collection is empty: no source of the discussion
 * that comes by webmention is on (src/lib/discussion.ts).
 */
export function mentionsLoader(api: string, { enabled = true }: { enabled?: boolean } = {}): Loader {
  return {
    name: "webmentions",
    async load({ store, logger, parseData }) {
      const token = process.env.WEBMENTION_IO_TOKEN
      const file = process.env.WEBMENTIONS_FILE
      store.clear()
      if (!enabled) {
        logger.info("The discussion's webmention sources are off: no webmentions are read.")
        return
      }
      if (file) {
        if (!fs.existsSync(file)) {
          logger.warn(`No mentions are shown: WEBMENTIONS_FILE names ${file}, which is not there.`)
          return
        }
        await keep(JSON.parse(fs.readFileSync(file, "utf8")).children ?? [])
        logger.info(`Read from ${file}.`)
        return
      }
      if (!token) {
        logger.info("No WEBMENTION_IO_TOKEN: no mentions are shown.")
        return
      }
      async function keep(entries: Jf2Entry[]) {
        const { resolve } = getAddressMap()
        let kept = 0
        for (const entry of entries) {
          const mention = toMention(entry, resolve)
          if (!mention || entry["wm-id"] === undefined) continue
          const id = String(entry["wm-id"])
          store.set({ id, data: await parseData({ id, data: mention }) })
          kept++
        }
        logger.info(`${kept} mentions, of ${entries.length} webmentions.`)
      }

      let entries: Jf2Entry[]
      try {
        entries = await fetchAll(api, token)
      } catch (error) {
        // The site is still built, without mentions, so that webmention.io being down holds no
        // deploy back; the next deploy shows them again.
        logger.warn(`No mentions are shown: ${(error as Error).message}`)
        return
      }
      await keep(entries)
    },
  }
}
