// cgc-seo's options, as the site config gives them. Every one is optional.

/** A person or organization credited in JSON-LD and `article:author`. A bare string is a Person's name. */
export type AuthorOption = string | { name: string; url?: string; type?: "Person" | "Organization" }

export interface Options {
  /**
   * The private tags: a **private page** (tags-core) carries one of them, or a descendant of one
   * (`private/work` under `private`), and gets `noindex`. So does a **private tag page**, the page of
   * one of those tags (`tags/private`, `tags/private/work`). Written as a site writes tags, and
   * normalised as the tag engine normalises them. Default `["private"]`.
   */
  noindexTags: string[]
  /**
   * The **default author**: credited on every page whose frontmatter names no `author`. Default: the
   * site itself, an Organization named by `pageTitle`.
   */
  defaultAuthor?: AuthorOption
  /**
   * The JSON-LD publisher. Default: the default author. An Organization is given a logo, which
   * defaults to the site icon, `static/icon.png`.
   */
  publisher?: Exclude<AuthorOption, string> & { logo?: { url?: string; width?: number; height?: number } }
  /**
   * Folders whose pages are articles, carrying `article:*` meta and JSON-LD. Default: every page
   * built from a file of its own (not tag listings or the 404 page).
   */
  articleFolders?: string[]
  /** The JSON-LD `@type` and `articleSection` for a page carrying `tag`. The first match wins. */
  articleTypes?: { tag: string; type: string; section?: string }[]
  /** The JSON-LD `@type` when no `articleTypes` entry matches. Default `Article`. */
  defaultArticleType?: string
  /**
   * Whether to write `sitemap.xml`: every indexable page, and the page of every tag one carries.
   * Default `true`. Turn off `content-index`'s own (`enableSiteMap: false`), or the two race.
   */
  enableSiteMap?: boolean
  /**
   * Whether to write the RSS feed, `index.xml`, of the newest indexable articles, and link it from
   * every page's head. Default `true`. Turn off `content-index`'s own (`enableRSS: false`).
   */
  enableRSS?: boolean
  /** The most articles the feed carries, newest first. Default 10; 0 carries every article. */
  rssLimit?: number
  /**
   * The feed's description when it has no limit, before ` on <pageTitle>`: stock content-index's
   * option, for a site in another language. Default `Recent notes`.
   */
  rssRecentNotesText?: string
  /**
   * The feed's description when it has a limit, before ` on <pageTitle>`: stock content-index's
   * option. `{count}` in a string is replaced by the limit; stock's function form, `(count) =>
   * string`, is taken too. Default `Last {count} notes`.
   */
  rssLastFewNotesText?: string | ((count: number) => string)
}
