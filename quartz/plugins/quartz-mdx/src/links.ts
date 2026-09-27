// `.mdx` pages at their own slugs, and links that reach them there (docs/adr/0005). A page's slug is
// what core's `slugifyFilePath` gives its file, extension kept, as stock canvas-page and bases-page
// keep `.canvas` and `.base`: `lab/life.mdx` lives at `lab/life.mdx`, and `ctx.allSlugs` lists it
// there. So a link written with the extension reaches it through crawl-links alone. A link written
// without it, `[[life]]` or `[[/cv]]`, names the page's clean URL, which is only a redirect now,
// and crawl-links finds no page there. This points each such link at the page itself, before
// crawl-links resolves it, so the backlinks and graph edges built from links count the page.
import path from "node:path"
import { visit } from "unist-util-visit"
import { slugifyFilePath } from "@quartz-community/utils/path"

export const EXT = ".mdx"

/** A path slugified as a `.md` file's: `lab/life` for `lab/life`, as note-properties slugifies an alias. */
const asPage = (p: string) => slugifyFilePath((p + ".md") as any) as string

/**
 * An `.mdx` page's clean URL, as v4 published it and as its alias keeps it: its path without the
 * extension, slugified as a `.md` file's. `lab/life` for `lab/life.mdx`.
 */
export function cleanUrl(relativePath: string): string {
  return asPage(relativePath.slice(0, -EXT.length))
}

/** Where links can land: the `.mdx` pages' slugs, and every other slug Quartz lists. */
export interface Targets {
  mdx: ReadonlySet<string>
  pages: ReadonlySet<string>
}

/** The part of Quartz's build context the targets are read from. */
interface SlugContext {
  allFiles?: readonly string[]
  allSlugs?: readonly string[]
}

export function targetsOf(ctx: SlugContext): Targets {
  const mdx = new Set((ctx.allFiles ?? []).filter((file) => file.endsWith(EXT)).map((file) => slugifyFilePath(file as any) as string))
  return { mdx, pages: new Set((ctx.allSlugs ?? []).filter((slug) => !mdx.has(slug))) }
}

// is-absolute-url's test, which crawl-links uses to tell an external link from an internal one.
const ABSOLUTE = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/

/**
 * An internal link written without an extension, pointed at the `.mdx` page it names, or `undefined`
 * to leave it as it is: when it has an extension already, names a folder, or could reach any other
 * page. A link from `/`, `./` or `../` names one path, which it takes exactly. A bare one names a
 * path from the root or, under crawl-links' `shortest`, the one page whose slug ends with it; either
 * way, a page whose slug ends with it.
 */
export function toMdxPage(href: string, from: string, { mdx, pages }: Targets): string | undefined {
  if (ABSOLUTE.test(href) || href.startsWith("#")) return
  const end = href.search(/[?#]/)
  const target = end < 0 ? href : href.slice(0, end)
  if (!target || target.endsWith("/") || /\.[A-Za-z0-9]+$/.test(target)) return
  let decoded: string
  try {
    decoded = decodeURI(target)
  } catch {
    return
  }
  const withMdx = target + EXT + href.slice(target.length)
  if (decoded.startsWith("/") || decoded.startsWith("./") || decoded.startsWith("../")) {
    const joined = decoded.startsWith("/") ? decoded.slice(1) : path.posix.join(path.posix.dirname(from), decoded)
    if (joined.startsWith("../")) return
    const slug = asPage(joined)
    return !pages.has(slug) && mdx.has(slug + EXT) ? withMdx : undefined
  }
  const slug = asPage(decoded)
  const endsWith = (slugs: ReadonlySet<string>, name: string) => [...slugs].some((s) => s === name || s.endsWith("/" + name))
  return !endsWith(pages, slug) && endsWith(mdx, slug + EXT) ? withMdx : undefined
}

/**
 * rehype plugin: points every internal link to an `.mdx` page's clean URL at the page. It has to
 * run before crawl-links resolves the link, which this plugin's order (45, below crawl-links' 60)
 * ensures. It reads the slugs as each file is transformed, after note-properties has added the
 * aliases parsed so far, as crawl-links does.
 */
export function mdxLinks(ctx: SlugContext) {
  return () => (tree: any, file: any) => {
    const targets = targetsOf(ctx)
    if (targets.mdx.size === 0) return
    const from = String(file.data?.slug ?? "")
    visit(tree, "element", (el: any) => {
      if (el.tagName !== "a" || typeof el.properties?.href !== "string") return
      const to = toMdxPage(el.properties.href, from, targets)
      if (to !== undefined) el.properties.href = to
    })
  }
}
