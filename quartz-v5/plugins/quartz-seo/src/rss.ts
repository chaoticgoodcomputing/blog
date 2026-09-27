// The RSS feed, `index.xml`, in the shape of v4's feed fork (FORK-LEDGER, contentIndex.tsx RSS row):
// the newest indexable articles, each with its explicit description (never a derived one) followed by
// its reading time, and a `<category>` per tag. The decision is #28.
import { escapeHTML } from "@quartz-community/utils/escape"
import { joinSegments } from "@quartz-community/utils/path"
// The counter alone: the package's entry also loads a Node stream, which the bundle can't require.
import readingTime from "reading-time/lib/reading-time"
import { crawlPath, dateOf, type PageData } from "./page"

export interface Channel {
  baseUrl: string
  pageTitle?: string
  /** The most items the feed carries; none, or 0, for every article. */
  limit?: number
  /** The description of a feed with no limit, before ` on <pageTitle>`. */
  recentNotesText?: string
  /** The description of a feed with a limit: `{count}` is the limit. Or stock's function form. */
  lastFewNotesText?: string | ((count: number) => string)
}

/** What the channel says it carries, in the site's words: v4's (and stock's) English by default. */
function describe({ limit, recentNotesText = "Recent notes", lastFewNotesText = "Last {count} notes" }: Channel) {
  if (!limit) return recentNotesText
  return typeof lastFewNotesText === "function" ? lastFewNotesText(limit) : lastFewNotesText.replaceAll("{count}", String(limit))
}

// A description goes out as CDATA, which a literal `]]>` would end early.
const cdata = (text: string) => `<![CDATA[ ${text.replaceAll("]]>", "]]]]><![CDATA[>")} ]]>`

/**
 * The feed of `articles`, the site's indexable articles in the order Quartz read them. A page with no
 * date of its own is dated `now`, as v4 dated it.
 */
export function rssFor(channel: Channel, articles: PageData[], now = new Date()): string {
  const { baseUrl, pageTitle = "", limit } = channel
  const dated = articles.map((page) => ({ page, date: dateOf(page) ?? now }))
  // Newest first. A stable sort, so same-date articles keep Quartz's order, as in v4.
  dated.sort((a, b) => b.date.getTime() - a.date.getTime())

  const items = dated.slice(0, limit || dated.length).map(({ page, date }) => {
    const url = `https://${joinSegments(baseUrl, encodeURI(crawlPath(page.slug!)))}`
    const time = `${Math.ceil(readingTime(page.text ?? "").minutes)} min read`
    // Only a description the page gives itself: a derived one is the page's first lines.
    const own = page.frontmatter?.description ? page.description : ""
    const categories = (page.frontmatter?.tags ?? []).map((tag) => `    <category>${escapeHTML(tag)}</category>`).join("\n")
    return `<item>
    <title>${escapeHTML(page.frontmatter?.title ?? "")}</title>
    <link>${url}</link>
    <guid>${url}</guid>
    <description>${cdata(own ? `${own} (${time})` : `(${time})`)}</description>
    <pubDate>${date.toUTCString()}</pubDate>
${categories}
  </item>`
  })

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
      <title>${escapeHTML(pageTitle)}</title>
      <link>https://${baseUrl}</link>
      <description>${escapeHTML(describe(channel))} on ${escapeHTML(pageTitle)}</description>
      <generator>Quartz -- quartz.jzhao.xyz</generator>
      ${items.join("")}
    </channel>
  </rss>`
}
