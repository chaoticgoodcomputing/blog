import { ValidDateType } from "./components/Date"
import { QuartzComponent } from "./components/types"
import { ValidLocale } from "./i18n"
import { PluginTypes } from "./plugins/types"
import { Theme } from "./util/theme"

export type Analytics =
  | null
  | {
      provider: "plausible"
      host?: string
    }
  | {
      provider: "google"
      tagId: string
    }
  | {
      provider: "umami"
      websiteId: string
      host?: string
    }
  | {
      provider: "goatcounter"
      websiteId: string
      host?: string
      scriptSrc?: string
    }
  | {
      provider: "posthog"
      apiKey: string
      host?: string
    }
  | {
      provider: "tinylytics"
      siteId: string
    }
  | {
      provider: "cabin"
      host?: string
    }
  | {
      provider: "clarity"
      projectId?: string
    }
  | {
      provider: "matomo"
      host: string
      siteId: string
    }
  | {
      provider: "vercel"
    }
  | {
      provider: "rybbit"
      siteId: string
      host?: string
    }

export interface TagColorConfig {
  tag: string
  color: string  // hex color
}

export interface TagIconConfig {
  tag: string
  icon: string  // "provider:icon-name" (e.g., "mdi:lock", "custom:roblox")
}

export interface TagConfiguration {
  /** 
   * Color assignments for tags. Child tags inherit parent colors if not specified.
   * Order matters: earlier entries take priority when matching.
   */
  colors?: TagColorConfig[]
  
  /**
   * Icon assignments for tags.
   * Order matters: earlier entries take priority when a post has multiple tagged icons.
   */
  icons?: TagIconConfig[]
  
  /** Default color for tags without explicit or inherited colors */
  defaultColor?: string
  
  /** Default icon for tags without explicit or inherited icons (usually null) */
  defaultIcon?: string | null
}

/**
 * Schema.org types for structured data
 * @see https://schema.org/Article
 */
export type SchemaOrgArticleType =
  | "Article"           // Generic article
  | "BlogPosting"       // Blog post
  | "NewsArticle"       // News article
  | "ScholarlyArticle"  // Academic/research article
  | "TechArticle"       // Technical article
  | "Report"            // Report or documentation
  | "HowTo"             // Tutorial or how-to guide
  | "Review"            // Review or annotation

export interface StructuredDataMapping {
  /** Tag to match (e.g., "writing/articles") */
  tag: string
  /** Schema.org type */
  type: SchemaOrgArticleType
  /** Human-readable section name for articleSection property */
  section: string
}

export interface StructuredDataAuthor {
  /** "Organization" or "Person" */
  type: "Organization" | "Person"
  /** Author name */
  name: string
  /** Author URL (optional) */
  url?: string
}

export interface StructuredDataConfiguration {
  /**
   * Tag-to-type mappings for structured data.
   * Order matters: first matching tag determines the article type and section.
   */
  mappings?: StructuredDataMapping[]
  
  /** Default Schema.org type when no tags match */
  defaultType?: SchemaOrgArticleType
  
  /** Author information for structured data */
  author?: StructuredDataAuthor
  
  /** Publisher information (defaults to author if not specified) */
  publisher?: StructuredDataAuthor
}

export interface GlobalConfiguration {
  pageTitle: string
  pageTitleSuffix?: string
  /** Whether to enable single-page-app style rendering. this prevents flashes of unstyled content and improves smoothness of Quartz */
  enableSPA: boolean
  /** Whether to display Wikipedia-style popovers when hovering over links */
  enablePopovers: boolean
  /** Analytics mode */
  analytics: Analytics
  /** Glob patterns to not search */
  ignorePatterns: string[]
  /** Whether to use created, modified, or published as the default type of date */
  defaultDateType: ValidDateType
  /** Base URL to use for CNAME files, sitemaps, and RSS feeds that require an absolute URL.
   *   Quartz will avoid using this as much as possible and use relative URLs most of the time
   */
  baseUrl?: string
  theme: Theme
  /**
   * Allow to translate the date in the language of your choice.
   * Also used for UI translation (default: en-US)
   * Need to be formatted following BCP 47: https://en.wikipedia.org/wiki/IETF_language_tag
   * The first part is the language (en) and the second part is the script/region (US)
   * Language Codes: https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
   * Region Codes: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
   */
  locale: ValidLocale
  /** Tag system configuration for colors and icons */
  tags?: TagConfiguration
  /** Structured data (JSON-LD) configuration for SEO */
  structuredData?: StructuredDataConfiguration
  /** Base GitHub repository URL for source links (e.g., "https://github.com/user/repo/blob/main") */
  repoUrl?: string
}

export interface QuartzConfig {
  configuration: GlobalConfiguration
  plugins: PluginTypes
}

export interface FullPageLayout {
  head: QuartzComponent
  header: QuartzComponent[]
  beforeBody: QuartzComponent[]
  pageBody: QuartzComponent
  afterBody: QuartzComponent[]
  left: QuartzComponent[]
  right: QuartzComponent[]
  footer: QuartzComponent
}

export type PageLayout = Pick<FullPageLayout, "beforeBody" | "left" | "right"> & {
  body?: QuartzComponent[]
  pageHeader?: QuartzComponent[]
  afterBody?: QuartzComponent[]
}
export type SharedLayout = Pick<FullPageLayout, "head" | "header" | "footer" | "afterBody">
