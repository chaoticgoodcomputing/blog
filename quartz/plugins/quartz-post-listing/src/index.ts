// quartz-post-listing: the site's posts, newest first, each with its tags as badges (v4's
// PostListing, #42, #44, #73). A consumer of the quartz-tags engine: it reads the tags the engine
// publishes on each page's `fileData`, and paints with the engine's `--cgc-tag-*` properties. The
// component is in ./components; this is the plugin's transformer half, which exists to ship the
// component's stylesheet.
//
// ADR-0003 rule 11: a package's own CSS goes in its family layer, `@layer cgc.post-listing`,
// emitted from externalResources(). A component's `css` would land in core's `quartz-base` layer.
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import bubble from "@chaoticgoodcomputing/tags-core/bubble.css"
import style from "./style.css"

export type { PostListingOptions } from "./components/PostListing"

const PostListingStyles: QuartzTransformerPlugin = () => ({
  name: "cgc-post-listing",
  // A transformer with no hook at all is skipped by the loader, stylesheet and all (ADR-0003).
  htmlPlugins: () => [],
  // tags-core's tag bubble, which every badge holds, declares no layer (ADR-0003's libraries
  // amendment), so it ships in this package's, ahead of the package's own rules.
  externalResources: () => ({
    css: [{ content: `@layer cgc.post-listing {\n${bubble}\n}\n${style}`, inline: true }],
  }),
})

export default PostListingStyles
