import { render } from "preact-render-to-string"
import { QuartzComponent, QuartzComponentProps } from "./types"
import HeaderConstructor from "./Header"
import BodyConstructor from "./Body"
import MobileSidebarMenuConstructor from "./MobileSidebarMenu"
import { JSResourceToScriptElement, StaticResources } from "../util/resources"
import { FullSlug, RelativeURL, joinSegments, normalizeHastElement } from "../util/path"
import { clone } from "../util/clone"
import { visit } from "unist-util-visit"
import { Root, Element, ElementContent } from "hast"
import { GlobalConfiguration } from "../cfg"
import { i18n } from "../i18n"
import { styleText } from "util"
import { QuartzPluginData } from "../plugins/vfile"

interface RenderComponents {
  head: QuartzComponent
  header: QuartzComponent[]
  beforeBody: QuartzComponent[]
  left: QuartzComponent[]
  right: QuartzComponent[]
  footer: QuartzComponent
  body?: QuartzComponent[]
  pageHeader?: QuartzComponent[]
}

const headerRegex = new RegExp(/h[1-6]/)

/**
 * Builds the complete resource set for a page, merging:
 * 1. Base resources (index.css, prescript.js, postscript.js)
 * 2. Static resources from plugins (via externalResources)
 * 3. Per-page resources from transformers (via fileData.pageResources)
 *
 * @param baseDir - Base directory for resolving relative paths
 * @param staticResources - Global static resources from plugins
 * @param fileData - Optional file data containing per-page resources
 */
export function pageResources(
  baseDir: FullSlug | RelativeURL,
  staticResources: StaticResources,
  fileData?: QuartzPluginData,
): StaticResources {
  const contentIndexScript = `const fetchData = fetch("/static/contentIndex.json").then(data => data.json())`
  const tagIndexScript = `const fetchTagData = fetch("/static/tagIndex.json").then(data => data.json())`

  // Extract per-page resources if available
  const pageJs = fileData?.pageResources?.js ?? []
  const pageCss = fileData?.pageResources?.css ?? []

  const resources: StaticResources = {
    css: [
      {
        content: "/index.css",
      },
      ...staticResources.css,
      // Per-page CSS comes after static resources
      ...pageCss,
    ],
    js: [
      {
        src: "/prescript.js",
        loadTime: "beforeDOMReady",
        contentType: "external",
      },
      {
        loadTime: "beforeDOMReady",
        contentType: "inline",
        spaPreserve: true,
        script: contentIndexScript,
      },
      {
        loadTime: "beforeDOMReady",
        contentType: "inline",
        spaPreserve: true,
        script: tagIndexScript,
      },
      ...staticResources.js,
    ],
    additionalHead: staticResources.additionalHead,
  }

  resources.js.push({
    src: "/postscript.js",
    loadTime: "afterDOMReady",
    moduleType: "module",
    contentType: "external",
  })

  // Per-page JS comes after postscript to ensure dependencies are loaded
  resources.js.push(...pageJs)

  return resources
}

function renderTranscludes(
  root: Root,
  cfg: GlobalConfiguration,
  slug: FullSlug,
  componentData: QuartzComponentProps,
  visited: Set<FullSlug>,
) {
  // process transcludes in componentData
  visit(root, "element", (node, _index, _parent) => {
    if (node.tagName === "blockquote") {
      const classNames = (node.properties?.className ?? []) as string[]
      if (classNames.includes("transclude")) {
        const inner = node.children[0] as Element
        const transcludeTarget = (inner.properties["data-slug"] ?? slug) as FullSlug
        if (visited.has(transcludeTarget)) {
          console.warn(
            styleText(
              "yellow",
              `Warning: Skipping circular transclusion: ${slug} -> ${transcludeTarget}`,
            ),
          )
          node.children = [
            {
              type: "element",
              tagName: "p",
              properties: { style: "color: var(--secondary);" },
              children: [
                {
                  type: "text",
                  value: `Circular transclusion detected: ${transcludeTarget}`,
                },
              ],
            },
          ]
          return
        }
        visited.add(transcludeTarget)

        const page = componentData.allFiles.find((f) => f.slug === transcludeTarget)
        if (!page) {
          return
        }

        let blockRef = node.properties.dataBlock as string | undefined
        if (blockRef?.startsWith("#^")) {
          // block transclude
          blockRef = blockRef.slice("#^".length)
          let blockNode = page.blocks?.[blockRef]
          if (blockNode) {
            if (blockNode.tagName === "li") {
              blockNode = {
                type: "element",
                tagName: "ul",
                properties: {},
                children: [blockNode],
              }
            }

            node.children = [
              normalizeHastElement(blockNode, slug, transcludeTarget),
              {
                type: "element",
                tagName: "a",
                properties: { href: inner.properties?.href, class: ["internal", "transclude-src"] },
                children: [
                  { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal },
                ],
              },
            ]
          }
        } else if (blockRef?.startsWith("#") && page.htmlAst) {
          // header transclude
          blockRef = blockRef.slice(1)
          let startIdx = undefined
          let startDepth = undefined
          let endIdx = undefined
          for (const [i, el] of page.htmlAst.children.entries()) {
            // skip non-headers
            if (!(el.type === "element" && el.tagName.match(headerRegex))) continue
            const depth = Number(el.tagName.substring(1))

            // lookin for our blockref
            if (startIdx === undefined || startDepth === undefined) {
              // skip until we find the blockref that matches
              if (el.properties?.id === blockRef) {
                startIdx = i
                startDepth = depth
              }
            } else if (depth <= startDepth) {
              // looking for new header that is same level or higher
              endIdx = i
              break
            }
          }

          if (startIdx === undefined) {
            return
          }

          node.children = [
            ...(page.htmlAst.children.slice(startIdx, endIdx) as ElementContent[]).map((child) =>
              normalizeHastElement(child as Element, slug, transcludeTarget),
            ),
            {
              type: "element",
              tagName: "a",
              properties: { href: inner.properties?.href, class: ["internal", "transclude-src"] },
              children: [
                { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal },
              ],
            },
          ]
        } else if (page.htmlAst) {
          // page transclude
          node.children = [
            {
              type: "element",
              tagName: "h1",
              properties: {},
              children: [
                {
                  type: "text",
                  value:
                    page.frontmatter?.title ??
                    i18n(cfg.locale).components.transcludes.transcludeOf({
                      targetSlug: page.slug!,
                    }),
                },
              ],
            },
            ...(page.htmlAst.children as ElementContent[]).map((child) =>
              normalizeHastElement(child as Element, slug, transcludeTarget),
            ),
            {
              type: "element",
              tagName: "a",
              properties: { href: inner.properties?.href, class: ["internal", "transclude-src"] },
              children: [
                { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal },
              ],
            },
          ]
        }
      }
    }
  })
}

export function renderPage(
  cfg: GlobalConfiguration,
  slug: FullSlug,
  componentData: QuartzComponentProps,
  components: RenderComponents,
  pageResources: StaticResources,
): string {
  // make a deep copy of the tree so we don't remove the transclusion references
  // for the file cached in contentMap in build.ts
  const root = clone(componentData.tree) as Root
  const visited = new Set<FullSlug>([slug])
  renderTranscludes(root, cfg, slug, componentData, visited)

  // set componentData.tree to the edited html that has transclusions rendered
  componentData.tree = root

  const {
    head: Head,
    header,
    beforeBody,
    left,
    right,
    footer: Footer,
  } = components

  // Extract body components from pageLayout (if provided in layout config)
  // @ts-ignore - body is optionally added to layout
  const bodyComponents = components.body ?? []
  const Header = HeaderConstructor()
  const Body = BodyConstructor()
  const MobileSidebarMenu = MobileSidebarMenuConstructor()

  // Check if sidebars are empty to enable full-width layout
  const hasLeftSidebar = left.length > 0
  const hasRightSidebar = right.length > 0
  const layoutClass = !hasLeftSidebar && !hasRightSidebar ? "full-width" :
    !hasLeftSidebar ? "no-left" :
      !hasRightSidebar ? "no-right" : ""

  const LeftComponent = hasLeftSidebar ? (
    <MobileSidebarMenu {...componentData}>
      <div class="left sidebar">
        {left.map((BodyComponent) => (
          <BodyComponent {...componentData} />
        ))}
      </div>
    </MobileSidebarMenu>
  ) : null

  const RightComponent = hasRightSidebar ? (
    <div class="right sidebar">
      {right.map((BodyComponent) => (
        <BodyComponent {...componentData} />
      ))}
    </div>
  ) : null

  const lang = componentData.fileData.frontmatter?.lang ?? cfg.locale?.split("-")[0] ?? "en"
  const direction = i18n(cfg.locale).direction ?? "ltr"

  // Check if there are page-level header components (for index page)
  // @ts-ignore - pageHeader is optionally added to RenderComponents
  const pageHeaderComponents = components.pageHeader ?? []
  const PageHeaderComponent = pageHeaderComponents.length > 0 ? (
    <div class="page-level-header">
      {pageHeaderComponents.map((HeaderComponent) => (
        <HeaderComponent {...componentData} />
      ))}
    </div>
  ) : null

  const doc = (
    <html lang={lang} dir={direction}>
      <Head {...componentData} />
      <body data-slug={slug} class={layoutClass}>
        <div id="quartz-root" class="page">
          <Body {...componentData}>
            {PageHeaderComponent}
            {LeftComponent}
            <div class="center">
              <div class="page-header">
                <Header {...componentData}>
                  {header.map((HeaderComponent) => (
                    <HeaderComponent {...componentData} />
                  ))}
                </Header>
                <div class="popover-hint">
                  {beforeBody.map((BodyComponent) => (
                    <BodyComponent {...componentData} />
                  ))}
                </div>
              </div>
              {bodyComponents.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
              {bodyComponents.length > 0 && <hr />}
            </div>
            {RightComponent}
            <Footer {...componentData} />
          </Body>
        </div>
        {/* afterDOMReady scripts go at the end of body, where micromorph can see them */}
        {pageResources.js
          .filter((resource) => resource.loadTime === "afterDOMReady")
          .map((res) => JSResourceToScriptElement(res))}
      </body>
    </html>
  )

  return "<!DOCTYPE html>\n" + render(doc)
}
