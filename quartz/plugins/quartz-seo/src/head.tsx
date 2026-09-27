// A page's head metadata, ported from the v4 `Head` fork at parity (FORK-LEDGER, `Head.tsx` rows):
// the canonical URL, `article:*` OpenGraph meta and a JSON-LD article. The one deliberate change is
// `noindex` without v4's `nofollow` on private pages (#28).
import { isAbsoluteURL, joinSegments, simplifySlug, slugTag } from "@quartz-community/utils/path"
import { unescapeHTML } from "@quartz-community/utils/escape"
import type { Options } from "./options"
import { toDate, type PageData } from "./page"

interface Author {
  type: string
  name: string
  url?: string
}

export interface Site {
  baseUrl?: string
  pageTitle?: string
  locale?: string
  /** Whether stock `og-image` generates a card per page, which the JSON-LD image then points at. */
  ogImages: boolean
}

// An author option, `defaultAuthor` or `publisher`: a name, or `{ name, url, type }`, of `type` unless
// it says otherwise.
function authorOf(value: unknown, type: string): Author | undefined {
  if (typeof value === "string") return value.trim() ? { type, name: value.trim() } : undefined
  if (value && typeof value === "object" && typeof (value as Author).name === "string") {
    const { name, url, type: own } = value as Partial<Author>
    return { type: own ?? type, name: name!, ...(url && { url }) }
  }
  return undefined
}

const person = ({ type, name, url }: Author) => ({ "@type": type, name, ...(url && { url }) })

// `</script>` inside a string must not end the script element, so every `<` is written as its JSON
// unicode escape, which parses back to the same value.
const scriptSafe = (value: unknown) => JSON.stringify(value).replaceAll("<", "\\u003c")

/** The tests the plugin builds once from its options, which the head shares with the sitemap and feed. */
export interface PageTests {
  /** Whether a page asks not to be indexed (`noindexTest()`). */
  isNoindex: (page: PageData) => boolean
  /** Whether a page is an article (`articleTest()`). */
  isArticle: (page: PageData) => boolean
}

/** The `additionalHead` entry: one page's head metadata, from its data. */
export function headFor(site: Site, opts: Options, { isNoindex, isArticle }: PageTests) {
  const types = (opts.articleTypes ?? []).map((mapping) => ({ ...mapping, tag: slugTag(mapping.tag) }))
  const siteAuthor = authorOf(opts.defaultAuthor, "Person") ?? { type: "Organization", name: site.pageTitle ?? "" }

  // Everything below needs absolute URLs, so a site without a baseUrl gets `noindex` alone.
  if (!site.baseUrl) return (page: PageData) => (isNoindex(page) ? <meta name="robots" content="noindex" /> : null)

  const origin = `https://${site.baseUrl}`
  const siteUrl = new URL(origin).toString()
  const absolute = (url: string) => (isAbsoluteURL(url) ? url : joinSegments(siteUrl, url))

  const publisher = authorOf(opts.publisher, "Organization") ?? siteAuthor
  const publisherLd = {
    ...person(publisher),
    ...(publisher.type === "Organization" && {
      logo: {
        "@type": "ImageObject",
        url: absolute(opts.publisher?.logo?.url ?? "static/icon.png"),
        ...(opts.publisher?.logo?.width && { width: opts.publisher.logo.width }),
        ...(opts.publisher?.logo?.height && { height: opts.publisher.logo.height }),
      },
    }),
  }

  // As stock `og-image` names its cards, so the JSON-LD image is the page's own OG image.
  const imageOf = (page: PageData) => {
    const own = page.frontmatter?.socialImage
    if (own) return isAbsoluteURL(own) ? own : `${origin}/static/${own}`
    return site.ogImages ? `${origin}/${page.slug}-og-image.webp` : `${origin}/static/og-image.png`
  }

  return (page: PageData) => {
    const fm = page.frontmatter ?? {}
    const tags = fm.tags ?? []
    const url = page.slug === "404" ? siteUrl : joinSegments(siteUrl, simplifySlug(page.slug ?? ""))
    const article = isArticle(page)
    // The **page author** (CONTEXT.md): the name a page gives as its own `author`, as #57 asks.
    const own = typeof fm.author === "string" ? authorOf(fm.author, "Person") : undefined
    const author = own ?? siteAuthor
    const published = toDate(page.dates?.published)?.toISOString()
    const modified = toDate(page.dates?.modified)?.toISOString()
    const description = fm.socialDescription ?? fm.description ?? unescapeHTML(page.description?.trim() ?? "")
    const mapped = types.find((mapping) => tags.includes(mapping.tag))

    return (
      <>
        {isNoindex(page) && <meta name="robots" content="noindex" />}
        <link rel="canonical" href={url} />
        {article && (
          <>
            {published && <meta property="article:published_time" content={published} />}
            {modified && <meta property="article:modified_time" content={modified} />}
            <meta property="article:author" content={author.url ?? author.name} />
            {tags.length > 0 && (
              <>
                <meta property="article:section" content={tags[0].split("/")[0]} />
                {tags.map((tag) => (
                  <meta property="article:tag" content={tag.split("/").pop()} />
                ))}
              </>
            )}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: scriptSafe({
                  "@context": "https://schema.org",
                  "@type": mapped?.type ?? opts.defaultArticleType ?? "Article",
                  headline: fm.title,
                  url,
                  image: imageOf(page),
                  inLanguage: site.locale,
                  mainEntityOfPage: { "@type": "WebPage", "@id": url },
                  author: person(author),
                  publisher: publisherLd,
                  ...(description && { description }),
                  ...(published && { datePublished: published }),
                  ...(modified && { dateModified: modified }),
                  ...(mapped?.section && { articleSection: mapped.section }),
                  ...(tags.length > 0 && { keywords: tags.join(", ") }),
                }),
              }}
            />
          </>
        )}
      </>
    )
  }
}
