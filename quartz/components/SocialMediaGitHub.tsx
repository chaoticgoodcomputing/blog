import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import style from "./styles/socialMediaGitHub.scss"
// @ts-ignore
import script from "./scripts/socialMediaGitHub.inline"

interface Options {
  /** GitHub username to display contributions for */
  username: string
  /** Theme preset or custom theme configuration */
  theme?: "default" | "void" | "slate" | "midnight" | "glacier" | "cyber"
  /** Show contribution count header */
  showHeader?: boolean
  /** Show legend footer */
  showFooter?: boolean
  /** Show GitHub attribution */
  showThumbnail?: boolean
  /** Title to display above the widget */
  title?: string
  /** Show user profile (avatar, name, organizations) */
  showProfile?: boolean
}

const defaultOptions: Partial<Options> = {
  theme: "default",
  showHeader: true,
  showFooter: true,
  showThumbnail: false,
  title: "GitHub Contributions",
  showProfile: true,
}

export default ((userOpts: Options) => {
  const opts = { ...defaultOptions, ...userOpts }

  const SocialMediaGitHub: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={classNames(displayClass, "social-media-github")}>
        {opts.title && <h3>{opts.title}</h3>}
        <div
          class="github-contrib-container"
          data-username={opts.username}
          data-theme={opts.theme}
          data-show-header={opts.showHeader}
          data-show-footer={opts.showFooter}
          data-show-thumbnail={opts.showThumbnail}
          data-show-profile={opts.showProfile}
        >
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading contributions...</p>
          </div>
        </div>
      </div>
    )
  }

  SocialMediaGitHub.css = style
  SocialMediaGitHub.afterDOMLoaded = script

  return SocialMediaGitHub
}) satisfies QuartzComponentConstructor<Options>
