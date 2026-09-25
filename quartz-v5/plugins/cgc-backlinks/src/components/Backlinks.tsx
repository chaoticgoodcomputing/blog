import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative, simplifySlug, slugTag } from "@quartz-community/utils/path"
import { createIcons, type IconCollections } from "@chaoticgoodcomputing/icons"
import { i18n } from "../i18n"
import overflow from "./overflow.inline.js" with { type: "text" }

export interface BacklinksOptions {
  /**
   * Tags that make a page private: a page carrying one of them, or a descendant of one
   * (`private/work` under `private`), is a private backlink. A tag that only starts with one
   * (`privateer`) is not a descendant. Default: `["private"]`, as cgc-seo's `noindexTags`.
   */
  privateTags?: string[]
  /** The icon id a private backlink is marked with. Default: `mdi:lock`, as v4's. */
  privateIcon?: string
  /**
   * The site's own icon collections, each prefix and its directory of SVG files, resolved against
   * the Quartz root: `{ custom: "../icons" }` draws `custom:lock` from `../icons/lock.svg`. Installed
   * Iconify sets, such as `mdi`, need no entry. Default: none.
   */
  iconCollections?: IconCollections
  /** Leave the section out of a page no page links to, as stock does. Default: true. */
  hideWhenEmpty?: boolean
}

// Quartz merges no defaults into a component's options, so the component does.
const DEFAULTS: Required<BacklinksOptions> = {
  privateTags: ["private"],
  privateIcon: "mdi:lock",
  iconCollections: {},
  hideWhenEmpty: true,
}

type PageData = QuartzComponentProps["fileData"]

// Whether a page is private: it carries one of the private tags, or a descendant of one. Frontmatter
// tags arrive slugged (note-properties), so the private tags are slugged the same way to match.
function privatePages(privateTags: string[]): (page: PageData) => boolean {
  const roots = privateTags.map((tag) => slugTag(tag))
  const isPrivateTag = (tag: string) =>
    roots.some((root) => tag === root || tag.startsWith(`${root}/`))
  return (page) => (page.frontmatter?.tags ?? []).some(isPrivateTag)
}

// When a page was last changed, as v4 sorted by it: its modified date, else its published date.
// Quartz's dates are Dates; a page with neither sorts as the oldest.
const changed = (page: PageData) => {
  const time = new Date((page.dates?.modified ?? page.dates?.published ?? 0) as Date).getTime()
  return Number.isNaN(time) ? 0 : time
}

export default ((userOpts?: BacklinksOptions) => {
  const opts = { ...DEFAULTS, ...userOpts }
  const isPrivate = privatePages(opts.privateTags)
  const icons = createIcons({ iconCollections: opts.iconCollections })
  // The private mark, drawn once, on the first page rendered, whether or not that page has a private
  // backlink: an icon id no collection has fails the build every time.
  let lock: string | undefined
  const drawLock = () => {
    try {
      return (lock ??= icons.svg(opts.privateIcon, { class: "cgc-backlinks__icon" }))
    } catch (err) {
      throw new Error(`cgc-backlinks: privateIcon: ${(err as Error).message}`)
    }
  }

  // v4's order: public pages first, then the most recently changed, then titles in reverse
  // alphabetical order.
  const order = (a: PageData, b: PageData) =>
    Number(isPrivate(a)) - Number(isPrivate(b)) ||
    changed(b) - changed(a) ||
    (b.frontmatter?.title?.toLowerCase() ?? "").localeCompare(
      a.frontmatter?.title?.toLowerCase() ?? "",
    )

  const Backlinks: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const privateMark = drawLock()
    const slug = fileData.slug as string
    const here = simplifySlug(slug as never)
    const sources = allFiles
      .filter(
        (file) => file.unlisted !== true && (file.links as string[] | undefined)?.includes(here),
      )
      .sort(order)
    if (opts.hideWhenEmpty && sources.length === 0) return null

    const strings = i18n(cfg.locale)
    return (
      <div class={["cgc-backlinks", displayClass].filter(Boolean).join(" ")}>
        <h3 class="cgc-backlinks__heading">{strings.title}</h3>
        {/* Core's overflow list (`overflow`, `overflow-end`), as stock's and v4's: it scrolls in its
            own box, and the script fades its bottom out while there is more below. */}
        <ul class="cgc-backlinks__list overflow">
          {sources.length > 0 ? (
            sources.map((file) => {
              const marked = isPrivate(file)
              return (
                <li class="cgc-backlinks__item">
                  <a
                    class={
                      marked
                        ? "cgc-backlinks__link cgc-backlinks__link--private"
                        : "cgc-backlinks__link"
                    }
                    href={resolveRelative(slug as never, file.slug as never)}
                  >
                    {/* A private page's lock, or empty for a public page's bullet (the stylesheet). */}
                    <span
                      class="cgc-backlinks__mark"
                      dangerouslySetInnerHTML={marked ? { __html: privateMark } : undefined}
                    ></span>
                    <span class="cgc-backlinks__name">{file.frontmatter?.title}</span>
                  </a>
                </li>
              )
            })
          ) : (
            <li class="cgc-backlinks__empty">{strings.noBacklinksFound}</li>
          )}
          <li class="cgc-backlinks__end overflow-end"></li>
        </ul>
      </div>
    )
  }

  Backlinks.afterDOMLoaded = overflow
  return Backlinks
}) satisfies QuartzComponentConstructor<BacklinksOptions>
