import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveAbsolute } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { Date, getDate } from "./Date"
import { byDateAndAlphabetical, SortFn } from "./PageList"
import { matchesTagFilter } from "../util/tags"
import readingTime from "reading-time"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"
import style from "./styles/postListing.scss"

// @ts-ignore
import script from "./scripts/PostListing.inline"

export interface PostListingOptions {
  /**
   * Title to display above the post listing.
   * If undefined, uses the i18n default ("Posts").
   * Set to false to hide the title.
   */
  title?: string | false

  /**
   * Maximum number of posts to display. If undefined, shows all posts.
   */
  limit?: number

  /**
   * Number of posts to show before collapsing the rest into a details element.
   * If undefined, all posts are shown without collapsing.
   */
  collapsedItemCount?: number

  /**
   * Sorting function for posts. Defaults to byDateAndAlphabetical.
   */
  sort?: SortFn

  /**
   * Tags to exclude from the listing. Posts with any of these tags will be filtered out.
   * Default: ["private"]
   */
  excludeTags?: string[]

  /**
   * If true, filters posts to only those that have the current page's tag.
   * Only works on tag pages (pages with slug starting with "tags/").
   * Default: false
   */
  filterToCurrentTag?: boolean

  /**
   * If true, includes posts with subtags when filtering to current tag.
   * For example, on the "engineering" tag page, posts tagged with
   * "engineering/languages/typescript" or "engineering/ai" will also be shown.
   * Only applies when filterToCurrentTag is true.
   * Default: false
   */
  includeSubtags?: boolean

  /**
   * Filter function to determine which pages to include.
   * Takes precedence over excludeTags and filterToCurrentTag if specified.
   */
  filter?: (file: QuartzPluginData) => boolean

  /**
   * Whether to show a "No posts found" message when the list is empty.
   * Default: true
   */
  showEmptyMessage?: boolean

  /**
   * Custom empty message to display when no posts are found.
   */
  emptyMessage?: string

  /**
   * Whether to show tags on each post.
   * Default: true
   */
  showTags?: boolean

  /**
   * Whether to show dates on each post.
   * Default: true
   */
  showDates?: boolean

  /**
   * Whether to show descriptions on each post.
   * Default: true
   */
  showDescriptions?: boolean

  /**
   * Whether to show post counts in tag badges.
   * Default: false
   */
  showTagCounts?: boolean

  /**
   * Whether to exclude tag index pages from the listing.
   * Tag pages (e.g., tags/engineering/index) are meta pages whose links
   * are already included in tag bubbles.
   * Default: true
   */
  excludeTagPages?: boolean
}

const defaultOptions: PostListingOptions = {
  excludeTags: ["private"],
  showEmptyMessage: true,
  emptyMessage: "No posts found.",
  showTags: true,
  showDates: true,
  showDescriptions: true,
  excludeTagPages: true,
}

export default ((userOpts?: Partial<PostListingOptions>) => {
  const opts: PostListingOptions = { ...defaultOptions, ...userOpts }

  const PostListing: QuartzComponent = ({
    cfg,
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const sorter = opts.sort ?? byDateAndAlphabetical(cfg)

    // Determine the title to display
    const title = opts.title === false
      ? null
      : opts.title ?? i18n(cfg.locale).components.postListing.title

    // Apply filtering
    let filteredFiles = allFiles

    if (opts.filter) {
      // Use custom filter if provided
      filteredFiles = filteredFiles.filter(opts.filter)
    } else {
      // Exclude tag index pages by default
      if (opts.excludeTagPages) {
        filteredFiles = filteredFiles.filter((file) => !file.slug?.startsWith("tags/"))
      }

      // Apply filterToCurrentTag if on a tag page
      if (opts.filterToCurrentTag && fileData.slug?.startsWith("tags/")) {
        // Extract tag from slug: "tags/horticulture/index" -> "horticulture"
        const currentTag = fileData.slug
          .replace(/^tags\//, "")
          .replace(/\/index$/, "")
          .replace(/\/$/, "")
        filteredFiles = filteredFiles.filter((file) => {
          const tags = file.frontmatter?.tags ?? []
          return matchesTagFilter(tags, currentTag, opts.includeSubtags ?? false)
        })
      }

      // Apply excludeTags filter
      if (opts.excludeTags && opts.excludeTags.length > 0) {
        filteredFiles = filteredFiles.filter((file) => {
          const tags = file.frontmatter?.tags ?? []
          return !tags.some((tag) => opts.excludeTags!.includes(tag))
        })
      }
    }

    // Apply sorting
    let list = filteredFiles.sort(sorter)

    // Apply limit
    if (opts.limit) {
      list = list.slice(0, opts.limit)
    }

    // Show empty message if no posts
    if (list.length === 0 && opts.showEmptyMessage) {
      return <p class="post-listing-empty">{opts.emptyMessage}</p>
    }

    // Render list items
    const renderListItems = (items: QuartzPluginData[]) =>
      items.map((page) => {
        const title = page.frontmatter?.title
        const description = page.frontmatter?.description
        const tags = page.frontmatter?.tags ?? []

        // Calculate reading time
        let readingTimeText: string | undefined
        if (page.text) {
          const { minutes } = readingTime(page.text)
          readingTimeText = i18n(cfg.locale).components.contentMeta.readingTime({
            minutes: Math.ceil(minutes),
          })
        }

        return (
          <li class="section-li">
            <div class="section">
              <div class="desc">
                <h3>
                  <a href={resolveAbsolute(page.slug!)} class="post-link">
                    {title}
                  </a>
                </h3>
                {opts.showTags && tags.length > 0 && (
                  <ul
                    class="tags"
                    data-component="post-listing"
                    data-showcount={opts.showTagCounts}
                  >
                    {tags.map((tag) => (
                      <li class="tag-item" data-tag={tag}>
                        <a href="#" class="internal tag-link">
                          <span class="tag-icon-badge"></span>
                          <span class="tag-name"></span>
                          <span class="tag-count"></span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {opts.showDescriptions && description && (
                  <p class="post-description">
                    {opts.showDates && page.dates && (
                      <>
                        <Date date={getDate(cfg, page)!} locale={cfg.locale} /> —{" "}
                      </>
                    )}
                    {description}
                    {readingTimeText && ` (${readingTimeText})`}
                  </p>
                )}
              </div>
            </div>
          </li>
        )
      })

    // Handle collapsible list if collapsedItemCount is set
    const content = opts.collapsedItemCount && list.length > opts.collapsedItemCount ? (
      <>
        <ul class="section-ul">{renderListItems(list.slice(0, opts.collapsedItemCount))}</ul>
        <details class="post-listing-collapse">
          <summary>
            Show {list.length - opts.collapsedItemCount} more {list.length - opts.collapsedItemCount === 1 ? "post" : "posts"}
          </summary>
          <ul class="section-ul">{renderListItems(list.slice(opts.collapsedItemCount))}</ul>
        </details>
      </>
    ) : (
      <ul class="section-ul">{renderListItems(list)}</ul>
    )

    return (
      <div class={classNames(displayClass, "post-listing")}>
        {title && <h3>{title}</h3>}
        {content}
      </div>
    )
  }

  PostListing.css = style
  PostListing.afterDOMLoaded = script
  return PostListing
}) satisfies QuartzComponentConstructor<PostListingOptions>
