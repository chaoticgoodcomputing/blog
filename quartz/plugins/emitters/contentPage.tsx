import path from "path"
import { QuartzEmitterPlugin } from "../types"
import { FullPageLayout } from "../../cfg"
import { indexLayout } from "../../layouts/index.layout"
import { notesLayout } from "../../layouts/notes.layout"
import { annotationsLayout } from "../../layouts/annotations.layout"
import { Content } from "../../components"
import { styleText } from "util"
import { StaticResources } from "../../util/resources"
import { buildComponentList, buildLayout, renderAndWritePage } from "./pageHelpers"

export const ContentPage: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {

  return {
    name: "ContentPage",
    getQuartzComponents() {
      return [...buildComponentList(indexLayout, notesLayout, annotationsLayout), Content()]
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
        // external content is referenced in the graph/index but lives off-site
        if (file.data.external) continue

        // Select layout based on slug and frontmatter
        let pageLayout
        if (slug === "index") {
          pageLayout = indexLayout
        } else if (file.data.frontmatter?.["annotation-target"]) {
          pageLayout = annotationsLayout
        } else {
          pageLayout = notesLayout
        }

        const opts = buildLayout(pageLayout, userOpts)
        yield renderAndWritePage(ctx, tree, file.data, allFiles, opts, resources)
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
        if (file.data.external) continue

        // Select layout based on slug and frontmatter
        let pageLayout
        if (slug === "index") {
          pageLayout = indexLayout
        } else if (file.data.frontmatter?.["annotation-target"]) {
          pageLayout = annotationsLayout
        } else {
          pageLayout = notesLayout
        }

        const opts = buildLayout(pageLayout, userOpts)
        yield renderAndWritePage(ctx, tree, file.data, allFiles, opts, resources)
      }
    },
  }
}
