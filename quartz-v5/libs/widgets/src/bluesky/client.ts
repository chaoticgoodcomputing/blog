// The ATProto client: Bluesky's public API, read without signing in, from the browser. It replaces
// v4's `blueskyService` fetch half. Nothing here touches the DOM, so it runs anywhere `fetch` does.

/** Bluesky's public, unauthenticated API (the AppView). */
export const PUBLIC_API = "https://public.api.bsky.app"

/** A profile as the API embeds one in a post. */
export interface ProfileView {
  did: string
  handle: string
  displayName?: string
  avatar?: string
}

/** A post's record, as its author wrote it. */
export interface PostRecord {
  text: string
  createdAt: string
  /** Present when the post replies to another. */
  reply?: unknown
}

/** One post, as the API shows it: `app.bsky.feed.defs#postView`. */
export interface PostView {
  uri: string
  cid: string
  author: ProfileView
  record: PostRecord
  /** An `app.bsky.embed.*#view`: images, a link card, a quoted post, or a quote with media. */
  embed?: EmbedView
  replyCount?: number
  repostCount?: number
  likeCount?: number
}

/** One embed view. Only the kinds v4 drew are typed; any other is left undrawn. */
export type EmbedView =
  | { $type: "app.bsky.embed.images#view"; images: ImageView[] }
  | { $type: "app.bsky.embed.external#view"; external: ExternalView }
  | { $type: "app.bsky.embed.record#view"; record: RecordView }
  | {
      $type: "app.bsky.embed.recordWithMedia#view"
      record: { record: RecordView }
      media: EmbedView
    }
  | { $type: string; [key: string]: unknown }

export interface ImageView {
  thumb: string
  fullsize?: string
  alt?: string
}

export interface ExternalView {
  uri: string
  title?: string
  description?: string
  thumb?: string
}

/** A quoted post (`#viewRecord`), or one that can't be shown (not found, blocked, detached…). */
export type RecordView =
  | {
      $type: "app.bsky.embed.record#viewRecord"
      uri: string
      author: ProfileView
      value: PostRecord
      embeds?: EmbedView[]
    }
  | { $type: string; [key: string]: unknown }

/** One item of an author's feed: a post, and why it is there (a repost), if not their own. */
export interface FeedViewPost {
  post: PostView
  reason?: { $type: string; by?: ProfileView }
  reply?: unknown
}

/** `app.bsky.feed.getPostThread`'s answer: the post, or why it can't be shown. */
export interface ThreadResponse {
  thread:
    | {
        $type: "app.bsky.feed.defs#threadViewPost"
        post: PostView
        parent?: unknown
        replies?: unknown[]
      }
    | { $type: "app.bsky.feed.defs#notFoundPost" | "app.bsky.feed.defs#blockedPost"; uri: string }
}

/** A post's address on bsky.app, as a reader copies it, and as ATProto names it. */
export interface BlueskyPostUrl {
  /** The author's handle, or their DID. */
  handle: string
  /** The post's record key. */
  postId: string
  /** `at://<handle>/app.bsky.feed.post/<postId>`. */
  atUri: string
}

const POST_URL = /^https:\/\/bsky\.app\/profile\/([^/?#]+)\/post\/([^/?#]+)/

/** Reads a `https://bsky.app/profile/<handle>/post/<id>` URL. Null for anything else. */
export function parseBlueskyUrl(url: string): BlueskyPostUrl | null {
  const match = POST_URL.exec(url)
  if (!match) return null
  const [, handle, postId] = match
  return { handle, postId, atUri: `at://${handle}/app.bsky.feed.post/${postId}` }
}

/** Why a post or feed couldn't be had. `message` says what went wrong, for a reader to see. */
export class BlueskyError extends Error {
  override name = "BlueskyError"
  /** `not-found`: deleted, or never public. `blocked`: its author or the reader blocked the other.
   * `unavailable`: Bluesky didn't answer, or answered with an error. */
  readonly reason: "not-found" | "blocked" | "unavailable"
  constructor(reason: BlueskyError["reason"], message: string) {
    super(message)
    this.reason = reason
  }
}

export interface FetchOptions {
  /** Aborts the request, as a widget does when it unmounts. The promise then rejects with the
   * signal's reason, not a `BlueskyError`. */
  signal?: AbortSignal
}

// One XRPC query against the public API. Every failure other than an abort is a `BlueskyError`.
async function query<T>(
  method: string,
  params: Record<string, string>,
  options: FetchOptions,
): Promise<T> {
  const url = `${PUBLIC_API}/xrpc/${method}?${new URLSearchParams(params)}`
  let response: Response
  try {
    response = await fetch(url, { signal: options.signal })
  } catch (error) {
    if (options.signal?.aborted) throw options.signal.reason
    throw new BlueskyError(
      "unavailable",
      `Bluesky couldn't be reached (${(error as Error).message})`,
    )
  }
  const body = await response.json().catch(() => undefined)
  if (response.ok && body !== undefined) return body as T
  if (body?.error === "NotFound") throw new BlueskyError("not-found", body.message ?? "Not found")
  throw new BlueskyError(
    "unavailable",
    `Bluesky answered ${response.status}${body?.message ? `: ${body.message}` : ""}`,
  )
}

/** `app.bsky.feed.getPostThread`: a post with its replies (`depth` levels) and parents. */
export function getPostThread(
  atUri: string,
  {
    depth = 6,
    parentHeight = 80,
    ...options
  }: FetchOptions & { depth?: number; parentHeight?: number } = {},
): Promise<ThreadResponse> {
  return query(
    "app.bsky.feed.getPostThread",
    { uri: atUri, depth: `${depth}`, parentHeight: `${parentHeight}` },
    options,
  )
}

/** One post, without its thread. Rejects with a `BlueskyError` saying why it can't be shown. */
export async function getPost(atUri: string, options: FetchOptions = {}): Promise<PostView> {
  const { thread } = await getPostThread(atUri, { ...options, depth: 0, parentHeight: 0 })
  const type: string | undefined = thread?.$type
  if (type === "app.bsky.feed.defs#threadViewPost") return (thread as { post: PostView }).post
  if (type === "app.bsky.feed.defs#blockedPost")
    throw new BlueskyError("blocked", "This post is blocked")
  if (type === "app.bsky.feed.defs#notFoundPost")
    throw new BlueskyError("not-found", "This post was not found")
  throw new BlueskyError("unavailable", `Bluesky answered with no post (${type})`)
}

/** `com.atproto.identity.resolveHandle`: the DID a handle stands for. */
export async function resolveHandle(handle: string, options: FetchOptions = {}): Promise<string> {
  const { did } = await query<{ did: string }>(
    "com.atproto.identity.resolveHandle",
    { handle },
    options,
  )
  return did
}

/** `app.bsky.feed.getAuthorFeed`: an author's latest posts and reposts, newest first. */
export async function getAuthorFeed(
  actor: string,
  { limit = 5, ...options }: FetchOptions & { limit?: number } = {},
): Promise<FeedViewPost[]> {
  const { feed } = await query<{ feed: FeedViewPost[] }>(
    "app.bsky.feed.getAuthorFeed",
    { actor, limit: `${limit}` },
    options,
  )
  return feed
}
