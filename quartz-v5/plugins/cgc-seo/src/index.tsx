// cgc-seo: what search engines and feed readers see of the site. Each page's head, through
// `additionalHead`'s per-page form: `noindex` on private pages, and the canonical URL, `article:*`
// meta and JSON-LD ported from the v4 `Head` fork. And the files crawlers read, ported from v4's
// `ContentIndex` fork: the sitemap and the RSS feed, which leave out every page that isn't
// indexable. The glossary is CONTEXT.md; the decision is #28.
//
// An emitter, so that Quartz collects its `externalResources` exactly once: core gathers them from
// transformers and emitters alike, and a plugin in both categories would add its head twice.
import fs from "node:fs/promises"
import path from "node:path"
import { joinSegments } from "@quartz-community/utils/path"
import { headFor } from "./head"
import type { Options } from "./options"
import { articleTest, isExternal, noindexTest, type PageData } from "./page"
import { rssFor } from "./rss"
import { sitemapFor } from "./sitemap"

export type { Options, AuthorOption } from "./options"

async function write(output: string, file: string, content: string) {
  const target = joinSegments(output, file)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, content)
  return target
}

export default function CgcSeo(opts?: Partial<Options>) {
  const options: Options = { noindexTags: ["private"], ...opts }
  const isNoindex = noindexTest(options.noindexTags)
  const isArticle = articleTest(options.articleFolders)
  // Whether a page may be listed at all: not a private page or a private tag page, not unlisted (which
  // keeps a page off every listing, these included) and not external. The sitemap narrows these to
  // the **indexable pages** (CONTEXT.md); the feed takes their articles, which are all indexable.
  const listable = (page: PageData) => page.unlisted !== true && !isNoindex(page) && !isExternal(page)
  const rss = options.enableRSS !== false

  // Every page the site builds, including those page types generate (tag listings): core hands
  // emitters after its page dispatcher the generated pages too.
  async function emit(ctx: any, content: [unknown, { data: PageData }][]) {
    const baseUrl: string | undefined = ctx.cfg.configuration.baseUrl
    // Both files are lists of absolute URLs, which need the site's address.
    if (!baseUrl) return []
    const pages = content.map(([, file]) => file.data)
    const written: string[] = []
    if (options.enableSiteMap !== false) written.push(await write(ctx.argv.output, "sitemap.xml", sitemapFor(baseUrl, pages, listable)))
    if (rss) {
      const channel = {
        baseUrl,
        pageTitle: ctx.cfg.configuration.pageTitle,
        limit: options.rssLimit ?? 10,
        recentNotesText: options.rssRecentNotesText,
        lastFewNotesText: options.rssLastFewNotesText,
      }
      const feed = rssFor(channel, pages.filter((page) => listable(page) && isArticle(page)))
      written.push(await write(ctx.argv.output, "index.xml", feed))
    }
    return written
  }

  return {
    name: "cgc-seo",
    externalResources(ctx: any) {
      const cfg = ctx.cfg.configuration
      const site = {
        baseUrl: cfg.baseUrl,
        pageTitle: cfg.pageTitle,
        locale: cfg.locale,
        ogImages: (ctx.cfg.plugins?.emitters ?? []).some((emitter: { name?: string }) => emitter.name === "CustomOgImages"),
      }
      // Every page links the feed, as v4's did, so a feed reader given any page finds it.
      const feedLink = rss && cfg.baseUrl && (
        <link rel="alternate" type="application/rss+xml" title="RSS Feed" href={`https://${joinSegments(cfg.baseUrl, "index.xml")}`} />
      )
      return { additionalHead: [headFor(site, options, { isNoindex, isArticle }), ...(feedLink ? [feedLink] : [])] }
    },
    emit,
    // Rebuilt whole on every change under `serve`, as stock content-index does: which pages are
    // listed depends on every page.
    partialEmit: emit,
  }
}
