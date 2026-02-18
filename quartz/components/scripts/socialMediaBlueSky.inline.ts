import { IconService } from "../../util/iconService"
import {
  resolveHandle,
  getAuthorFeed,
  renderPost,
  escapeHtml,
  PostData,
} from "../../util/blueskyService"

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
        const did = await resolveHandle(handle)
        if (!did) {
          throw new Error(`Failed to resolve handle: ${handle}`)
        }

        // Fetch author feed using public API
        const feed = await getAuthorFeed(did, postLimit)
        if (!feed || feed.length === 0) {
          container.innerHTML = '<div class="empty-state"><p>No posts found</p></div>'
          continue
        }

        // Render posts
        const postsHtml = feed
          .map((item: PostData) => {
            return renderPost(item, {
              showMetrics,
              showContext: true,
              repostIconSvg: repostIconSvg || undefined,
              replyIconSvg: replyIconSvg || undefined,
            })
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
