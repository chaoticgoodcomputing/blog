// The annotation page's frame, `cgc-annotation` (docs/adr/0004): the page as it reads at every
// width, the document first. Quartz's loader imports this module from the package's `./frames` and
// registers each frame the manifest's `quartz.frames` names under the frame's own `name`.
//
// From top to bottom: the bar, fixed (☰, the title, zoom, the annotations' toggle); the top
// section (`beforeBody`, where the document comes from, the preface); the page body (the Viewer and
// the annotations); the bottom section (the epilogue, `right`, `afterBody`); then `footer`.
// `header` and `left` go in the ☰ drawer, from the left.
//
// This is the page before any script runs, and for good where there's no document to show: the
// annotations are the page. The page's script (./script.inline) works the bar and the ☰ drawer; the
// Viewer switches the page to the document's layout once it has opened the mirror.
import { h, type ComponentChildren } from "preact"
import { toHtml } from "hast-util-to-html"
import { annotationTarget, sourceUrl, Unmirrorable } from "../mirror"
import { hasContent, split } from "../sections"
import type { AnnotatorData } from "../transformer"
import { DEFAULT_WIDTHS, widthProperties } from "../widths"

// The little of Quartz's frame contract this frame reads (core's `components/frames/types.ts`).
type Component = (props: any) => unknown
interface ComponentData {
  fileData: { slug?: string; frontmatter?: Record<string, unknown>; cgcAnnotator?: AnnotatorData }
  cfg: { pageTitle?: string }
  tree?: Parameters<typeof split>[0]
}
interface FrameProps {
  componentData: ComponentData
  header: Component[]
  beforeBody: Component[]
  pageBody: Component
  afterBody: Component[]
  left: Component[]
  right: Component[]
  footer: Component[]
}

const FRAME = "cgc-annotator-frame"
/** The ☰ drawer's id, which its button controls. */
const MENU = `${FRAME}-menu`
/** The annotations' id, which the bar's toggle controls: the page body's list. */
export const ANNOTATIONS = "cgc-annotator-annotations"

// Each of a slot's components, with the page's data.
const draw = (components: Component[], props: ComponentData) =>
  components.map((component) => h(component as any, props as any))

// The site's root, relative to a page: Quartz's `pathToRoot`.
const pathToRoot = (slug = "") =>
  slug
    .split("/")
    .filter((part) => part !== "")
    .slice(0, -1)
    .map(() => "..")
    .join("/") || "."

// Prose the site's pipeline rendered, as it stands in the page's tree.
const prose = (nodes: ReturnType<typeof split>["preface"], part: string) =>
  hasContent(nodes) && (
    <article
      class={`${FRAME}__${part}`}
      dangerouslySetInnerHTML={{
        __html: toHtml({ type: "root", children: nodes } as any, { allowDangerousHtml: true }),
      }}
    />
  )

const MenuIcon = () => (
  <svg class={`${FRAME}__icon`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg class={`${FRAME}__icon`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

const NotesIcon = () => (
  <svg class={`${FRAME}__icon`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 5h14v10H10l-5 4z" />
  </svg>
)

function SourceLine({ target }: { target: string }) {
  const url = sourceUrl(target)
  const linkable = !(url instanceof Unmirrorable)
  // Where to read along, for a reader whose Viewer never loads. With script, the Viewer says it
  // itself when it can't show the document.
  const readAlong = linkable && (
    <noscript>
      <p class={`${FRAME}__read-along`}>
        You can read along at{" "}
        <a
          class={`${FRAME}__read-along-link`}
          href={url.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {url.href}
        </a>
        .
      </p>
    </noscript>
  )
  return (
    <>
      <p class={`${FRAME}__source`}>
        Source document:{" "}
        {linkable ? (
          <a
            class={`${FRAME}__source-link`}
            href={url.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {url.hostname}
          </a>
        ) : (
          <span class={`${FRAME}__source-link`}>{target}</span>
        )}
      </p>
      {readAlong}
    </>
  )
}

function Bar({
  siteName,
  pageTitle,
  home,
  count,
}: {
  siteName: string
  pageTitle: string
  home: string
  count: number
}) {
  return (
    <header class={`${FRAME}__bar`}>
      <button
        class={`${FRAME}__button ${FRAME}__menu-button`}
        type="button"
        aria-controls={MENU}
        aria-expanded="false"
        aria-label="Menu"
      >
        <MenuIcon />
      </button>
      <a class={`${FRAME}__title`} href={home}>
        <span class={`${FRAME}__site-name`}>{siteName}</span>
        {/* Shown in place of the site name once the top section's title has scrolled away. */}
        <span class={`${FRAME}__page-title`} aria-hidden="true">
          {pageTitle}
        </span>
      </a>
      {/* The document's zoom: out of sight until there's a document. */}
      <div class={`${FRAME}__zoom`} role="group" aria-label="Zoom">
        <button class={`${FRAME}__button ${FRAME}__zoom-out`} type="button" aria-label="Zoom out">
          −
        </button>
        <button class={`${FRAME}__button ${FRAME}__zoom-level`} type="button" aria-label="Reset the zoom" title="Reset the zoom">
          100%
        </button>
        <button class={`${FRAME}__button ${FRAME}__zoom-in`} type="button" aria-label="Zoom in">
          +
        </button>
      </div>
      {/* Without script, a link to the annotations; the Viewer makes it a toggle. */}
      <a
        class={`${FRAME}__button ${FRAME}__toggle`}
        href={`#${ANNOTATIONS}`}
        aria-controls={ANNOTATIONS}
        aria-label={`Annotations (${count})`}
      >
        <NotesIcon />
        <span class={`${FRAME}__count`}>{count}</span>
      </a>
    </header>
  )
}

export const AnnotationFrame = {
  name: "cgc-annotation",
  render({
    componentData,
    header,
    beforeBody,
    pageBody,
    afterBody,
    left,
    right,
    footer,
  }: FrameProps) {
    const { fileData, cfg, tree } = componentData
    const data = fileData.cgcAnnotator
    const target = annotationTarget(fileData.frontmatter)
    const title =
      typeof fileData.frontmatter?.title === "string"
        ? fileData.frontmatter.title
        : (fileData.slug ?? "")
    const { preface, epilogue } = split(tree)
    const menu: ComponentChildren = [...draw(header, componentData), ...draw(left, componentData)]
    return (
      <div
        class={FRAME}
        data-layout="static"
        style={widthProperties(data?.widths ?? DEFAULT_WIDTHS)}
      >
        <Bar
          siteName={cfg.pageTitle ?? ""}
          pageTitle={title}
          home={pathToRoot(fileData.slug)}
          count={data?.annotations.length ?? 0}
        />
        {/* The ☰ drawer: never open by default. A host drawer, the family's `cgc-drawer` container
            (frame.css): a component that would be a drawer of its own on a narrow screen, as
            quartz-tag-explorer is, keeps its sidebar form in here. */}
        <div class={`${FRAME}__scrim`} data-for={MENU} />
        <nav class={`${FRAME}__menu`} id={MENU} aria-label="Menu" data-open="false">
          <button
            class={`${FRAME}__button ${FRAME}__menu-close`}
            type="button"
            aria-label="Close the menu"
          >
            <CloseIcon />
          </button>
          {menu}
        </nav>
        {/* \`center\` is core's name for a page's main column, which stock scripts look for (Obsidian-
            flavored markdown's Mermaid, for one); core styles it only to fill its column. */}
        <main class={`${FRAME}__main center`}>
          <div class={`${FRAME}__top popover-hint`}>
            {draw(beforeBody, componentData)}
            {target !== undefined && <SourceLine target={target} />}
            {prose(preface, "preface")}
          </div>
          {h(pageBody as any, componentData as any)}
          <div class={`${FRAME}__bottom`}>
            {prose(epilogue, "epilogue")}
            {draw(right, componentData)}
            {draw(afterBody, componentData)}
          </div>
        </main>
        {draw(footer, componentData)}
      </div>
    )
  },
}
