// A note's discussion: a panel for each of its sources, among what is related to the note
// (Connections.astro), each with where a reader answers and the mentions it gives. Each source
// is on or off in the site's configuration (`discussion`), so one that becomes unmanageable is
// turned off there alone:
//
//   - `webmentions`: the webmentions other sites send, which webmention.io receives
//     (./mentions.ts), listed as the post listings list posts. A reader answers from their own site,
//     which webmention.io shows them how to make send one.
//   - `bluesky`: the replies to the site's account's post of the note (./bluesky-posts.ts), which
//     Bridgy sends to webmention.io: a webmention from Bluesky is this source's, not `webmentions`'.
//     A reader answers at the post, or at the account while there is none.
//   - `hackerNews`: the top comments of the note's Hacker News thread (./hacker-news.ts), answered
//     there, or, while it has none, by submitting the note to Hacker News.
//
// Each source that is on has its panel, with nothing in it too: then it says there is no discussion
// yet, and that the reader could be the first to answer, a link to where they would.
//
// Bluesky's and Hacker News's are listed as comments, each by who wrote it and when.
//
// Pure: the collections are read by ./note-discussion.ts.

import type { DiscussionSourceId } from "../site.config.types.ts"
import type { BlueskyPost } from "./bluesky-posts.ts"
import { profileUrl } from "./bluesky-posts.ts"
import { hackerNewsSubmitUrl, type SharedPage } from "./share.ts"
import type { HackerNewsThread } from "./hacker-news.ts"
import type { Mention } from "./mentions.ts"

export type { DiscussionSourceId }

/** Where a reader answers a note on a source: a post or a thread of it, or where they would make one. */
export interface DiscussionAction {
  href: string
  /** Its name: `Discuss on Bluesky`. */
  label: string
  /** Whether it is the note's own copy there, which its h-entry names (`u-syndication`). */
  syndication: boolean
}

/** A source's panel of a note's discussion. */
export interface DiscussionPanel {
  source: DiscussionSourceId
  /** Where a reader answers. */
  action: DiscussionAction
  /** What is said under the heading: `12 comments`. */
  detail?: string
  /** Its mentions of the note, newest first. */
  mentions: Mention[]
}

/** Where a reader learns to send a webmention from their own site. */
export const WEBMENTION_GUIDE = "https://webmention.io/"

const hostOf = (url: string | undefined): string | undefined =>
  url && URL.canParse(url) ? new URL(url).host.toLowerCase() : undefined

/**
 * The source a webmention comes from, by the page that sent it (`url`) and the address webmention.io
 * was told it came from (`via`): Bluesky's, a post on bsky.app or Bridgy's copy of one; Hacker
 * News's; or any other site's.
 */
export function mentionSourceOf(url: string, via?: string): DiscussionSourceId {
  const host = hostOf(url)
  if (host === "bsky.app" || (hostOf(via) === "brid.gy" && /\/bluesky\//.test(new URL(via!).pathname))) return "bluesky"
  if (host === "news.ycombinator.com") return "hackerNews"
  return "webmentions"
}

/** The mentions of the sources that are on. */
export function mentionsOn(mentions: Mention[], sources: Record<DiscussionSourceId, boolean>): Mention[] {
  return mentions.filter((mention) => sources[mention.source])
}

/**
 * A note's discussion, a panel for each source that is on, in the order they are drawn: other sites,
 * then Bluesky, then Hacker News. `page` is the note's page, `mentions` the note's own, newest first,
 * as `mentionsOf` gives them.
 */
export function discussionPanels({
  sources,
  page,
  handle,
  post,
  thread,
  mentions,
}: {
  sources: Record<DiscussionSourceId, boolean>
  page: SharedPage
  /** The site's Bluesky account's handle. */
  handle: string
  post?: BlueskyPost | undefined
  thread?: HackerNewsThread | undefined
  mentions: Mention[]
}): DiscussionPanel[] {
  const of = (source: DiscussionSourceId) => mentions.filter((mention) => mention.source === source)
  const panels: DiscussionPanel[] = []
  if (sources.webmentions) {
    panels.push({
      source: "webmentions",
      action: { href: WEBMENTION_GUIDE, label: "Reply from your own site", syndication: false },
      mentions: of("webmentions"),
    })
  }
  if (sources.bluesky) {
    panels.push({
      source: "bluesky",
      action: { href: post?.url ?? profileUrl(handle), label: "Discuss on Bluesky", syndication: post !== undefined },
      mentions: of("bluesky"),
    })
  }
  if (sources.hackerNews) {
    panels.push({
      source: "hackerNews",
      action: thread
        ? { href: thread.url, label: "Discuss on Hacker News", syndication: false }
        : { href: hackerNewsSubmitUrl(page), label: "Submit to Hacker News", syndication: false },
      ...(thread && { detail: `${thread.comments} ${thread.comments === 1 ? "comment" : "comments"}` }),
      mentions: of("hackerNews"),
    })
  }
  return panels
}
