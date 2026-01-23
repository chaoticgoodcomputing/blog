import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import style from "./styles/socialMediaBlueSky.scss"
// @ts-ignore
import script from "./scripts/socialMediaBlueSky.inline"

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
  SocialMediaBlueSky.afterDOMLoaded = script

  return SocialMediaBlueSky
}) satisfies QuartzComponentConstructor<Options>
