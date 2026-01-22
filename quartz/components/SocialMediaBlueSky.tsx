import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import style from "./styles/socialMediaBlueSky.scss"

interface Options {
  /** BlueSky handle (e.g., "user.bsky.social") */
  handle: string
  /** Number of posts to display */
  postLimit?: number
  /** Title to display above the widget */
  title?: string
  /** Show post metrics (likes, reposts, replies) */
  showMetrics?: boolean
}

const defaultOptions: Partial<Options> = {
  postLimit: 5,
  title: "Bluesky Feed",
  showMetrics: true,
}

export default ((userOpts: Options) => {
  const opts = { ...defaultOptions, ...userOpts }

  const SocialMediaBlueSky: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={classNames(displayClass, "social-media-bluesky")}>
        {opts.title && <h3>{opts.title}</h3>}
        <div
          class="bluesky-posts-container"
          data-handle={opts.handle}
          data-post-limit={opts.postLimit}
          data-show-metrics={opts.showMetrics}
        >
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading posts...</p>
          </div>
        </div>
      </div>
    )
  }

  SocialMediaBlueSky.css = style
  SocialMediaBlueSky.afterDOMLoaded = `
    // Fetch and render BlueSky posts using public API
    (function() {
      async function initBlueSkyWidgets() {
        const containers = document.querySelectorAll('.bluesky-posts-container');
        
        for (const container of containers) {
          const handle = container.dataset.handle;
          const postLimit = parseInt(container.dataset.postLimit || '5', 10);
          const showMetrics = container.dataset.showMetrics === 'true';

          if (!handle) {
            container.innerHTML = '<div class="error-state"><p>No handle specified</p></div>';
            continue;
          }

          try {
            // Resolve handle to DID using public API
            const resolveResponse = await fetch(\`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=\${encodeURIComponent(handle)}\`);
            if (!resolveResponse.ok) {
              throw new Error(\`Failed to resolve handle: \${resolveResponse.status}\`);
            }
            const { did } = await resolveResponse.json();
            
            // Fetch author feed using public API
            const feedResponse = await fetch(\`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=\${encodeURIComponent(did)}&limit=\${postLimit}\`);
            if (!feedResponse.ok) {
              throw new Error(\`Failed to fetch posts: \${feedResponse.status}\`);
            }
            const { feed } = await feedResponse.json();

            if (!feed || feed.length === 0) {
              container.innerHTML = '<div class="empty-state"><p>No posts found</p></div>';
              continue;
            }

            // Render posts
            const postsHtml = feed.map(item => {
              const post = item.post;
              const record = post.record;
              const text = record.text || '';
              const createdAt = new Date(record.createdAt);
              const relativeTime = getRelativeTime(createdAt);

              // Format text with proper newlines
              const formattedText = escapeHtml(text).replace(/\\n/g, '<br>');

              // Build embed display (images, external links, etc.)
              let embedHtml = '';
              if (post.embed) {
                if (post.embed.$type === 'app.bsky.embed.images#view') {
                  const imagesHtml = post.embed.images.map(img => \`
                    <img src="\${img.thumb}" alt="\${escapeHtml(img.alt || '')}" class="post-image" loading="lazy" />
                  \`).join('');
                  embedHtml = \`<div class="post-images">\${imagesHtml}</div>\`;
                } else if (post.embed.$type === 'app.bsky.embed.external#view') {
                  const ext = post.embed.external;
                  embedHtml = \`
                    <a href="\${escapeHtml(ext.uri)}" target="_blank" rel="noopener noreferrer" class="post-external-link">
                      \${ext.thumb ? \`<img src="\${ext.thumb}" alt="" class="link-thumb" loading="lazy" />\` : ''}
                      <div class="link-details">
                        <div class="link-title">\${escapeHtml(ext.title || '')}</div>
                        \${ext.description ? \`<div class="link-description">\${escapeHtml(ext.description)}</div>\` : ''}
                      </div>
                    </a>
                  \`;
                }
              }

              // Build metrics display
              let metricsHtml = '';
              if (showMetrics) {
                metricsHtml = \`
                  <div class="post-metrics">
                    <span class="metric"><span class="icon">💬</span> \${post.replyCount || 0}</span>
                    <span class="metric"><span class="icon">🔁</span> \${post.repostCount || 0}</span>
                    <span class="metric"><span class="icon">❤️</span> \${post.likeCount || 0}</span>
                  </div>
                \`;
              }

              // Create post URL
              const postId = post.uri.split('/').pop();
              const postUrl = \`https://bsky.app/profile/\${handle}/post/\${postId}\`;

              return \`
                <div class="bluesky-post">
                  <div class="post-content">
                    <p>\${formattedText}</p>
                    \${embedHtml}
                  </div>
                  <div class="post-footer">
                    <time datetime="\${createdAt.toISOString()}">\${relativeTime}</time>
                    \${metricsHtml}
                  </div>
                  <a href="\${postUrl}" target="_blank" rel="noopener noreferrer" class="post-link">
                    View on BlueSky
                  </a>
                </div>
              \`;
            }).join('');

            container.innerHTML = \`<div class="posts-list">\${postsHtml}</div>\`;
          } catch (error) {
            console.error('Error loading BlueSky posts:', error);
            container.innerHTML = \`<div class="error-state"><p>Failed to load posts: \${error.message}</p></div>\`;
          }
        }
      }

      function getRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return \`\${diffMins}m ago\`;
        if (diffHours < 24) return \`\${diffHours}h ago\`;
        if (diffDays < 7) return \`\${diffDays}d ago\`;
        return date.toLocaleDateString();
      }

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      // Initialize on load
      initBlueSkyWidgets();

      // Re-initialize on SPA navigation
      document.addEventListener('nav', initBlueSkyWidgets);
    })();
  `

  return SocialMediaBlueSky
}) satisfies QuartzComponentConstructor<Options>
