import { QuartzEmitterPlugin } from "../types"
import { ProcessedContent, QuartzPluginData, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import { FullSlug, getAllSegmentPrefixes, joinSegments } from "../../util/path"
import { tagsLayout } from "../../layouts/tags.layout"
import { i18n, TRANSLATIONS } from "../../i18n"
import { BuildCtx } from "../../util/ctx"
import { StaticResources } from "../../util/resources"
import { buildComponentList, buildLayout, renderAndWritePage } from "./pageHelpers"

interface TagPageOptions extends FullPageLayout {
  sort?: (f1: QuartzPluginData, f2: QuartzPluginData) => number
}

function computeTagInfo(
  allFiles: QuartzPluginData[],
  content: ProcessedContent[],
  locale: keyof typeof TRANSLATIONS,
): [Set<string>, Record<string, ProcessedContent>] {
  const tags: Set<string> = new Set(
    allFiles.flatMap((data) => data.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes),
  )

  // add base tag
  tags.add("index")

  const tagDescriptions: Record<string, ProcessedContent> = Object.fromEntries(
    [...tags].map((tag) => {
      const title =
        tag === "index"
          ? i18n(locale).pages.tagContent.tagIndex
          : `${i18n(locale).pages.tagContent.tag}: ${tag}`
      return [
        tag,
        defaultProcessedContent({
          slug: joinSegments("tags", tag) as FullSlug,
          frontmatter: { title, tags: [] },
        }),
      ]
    }),
  )

  // Update with actual content if available
  for (const [tree, file] of content) {
    const slug = file.data.slug!
    if (slug.startsWith("tags/")) {
      let tag = slug.slice("tags/".length)
      // Remove /index suffix if present
      if (tag.endsWith("/index")) {
        tag = tag.slice(0, -"/index".length)
      }
      console.log(`[tagPage] Found tag content file: ${slug}, normalized tag: ${tag}, tree children: ${tree.children.length}`)
      if (tags.has(tag)) {
        tagDescriptions[tag] = [tree, file]
        if (file.data.frontmatter?.title === tag) {
          file.data.frontmatter.title = `${i18n(locale).pages.tagContent.tag}: ${tag}`
        }
      }
    }
  }

  return [tags, tagDescriptions]
}

async function processTagPage(
  ctx: BuildCtx,
  tag: string,
  tagContent: ProcessedContent,
  allFiles: QuartzPluginData[],
  opts: FullPageLayout,
  resources: StaticResources,
) {
  const [tree, file] = tagContent
  console.log(`[processTagPage] Processing tag: ${tag}, tree children: ${tree.children.length}, slug: ${file.data.slug}`)
  return renderAndWritePage(ctx, tree, file.data, allFiles, opts, resources)
}

export const TagPage: QuartzEmitterPlugin<Partial<TagPageOptions>> = (userOpts) => {
  const opts = buildLayout(tagsLayout, userOpts)

  return {
    name: "TagPage",
    getQuartzComponents() {
      return buildComponentList(tagsLayout)
    },
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration
      const [tags, tagDescriptions] = computeTagInfo(allFiles, content, cfg.locale)

      for (const tag of tags) {
        yield processTagPage(ctx, tag, tagDescriptions[tag], allFiles, opts, resources)
      }
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      const allFiles = content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration

      // Find all tags that need to be updated based on changed files
      const affectedTags: Set<string> = new Set()
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue
        const slug = changeEvent.file.data.slug!

        // If it's a tag page itself that changed
        if (slug.startsWith("tags/")) {
          const tag = slug.slice("tags/".length)
          affectedTags.add(tag)
        }

        // If a file with tags changed, we need to update those tag pages
        const fileTags = changeEvent.file.data.frontmatter?.tags ?? []
        fileTags.flatMap(getAllSegmentPrefixes).forEach((tag) => affectedTags.add(tag))

        // Always update the index tag page if any file changes
        affectedTags.add("index")
      }

      // If there are affected tags, rebuild their pages
      if (affectedTags.size > 0) {
        // We still need to compute all tags because tag pages show all tags
        const [_tags, tagDescriptions] = computeTagInfo(allFiles, content, cfg.locale)

        for (const tag of affectedTags) {
          if (tagDescriptions[tag]) {
            yield processTagPage(ctx, tag, tagDescriptions[tag], allFiles, opts, resources)
          }
        }
      }
    },
  }
}
