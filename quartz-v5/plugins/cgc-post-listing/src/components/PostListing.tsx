import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils/path"
import { formatDate } from "@quartz-community/utils/date"
import { getDate } from "@quartz-community/utils/sort"
import { tagOfPage, type TagsData } from "@chaoticgoodcomputing/tags-core"
import readingTime from "reading-time/lib/reading-time.js"
import { i18n } from "../i18n"
import { postsFor } from "../listing"
import longPress from "./longpress.inline.js" with { type: "text" }

export interface PostListingOptions {
  /**
   * The pages, besides tag pages, that carry the listing, by slug: `index` is the site's home page
   * and `404` its not-found page. Every other page renders nothing, so the component can sit in a
   * layout slot every page shares. Quartz 5 lets no plugin add the `is-index` layout condition this
   * would otherwise be (docs/adr/0001). Default: `["index"]`.
   */
  showOn?: string[]
  /** The heading above the listing. Default: "Recent Posts". `false` for none. */
  title?: string | false
  /** List at most this many posts. Default: all of them. */
  limit?: number
  /** Show this many posts, and the rest behind a "Show N more posts" toggle. Default: all shown. */
  collapsedItemCount?: number
  /** Leave out the posts under any of these tags, their subtags included. Default: `["private"]`. */
  excludeTags?: string[]
  /** On a tag page, list only the posts under that tag. Default: true. */
  filterToCurrentTag?: boolean
  /** On a tag page, count the posts under its subtags as under the tag. Default: true. */
  includeSubtags?: boolean
  /** Leave out tag pages, such as a tag's description file. Default: true. */
  excludeTagPages?: boolean
  /** Say so when there is nothing to list. Default: true. */
  showEmptyMessage?: boolean
  /** What to say when there is nothing to list. Default: "No posts found." */
  emptyMessage?: string
  /** Show each post's tags. Default: true. */
  showTags?: boolean
  /** Show each post's date, before its description. Default: true. */
  showDates?: boolean
  /** Show each post's description, with its date and reading time. Default: true. */
  showDescriptions?: boolean
  /** After each tag, the number of pages under it, its subtags' included. Default: false. */
  showTagCounts?: boolean
}

// Quartz merges no defaults into a component's options, so the component does. v4's, except that
// one option set now serves the index and the tag pages alike: the tag filter, which only a tag
// page applies, is on (v4's tags layout turned it on; its index had no tag to filter by).
const DEFAULTS: Required<
  Omit<PostListingOptions, "title" | "limit" | "collapsedItemCount" | "emptyMessage">
> = {
  showOn: ["index"],
  excludeTags: ["private"],
  filterToCurrentTag: true,
  includeSubtags: true,
  excludeTagPages: true,
  showEmptyMessage: true,
  showTags: true,
  showDates: true,
  showDescriptions: true,
  showTagCounts: false,
}

type PageData = QuartzComponentProps["fileData"]

// How many pages each tag is over, built once per build: every page gets the same `allFiles`.
const countsByCorpus = new WeakMap<object, Map<string, number>>()
function countsOf(allFiles: PageData[]): Map<string, number> {
  let counts = countsByCorpus.get(allFiles)
  if (!counts) {
    counts = new Map()
    for (const file of allFiles)
      for (const tag of Object.keys((file.cgcTags as TagsData | undefined)?.ancestors ?? {}))
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
    countsByCorpus.set(allFiles, counts)
  }
  return counts
}

// A link from the page being rendered. Relative, as Quartz's own are, except on the 404 page,
// which is served at any depth: its links start from the site's base path, as Quartz's head does.
function linkFrom(slug: string, baseUrl: string | undefined) {
  if (slug !== "404") return (target: string) => resolveRelative(slug as never, target as never)
  const base = new URL(`https://${baseUrl ?? "example.com"}`).pathname.replace(/\/?$/, "/")
  return (target: string) =>
    base + resolveRelative("index" as never, target as never).replace(/^\.\/?/, "")
}

export default ((userOpts?: PostListingOptions) => {
  const opts = { ...DEFAULTS, ...userOpts }

  const PostListing: QuartzComponent = ({
    cfg,
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const slug = fileData.slug as string
    if (tagOfPage(slug) === null && !opts.showOn.includes(slug)) return null

    const strings = i18n(cfg.locale)
    const href = linkFrom(slug, cfg.baseUrl)
    const counts = opts.showTagCounts ? countsOf(allFiles) : null
    let posts = postsFor(slug, allFiles, opts)
    if (opts.limit) posts = posts.slice(0, opts.limit)
    const classes = ["cgc-post-listing", displayClass].filter(Boolean).join(" ")

    if (posts.length === 0) {
      if (!opts.showEmptyMessage) return null
      return (
        <div class={classes}>
          <p class="cgc-post-listing__empty">{opts.emptyMessage ?? strings.empty}</p>
        </div>
      )
    }

    const item = (post: PageData) => {
      const description = post.frontmatter?.description as string | undefined
      const date = opts.showDates ? getDate(post) : undefined
      const minutes = post.text ? Math.ceil(readingTime(post.text as string).minutes) : undefined
      const tags = (post.cgcTags as TagsData | undefined)?.tags ?? {}
      return (
        <li class="cgc-post-listing__post">
          <h3 class="cgc-post-listing__heading">
            <a class="cgc-post-listing__link" href={href(post.slug as string)}>
              {post.frontmatter?.title}
            </a>
          </h3>
          {/* As in v4, the date and reading time come with the description, or not at all. */}
          {opts.showDescriptions && description && (
            <p class="cgc-post-listing__description">
              {date && (
                <>
                  <time class="cgc-post-listing__date" datetime={date.toISOString()}>
                    {formatDate(date, cfg.locale)}
                  </time>{" "}
                  —{" "}
                </>
              )}
              {description}
              {minutes !== undefined && ` (${strings.readingTime(minutes)})`}
            </p>
          )}
          {opts.showTags && Object.keys(tags).length > 0 && (
            <ul class="cgc-post-listing__tags">
              {Object.entries(tags).map(([tag, properties]) => (
                <li class="cgc-post-listing__tag" data-tag={tag}>
                  {/* `internal`, so core gives the badge a popover like any link to a page of the site. */}
                  <a class="internal cgc-post-listing__tag-link" href={href(`tags/${tag}`)}>
                    {/* The tag colour paints the ring, and never text (cgc-tag-list's ADR-0001). */}
                    <span
                      class="cgc-post-listing__ring"
                      style={{ color: `var(${properties.color})` }}
                      title={tag}
                    ></span>
                    <span class="cgc-post-listing__tag-name">{tag.split("/").pop()}</span>
                    {counts && (
                      <span class="cgc-post-listing__tag-count">({counts.get(tag) ?? 0})</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      )
    }

    const shown = opts.collapsedItemCount ?? posts.length
    const rest = posts.slice(shown)
    return (
      <div class={classes}>
        {opts.title !== false && (
          <h3 class="cgc-post-listing__title">{opts.title ?? strings.title}</h3>
        )}
        <ul class="cgc-post-listing__list">{posts.slice(0, shown).map(item)}</ul>
        {rest.length > 0 && (
          <details class="cgc-post-listing__more">
            <summary class="cgc-post-listing__more-toggle">{strings.showMore(rest.length)}</summary>
            <ul class="cgc-post-listing__list">{rest.map(item)}</ul>
          </details>
        )}
      </div>
    )
  }

  PostListing.afterDOMLoaded = longPress
  return PostListing
}) satisfies QuartzComponentConstructor<PostListingOptions>
