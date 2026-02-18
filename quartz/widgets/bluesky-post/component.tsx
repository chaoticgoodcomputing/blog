import { WidgetProps, WidgetComponent } from "../types"

interface BlueSkyPostProps extends WidgetProps {
  url: string
  showMetrics?: boolean
  maxWidth?: string
}

/**
 * BlueSkyPost widget - displays a single BlueSky post.
 * 
 * Embeds a specific BlueSky post by URL, fetching and rendering it client-side using
 * the public ATProto API.
 * 
 * @example
 * ```mdx
 * import { BlueSkyPost } from '@widgets/bluesky-post'
 * 
 * <BlueSkyPost url="https://bsky.app/profile/handle.bsky.social/post/abc123" />
 * 
 * <BlueSkyPost 
 *   url="https://bsky.app/profile/handle.bsky.social/post/abc123"
 *   showMetrics={true}
 *   maxWidth="800px"
 * />
 * ```
 * 
 * @param url - BlueSky post URL in format: https://bsky.app/profile/<HANDLE>/post/<ID>
 * @param showMetrics - Display interaction metrics (likes, reposts, replies). Default: false
 * @param maxWidth - Maximum width of the widget. Default: "600px"
 */
export const BlueSkyPost: WidgetComponent = (props: WidgetProps) => {
  const {
    url,
    showMetrics = false,
    maxWidth = "600px",
  } = props as BlueSkyPostProps

  if (!url) {
    return (
      <div class="widget-bluesky-post" style={{ maxWidth }}>
        <div class="error-state">
          <p>Error: No URL provided</p>
        </div>
      </div>
    )
  }

  return (
    <div
      class="widget-bluesky-post"
      data-url={url}
      data-show-metrics={showMetrics.toString()}
      style={{ maxWidth }}
    >
      <div class="bluesky-post-loading">
        <div class="loading-spinner"></div>
        <p>Loading post...</p>
      </div>
    </div>
  )
}
