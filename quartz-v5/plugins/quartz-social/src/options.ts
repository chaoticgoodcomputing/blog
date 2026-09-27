// The plugin's options, as a site writes them, and the checks that fail the build on a mistake. One
// config entry gives both halves the same options: the component draws the cards, and the
// transformer ships the stylesheet, with the calendar's colours if the site sets them.
import { isColourValue } from "./colour"

export interface GitHubCardOptions {
  /** The GitHub user whose year of contributions the card shows. Required. */
  username: string
  /** The heading above the card. Default: "GitHub Contributions". `""` or `false` for none. */
  title?: string | false
  /** Show the user's avatar, name, username and bio above the calendar. Default: true. */
  showProfile?: boolean
  /** Show the year's total above the calendar ("N contributions in the last year"). Default: true. */
  showHeader?: boolean
  /**
   * The calendar's five colours, from a day with no contributions to the busiest: colour values
   * (ADR-0003), such as `var(--lightgray)` or `light-dark(#ebedf0, #161b22)`. Default: the theme's
   * `lightgray`, then three mixes of it with `secondary`, then `secondary`.
   */
  levelColors?: string[]
}

export interface BlueskyCardOptions {
  /** The Bluesky account whose latest posts the card shows, by handle, such as `alice.bsky.social`. Required. */
  handle: string
  /** How many posts to show, from 1 to 100. Default: 5. */
  postLimit?: number
  /** The heading above the card. Default: "Bluesky Feed". `""` or `false` for none. */
  title?: string | false
  /** Show each post's reply, repost and like counts. Default: true. */
  showMetrics?: boolean
}

export interface SocialMediaOptions {
  /**
   * The pages that carry the cards, by slug: `index` is the site's home page. Every other page
   * renders nothing, so the component can sit in a layout slot every page shares: Quartz 5 ships no
   * `is-index` layout condition (cgc-post-listing's docs/adr/0001). `false` for no filter of its own,
   * for a site that keeps the cards to their pages itself, in its `quartz.ts`: they render wherever
   * the layout puts them. Default: `["index"]`.
   */
  showOn?: string[] | false
  /** The GitHub card. Leave it out for no GitHub card. */
  github?: GitHubCardOptions
  /** The Bluesky card, below the GitHub card. Leave it out for no Bluesky card. */
  bluesky?: BlueskyCardOptions
}

export type GitHubCard = Required<Omit<GitHubCardOptions, "levelColors">> &
  Pick<GitHubCardOptions, "levelColors">
export type BlueskyCard = Required<BlueskyCardOptions>
export interface SocialMedia {
  showOn: string[] | false
  github?: GitHubCard
  bluesky?: BlueskyCard
}

// v4's defaults (SocialMediaGitHub, SocialMediaBlueSky), less its hex presets (ADR-0003 rule 5).
const GITHUB_DEFAULTS = { title: "GitHub Contributions", showProfile: true, showHeader: true }
const BLUESKY_DEFAULTS = { postLimit: 5, title: "Bluesky Feed", showMetrics: true }
/** How many colours `levelColors` takes: the contributions API's five levels. */
export const LEVELS = 5

const fail = (message: string): never => {
  throw new Error(`cgc-social: ${message}`)
}

/** The site's options, checked and completed with the defaults. Throws, failing the build, on a mistake. */
export function resolveOptions(opts?: Partial<SocialMediaOptions>): SocialMedia {
  // Options arrive as the site's config gives them: Quartz merges no defaults into a component's.
  if (!opts?.github && !opts?.bluesky) {
    fail(`set "github" (with a "username"), "bluesky" (with a "handle"), or both, to show a card`)
  }
  const showOn = opts?.showOn ?? ["index"]
  if (
    showOn !== false &&
    (!Array.isArray(showOn) || !showOn.every((slug) => typeof slug === "string"))
  ) {
    fail(`"showOn" is a list of page slugs, such as [index], or false`)
  }
  return { showOn, github: github(opts?.github), bluesky: bluesky(opts?.bluesky) }
}

function github(opts: Partial<GitHubCardOptions> | undefined): GitHubCard | undefined {
  if (!opts) return undefined
  const username = typeof opts.username === "string" ? opts.username.trim() : ""
  if (!username) fail(`set "github.username" to the GitHub user whose contributions to show`)
  const card = { ...GITHUB_DEFAULTS, ...opts, username } as GitHubCard
  if (card.levelColors !== undefined) {
    if (!Array.isArray(card.levelColors) || card.levelColors.length !== LEVELS) {
      fail(
        `"github.levelColors" is a list of ${LEVELS} colour values, from no contributions to the most`,
      )
    }
    for (const value of card.levelColors) {
      if (!isColourValue(value)) {
        fail(`"github.levelColors" has ${JSON.stringify(value)}, which is not a colour value`)
      }
    }
  }
  return card
}

function bluesky(opts: Partial<BlueskyCardOptions> | undefined): BlueskyCard | undefined {
  if (!opts) return undefined
  const handle = typeof opts.handle === "string" ? opts.handle.trim().replace(/^@/, "") : ""
  if (!handle) fail(`set "bluesky.handle" to the Bluesky account whose posts to show`)
  const card = { ...BLUESKY_DEFAULTS, ...opts, handle } as BlueskyCard
  if (!Number.isInteger(card.postLimit) || card.postLimit < 1 || card.postLimit > 100) {
    fail(
      `"bluesky.postLimit" is a whole number from 1 to 100, not ${JSON.stringify(card.postLimit)}`,
    )
  }
  return card
}
