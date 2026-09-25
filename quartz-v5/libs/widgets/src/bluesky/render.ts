// The renderer: a post as HTML, the other half of v4's `blueskyService`. It returns a string so that
// anything can draw a post, a Preact island (`bluesky-post`) and a plain script (a sidebar feed)
// alike. Everything a post carries is escaped, and only http(s) URLs become links or images, since
// a post's text, names and link cards are written by strangers.
//
// The markup is one BEM block, `cgc-bluesky`, whose stylesheet comes with this module: a bundler
// that takes the renderer takes its CSS too.
import type {
  EmbedView,
  ExternalView,
  FeedViewPost,
  ImageView,
  PostView,
  ProfileView,
  RecordView,
} from "./client"
import * as icons from "./icons"
import "./bluesky.css"

export interface RenderOptions {
  /** Show the reply, repost and like counts. Defaults to true. */
  showMetrics?: boolean
  /** Say why a feed item is there: who reposted it, or that it replies to another post. Defaults
   * to true. */
  showContext?: boolean
  /** Draw the post smaller, as v4's sidebar feed did: the `cgc-bluesky--compact` card, with less
   * padding, smaller pictures and smaller type. Defaults to false. */
  compact?: boolean
}

/** Text as HTML: safe in an element's content and in a quoted attribute value. */
export function escapeHtml(text: string): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// A URL a post may link or load: http(s) only, so a `javascript:` link card is never a link.
function safeUrl(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined
  try {
    const { protocol } = new URL(url)
    return protocol === "https:" || protocol === "http:" ? url : undefined
  } catch {
    return undefined
  }
}

/** How long ago, as v4 said it: "just now", "5m ago", "3h ago", "2d ago", then the date. */
export function relativeTime(date: Date | string, now: Date = new Date()): string {
  const then = typeof date === "string" ? new Date(date) : date
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`
  if (minutes < 60 * 24 * 7) return `${Math.floor(minutes / (60 * 24))}d ago`
  return then.toLocaleDateString()
}

/** The post's page on bsky.app. */
export function postUrl(post: PostView): string {
  return `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split("/").pop()}`
}

const name = (profile: ProfileView) => escapeHtml(profile.displayName || profile.handle)

function image(url: string | undefined, className: string, alt = ""): string {
  const src = safeUrl(url)
  return src
    ? `<img class="${className}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy">`
    : ""
}

// A link card. Compact inside a quoted post: a smaller thumbnail, and no description.
function card(external: ExternalView, compact = false): string {
  const href = safeUrl(external.uri)
  const tag = href ? "a" : "div"
  const link = href ? ` href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"` : ""
  const description =
    !compact && external.description
      ? `<span class="cgc-bluesky__card-description">${escapeHtml(external.description)}</span>`
      : ""
  return (
    `<${tag} class="cgc-bluesky__card${compact ? " cgc-bluesky__card--compact" : ""}"${link}>` +
    image(
      external.thumb,
      compact
        ? "cgc-bluesky__card-thumb cgc-bluesky__card-thumb--compact"
        : "cgc-bluesky__card-thumb",
    ) +
    `<span class="cgc-bluesky__card-body"><span class="cgc-bluesky__card-title">${escapeHtml(external.title ?? "")}</span>${description}</span>` +
    `</${tag}>`
  )
}

const images = (list: ImageView[]) =>
  `<div class="cgc-bluesky__images">${list.map((img) => image(img.thumb, "cgc-bluesky__image", img.alt)).join("")}</div>`

// A quoted post. One that can't be shown (deleted, blocked, detached) is left out, as in v4.
function quote(record: RecordView): string {
  if (record.$type !== "app.bsky.embed.record#viewRecord") return ""
  const { author, value, embeds } = record as Extract<RecordView, { value: unknown }>
  const external = embeds?.find((e) => e.$type === "app.bsky.embed.external#view") as
    | { external: ExternalView }
    | undefined
  return (
    `<div class="cgc-bluesky__quote">` +
    `<div class="cgc-bluesky__quote-author">${image(author.avatar, "cgc-bluesky__quote-avatar")}` +
    `<span class="cgc-bluesky__quote-name">${name(author)}</span>` +
    `<span class="cgc-bluesky__quote-handle">@${escapeHtml(author.handle)}</span></div>` +
    (value.text ? `<p class="cgc-bluesky__quote-text">${escapeHtml(value.text)}</p>` : "") +
    (external ? card(external.external, true) : "") +
    `</div>`
  )
}

// Images, a link card, a quoted post, or a quoted post with images: the embeds v4 drew.
function embed(view: EmbedView | undefined): string {
  switch (view?.$type) {
    case "app.bsky.embed.images#view":
      return images((view as { images: ImageView[] }).images)
    case "app.bsky.embed.external#view":
      return card((view as { external: ExternalView }).external)
    case "app.bsky.embed.record#view":
      return quote((view as { record: RecordView }).record)
    case "app.bsky.embed.recordWithMedia#view": {
      const { media, record } = view as { media: EmbedView; record: { record: RecordView } }
      return (
        (media.$type === "app.bsky.embed.images#view" ? embed(media) : "") + quote(record.record)
      )
    }
    default:
      return ""
  }
}

function context(item: FeedViewPost): string {
  const { post, reason } = item
  if (reason?.$type === "app.bsky.feed.defs#reasonRepost" && reason.by)
    return `<div class="cgc-bluesky__context">${icons.reposted}<span class="cgc-bluesky__context-text">${name(reason.by)} reposted</span></div>`
  if (post.record.reply)
    return `<div class="cgc-bluesky__context">${icons.replied}<span class="cgc-bluesky__context-text">${name(post.author)} replied</span></div>`
  return ""
}

// Each count beside its icon, and what it counts, for a reader that can't see the icon.
function metrics(post: PostView): string {
  const metric = (icon: string, count: unknown, what: string) =>
    `<span class="cgc-bluesky__metric">${icon}<span class="cgc-bluesky__count">${Number.isFinite(count) ? count : 0}</span><span class="cgc-bluesky__metric-name"> ${what}</span></span>`
  return (
    `<span class="cgc-bluesky__metrics">` +
    metric(icons.replies, post.replyCount, "replies") +
    metric(icons.reposts, post.repostCount, "reposts") +
    metric(icons.likes, post.likeCount, "likes") +
    `</span>`
  )
}

function time(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ""
  return `<time class="cgc-bluesky__time" datetime="${date.toISOString()}">${escapeHtml(relativeTime(date))}</time>`
}

/** One post, or one item of a feed, as HTML: a `cgc-bluesky` block. */
export function renderPost(
  item: FeedViewPost | { post: PostView },
  options: RenderOptions = {},
): string {
  const { showMetrics = true, showContext = true, compact = false } = options
  const { post } = item
  const text = post.record.text ?? ""
  return (
    `<article class="cgc-bluesky${compact ? " cgc-bluesky--compact" : ""}">` +
    (showContext ? context(item) : "") +
    `<div class="cgc-bluesky__author">${image(post.author.avatar, "cgc-bluesky__avatar")}` +
    `<span class="cgc-bluesky__names"><span class="cgc-bluesky__name">${name(post.author)}</span>` +
    `<span class="cgc-bluesky__handle">@${escapeHtml(post.author.handle)}</span></span></div>` +
    `<div class="cgc-bluesky__content">${text ? `<p class="cgc-bluesky__text">${escapeHtml(text)}</p>` : ""}${embed(post.embed)}</div>` +
    `<div class="cgc-bluesky__footer">${time(post.record.createdAt)}${showMetrics ? metrics(post) : ""}</div>` +
    `<a class="cgc-bluesky__link" href="${escapeHtml(postUrl(post))}" target="_blank" rel="noopener noreferrer">View on Bluesky</a>` +
    `</article>`
  )
}
