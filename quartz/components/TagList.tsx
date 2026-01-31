import { FullSlug, resolveAbsolute } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

// @ts-ignore
import script from "./scripts/TagList.inline"

export interface TagListOptions {
  /**
   * When on a tag page, show subtags instead of the current page's tags.
   * Default: false
   */
  showSubtags?: boolean

  /**
   * Show the immediate parent tag in the hierarchy.
   * For example, #writing/annotations will show #writing.
   * Only shows one level up (not all ancestors).
   * Default: false
   */
  showParentTag?: boolean

  /**
   * Show count of posts for each tag (only applies when showSubtags is true).
   * Counts are cumulative - parent tags include all descendant posts.
   * Default: true
   */
  showCount?: boolean
}

const defaultOptions: TagListOptions = {
  showSubtags: false,
  showParentTag: false,
  showCount: true,
}

export default ((userOpts?: Partial<TagListOptions>) => {
  const opts: TagListOptions = { ...defaultOptions, ...userOpts }

  const TagList: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const slug = fileData.slug

    // Default behavior: show the current page's tags
    const tags = fileData.frontmatter?.tags

    // If this page has explicit tags, render them.
    if (tags && tags.length > 0) {
      return (
        <ul
          class={classNames(displayClass, "tags")}
          data-showtags="true"
          data-showsubtags={opts.showSubtags}
          data-showparenttag={opts.showParentTag}
          data-showcount={opts.showCount}
          data-currentslug={slug}
        >
          {tags.map((tag) => {
            return (
              <li class="tag-item" data-tag={tag}>
                <a href="#" class="internal tag-link">
                  <span class="tag-icon-badge"></span>
                  <span class="tag-name"></span>
                  <span class="tag-count"></span>
                </a>
              </li>
            )
          })}
        </ul>
      )
    }

    // On tag pages with showSubtags enabled, render an empty list for the script to populate.
    if (opts.showSubtags && slug?.startsWith("tags/")) {
      return (
        <ul
          class={classNames(displayClass, "tags")}
          data-showtags="true"
          data-showsubtags={opts.showSubtags}
          data-showparenttag={opts.showParentTag}
          data-showcount={opts.showCount}
          data-currentslug={slug}
        ></ul>
      )
    }

    return null
  }

  TagList.css = `
.tags {
  list-style: none;
  display: flex;
  padding-left: 0;
  gap: 0.5rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.section-li > .section > .tags {
  justify-content: flex-end;
}

@media (max-width: 800px) {
  .tags {
    justify-content: center;
  }
}
  
.tags > .tag-item {
  display: inline-block;
  white-space: nowrap;
  margin: 0;
  overflow-wrap: normal;
}

a.internal.tag-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 18px 8px 8px 18px;
  background-color: var(--lightgray);
  padding: 0.3rem 0.6rem 0.3rem 0.3rem;
  margin: 0;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s ease, border-radius 0.2s ease, padding 0.2s ease;
}

a.internal.tag-link:hover {
  background-color: var(--gray);
}

/* Mobile only: icon-only mode */
@media (max-width: 800px) {
  a.internal.tag-link {
    border-radius: 50%;
    padding: 0.3rem;
    gap: 0;
  }

  a.internal.tag-link:not(.expanded) .tag-name,
  a.internal.tag-link:not(.expanded) .tag-count {
    display: none;
  }

  /* Long-press: expand to show name and count */
  a.internal.tag-link.expanded {
    border-radius: 18px 8px 8px 18px;
    padding: 0.3rem 0.6rem 0.3rem 0.3rem;
    gap: 0.5rem;
  }

  a.internal.tag-link.expanded .tag-name,
  a.internal.tag-link.expanded .tag-count {
    display: flex;
  }
}

.tag-icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  background-color: transparent;
  border: 2.5px solid var(--tag-color, #888888);
  font-size: 16px;
  line-height: 1;
}

.tag-name {
  font-weight: 500;
  font-size: 0.95em;
  display: flex;
  align-items: center;
}

.tag-name::before {
  content: "#";
  margin-right: 0.2em;
  opacity: 0.7;
}

.tag-count {
  color: var(--gray);
  font-size: 0.85em;
  margin-left: 0.2rem;
}
`

  TagList.afterDOMLoaded = script
  return TagList
}) satisfies QuartzComponentConstructor<TagListOptions>
