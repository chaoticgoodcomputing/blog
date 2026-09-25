import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { script } from "cgc-social:client"
import { resolveOptions, type SocialMediaOptions } from "../options"

// What a card shows while its script fetches, and when the script never runs: v4's loading state.
const Loading = ({ message }: { message: string }) => (
  <div class="cgc-social__status">
    <div class="cgc-social__spinner" />
    <p class="cgc-social__message">{message}</p>
  </div>
)

const Title = ({ title }: { title: string | false }) =>
  title ? <h3 class="cgc-social__title">{title}</h3> : null

export default ((userOpts?: Partial<SocialMediaOptions>) => {
  const { showOn, github, bluesky } = resolveOptions(userOpts)

  // v4's SocialMediaGitHub and SocialMediaBlueSky, one after the other, as v4's home page had them.
  // The page as built holds each card's loading state; the browser script (src/client/) fetches what
  // the card shows and draws it in the card's body.
  const SocialMedia: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    if (!showOn.includes(fileData.slug as string)) return null
    return (
      <div class={["cgc-social", displayClass].filter(Boolean).join(" ")}>
        {github && (
          <div
            class="cgc-social__card cgc-social__card--github"
            data-username={github.username}
            data-show-profile={String(github.showProfile)}
            data-show-header={String(github.showHeader)}
          >
            <Title title={github.title} />
            <div class="cgc-social__body cgc-social__body--github">
              <Loading message="Loading contributions..." />
            </div>
          </div>
        )}
        {bluesky && (
          <div
            class="cgc-social__card cgc-social__card--bluesky"
            data-handle={bluesky.handle}
            data-post-limit={String(bluesky.postLimit)}
            data-show-metrics={String(bluesky.showMetrics)}
          >
            <Title title={bluesky.title} />
            <div class="cgc-social__body">
              <Loading message="Loading posts..." />
            </div>
          </div>
        )}
      </div>
    )
  }

  SocialMedia.afterDOMLoaded = script
  return SocialMedia
}) satisfies QuartzComponentConstructor<Partial<SocialMediaOptions>>
