import {
  parseBlueSkyUrl,
  getPostThread,
  renderPost,
  escapeHtml,
  PostData,
} from "../../util/blueskyService"
import { IconService } from "../../util/iconService"

// Fetch and render BlueSky posts
;(async function () {
  // Check if widgets exist on the page before loading resources
  const widgets = document.querySelectorAll(".widget-bluesky-post")
  if (widgets.length === 0) return

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

  /**
   * Initialize a single BlueSky post widget.
   */
  async function initBlueSkyPostWidget(container: HTMLElement): Promise<void> {
  // Ensure icons are loaded
  if (!repostIconSvg || !replyIconSvg) {
    await preloadIcons()
  }

  const url = container.dataset.url
  const showMetrics = container.dataset.showMetrics === "true"

  if (!url) {
    container.innerHTML = '<div class="error-state"><p>No URL specified</p></div>'
    return
  }

  // Parse the BlueSky URL
  const parsed = parseBlueSkyUrl(url)
  if (!parsed) {
    container.innerHTML = `
      <div class="error-state">
        <p>Invalid BlueSky URL format</p>
        <p class="error-details">Expected format: https://bsky.app/profile/&lt;HANDLE&gt;/post/&lt;ID&gt;</p>
      </div>
    `
    return
  }

  try {
    // Fetch the post thread
    const threadData = await getPostThread(parsed.atUri)

    if (!threadData || !threadData.thread) {
      throw new Error("Failed to fetch post data")
    }

    const thread = threadData.thread

    // Check if the post exists
    if (thread.$type === "app.bsky.feed.defs#notFoundPost") {
      container.innerHTML = `
        <div class="error-state">
          <p>Post not found</p>
          <p class="error-details">This post may have been deleted or is not publicly accessible.</p>
        </div>
      `
      return
    }

    if (thread.$type === "app.bsky.feed.defs#blockedPost") {
      container.innerHTML = `
        <div class="error-state">
          <p>Post blocked</p>
          <p class="error-details">You do not have permission to view this post.</p>
        </div>
      `
      return
    }

    // Build HTML for the main post
    const mainPostItem: PostData = {
      post: thread.post,
    }

    const mainPostHtml = renderPost(mainPostItem, {
      showMetrics,
      showContext: false, // No context for the main post (not in a feed)
      repostIconSvg: repostIconSvg || undefined,
      replyIconSvg: replyIconSvg || undefined,
    })

    // Render the complete widget
    container.innerHTML = mainPostHtml
  } catch (error) {
    console.error("Error loading BlueSky post:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    container.innerHTML = `
      <div class="error-state">
        <p>Failed to load post</p>
        <p class="error-details">${escapeHtml(errorMessage)}</p>
      </div>
    `
  }
}

  // Initialize all widgets on page load
  async function initAllWidgets() {
    const containers = document.querySelectorAll<HTMLElement>(".widget-bluesky-post")
    for (const container of containers) {
      await initBlueSkyPostWidget(container)
    }
  }

  // Initialize on load
  await preloadIcons()
  await initAllWidgets()

  // Re-initialize on SPA navigation
  document.addEventListener("nav", initAllWidgets)
})()
