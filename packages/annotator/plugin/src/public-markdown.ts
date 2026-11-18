// A comment as the web reads it, for Hypothesis: its wikilinks made links to the notes' pages on the
// site, which the vault's links name by their files. The site's rule for a note's address is the
// Astro site's (astro/src/lib/vault.ts, `slugFor` and `pagePath`), copied here: a change to one is a
// change to the other. A note not on the site yet still gets its address, since it may be later.
// Nothing here reaches Obsidian: the vault's files come through `resolve`.

import GithubSlugger, { slug } from "github-slugger"

/** A file of the vault a link names: its path, and a note's headings, in order. */
export interface LinkedFile {
  path: string
  headings: readonly string[]
}

export interface Site {
  /** The site's address, without a trailing `/`: `https://chaoticgood.computer`. Empty, no site. */
  url: string
  /** The vault's folders whose notes are the site's, from its root: `public`, `private`. */
  roots: readonly string[]
}

/**
 * Finds the file a link's path names, as Obsidian would from the note being converted; the empty
 * path is that note itself.
 */
export type Resolve = (linkpath: string) => LinkedFile | undefined

/** The site's slug of a note's path under its root: Quartz's rule, as the site keeps it. */
export function slugFor(notePath: string): string {
  return notePath
    .replace(/\.mdx?$/i, "")
    .split("/")
    .map((segment) => segment.replace(/\s/g, "-").replace(/&/g, "-and-").replace(/%/g, "-percent").replace(/[?#]/g, ""))
    .join("/")
}

/** A slug's page path: a folder's `index` is the folder. */
const pagePath = (slug: string) => (slug === "index" ? "" : slug.replace(/\/index$/, ""))

/** The page on the site of a note at a path of the vault; none for one outside the site's folders, or no note. */
export function pageUrl(path: string, site: Site): string | undefined {
  if (!site.url || !/\.mdx?$/i.test(path)) return undefined
  const root = site.roots.map((root) => root.replace(/^\/+|\/+$/g, "")).find((root) => root === "" || path.startsWith(`${root}/`))
  if (root === undefined) return undefined
  const under = root === "" ? path : path.slice(root.length + 1)
  return `${site.url.replace(/\/+$/, "")}/${encodeURI(pagePath(slugFor(under))).replace(/[()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`
}

/** The anchor a subpath has on a note's page: a block's `^id`, a heading's slug as the site numbers it. */
function anchorOf(subpath: string, file: LinkedFile): string | undefined {
  const last = subpath.split("#").filter(Boolean).at(-1)
  if (!last) return undefined
  if (last.startsWith("^")) return last
  const slugger = new GithubSlugger()
  const wanted = slug(last)
  for (const heading of file.headings) {
    const anchor = slugger.slug(heading)
    if (slug(heading) === wanted) return anchor
  }
  return undefined
}

/** What a wikilink shows: its alias, or its link text with each `#` as Obsidian shows it. */
const shown = (linktext: string, alias: string | undefined) =>
  alias?.trim() || linktext.replace(/^#/, "").split("#").map((part) => part.replace(/^\^/, "").trim()).filter(Boolean).join(" > ")

const escapeText = (text: string) => text.replace(/([[\]\\])/g, "\\$1")

/** One wikilink, as a Markdown link to its page, or its text when it goes nowhere on the site. */
function convertLink(inner: string, resolve: Resolve, site: Site): string {
  const bar = inner.indexOf("|")
  const linktext = (bar < 0 ? inner : inner.slice(0, bar)).trim()
  const alias = bar < 0 ? undefined : inner.slice(bar + 1)
  const hash = linktext.indexOf("#")
  const linkpath = hash < 0 ? linktext : linktext.slice(0, hash).trim()
  const subpath = hash < 0 ? "" : linktext.slice(hash)
  const text = escapeText(shown(linktext, alias))
  const file = resolve(linkpath)
  const page = file && pageUrl(file.path, site)
  if (!file || page === undefined) return text
  const anchor = subpath ? anchorOf(subpath, file) : undefined
  return `[${text}](${page}${anchor ? `#${anchor}` : ""})`
}

/** Code, fenced or inline, which is left as it is. */
const CODE = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/
const WIKILINK = /!?\[\[([^\[\]\n]+)\]\]/g

/** A comment with its wikilinks, and embeds, made Markdown links to their pages on the site. */
export function publicMarkdown(comment: string, resolve: Resolve, site: Site): string {
  return comment
    .split(CODE)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(WIKILINK, (_whole, inner: string) => convertLink(inner, resolve, site))))
    .join("")
}
