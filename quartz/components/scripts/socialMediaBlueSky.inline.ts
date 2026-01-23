import { IconService } from "../../util/iconService"

// Fetch and render BlueSky posts using public API
;(function () {
  // Cache for loaded icons
  let repostIconSvg: string | null = null
  let replyIconSvg: string | null = null

  // Preload icons
  async function preloadIcons() {
    const [repostIcon, replyIcon] = await Promise.all([
      IconService.getIcon("mdi:repeat-variant"),
      IconService.getIcon("mdi:reply"),
    ])

    if (repostIcon) {
      repostIconSvg = repostIcon.svgContent
    }
    if (replyIcon) {
      replyIconSvg = replyIcon.svgContent
    }
  }

  async function initBlueSkyWidgets() {
    // Ensure icons are loaded
    if (!repostIconSvg || !replyIconSvg) {
      await preloadIcons()
    }

    const containers = document.querySelectorAll<HTMLElement>(".bluesky-posts-container")

    for (const container of containers) {
      const handle = container.dataset.handle
      const postLimit = parseInt(container.dataset.postLimit || "5", 10)
      const showMetrics = container.dataset.showMetrics === "true"

      if (!handle) {
        container.innerHTML = '<div class="error-state"><p>No handle specified</p></div>'
        continue
      }

      try {
        // Resolve handle to DID using public API
        const resolveResponse = await fetch(
          `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
        )
        if (!resolveResponse.ok) {
          throw new Error(`Failed to resolve handle: ${resolveResponse.status}`)
        }
        const { did } = await resolveResponse.json()

        // Fetch author feed using public API
        const feedResponse = await fetch(
          `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(did)}&limit=${postLimit}`,
        )
        if (!feedResponse.ok) {
          throw new Error(`Failed to fetch posts: ${feedResponse.status}`)
        }
        const { feed } = await feedResponse.json()

        if (!feed || feed.length === 0) {
          container.innerHTML = '<div class="empty-state"><p>No posts found</p></div>'
          continue
        }

        // Render posts
        const postsHtml = feed
          .map((item: any) => {
            const post = item.post
            const record = post.record
            const author = post.author
            const text = record.text || ""
            const createdAt = new Date(record.createdAt)
            const relativeTime = getRelativeTime(createdAt)

            // Format text with proper newlines
            const formattedText = escapeHtml(text).replace(/\n/g, "<br>")

            // Build context header (repost or reply indicator)
            let contextHtml = ""
            if (item.reason && item.reason.$type === "app.bsky.feed.defs#reasonRepost") {
              const reposter = item.reason.by
              contextHtml = `
                  <div class="post-context">
                    ${repostIconSvg ? repostIconSvg.replace('<svg', '<svg class="context-icon"') : ''}
                    <span>${escapeHtml(reposter.displayName || reposter.handle)} reposted</span>
                  </div>
                `
            } else if (record.reply) {
              contextHtml = `
                  <div class="post-context">
                    ${replyIconSvg ? replyIconSvg.replace('<svg', '<svg class="context-icon"') : ''}
                    <span>${escapeHtml(author.displayName || author.handle)} replied</span>
                  </div>
                `
            }

            // Build author header
            const authorHtml = `
                <div class="post-author">
                  <img src="${author.avatar}" alt="${escapeHtml(author.displayName || author.handle)}" class="author-avatar" />
                  <div class="author-info">
                    <div class="author-name">${escapeHtml(author.displayName || author.handle)}</div>
                    <div class="author-handle">@${escapeHtml(author.handle)}</div>
                  </div>
                </div>
              `

            // Helper function to render a quoted post
            function renderQuotedPost(quotedRecord: any) {
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
                    <div class="quoted-author">
                      <img src="${qAuthor.avatar}" alt="${escapeHtml(qAuthor.displayName || qAuthor.handle)}" class="quoted-avatar" />
                      <div class="quoted-author-info">
                        <span class="quoted-author-name">${escapeHtml(qAuthor.displayName || qAuthor.handle)}</span>
                        <span class="quoted-author-handle">@${escapeHtml(qAuthor.handle)}</span>
                      </div>
                    </div>
                    <div class="quoted-content">
                      <p>${qText}</p>
                      ${qEmbedHtml}
                    </div>
                  </div>
                `
            }

            // Build embed display (images, external links, quotes, etc.)
            let embedHtml = ""
            if (post.embed) {
              if (post.embed.$type === "app.bsky.embed.images#view") {
                const imagesHtml = post.embed.images
                  .map(
                    (img: any) =>
                      `<img src="${img.thumb}" alt="${escapeHtml(img.alt || "")}" class="post-image" loading="lazy" />`,
                  )
                  .join("")
                embedHtml = `<div class="post-images">${imagesHtml}</div>`
              } else if (post.embed.$type === "app.bsky.embed.external#view") {
                const ext = post.embed.external
                embedHtml = `
                    <a href="${escapeHtml(ext.uri)}" target="_blank" rel="noopener noreferrer" class="post-external-link">
                      ${ext.thumb ? `<img src="${ext.thumb}" alt="" class="link-thumb" loading="lazy" />` : ""}
                      <div class="link-details">
                        <div class="link-title">${escapeHtml(ext.title || "")}</div>
                        ${ext.description ? `<div class="link-description">${escapeHtml(ext.description)}</div>` : ""}
                      </div>
                    </a>
                  `
              } else if (post.embed.$type === "app.bsky.embed.record#view") {
                // Quote post
                if (
                  post.embed.record &&
                  post.embed.record.$type === "app.bsky.embed.record#viewRecord"
                ) {
                  embedHtml = renderQuotedPost(post.embed.record)
                }
              } else if (post.embed.$type === "app.bsky.embed.recordWithMedia#view") {
                // Quote post with media (images + quoted post)
                let mediaHtml = ""
                if (
                  post.embed.media &&
                  post.embed.media.$type === "app.bsky.embed.images#view"
                ) {
                  const imagesHtml = post.embed.media.images
                    .map(
                      (img: any) =>
                        `<img src="${img.thumb}" alt="${escapeHtml(img.alt || "")}" class="post-image" loading="lazy" />`,
                    )
                    .join("")
                  mediaHtml = `<div class="post-images">${imagesHtml}</div>`
                }

                let quotedHtml = ""
                if (
                  post.embed.record &&
                  post.embed.record.record &&
                  post.embed.record.record.$type === "app.bsky.embed.record#viewRecord"
                ) {
                  quotedHtml = renderQuotedPost(post.embed.record.record)
                }

                embedHtml = mediaHtml + quotedHtml
              }
            }

            // Build metrics display
            let metricsHtml = ""
            if (showMetrics) {
              metricsHtml = `
                  <div class="post-metrics">
                    <span class="metric"><span class="icon">💬</span> ${post.replyCount || 0}</span>
                    <span class="metric"><span class="icon">🔁</span> ${post.repostCount || 0}</span>
                    <span class="metric"><span class="icon">❤️</span> ${post.likeCount || 0}</span>
                  </div>
                `
            }

            // Create post URL
            const postId = post.uri.split("/").pop()
            const postUrl = `https://bsky.app/profile/${handle}/post/${postId}`

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
          })
          .join("")

        container.innerHTML = `<div class="posts-list">${postsHtml}</div>`
      } catch (error) {
        console.error("Error loading BlueSky posts:", error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        container.innerHTML = `<div class="error-state"><p>Failed to load posts: ${errorMessage}</p></div>`
      }
    }
  }

  function getRelativeTime(date: Date) {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  function escapeHtml(text: string) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  // Initialize on load
  initBlueSkyWidgets()

  // Re-initialize on SPA navigation
  document.addEventListener("nav", initBlueSkyWidgets)
})()
