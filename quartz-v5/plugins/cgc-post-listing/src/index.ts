// cgc-post-listing: the site's posts, newest first, each with its tags ringed in their colours (v4's
// PostListing, #42, #44, #73). A consumer of the cgc-tags engine: it reads the tags the engine
// publishes on each page's `fileData`, and paints with the engine's `--cgc-tag-*` properties. The
// component is in ./components; this is the plugin's transformer half, which exists to ship the
// component's stylesheet.
//
// ADR-0003 rule 11: a package's own CSS goes in its family layer, `@layer cgc.post-listing`,
// emitted from externalResources(). A component's `css` would land in core's `quartz-base` layer.
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import style from "./style.css"

export type { PostListingOptions } from "./components/PostListing"

const PostListingStyles: QuartzTransformerPlugin = () => ({
  name: "cgc-post-listing",
  // A transformer with no hook at all is skipped by the loader, stylesheet and all (ADR-0003).
  htmlPlugins: () => [],
  externalResources: () => ({ css: [{ content: style, inline: true }] }),
})

export default PostListingStyles
