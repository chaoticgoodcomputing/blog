import { QuartzComponentProps } from "../../components/types"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout, PageLayout } from "../../cfg"
import { pathToRoot } from "../../util/path"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { StaticResources } from "../../util/resources"
import { QuartzPluginData } from "../vfile"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import MobileSidebarMenuConstructor from "../../components/MobileSidebarMenu"
import { sharedPageComponents } from "../../layouts/shared.layout"
import { Root } from "hast"

/**
 * Common infrastructure components used by all page emitters.
 * These are constructed once and reused across all pages.
 */
export const infrastructureComponents = {
  Header: HeaderConstructor(),
  Body: BodyConstructor(),
  MobileSidebarMenu: MobileSidebarMenuConstructor(),
}

/**
 * Builds the complete component list for getQuartzComponents().
 * Collects all components from layouts and infrastructure.
 */
export function buildComponentList(...layouts: PageLayout[]): any[] {
  const { head: Head, header, footer: Footer } = sharedPageComponents
  const { Header, Body, MobileSidebarMenu } = infrastructureComponents

  // Collect unique components from all provided layouts
  const layoutComponents = layouts.flatMap((layout) => [
    ...(layout.pageHeader || []),
    ...layout.beforeBody,
    ...(layout.body || []),
    ...layout.left,
    ...layout.right,
  ])

  return [Head, Header, Body, MobileSidebarMenu, ...header, ...layoutComponents, Footer]
}

/**
 * Renders a single page with the given layout and writes it to disk.
 * This is the common rendering logic used by all emitters.
 */
export async function renderAndWritePage(
  ctx: BuildCtx,
  tree: Root,
  fileData: QuartzPluginData,
  allFiles: QuartzPluginData[],
  layout: FullPageLayout,
  resources: StaticResources,
) {
  const slug = fileData.slug!
  const cfg = ctx.cfg.configuration
  const externalResources = pageResources(pathToRoot(slug), resources, fileData)
  
  const componentData: QuartzComponentProps = {
    ctx,
    fileData,
    externalResources,
    cfg,
    children: [],
    tree,
    allFiles,
  }

  const content = renderPage(cfg, slug, componentData, layout, externalResources)
  return write({
    ctx,
    content,
    slug,
    ext: ".html",
  })
}

/**
 * Builds a complete FullPageLayout by merging shared components with a page-specific layout.
 */
export function buildLayout(pageLayout: PageLayout, userOpts?: Partial<FullPageLayout>): FullPageLayout {
  return {
    ...sharedPageComponents,
    ...pageLayout,
    ...userOpts,
  }
}
