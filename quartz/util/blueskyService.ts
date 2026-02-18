/**
 * BlueSky/ATProto service for fetching and rendering posts.
 * 
 * Provides:
 * - URL parsing for bsky.app links
 * - API methods for fetching posts and threads
 * - HTML rendering helpers for posts, embeds, and quoted content
 * - Shared utilities for time formatting and HTML escaping
 * 
 * This service can be used in both build-time components and client-side scripts.
 */

// ============================================================================
// Types
// ============================================================================

export interface PostData {
  post: {
    uri: string
    cid: string
    author: {
      did: string
      handle: string
      displayName?: string
      avatar?: string
    }
    record: {
      text: string
      createdAt: string
      reply?: any
      embed?: any
    }
    embed?: any
    replyCount?: number
    repostCount?: number
    likeCount?: number
  }
  reason?: {
    $type: string
    by?: any
  }
  reply?: any
}

export interface ThreadData {
  thread: {
    $type: string
    post: PostData["post"]
    parent?: ThreadData["thread"]
    replies?: ThreadData["thread"][]
  }
}

export interface ParsedBlueSkyUrl {
  handle: string
  postId: string
  atUri: string
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Parse a bsky.app URL into handle, post ID, and AT-URI.
 * @param url - BlueSky post URL (e.g., https://bsky.app/profile/handle.bsky.social/post/abc123)
 * @returns Parsed components or null if invalid
 */
export function parseBlueSkyUrl(url: string): ParsedBlueSkyUrl | null {
  const pattern = /^https:\/\/bsky\.app\/profile\/([^\/]+)\/post\/([^\/\?#]+)/
  const match = url.match(pattern)
  
  if (!match) {
    console.warn(`Invalid BlueSky URL format: ${url}`)
    return null
  }
  
  const [, handle, postId] = match
  const atUri = `at://${handle}/app.bsky.feed.post/${postId}`
  
  return { handle, postId, atUri }
}

/**
 * Resolve a handle to a DID using the public API.
 * @param handle - BlueSky handle (e.g., handle.bsky.social)
 * @returns Promise resolving to DID or null if resolution fails
 */
export async function resolveHandle(handle: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`
    )
    if (!response.ok) {
      console.warn(`Failed to resolve handle ${handle}: ${response.status}`)
      return null
    }
    const { did } = await response.json()
    return did
  } catch (error) {
    console.error(`Error resolving handle ${handle}:`, error)
    return null
  }
}

/**
 * Fetch an author's feed using the public API.
 * @param actor - Handle or DID
 * @param limit - Number of posts to fetch (default: 5)
 * @returns Promise resolving to feed items or null if fetch fails
 */
export async function getAuthorFeed(
  actor: string,
  limit: number = 5
): Promise<PostData[] | null> {
  try {
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(actor)}&limit=${limit}`
    )
    if (!response.ok) {
      console.warn(`Failed to fetch feed for ${actor}: ${response.status}`)
      return null
    }
    const { feed } = await response.json()
    return feed
  } catch (error) {
    console.error(`Error fetching feed for ${actor}:`, error)
    return null
  }
}

/**
 * Fetch a post thread using the public API.
 * @param uri - AT-URI of the post
 * @param depth - Reply depth (default: 6)
 * @param parentHeight - Parent post levels (default: 80)
 * @returns Promise resolving to thread data or null if fetch fails
 */
export async function getPostThread(
  uri: string,
  depth: number = 6,
  parentHeight: number = 80
): Promise<ThreadData | null> {
  try {
    const params = new URLSearchParams({
      uri,
      depth: depth.toString(),
      parentHeight: parentHeight.toString(),
    })
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?${params}`
    )
    if (!response.ok) {
      console.warn(`Failed to fetch thread for ${uri}: ${response.status}`)
      return null
    }
    return await response.json()
  } catch (error) {
    console.error(`Error fetching thread for ${uri}:`, error)
    return null
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Escape HTML to prevent XSS.
 * @param text - Text to escape
 * @returns HTML-escaped text
 */
export function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

/**
 * Get relative time string from a date.
 * @param date - Date object or ISO string
 * @returns Relative time string (e.g., "2h ago", "3d ago")
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return dateObj.toLocaleDateString()
}

// ============================================================================
// Rendering Helpers
// ============================================================================

/**
 * Render author information.
 * @param author - Author object from post data
 * @param variant - Display variant ("full" or "compact")
 * @returns HTML string
 */
export function renderAuthor(
  author: PostData["post"]["author"],
  variant: "full" | "compact" = "full"
): string {
  const displayName = escapeHtml(author.displayName || author.handle)
  const handle = escapeHtml(author.handle)
  
  if (variant === "compact") {
    return `
      <div class="quoted-author">
        <img src="${author.avatar}" alt="${displayName}" class="quoted-avatar" />
        <div class="quoted-author-info">
          <span class="quoted-author-name">${displayName}</span>
          <span class="quoted-author-handle">@${handle}</span>
        </div>
      </div>
    `
  }
  
  return `
    <div class="post-author">
      <img src="${author.avatar}" alt="${displayName}" class="author-avatar" />
      <div class="author-info">
        <div class="author-name">${displayName}</div>
        <div class="author-handle">@${handle}</div>
      </div>
    </div>
  `
}

/**
 * Render a quoted post.
 * @param quotedRecord - Quoted post record data
 * @returns HTML string
 */
export function renderQuotedPost(quotedRecord: any): string {
  const qAuthor = quotedRecord.author
  const qValue = quotedRecord.value
  const qText = escapeHtml(qValue.text || "").replace(/\n/g, "<br>")

  let qEmbedHtml = ""
  if (quotedRecord.embeds && quotedRecord.embeds.length > 0) {
    const qEmbed = quotedRecord.embeds[0]
    if (qEmbed.$type === "app.bsky.embed.external#view") {
      const ext = qEmbed.external
      qEmbedHtml = `
        <a href="${escapeHtml(ext.uri)}" target="_blank" rel="noopener noreferrer" class="quoted-external-link">
          ${ext.thumb ? `<img src="${ext.thumb}" alt="" class="quoted-link-thumb" loading="lazy" />` : ""}
          <div class="quoted-link-details">
            <div class="quoted-link-title">${escapeHtml(ext.title || "")}</div>
          </div>
        </a>
      `
    }
  }

  return `
    <div class="quoted-post">
      ${renderAuthor(qAuthor, "compact")}
      <div class="quoted-content">
        <p>${qText}</p>
        ${qEmbedHtml}
      </div>
    </div>
  `
}

/**
 * Render post embed (images, links, quotes, etc.).
 * @param embed - Embed object from post data
 * @returns HTML string
 */
export function renderEmbed(embed: any): string {
  if (!embed) return ""

  // Images
  if (embed.$type === "app.bsky.embed.images#view") {
    const imagesHtml = embed.images
      .map(
        (img: any) =>
          `<img src="${img.thumb}" alt="${escapeHtml(img.alt || "")}" class="post-image" loading="lazy" />`
      )
      .join("")
    return `<div class="post-images">${imagesHtml}</div>`
  }

  // External link
  if (embed.$type === "app.bsky.embed.external#view") {
    const ext = embed.external
    return `
      <a href="${escapeHtml(ext.uri)}" target="_blank" rel="noopener noreferrer" class="post-external-link">
        ${ext.thumb ? `<img src="${ext.thumb}" alt="" class="link-thumb" loading="lazy" />` : ""}
        <div class="link-details">
          <div class="link-title">${escapeHtml(ext.title || "")}</div>
          ${ext.description ? `<div class="link-description">${escapeHtml(ext.description)}</div>` : ""}
        </div>
      </a>
    `
  }

  // Quote post
  if (embed.$type === "app.bsky.embed.record#view") {
    if (embed.record && embed.record.$type === "app.bsky.embed.record#viewRecord") {
      return renderQuotedPost(embed.record)
    }
  }

  // Quote post with media (images + quoted post)
  if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
    let mediaHtml = ""
    if (embed.media && embed.media.$type === "app.bsky.embed.images#view") {
      const imagesHtml = embed.media.images
        .map(
          (img: any) =>
            `<img src="${img.thumb}" alt="${escapeHtml(img.alt || "")}" class="post-image" loading="lazy" />`
        )
        .join("")
      mediaHtml = `<div class="post-images">${imagesHtml}</div>`
    }

    let quotedHtml = ""
    if (
      embed.record &&
      embed.record.record &&
      embed.record.record.$type === "app.bsky.embed.record#viewRecord"
    ) {
      quotedHtml = renderQuotedPost(embed.record.record)
    }

    return mediaHtml + quotedHtml
  }

  return ""
}

/**
 * Render post metrics (likes, reposts, replies).
 * @param post - Post object with metric counts
 * @returns HTML string
 */
export function renderMetrics(post: PostData["post"]): string {
  return `
    <div class="post-metrics">
      <span class="metric"><span class="icon">💬</span> ${post.replyCount || 0}</span>
      <span class="metric"><span class="icon">🔁</span> ${post.repostCount || 0}</span>
      <span class="metric"><span class="icon">❤️</span> ${post.likeCount || 0}</span>
    </div>
  `
}

/**
 * Render post context (repost or reply indicator).
 * @param item - Feed item with reason/reply context
 * @param repostIconSvg - Optional SVG content for repost icon
 * @param replyIconSvg - Optional SVG content for reply icon
 * @returns HTML string
 */
export function renderContext(
  item: PostData,
  repostIconSvg?: string,
  replyIconSvg?: string
): string {
  const { post, reason } = item
  const record = post.record

  // Repost context
  if (reason && reason.$type === "app.bsky.feed.defs#reasonRepost" && reason.by) {
    const reposter = reason.by
    const iconHtml = repostIconSvg
      ? repostIconSvg.replace("<svg", '<svg class="context-icon"')
      : ""
    return `
      <div class="post-context">
        ${iconHtml}
        <span>${escapeHtml(reposter.displayName || reposter.handle)} reposted</span>
      </div>
    `
  }

  // Reply context
  if (record.reply) {
    const author = post.author
    const iconHtml = replyIconSvg
      ? replyIconSvg.replace("<svg", '<svg class="context-icon"')
      : ""
    return `
      <div class="post-context">
        ${iconHtml}
        <span>${escapeHtml(author.displayName || author.handle)} replied</span>
      </div>
    `
  }

  return ""
}

/**
 * Render a complete post.
 * @param item - Feed item or post data
 * @param options - Rendering options
 * @returns HTML string
 */
export function renderPost(
  item: PostData,
  options: {
    showMetrics?: boolean
    showContext?: boolean
    repostIconSvg?: string
    replyIconSvg?: string
  } = {}
): string {
  const { showMetrics = true, showContext = true, repostIconSvg, replyIconSvg } = options
  const { post } = item
  const record = post.record
  const author = post.author
  const text = record.text || ""
  const createdAt = new Date(record.createdAt)
  const relativeTime = getRelativeTime(createdAt)

  // Format text with proper newlines
  const formattedText = escapeHtml(text).replace(/\n/g, "<br>")

  // Build context header (repost or reply indicator)
  const contextHtml = showContext
    ? renderContext(item, repostIconSvg, replyIconSvg)
    : ""

  // Build author header
  const authorHtml = renderAuthor(author, "full")

  // Build embed display
  const embedHtml = renderEmbed(post.embed)

  // Build metrics display
  const metricsHtml = showMetrics ? renderMetrics(post) : ""

  // Create post URL
  const postId = post.uri.split("/").pop()
  const postUrl = `https://bsky.app/profile/${author.handle}/post/${postId}`

  return `
    <div class="bluesky-post">
      ${contextHtml}
      ${authorHtml}
      <div class="post-content">
        <p>${formattedText}</p>
        ${embedHtml}
      </div>
      <div class="post-footer">
        <time datetime="${createdAt.toISOString()}">${relativeTime}</time>
        ${metricsHtml}
      </div>
      <a href="${postUrl}" target="_blank" rel="noopener noreferrer" class="post-link">
        View on BlueSky
      </a>
    </div>
  `
}
