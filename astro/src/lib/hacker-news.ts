// Each note's Hacker News thread: the submission of the note's page with the most comments, and its
// top comments, as mentions. The `hackerNewsThreads` collection reads them as the site builds
// (src/content.config.ts), and a note's discussion links to its thread and shows its comments
// (./discussion.ts). Hacker News sends no webmention, and Bridgy reads none of it, so they are
// read from its own APIs instead, neither of which needs an account:
//
//   - Algolia's search of Hacker News (https://hn.algolia.com/api), for the submissions of the
//     site's pages: the official API can't look a submission up by its address;
//   - the official API (https://github.com/HackerNews/API), for a thread's comments, in the order
//     Hacker News ranks them.
//
// A comment is shown as text, as every mention is: what another site wrote is never put on a page
// as HTML. The daily deploy picks up new threads and comments.

import fs from "node:fs"
import type { Loader } from "astro/loaders"
import { z } from "astro/zod"
import { parse } from "node-html-parser"
import { cut, EXCERPT_BLOCKS, getNoteRedirects, mentionSchema, noteAddressOf, type Mention } from "./mentions.ts"

/** A note's Hacker News thread, as the collection holds it. */
export const hackerNewsThreadSchema = z.object({
  /** The address of the note it submits, from the site's root, through an alias or a former address. */
  note: z.string(),
  /** The thread's page on Hacker News. */
  url: z.string(),
  points: z.number(),
  /** How many comments it has, every reply to a reply among them. */
  comments: z.number(),
  published: z.coerce.date(),
  /** Its top comments, as mentions of the note. */
  mentions: z.array(mentionSchema),
})
export type HackerNewsThread = z.infer<typeof hackerNewsThreadSchema>

/** A submission as Algolia's search gives it: only what is read here. */
export interface SearchHit {
  objectID: string
  url?: string | null
  points?: number | null
  num_comments?: number | null
  created_at?: string
}

/** An item as the official API gives it: only what is read here. */
export interface Item {
  id: number
  type?: string
  by?: string
  time?: number
  text?: string
  kids?: number[]
  deleted?: boolean
  dead?: boolean
}

const HN = "https://news.ycombinator.com"
const itemUrl = (id: number | string) => `${HN}/item?id=${id}`

/**
 * The submission of each note with the most comments, among `hits`, by the note's address: those
 * whose address is a page of `site`. Of two with as many, the earlier.
 */
export function threadsOfNotes(
  hits: SearchHit[],
  { site, redirects = {} }: { site: URL; redirects?: Record<string, string> },
): Map<string, SearchHit> {
  const threads = new Map<string, SearchHit>()
  for (const hit of hits) {
    if (!hit.url || !URL.canParse(hit.url) || new URL(hit.url).host !== site.host) continue
    const note = noteAddressOf(hit.url, redirects)
    if (note === undefined) continue
    const kept = threads.get(note)
    const more = (hit.num_comments ?? 0) - (kept?.num_comments ?? 0)
    if (!kept || more > 0 || (more === 0 && (hit.created_at ?? "") < (kept.created_at ?? ""))) threads.set(note, hit)
  }
  return threads
}

/** A comment's paragraphs, as text: Hacker News opens each but the first with a `<p>`. */
export function commentParagraphs(html: string): string[] {
  return html
    .split(/<p>/i)
    .map((paragraph) => cut(parse(paragraph).text))
    .filter(Boolean)
    .slice(0, EXCERPT_BLOCKS)
}

/**
 * The first `limit` comments of a thread that say something, in its own order, as mentions of the
 * note at `target`. A deleted or dead comment, or one not in `items`, is passed over.
 */
export function commentMentions(
  story: Item | undefined,
  items: Record<string, Item>,
  { note, target, limit }: { note: string; target: string; limit: number },
): Mention[] {
  const mentions: Mention[] = []
  for (const id of story?.kids ?? []) {
    if (mentions.length >= limit) break
    const comment = items[id]
    if (!comment || comment.deleted || comment.dead || !comment.text) continue
    mentions.push({
      source: "hackerNews",
      target,
      note,
      url: itemUrl(comment.id),
      title: "Hacker News",
      author: comment.by ? { name: comment.by, url: `${HN}/user?id=${encodeURIComponent(comment.by)}` } : {},
      ...(comment.time ? { published: new Date(comment.time * 1000) } : {}),
      excerpt: commentParagraphs(comment.text),
    })
  }
  return mentions
}

/** The threads of `hits`, each with its top comments from `items`, by its note's address. */
export function hackerNewsThreads(
  hits: SearchHit[],
  items: Record<string, Item>,
  { site, redirects = {}, comments }: { site: URL; redirects?: Record<string, string>; comments: number },
): HackerNewsThread[] {
  return [...threadsOfNotes(hits, { site, redirects })].map(([note, hit]) => ({
    note,
    url: itemUrl(hit.objectID),
    points: hit.points ?? 0,
    comments: hit.num_comments ?? 0,
    published: new Date(hit.created_at ?? 0),
    mentions: commentMentions(items[hit.objectID], items, {
      note,
      target: new URL(note, site).href,
      limit: comments,
    }),
  }))
}

async function fetchJson<T>(url: URL | string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${new URL(url).host} answered ${response.status} ${response.statusText}`)
  return (await response.json()) as T
}

/** Every submission whose address is on `host`, from Algolia's search, a page at a time. */
async function fetchHits(host: string): Promise<SearchHit[]> {
  const hits: SearchHit[] = []
  for (let page = 0; ; page++) {
    const url = new URL("https://hn.algolia.com/api/v1/search")
    url.searchParams.set("query", host)
    url.searchParams.set("restrictSearchableAttributes", "url")
    url.searchParams.set("tags", "story")
    url.searchParams.set("hitsPerPage", "100")
    url.searchParams.set("page", String(page))
    const result = await fetchJson<{ hits?: SearchHit[]; nbPages?: number }>(url)
    hits.push(...(result.hits ?? []))
    if (page + 1 >= (result.nbPages ?? 0)) return hits
  }
}

const fetchItem = (id: number | string) =>
  fetchJson<Item | null>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)

/** Each thread's story and the first comments it shows, from the official API, by id. */
async function fetchItems(threads: SearchHit[], comments: number): Promise<Record<string, Item>> {
  const items: Record<string, Item> = {}
  for (const hit of threads) {
    const story = await fetchItem(hit.objectID)
    if (!story) continue
    items[story.id] = story
    // A few more than are shown, for the deleted and dead ones passed over.
    const kids = await Promise.all((story.kids ?? []).slice(0, comments * 2).map(fetchItem))
    for (const kid of kids) if (kid) items[kid.id] = kid
  }
  return items
}

/**
 * The `hackerNewsThreads` collection's loader: each note's Hacker News thread, read afresh on each
 * build. With `HACKER_NEWS_FILE`, they are read from that file instead, `{ hits, items }` as the two
 * APIs give them: the end-to-end suite's (playwright.config.ts), and the dev server's made-up one
 * (scripts/mock-mentions.ts). Where they can't be read, the
 * collection is empty, and no note links to a thread. With `enabled` false, the discussion's Hacker
 * News source is off, and it reads nothing.
 */
export function hackerNewsLoader({
  site,
  comments,
  enabled = true,
}: {
  site: string
  comments: number
  enabled?: boolean
}): Loader {
  return {
    name: "hacker-news",
    async load({ store, logger, parseData }) {
      store.clear()
      if (!enabled) {
        logger.info("The discussion's Hacker News source is off: no threads are read.")
        return
      }
      const file = process.env.HACKER_NEWS_FILE
      const options = { site: new URL(site), redirects: getNoteRedirects(), comments }
      let threads: HackerNewsThread[]
      try {
        if (file) {
          const { hits = [], items = {} } = JSON.parse(fs.readFileSync(file, "utf8"))
          threads = hackerNewsThreads(hits, items, options)
        } else {
          const kept = [...threadsOfNotes(await fetchHits(options.site.host), options).values()]
          threads = hackerNewsThreads(kept, await fetchItems(kept, comments), options)
        }
      } catch (error) {
        // The site is still built, with no thread linked, so that Hacker News being down holds no
        // deploy back.
        logger.warn(`No Hacker News threads are linked: ${(error as Error).message}`)
        return
      }
      for (const thread of threads) {
        store.set({ id: thread.note, data: await parseData({ id: thread.note, data: thread }) })
      }
      logger.info(`${threads.length} notes' Hacker News threads${file ? ` in ${file}` : ""}.`)
    },
  }
}
