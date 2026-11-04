// Each note's Bluesky post: the site's Bluesky account's first post that links to the note, which
// the deploy made when the note reached the feed (.github/workflows/scripts/post-to-bluesky.mjs).
// The `blueskyPosts` collection reads them from Bluesky's public API as the site builds
// (src/content.config.ts), and a note's discussion links to its own (Connections.astro).
//
// A note is posted after the deploy that publishes it, so that deploy's page has no post to link
// to. The Bluesky job then deploys again when it has posted (.github/workflows/deploy.yaml), and
// that deploy's page links to the post.

import fs from "node:fs"
import type { Loader } from "astro/loaders"
import { z } from "astro/zod"
import { PUBLIC_API } from "./bluesky/client.ts"
import { getNoteRedirects, noteAddressOf } from "./mentions.ts"

/** A note's Bluesky post, as the collection holds it. */
export const blueskyPostSchema = z.object({
  /** The address of the note it links to, from the site's root, through an alias or a former address. */
  note: z.string(),
  /** The post's page on bsky.app. */
  url: z.string(),
  published: z.coerce.date(),
})
export type BlueskyPost = z.infer<typeof blueskyPostSchema>

/** One item of `app.bsky.feed.getAuthorFeed`: only what is read here. */
export interface AuthorFeedItem {
  /** Present when the item is a repost, not the account's own post. */
  reason?: unknown
  post: {
    uri: string
    record: {
      createdAt: string
      reply?: unknown
      embed?: { $type?: string; external?: { uri?: string } }
    }
  }
}

/** The account's page on bsky.app. */
export const profileUrl = (handle: string): string => `https://bsky.app/profile/${handle}`

/** A post's page on bsky.app, from its `at://` URI: the account's page and the post's record key. */
export function postUrl(uri: string, handle: string): string | undefined {
  const rkey = /^at:\/\/[^/]+\/app\.bsky\.feed\.post\/([^/]+)$/.exec(uri)?.[1]
  return rkey ? `${profileUrl(handle)}/post/${rkey}` : undefined
}

/**
 * The Bluesky post of each note an item of `feed` links to: the account's own posts, not its
 * replies or reposts, each by the link card it embeds, where that is a page of `site`. A note
 * posted more than once has its first post. Keyed by the note's address.
 */
export function postsOfNotes(
  feed: AuthorFeedItem[],
  { site, handle, redirects = {} }: { site: URL; handle: string; redirects?: Record<string, string> },
): Map<string, BlueskyPost> {
  const posts = new Map<string, BlueskyPost>()
  for (const { reason, post } of feed) {
    const link = post.record.embed?.$type === "app.bsky.embed.external" ? post.record.embed.external?.uri : undefined
    if (reason || post.record.reply || !link || !URL.canParse(link) || new URL(link).host !== site.host) continue
    const note = noteAddressOf(link, redirects)
    const url = postUrl(post.uri, handle)
    const published = new Date(post.record.createdAt)
    if (note === undefined || url === undefined || Number.isNaN(published.getTime())) continue
    const kept = posts.get(note)
    if (!kept || published < kept.published) posts.set(note, { note, url, published })
  }
  return posts
}

/** How many posts one request to the API asks for: as many as it gives. */
const PAGE_SIZE = 100

/** Every post of the account, its replies left out, a page of them at a time. */
async function fetchAll(handle: string): Promise<AuthorFeedItem[]> {
  const items: AuthorFeedItem[] = []
  let cursor: string | undefined
  do {
    const url = new URL("/xrpc/app.bsky.feed.getAuthorFeed", PUBLIC_API)
    url.searchParams.set("actor", handle)
    url.searchParams.set("filter", "posts_no_replies")
    url.searchParams.set("limit", String(PAGE_SIZE))
    if (cursor) url.searchParams.set("cursor", cursor)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Bluesky answered ${response.status} ${response.statusText}`)
    const page = (await response.json()) as { feed?: AuthorFeedItem[]; cursor?: string }
    items.push(...(page.feed ?? []))
    cursor = page.feed?.length ? page.cursor : undefined
  } while (cursor)
  return items
}

/**
 * The `blueskyPosts` collection's loader: each note's Bluesky post, read afresh on each build from
 * the account's posts on Bluesky's public API, which needs no sign-in. With `BLUESKY_POSTS_FILE`,
 * they are read from that file instead, an author feed as the API gives one: the end-to-end suite's
 * (playwright.config.ts), and the dev server's made-up one (scripts/mock-mentions.ts). Where the posts can't be read, the collection is empty, and every note's
 * discussion links to the account. With `enabled` false, the discussion's Bluesky source is off,
 * and it reads nothing.
 */
export function blueskyPostsLoader({
  site,
  handle,
  enabled = true,
}: {
  site: string
  handle: string
  enabled?: boolean
}): Loader {
  return {
    name: "bluesky-posts",
    async load({ store, logger, parseData }) {
      store.clear()
      if (!enabled) {
        logger.info("The discussion's Bluesky source is off: no Bluesky posts are read.")
        return
      }
      const file = process.env.BLUESKY_POSTS_FILE
      let feed: AuthorFeedItem[]
      try {
        feed = file ? (JSON.parse(fs.readFileSync(file, "utf8")).feed ?? []) : await fetchAll(handle)
      } catch (error) {
        // The site is still built, its discussions linking to the account, so that Bluesky being
        // down holds no deploy back.
        logger.warn(`No Bluesky posts are linked: ${(error as Error).message}`)
        return
      }
      const posts = postsOfNotes(feed, { site: new URL(site), handle, redirects: getNoteRedirects() })
      for (const post of posts.values()) {
        store.set({ id: post.note, data: await parseData({ id: post.note, data: post }) })
      }
      logger.info(`${posts.size} notes' Bluesky posts, of ${feed.length} posts${file ? ` in ${file}` : ""}.`)
    },
  }
}
