import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { pathToRoot } from "@quartz-community/utils/path"
import { createIcons, type Icons } from "@chaoticgoodcomputing/icons"
import script from "inline:./explorer.inline.ts"
import { i18n } from "../i18n"
import { lazySettings, type Settings, type TagExplorerOptions } from "../options"
import { PAGES_INDEX, treeOf, type PageData, type TagNode } from "../tree"

interface Corpus {
  tree: TagNode[]
  /** Each tag's icon, drawn, for every tag in the tree that has one. */
  icons: Map<string, string>
  /** The lock that marks a private page. */
  lock: string
}

// Built once per build: every page is rendered with the same `allFiles`. Every tag's icon is drawn
// here, so an icon id no collection has fails the build on the first page, whichever pages show it.
function corpusOf(
  allFiles: PageData[],
  settings: Settings,
  icons: Icons,
  corpora: WeakMap<object, Corpus>,
): Corpus {
  let corpus = corpora.get(allFiles)
  if (!corpus) {
    const tree = treeOf(allFiles, settings)
    const drawn = new Map<string, string>()
    const draw = (nodes: TagNode[]) => {
      for (const { tag, properties, children } of nodes) {
        if (properties.icon !== null) {
          try {
            drawn.set(tag, icons.svg(properties.icon, { class: "cgc-tag-explorer__icon" }))
          } catch (err) {
            throw new Error(`cgc-tag-explorer: tag "${tag}": ${(err as Error).message}`)
          }
        }
        draw(children)
      }
    }
    draw(tree)
    corpus = {
      tree,
      icons: drawn,
      lock: icons.svg("mdi:lock", { class: "cgc-tag-explorer__lock-icon" }),
    }
    corpora.set(allFiles, corpus)
  }
  return corpus
}

// The way back to the site's root from the page being rendered, with no trailing slash, which every
// link the explorer writes, and its script fills in, starts from. Relative, as Quartz's own links
// are, except from the 404 page: that is served at whatever depth the missing address has, so its
// links start from the site's base path, as core's head takes it (cgc-post-listing does the same).
function rootFrom(slug: string, baseUrl: string | undefined): string {
  if (slug !== "404") return pathToRoot(slug as never)
  return new URL(`https://${baseUrl ?? "example.com"}`).pathname.replace(/\/$/, "")
}

// Two marks drawn in the page rather than taken from an icon set, each in `currentColor`: the
// drawer's toggle, v4's caret, and its close button. A fold's chevron is the stylesheet's, since
// every tag has one.
const Caret = () => (
  <svg
    class="cgc-tag-explorer__toggle-icon"
    aria-hidden="true"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const Cross = () => (
  <svg
    class="cgc-tag-explorer__close-icon"
    aria-hidden="true"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
  >
    <line x1="6" x2="18" y1="6" y2="18" />
    <line x1="18" x2="6" y1="6" y2="18" />
  </svg>
)

let instances = 0

export default ((userOpts?: TagExplorerOptions) => {
  const settings = lazySettings(userOpts)
  const corpora = new WeakMap<object, Corpus>()
  let icons: Icons | undefined
  const id = `cgc-tag-explorer-${instances++}`

  const TagExplorer: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const s = settings()
    icons ??= createIcons({ iconCollections: s.iconCollections })
    const corpus = corpusOf(allFiles, s, icons, corpora)
    const slug = fileData.slug as string
    const strings = i18n(cfg?.locale)
    const title = s.title ?? strings.title
    const root = rootFrom(slug, cfg?.baseUrl)
    const open = s.defaultState === "open"

    const Tag = ({ node }: { node: TagNode }) => {
      const icon = corpus.icons.get(node.tag)
      const name = node.tag.split("/").pop()
      const href = `${root}/tags/${node.tag}`
      return (
        <li class="cgc-tag-explorer__tag" data-tag={node.tag}>
          <div class="cgc-tag-explorer__row">
            <button
              type="button"
              class={["cgc-tag-explorer__fold", open && "cgc-tag-explorer__fold--open"]
                .filter(Boolean)
                .join(" ")}
              aria-expanded={open ? "true" : "false"}
              aria-label={strings.fold(node.tag)}
            ></button>
            <a
              class="cgc-tag-explorer__link"
              href={href}
              aria-current={slug === `tags/${node.tag}` ? "page" : undefined}
            >
              {/* The tag colour paints the tag's mark, its icon or a dot, and never text (ADR-0003). */}
              <span
                class={[
                  "cgc-tag-explorer__mark",
                  icon === undefined && "cgc-tag-explorer__mark--dot",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ color: `var(${node.properties.color})` }}
                dangerouslySetInnerHTML={icon === undefined ? undefined : { __html: icon }}
              ></span>
              <span class="cgc-tag-explorer__name">{name}</span>
              {s.showCount && <span class="cgc-tag-explorer__count">({node.count})</span>}
            </a>
          </div>
          <div
            class={["cgc-tag-explorer__children", open && "cgc-tag-explorer__children--open"]
              .filter(Boolean)
              .join(" ")}
          >
            <ul class="cgc-tag-explorer__list">
              {node.children.map((child) => (
                <Tag node={child} />
              ))}
            </ul>
          </div>
        </li>
      )
    }

    return (
      <div
        class={["cgc-tag-explorer", displayClass].filter(Boolean).join(" ")}
        data-root={root}
        data-index={`${root}/${PAGES_INDEX}`}
        data-saved-state={String(s.useSavedState)}
      >
        <h3 class="cgc-tag-explorer__title">{title}</h3>
        <button
          type="button"
          class="cgc-tag-explorer__toggle"
          aria-controls={id}
          aria-expanded="false"
          aria-label={title}
        >
          <Caret />
        </button>
        <div class="cgc-tag-explorer__backdrop"></div>
        <nav class="cgc-tag-explorer__panel" id={id} aria-label={title}>
          {/* The drawer's own heading and close button, shown only when the explorer is a drawer. */}
          <div class="cgc-tag-explorer__bar">
            <span class="cgc-tag-explorer__bar-title" aria-hidden="true">
              {title}
            </span>
            <button type="button" class="cgc-tag-explorer__close" aria-label={strings.close}>
              <Cross />
            </button>
          </div>
          <ul class="cgc-tag-explorer__tree">
            {corpus.tree.map((node) => (
              <Tag node={node} />
            ))}
          </ul>
        </nav>
        {/* What the script fills a tag's pages in with: a page, and the lock a private one gets. */}
        <template class="cgc-tag-explorer__templates">
          <li class="cgc-tag-explorer__page">
            <a class="cgc-tag-explorer__page-link">
              <span class="cgc-tag-explorer__bullet"></span>
              <span class="cgc-tag-explorer__page-title"></span>
            </a>
          </li>
          <span
            class="cgc-tag-explorer__lock"
            dangerouslySetInnerHTML={{ __html: corpus.lock }}
          ></span>
        </template>
      </div>
    )
  }

  TagExplorer.afterDOMLoaded = script
  return TagExplorer
}) satisfies QuartzComponentConstructor<TagExplorerOptions>
