// Each note's discussion, from the collections its sources load (./discussion.ts), asked of them
// once for a build, not once for each page that shows a note's. The dev server asks each time, so a
// page shows them as the collections last loaded them.

import { getCollection } from "astro:content"
import { bluesky, discussion, webmentions } from "../site.config.ts"
import type { BlueskyPost } from "./bluesky-posts.ts"
import { discussionPanels, mentionsOn, type DiscussionPanel } from "./discussion.ts"
import type { HackerNewsThread } from "./hacker-news.ts"
import { mentionsOf, type Mention } from "./mentions.ts"

interface Loaded {
  /** Every mention of every source that is on. */
  mentions: Mention[]
  posts: Map<string, BlueskyPost>
  threads: Map<string, HackerNewsThread>
}

let all: Promise<Loaded> | undefined

async function load(): Promise<Loaded> {
  const [webmentions, posts, threads] = await Promise.all([
    getCollection("mentions"),
    getCollection("blueskyPosts"),
    getCollection("hackerNewsThreads"),
  ])
  const mentions = [...webmentions.map((entry) => entry.data), ...threads.flatMap((entry) => entry.data.mentions)]
  return {
    mentions: mentionsOn(mentions, discussion.sources),
    posts: new Map(posts.map((entry) => [entry.data.note, entry.data])),
    threads: new Map(threads.map((entry) => [entry.data.note, entry.data])),
  }
}

const loaded = (): Promise<Loaded> => (import.meta.env.DEV ? load() : (all ??= load()))

/** Every mention of every note, of the sources that are on. */
export const getMentions = async (): Promise<Mention[]> => (await loaded()).mentions

/**
 * The discussion of the note at `noteUrl`, titled `title`, a panel for each source that is on, its
 * mentions from no blocked domain. `site` is the site's address.
 */
export async function getDiscussionPanels(noteUrl: string, title: string, site: string): Promise<DiscussionPanel[]> {
  const { mentions, posts, threads } = await loaded()
  return discussionPanels({
    sources: discussion.sources,
    page: { title, address: new URL(noteUrl, site).href },
    handle: bluesky.handle,
    post: posts.get(noteUrl),
    thread: threads.get(noteUrl),
    mentions: mentionsOf(noteUrl, mentions, webmentions.blockedDomains),
  })
}
