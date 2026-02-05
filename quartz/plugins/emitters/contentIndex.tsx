import { Root } from "hast"
import { GlobalConfiguration } from "../../cfg"
import { getDate } from "../../components/Date"
import { escapeHTML } from "../../util/escape"
import { FilePath, FullSlug, SimpleSlug, joinSegments, simplifySlug, getAllSegmentPrefixes } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { toHtml } from "hast-util-to-html"
import { write } from "./helpers"
import { i18n } from "../../i18n"
import readingTime from "reading-time"

export type ContentIndexMap = Map<FullSlug, ContentDetails>
export type ContentDetails = {
  slug: FullSlug
  filePath: FilePath
  title: string
  links: SimpleSlug[]
  tags: string[]
  content: string
  richContent?: string
  date?: string  // ISO date string
  description?: string
  hasExplicitDescription?: boolean  // Whether description was explicitly set in frontmatter
}

interface Options {
  enableSiteMap: boolean
  enableRSS: boolean
  rssLimit?: number
  rssFullHtml: boolean
  rssSlug: string
  includeEmptyFiles: boolean
}

const defaultOptions: Options = {
  enableSiteMap: true,
  enableRSS: true,
  rssLimit: 10,
  rssFullHtml: false,
  rssSlug: "index",
  includeEmptyFiles: true,
}

function generateSiteMap(cfg: GlobalConfiguration, idx: ContentIndexMap, allTags: Set<string>): string {
  const base = cfg.baseUrl ?? ""
  const createURLEntry = (slug: SimpleSlug, date?: Date): string => `<url>
    <loc>https://${joinSegments(base, encodeURI(slug))}</loc>
    ${date ? `<lastmod>${date.toISOString()}</lastmod>` : ''}
  </url>`
  
  // Filter content pages - exclude private tagged content, similar to RSS feed
  const contentUrls = Array.from(idx)
    .filter(([slug, content]) => {
      // Exclude posts with "private" tag
      if (content.tags.some((tag) => tag.toLowerCase().includes("private"))) {
        return false
      }
      return true
    })
    .map(([slug, content]) => createURLEntry(simplifySlug(slug), content.date))
    .join("")
  
  // Add tag pages that aren't already in the content index
  // (some tag pages exist as actual files and are already included above)
  const existingTagSlugs = new Set(
    Array.from(idx.keys())
      .filter(slug => slug.startsWith("tags/"))
      .map(slug => slug.replace(/^tags\//, '').replace(/\/$/, ''))
  )
  
  const tagUrls = Array.from(allTags)
    .filter(tag => !existingTagSlugs.has(tag))
    .map((tag) => createURLEntry(`tags/${tag}` as SimpleSlug))
    .join("")
  
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${contentUrls}${tagUrls}</urlset>`
}

function generateRSSFeed(cfg: GlobalConfiguration, idx: ContentIndexMap, limit?: number): string {
  const base = cfg.baseUrl ?? ""

  const createURLEntry = (slug: SimpleSlug, content: ContentDetails): string => {
    // Calculate reading time
    const { minutes } = readingTime(content.content)
    const readingTimeText = `${Math.ceil(minutes)} min read`

    // Include full tag paths as categories
    const categories = content.tags
      .map(tag => `    <category>${escapeHTML(tag)}</category>`)
      .join('\n')

    // Build description with reading time appended
    let baseDescription = content.richContent
      ? content.richContent
      : (content.hasExplicitDescription ? content.description : '')

    // Append reading time to description
    const descriptionWithTime = baseDescription
      ? `${baseDescription} (${readingTimeText})`
      : `(${readingTimeText})`

    return `<item>
    <title>${escapeHTML(content.title)}</title>
    <link>https://${joinSegments(base, encodeURI(slug))}</link>
    <guid>https://${joinSegments(base, encodeURI(slug))}</guid>
    <description><![CDATA[ ${descriptionWithTime} ]]></description>
    <pubDate>${content.date?.toUTCString()}</pubDate>
${categories}
  </item>`
  }

  const items = Array.from(idx)
    .filter(([slug, content]) => {
      // Only include content pages (paths starting with "content/")
      if (!slug.startsWith("content/")) {
        return false
      }
      // Exclude posts with "private" tag
      if (content.tags.some((tag) => tag.toLowerCase().includes("private"))) {
        return false
      }
      return true
    })
    .sort(([_, f1], [__, f2]) => {
      if (f1.date && f2.date) {
        return f2.date.getTime() - f1.date.getTime()
      } else if (f1.date && !f2.date) {
        return -1
      } else if (!f1.date && f2.date) {
        return 1
      }

      return f1.title.localeCompare(f2.title)
    })
    .map(([slug, content]) => createURLEntry(simplifySlug(slug), content))
    .slice(0, limit ?? idx.size)
    .join("")

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
      <title>${escapeHTML(cfg.pageTitle)}</title>
      <link>https://${base}</link>
      <description>${!!limit ? i18n(cfg.locale).pages.rss.lastFewNotes({ count: limit }) : i18n(cfg.locale).pages.rss.recentNotes} on ${escapeHTML(
    cfg.pageTitle,
  )}</description>
      <generator>Quartz -- quartz.jzhao.xyz</generator>
      ${items}
    </channel>
  </rss>`
}

export const ContentIndex: QuartzEmitterPlugin<Partial<Options>> = (opts) => {
  opts = { ...defaultOptions, ...opts }
  return {
    name: "ContentIndex",
    async *emit(ctx, content) {
      const cfg = ctx.cfg.configuration
      const linkIndex: ContentIndexMap = new Map()
      for (const [tree, file] of content) {
        const slug = file.data.slug!
        const date = getDate(ctx.cfg.configuration, file.data) ?? new Date()
        if (opts?.includeEmptyFiles || (file.data.text && file.data.text !== "")) {
          linkIndex.set(slug, {
            slug,
            filePath: file.data.relativePath!,
            title: file.data.frontmatter?.title!,
            links: file.data.links ?? [],
            tags: file.data.frontmatter?.tags ?? [],
            content: file.data.text ?? "",
            richContent: opts?.rssFullHtml
              ? escapeHTML(toHtml(tree as Root, { allowDangerousHtml: true }))
              : undefined,
            date: date,
            description: file.data.description ?? "",
            hasExplicitDescription: !!file.data.frontmatter?.description,
          })
        }
      }

      if (opts?.enableSiteMap) {
        // Compute all tags from the content, similar to tag page generation
        const allTags: Set<string> = new Set(
          Array.from(linkIndex.values())
            .filter(content => {
              // Exclude private tagged content from tag computation
              return !content.tags.some((tag) => tag.toLowerCase().includes("private"))
            })
            .flatMap((content) => content.tags)
            .flatMap(getAllSegmentPrefixes)
        )
        // Add base tag
        allTags.add("index")
        
        yield write({
          ctx,
          content: generateSiteMap(cfg, linkIndex, allTags),
          slug: "sitemap" as FullSlug,
          ext: ".xml",
        })
      }

      if (opts?.enableRSS) {
        yield write({
          ctx,
          content: generateRSSFeed(cfg, linkIndex, opts.rssLimit),
          slug: (opts?.rssSlug ?? "index") as FullSlug,
          ext: ".xml",
        })
      }

      const fp = joinSegments("static", "contentIndex") as FullSlug
      const simplifiedIndex = Object.fromEntries(
        Array.from(linkIndex).map(([slug, content]) => {
          // remove description from content index as nothing downstream
          // actually uses it. we only keep it in the index as we need it
          // for the RSS feed. Convert date to ISO string for JSON serialization.
          delete content.description
          return [slug, { ...content, date: content.date?.toISOString() }]
        }),
      )

      yield write({
        ctx,
        content: JSON.stringify(simplifiedIndex),
        slug: fp,
        ext: ".json",
      })
    },
    externalResources: (ctx) => {
      if (opts?.enableRSS) {
        return {
          additionalHead: [
            <link
              rel="alternate"
              type="application/rss+xml"
              title="RSS Feed"
              href={`https://${ctx.cfg.configuration.baseUrl}/index.xml`}
            />,
          ],
        }
      }
    },
  }
}
