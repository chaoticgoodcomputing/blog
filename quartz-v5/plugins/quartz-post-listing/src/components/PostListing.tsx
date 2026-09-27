import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative, slugTag } from "@quartz-community/utils/path"
import { formatDate } from "@quartz-community/utils/date"
import { getDate } from "@quartz-community/utils/sort"
import { nameOf, normaliseTag, tagOfPage, type TagsData } from "@chaoticgoodcomputing/tags-core"
import { TAG_BUBBLE, tagBubble } from "@chaoticgoodcomputing/tags-core/bubble"
import { createIcons, type IconCollections, type Icons } from "@chaoticgoodcomputing/icons"
import readingTime from "reading-time/lib/reading-time.js"
import { i18n } from "../i18n"
import { postsFor } from "../listing"
import longPress from "./longpress.inline.js" with { type: "text" }

export interface PostListingOptions {
  /**
   * The pages, besides tag pages, that carry the listing, by slug: `index` is the site's home page
   * and `404` its not-found page. Every other page renders nothing, so the component can sit in a
   * layout slot every page shares: Quartz 5 ships no `is-index` layout condition (docs/adr/0001).
   * `false` for no filter of its own, for a site that keeps the listing to its pages itself, in its
   * `quartz.ts`: it renders wherever the layout puts it. Default: `["index"]`.
   */
  showOn?: string[] | false
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
  /** Leave out tag pages, such as a tag's description file, and the page of every tag. Default: true. */
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
  /**
   * The site's own icon collections, each prefix and its directory of SVG files, resolved against
   * the Quartz root: `{ custom: "../icons" }` draws `custom:d20` from `../icons/d20.svg`. Installed
   * Iconify sets, such as `mdi`, need no entry. Default: none.
   */
  iconCollections?: IconCollections
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
  iconCollections: {},
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

// The icon in a bubble, drawn for tags-core's bubble, which paints it, as cgc-tag-list draws it.
const ICON = { class: TAG_BUBBLE.icon }

// Each tag's icon, drawn, for every tag in the corpus that has one, built once per build. Every tag's
// is drawn on the first page rendered, whether that page shows the listing or not, so an icon id no
// collection has fails the build every time, as cgc-tag-list's does.
function iconsOf(
  allFiles: PageData[],
  icons: Icons,
  drawn: WeakMap<object, Map<string, string>>,
): Map<string, string> {
  let byTag = drawn.get(allFiles)
  if (!byTag) {
    byTag = new Map()
    for (const file of allFiles)
      for (const [tag, { icon }] of Object.entries(
        (file.cgcTags as TagsData | undefined)?.ancestors ?? {},
      )) {
        if (icon === null || byTag.has(tag)) continue
        try {
          byTag.set(tag, icons.svg(icon, ICON))
        } catch (err) {
          throw new Error(`cgc-post-listing: tag "${tag}": ${(err as Error).message}`)
        }
      }
    drawn.set(allFiles, byTag)
  }
  return byTag
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
  const merged = { ...DEFAULTS, ...userOpts }
  // The excluded tags as the engine normalises a tag a site writes (tags-core), so they match the
  // tags it publishes on each page.
  const excludeTags = merged.excludeTags.map((tag) => normaliseTag(tag, slugTag))
  const opts = { ...merged, excludeTags }
  const icons = createIcons({ iconCollections: opts.iconCollections })
  const drawn = new WeakMap<object, Map<string, string>>()

  const PostListing: QuartzComponent = ({
    cfg,
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const slug = fileData.slug as string
    const iconOf = iconsOf(allFiles, icons, drawn)
    if (opts.showOn && tagOfPage(slug) === null && !opts.showOn.includes(slug)) return null

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
                    {/* tags-core's bubble: the tag colour paints its rim, never text (cgc-tag-list's ADR-0001). */}
                    <span
                      {...tagBubble({ tag, color: properties.color, icon: iconOf.get(tag), badge: true })}
                    ></span>
                    {/* "#" and the name as one string, so they sit as one word (#82). */}
                    <span class="cgc-post-listing__tag-name">{`#${nameOf(tag)}`}</span>
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
