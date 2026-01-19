import path from "path"
import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import MobileSidebarMenuConstructor from "../../components/MobileSidebarMenu"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot } from "../../util/path"
import { sharedPageComponents } from "../../layouts/shared.layout"
import { indexLayout } from "../../layouts/index.layout"
import { notesLayout } from "../../layouts/notes.layout"
import { annotationsLayout } from "../../layouts/annotations.layout"
import { Content } from "../../components"
import { styleText } from "util"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { Node } from "unist"
import { StaticResources } from "../../util/resources"
import { QuartzPluginData } from "../vfile"

async function processContent(
  ctx: BuildCtx,
  tree: Node,
  fileData: QuartzPluginData,
  allFiles: QuartzPluginData[],
  opts: FullPageLayout,
  resources: StaticResources,
) {
  const slug = fileData.slug!
  const cfg = ctx.cfg.configuration
  // Pass fileData to merge any per-page resources from transformers
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

  const content = renderPage(cfg, slug, componentData, opts, externalResources)
  return write({
    ctx,
    content,
    slug,
    ext: ".html",
  })
}

export const ContentPage: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const { head: Head, header, footer: Footer } = sharedPageComponents
  const Header = HeaderConstructor()
  const Body = BodyConstructor()
  const MobileSidebarMenu = MobileSidebarMenuConstructor()

  return {
    name: "ContentPage",
    getQuartzComponents() {
      // Collect all unique components from both layouts
      const indexComponents = [
        ...(indexLayout.pageHeader || []),
        ...indexLayout.beforeBody,
        ...(indexLayout.body || []),
        ...indexLayout.left,
        ...indexLayout.right,
        ...(indexLayout.afterBody || []),
      ]
      const notesComponents = [
        ...(notesLayout.pageHeader || []),
        ...notesLayout.beforeBody,
        ...(notesLayout.body || []),
        ...notesLayout.left,
        ...notesLayout.right,
        ...(notesLayout.afterBody || []),
      ]
      const annotationsComponents = [
        ...(annotationsLayout.pageHeader || []),
        ...annotationsLayout.beforeBody,
        ...(annotationsLayout.body || []),
        ...annotationsLayout.left,
        ...annotationsLayout.right,
        ...(annotationsLayout.afterBody || []),
      ]

      return [
        Head,
        Header,
        Body,
        MobileSidebarMenu,
        ...header,
        ...indexComponents,
        ...notesComponents,
        ...annotationsComponents,
        Content(),
        Footer,
      ]
    },
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data)
      let containsIndex = false

      for (const [tree, file] of content) {
        const slug = file.data.slug!
        if (slug === "index") {
          containsIndex = true
        }

        // only process home page, non-tag pages, and non-index pages
        if (slug.endsWith("/index") || slug.startsWith("tags/")) continue

        // Select layout based on slug and frontmatter
        let pageLayout
        if (slug === "index") {
          pageLayout = indexLayout
        } else if (file.data.frontmatter?.["annotation-target"]) {
          pageLayout = annotationsLayout
        } else {
          pageLayout = notesLayout
        }

        const opts: FullPageLayout = {
          ...sharedPageComponents,
          ...pageLayout,
          ...userOpts,
        }

        yield processContent(ctx, tree, file.data, allFiles, opts, resources)
      }

      if (!containsIndex) {
        console.log(
          styleText(
            "yellow",
            `\nWarning: you seem to be missing an \`index.md\` home page file at the root of your \`${ctx.argv.directory}\` folder (\`${path.join(ctx.argv.directory, "index.md")} does not exist\`). This may cause errors when deploying.`,
          ),
        )
      }
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      const allFiles = content.map((c) => c[1].data)

      // find all slugs that changed or were added
      const changedSlugs = new Set<string>()
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue
        if (changeEvent.type === "add" || changeEvent.type === "change") {
          changedSlugs.add(changeEvent.file.data.slug!)
        }
      }

      for (const [tree, file] of content) {
        const slug = file.data.slug!
        if (!changedSlugs.has(slug)) continue
        if (slug.endsWith("/index") || slug.startsWith("tags/")) continue

        // Select layout based on slug and frontmatter
        let pageLayout
        if (slug === "index") {
          pageLayout = indexLayout
        } else if (file.data.frontmatter?.["annotation-target"]) {
          pageLayout = annotationsLayout
        } else {
          pageLayout = notesLayout
        }

        const opts: FullPageLayout = {
          ...sharedPageComponents,
          ...pageLayout,
          ...userOpts,
        }

        yield processContent(ctx, tree, file.data, allFiles, opts, resources)
      }
    },
  }
}
