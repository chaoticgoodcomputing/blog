// `sitemap.xml`, in the shape of v4's sitemap fork (FORK-LEDGER, contentIndex.tsx sitemap row):
// every indexable page, and the page of every tag an indexable page carries, with the index of all
// tags. Each is listed once, at the path a crawler is given for it, and a page Quartz generates has
// no date. The decision is #28; the tag URL is #43's.
import { getAllSegmentPrefixes, joinSegments } from "@quartz-community/utils/path"
import { crawlPath, dateOf, tagOf, type PageData } from "./page"

/**
 * The sitemap of `pages` (every page the site builds, including those Quartz generates), for a
 * site at `baseUrl`. `indexable` says which pages may be listed at all.
 */
export function sitemapFor(baseUrl: string, pages: PageData[], indexable: (page: PageData) => boolean): string {
  const listed = pages.filter(indexable)
  // A generated tag listing is only worth indexing for a tag some indexable page carries: one that
  // only private pages carry is a list of stubs. The tag index lists every tag.
  const carried = new Set(listed.flatMap((page) => (page.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes)))
  carried.add("index")

  const seen = new Set<string>()
  const entries: string[] = []
  for (const page of listed) {
    const tag = tagOf(page)
    if (tag !== undefined && page.filePath === undefined && !carried.has(tag)) continue
    const path = crawlPath(page.slug!)
    if (seen.has(path)) continue
    seen.add(path)
    const date = dateOf(page)
    entries.push(`<url>
    <loc>https://${joinSegments(baseUrl, encodeURI(path))}</loc>
    ${date ? `<lastmod>${date.toISOString()}</lastmod>` : ""}
  </url>`)
  }
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join("")}</urlset>`
}
