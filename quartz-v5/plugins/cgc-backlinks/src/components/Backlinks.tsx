import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative, simplifySlug, slugTag } from "@quartz-community/utils/path"
import { createIcons } from "@chaoticgoodcomputing/icons"
import { normaliseTag, privatePageTest } from "@chaoticgoodcomputing/tags-core"
import { i18n } from "../i18n"
import overflow from "./overflow.inline.js" with { type: "text" }

export interface BacklinksOptions {
  /**
   * The private tags: a **private page** (tags-core) carries one of them, or a descendant of one
   * (`private/work` under `private`), and its backlink is a private backlink. A tag that only starts
   * with one (`privateer`) is not a descendant. Default: `["private"]`, as cgc-seo's `noindexTags`.
   */
  privateTags?: string[]
  /** Leave the section out of a page no page links to, as stock does. Default: true. */
  hideWhenEmpty?: boolean
}

// Quartz merges no defaults into a component's options, so the component does.
const DEFAULTS: Required<BacklinksOptions> = {
  privateTags: ["private"],
  hideWhenEmpty: true,
}

type PageData = QuartzComponentProps["fileData"]

// When a page was last changed, as v4 sorted by it: its modified date, else its published date.
// Quartz's dates are Dates; a page with neither sorts as the oldest.
const changed = (page: PageData) => {
  const time = new Date((page.dates?.modified ?? page.dates?.published ?? 0) as Date).getTime()
  return Number.isNaN(time) ? 0 : time
}

export default ((userOpts?: BacklinksOptions) => {
  const opts = { ...DEFAULTS, ...userOpts }
  // Whether a page is a private page, by tags-core's rule, from its frontmatter tags: the plugin reads
  // no engine. The private tags and the page's tags are both normalised as the engine normalises them.
  const normalise = (tag: string) => normaliseTag(tag, slugTag)
  const isPrivatePage = privatePageTest(opts.privateTags.map(normalise))
  const isPrivate = (page: PageData) => isPrivatePage((page.frontmatter?.tags ?? []).map(normalise))
  // The private mark, v4's MDI lock, drawn once, on the first page rendered.
  const icons = createIcons()
  let lock: string | undefined
  const drawLock = () => (lock ??= icons.svg("mdi:lock", { class: "cgc-backlinks__icon" }))

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
