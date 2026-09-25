import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils/path"
import {
  colorPropertyOf,
  parentOf,
  type TagProperties,
  type TagsData,
} from "@chaoticgoodcomputing/tags-core"
import { createIcons, type IconCollections, type Icons } from "@chaoticgoodcomputing/icons"
import longPress from "./longpress.inline.js" with { type: "text" }

export interface TagListOptions {
  /**
   * On a tag page, list the tag's subtags rather than the page's own tags, as v4's tag pages did.
   * Default: false.
   */
  showSubtags?: boolean
  /** On a tag page listing its subtags, list the tag's parent first. Default: false. */
  showParentTag?: boolean
  /** After each tag, the number of pages under it, its subtags' included. Default: true. */
  showCount?: boolean
  /**
   * The site's own icon collections, each prefix and its directory of SVG files, resolved against
   * the Quartz root: `{ custom: "../icons" }` draws `custom:d20` from `../icons/d20.svg`. Installed
   * Iconify sets, such as `mdi`, need no entry. Default: none.
   */
  iconCollections?: IconCollections
}

// Quartz merges no defaults into a component's options, so the component does. v4's defaults.
const DEFAULTS: Required<TagListOptions> = {
  showSubtags: false,
  showParentTag: false,
  showCount: true,
  iconCollections: {},
}

type PageData = QuartzComponentProps["fileData"]

interface Corpus {
  /** Every tag in the corpus, as the engine published it. */
  properties: Map<string, TagProperties>
  /** How many pages each tag is over. */
  counts: Map<string, number>
  /** Each tag's icon, drawn, for every tag in the corpus that has one. */
  icons: Map<string, string>
}

// The icon in a ring: its glyph, painted in the ring's `color`, which is the tag colour.
const ICON = { class: "cgc-tag-list__icon" }

// Built once per build: every page is rendered with the same `allFiles`. Every tag's icon is drawn
// here, so an icon id no collection has fails the build on the first page, whichever pages show it.
function corpusOf(allFiles: PageData[], icons: Icons, corpora: WeakMap<object, Corpus>): Corpus {
  let corpus = corpora.get(allFiles)
  if (!corpus) {
    corpus = { properties: new Map(), counts: new Map(), icons: new Map() }
    for (const file of allFiles) {
      const data = file.cgcTags as TagsData | undefined
      for (const [tag, properties] of Object.entries(data?.ancestors ?? {})) {
        corpus.properties.set(tag, properties)
        corpus.counts.set(tag, (corpus.counts.get(tag) ?? 0) + 1)
      }
    }
    for (const [tag, { icon }] of corpus.properties) {
      if (icon === null) continue
      try {
        corpus.icons.set(tag, icons.svg(icon, ICON))
      } catch (err) {
        throw new Error(`cgc-tag-list: tag "${tag}": ${(err as Error).message}`)
      }
    }
    corpora.set(allFiles, corpus)
  }
  return corpus
}

// The tag a tag page is for: `tags/<t>`, or `tags/<t>/index` for a description file in v4's layout.
// The index of every tag, `tags/index`, is for none.
function tagOfPage(slug: string | undefined): string | null {
  if (!slug?.startsWith("tags/")) return null
  const tag = slug.slice("tags/".length).replace(/\/?index$/, "")
  return tag || null
}

export default ((userOpts?: TagListOptions) => {
  const opts = { ...DEFAULTS, ...userOpts }
  const icons = createIcons({ iconCollections: opts.iconCollections })
  const corpora = new WeakMap<object, Corpus>()

  const TagList: QuartzComponent = ({ fileData, allFiles, displayClass }: QuartzComponentProps) => {
    const slug = fileData.slug as string
    const corpus = corpusOf(allFiles, icons, corpora)
    const own = (fileData.cgcTags as TagsData | undefined)?.tags ?? {}

    let tags: string[] = Object.keys(own)
    const tagPage = opts.showSubtags ? tagOfPage(slug) : null
    if (tagPage !== null) {
      const parent = parentOf(tagPage)
      const subtags = [...corpus.properties.keys()]
        .filter((tag) => parentOf(tag) === tagPage)
        .sort()
      tags = [...(opts.showParentTag && parent !== null ? [parent] : []), ...subtags]
    }
    if (tags.length === 0) return null

    return (
      <ul class={["cgc-tag-list", displayClass].filter(Boolean).join(" ")}>
        {tags.map((tag) => {
          // The engine's property for the tag, which inherits from its ancestors through the cascade.
          const color = own[tag]?.color ?? corpus.properties.get(tag)?.color ?? colorPropertyOf(tag)
          const icon = corpus.icons.get(tag)
          return (
            <li class="cgc-tag-list__item" data-tag={tag}>
              {/* `internal`, so core gives the badge a popover like any link to a page of the site. */}
              <a
                class="internal cgc-tag-list__link"
                href={resolveRelative(slug as never, `tags/${tag}` as never)}
              >
                {/* The tag colour paints the ring and its icon, never text (docs/adr/0001). */}
                <span
                  class="cgc-tag-list__ring"
                  style={{ color: `var(${color})` }}
                  title={tag}
                  dangerouslySetInnerHTML={icon === undefined ? undefined : { __html: icon }}
                ></span>
                <span class="cgc-tag-list__name">{tag.split("/").pop()}</span>
                {opts.showCount && (
                  <span class="cgc-tag-list__count">({corpus.counts.get(tag) ?? 0})</span>
                )}
              </a>
            </li>
          )
        })}
      </ul>
    )
  }

  TagList.afterDOMLoaded = longPress
  return TagList
}) satisfies QuartzComponentConstructor<TagListOptions>
