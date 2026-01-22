# Social Media Widget Components

This directory contains social media integration components for Quartz.

## Components

### SocialMediaGitHub

Displays a GitHub contributions graph using the `github-contrib-graph` library.

**Usage:**
```typescript
Component.SocialMediaGitHub({
  username: "octocat",
  theme: "midnight",
  showHeader: true,
  showFooter: true,
  showThumbnail: false,
  title: "GitHub Contributions",
})
```

**Options:**
- `username` (required): GitHub username to display
- `theme`: Visual theme - "default", "void", "slate", "midnight", "glacier", or "cyber"
- `showHeader`: Show contribution count header (default: true)
- `showFooter`: Show legend footer (default: true)
- `showThumbnail`: Show GitHub attribution (default: false)
- `title`: Header text (default: "GitHub Contributions")

**Features:**
- Client-side rendering via CDN import
- No build-time dependencies
- Automatic SPA navigation support
- Loading and error states
- Responsive design

### SocialMediaBlueSky

Displays recent posts from a BlueSky account using the AT Protocol API.

**Usage:**
```typescript
Component.SocialMediaBlueSky({
  handle: "user.bsky.social",
  postLimit: 5,
  showMetrics: true,
  title: "Recent Posts",
})
```

**Options:**
- `handle` (required): BlueSky handle (e.g., "user.bsky.social")
- `postLimit`: Number of posts to display (default: 5)
- `showMetrics`: Show likes, reposts, and replies (default: true)
- `title`: Header text (default: "Recent Posts")

**Features:**
- Client-side rendering via AT Protocol API
- No authentication required (public posts only)
- Automatic SPA navigation support
- Loading and error states
- Relative timestamps
- Direct links to posts on BlueSky

## Example Layout Integration

Add to your layout's `right` section:

```typescript
import * as Component from "../components"

export const indexLayout: PageLayout = {
  // ...
  right: [
    Component.DesktopOnly(Component.TableOfContents()),
    Component.SocialMediaGitHub({
      username: "your-username",
      theme: "midnight",
      title: "GitHub Activity",
    }),
    Component.SocialMediaBlueSky({
      handle: "your-handle.bsky.social",
      postLimit: 3,
      title: "Latest Thoughts",
    }),
  ],
}
```

## Technical Details

Both components follow Quartz's architecture:
- Server-side rendering with placeholder HTML
- Client-side hydration via `afterDOMLoaded` scripts
- Dynamic ESM imports from CDN (no build dependencies)
- Support for SPA navigation via `nav` event listeners
- Responsive SCSS styling that matches Quartz theme
- Loading spinners and error states
