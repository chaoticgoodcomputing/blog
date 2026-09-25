// cgc-seo's options, as the site config gives them. Every one is optional.

/** A person or organization credited in JSON-LD and `article:author`. A bare string is a Person's name. */
export type AuthorOption = string | { name: string; url?: string; type?: "Person" | "Organization" }

export interface Options {
  /**
   * Tags that make a page a **private page**: a page carrying one of them, or a descendant of one
   * (`private/work` under `private`), gets `noindex`. So does that tag's own listing page. Default
   * `["private"]`.
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
}
