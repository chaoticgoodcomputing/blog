// What a page's head tells search engines and link previews: its title, description and canonical
// address, whether it asks to be indexed, its Open Graph tags, and its JSON-LD. The head prints it
// (src/components/Seo.astro).

import { seo, site as siteConfig } from "../site.config.ts"
import type { ArticleType, SeoConfig } from "../site.config.types.ts"
import type { Note, UnpublishedNote } from "./notes.ts"
import { isIndexable, type PageProps } from "./page.ts"
import { shareCardUrl } from "./share-card.ts"
import { isUnderTag } from "./tags.ts"

/** What one page's head says about it. */
export interface PageHead {
  /** The page's title, with the site's suffix. */
  title: string
  /** The page's own description, else the site's. */
  description: string
  /** The page's own address, whole. */
  canonical: string
  /** Whether it is an indexable page. One that is not says `noindex`. */
  indexable: boolean
  /** The page as a link preview shows it: `og:*`. */
  openGraph: {
    type: "website" | "article"
    siteName: string
    /** As Open Graph writes a locale: `en_US`. */
    locale: string
    /** The page's own title: the site's name is `siteName`. */
    title: string
    description: string
    url: string
  }
  /** On an article's page, what Open Graph says of an article: `article:*`. */
  article?: {
    publishedTime: string
    modifiedTime: string
    /** The author's page. */
    author: string
    section?: string | undefined
    /** Its tags, as tag slugs. */
    tags: string[]
  }
  /** Its JSON-LD: an article's on an article's page, the website's on the home page, else none. */
  structuredData?: Record<string, unknown>
}

/** What the head is written against. */
export interface HeadContext {
  /** The site's address, which every address in the head is made whole against. */
  site: URL
  /** The whole address of the site's icon, as built: the publisher's logo. */
  logo: string
}

// The article types that are an Article in schema.org, which alone has an `articleSection`
// (https://schema.org/articleSection). A HowTo is a CreativeWork.
const ARTICLES: ReadonlySet<ArticleType> = new Set([
  "Article",
  "BlogPosting",
  "Report",
  "ScholarlyArticle",
  "TechArticle",
])

/** What a page's head says about it. */
export function headOf(page: PageProps, context: HeadContext): PageHead {
  const { site } = context
  const canonical = new URL(page.url, site).href
  const description = page.description ?? seo.description
  // A tag page shows its tag's description note, which is no article's page.
  const article = (page.kind === "note" || page.kind === "annotation") && page.note?.isArticle ? page.note : undefined
  const head = { title: page.title, description, canonical }

  return {
    title: `${page.title}${siteConfig.titleSuffix}`,
    description,
    canonical,
    indexable: isIndexable(page),
    openGraph: {
      type: article ? "article" : "website",
      siteName: siteConfig.title,
      locale: siteConfig.locale.replace("-", "_"),
      title: page.title,
      description,
      url: canonical,
    },
    ...(article && {
      article: {
        publishedTime: article.date.toISOString(),
        modifiedTime: article.modified.toISOString(),
        author: new URL(siteConfig.author.url, site).href,
        section: articleTypeOf(article.tags).section,
        tags: article.tags,
      },
      structuredData: articleData(article, head, context),
    }),
    ...(page.kind === "home" && { structuredData: websiteData(head, context) }),
  }
}

/**
 * An article's type and section, from its tags: the first of the site's rules whose tag one of them
 * is under, else the default type, with no section. A note under `engineering/ai` is under
 * `engineering`, as everywhere else on the site.
 */
export function articleTypeOf(tags: string[], config: SeoConfig = seo): { type: ArticleType; section?: string } {
  const rule = config.articleTypes.find((each) => tags.some((tag) => isUnderTag(tag, each.tag)))
  return rule ? { type: rule.type, section: rule.section } : { type: config.defaultArticleType }
}

type HeadText = Pick<PageHead, "title" | "description" | "canonical">

// The site's publisher, with its logo. The logo's size is left out: schema.org gives an image's
// `width` as a QuantitativeValue, not a number of pixels, and a search engine reads it from the image.
function publisher({ site, logo }: HeadContext) {
  return {
    "@type": "Organization",
    name: siteConfig.publisher.name,
    url: new URL(siteConfig.publisher.url, site).href,
    logo: { "@type": "ImageObject", url: logo },
  }
}

// An article's JSON-LD, of its article type.
function articleData(note: Note | UnpublishedNote, head: HeadText, context: HeadContext): Record<string, unknown> {
  const { type, section } = articleTypeOf(note.tags)
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    headline: head.title,
    url: head.canonical,
    mainEntityOfPage: head.canonical,
    description: head.description,
    inLanguage: siteConfig.locale,
    datePublished: note.date.toISOString(),
    dateModified: note.modified.toISOString(),
    author: { "@type": "Person", name: siteConfig.author.name, url: new URL(siteConfig.author.url, context.site).href },
    publisher: publisher(context),
    ...(section && ARTICLES.has(type) && { articleSection: section }),
    ...(note.tags.length > 0 && { keywords: note.tags }),
  }

  // Its image is the share card of its page, which is the note's own.
  const card = note.url === undefined ? undefined : shareCardUrl({ kind: "note", url: note.url, note })
  if (card !== undefined) data.image = new URL(card, context.site).href

  return data
}

// The home page's JSON-LD: the website.
function websiteData(head: HeadText, context: HeadContext): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.title,
    url: head.canonical,
    description: head.description,
    inLanguage: siteConfig.locale,
    publisher: publisher(context),
  }
}
