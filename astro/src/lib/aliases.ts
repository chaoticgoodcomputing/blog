// Alias redirects: each alias in a note's frontmatter is an address that forwards the reader to the
// note, so a note's old names keep working. The redirects themselves are Astro's own, its
// `redirects` setting (astro.config.ts), and this module says what they are.
//
// An alias redirect is no note, so nothing that asks the notes query ever lists one: not a post
// listing, the feed, the sitemap, search or the graph.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseFrontMatterAliases } from "@chaoticgoodcomputing/obsidian-markdown"
import { publishedAttachments } from "./attachments.ts"
import { getDrawingExports } from "./drawings.ts"
import { getNotes, tagsOf, type Note } from "./notes.ts"
import { tagUrl } from "./tags.ts"
import { pagePath, slugFor } from "./vault.ts"

/** An alias that got no redirect, since its address was already something else's. */
export interface AliasCollision {
  /** The path in the vault of the note that has the alias. */
  file: string
  /** The alias as written. */
  alias: string
  /** The address it would have had. */
  address: string
  /** What has that address: a note's page, a tag's page, a page of the site, an earlier alias. */
  holder: string
}

export interface AliasRedirects {
  /** Astro's `redirects`: each alias's address, and the address of the note it forwards to. */
  redirects: Record<string, string>
  /** The aliases left without a redirect, in the vault's order. */
  collisions: AliasCollision[]
}

/**
 * The address an alias is: the one a note at that path of the vault would have, by the same slug
 * rule. An alias is read from the site's root however it is written, so none leaves the site.
 */
export function aliasAddress(alias: string): string {
  const fromRoot = path.posix.join("/", alias.trim().replace(/\\/g, "/"))
  return `/${pagePath(slugFor(fromRoot.replace(/^\/+|\/+$/g, "")))}`
}

/**
 * The alias redirects of the published notes. An alias whose address is a page's keeps no redirect,
 * and the page wins: a published note's, a tag's, or one of `pages`, the site's other pages. So
 * does one whose address is one of `files`, the files the site publishes, and one that an earlier
 * note's alias already has. The comparison ignores case, since a build writes files, and not every
 * file system tells `A.html` from `a.html`.
 */
export function aliasRedirects(
  notes: Note[],
  pages: Iterable<string> = [],
  files: Iterable<string> = [],
): AliasRedirects {
  const holders = new Map<string, string>()
  const hold = (address: string, holder: string) => {
    if (!holders.has(address.toLowerCase())) holders.set(address.toLowerCase(), holder)
  }
  for (const note of notes) hold(note.url, `the page of ${note.file.path}`)
  for (const tag of tagsOf(notes).keys()) hold(tagUrl(tag), `the page of the tag ${tag}`)
  for (const page of pages) hold(page, "a page of the site")
  for (const file of files) hold(file, "a file the site publishes")

  const result: AliasRedirects = { redirects: {}, collisions: [] }
  for (const note of notes) {
    for (const alias of parseFrontMatterAliases(note.frontmatter) ?? []) {
      const address = aliasAddress(alias)
      const holder = holders.get(address.toLowerCase())
      if (holder) {
        result.collisions.push({ file: note.file.path, alias, address, holder })
        continue
      }
      result.redirects[address] = note.url
      hold(address, `an alias of ${note.file.path}`)
    }
  }
  return result
}

// The routes Astro makes from src/pages
// (https://docs.astro.build/en/guides/routing/#static-routes): a file is a page or an endpoint, a
// file or folder whose name starts with `_` is not, and an `index` is its folder's.
const ROUTE = /\.(astro|md|mdx|html|js|ts)$/

/**
 * The addresses of the site's static routes, every file under src/pages with no parameter in its
 * path: `404.astro` is `/404`, `tags/index.astro` is `/tags`. A dynamic route's pages are the notes
 * query's to know, and `aliasRedirects` asks it.
 */
export function staticPages(pages: string = fileURLToPath(new URL("../pages/", import.meta.url))): string[] {
  return fs
    .readdirSync(pages, { recursive: true, encoding: "utf8" })
    .map((file) => file.split(path.sep).join("/"))
    .filter((file) => ROUTE.test(file) && !/[[\]]/.test(file) && !file.split("/").some((part) => part.startsWith("_")))
    .map((file) => `/${pagePath(file.replace(ROUTE, ""))}`)
}

/**
 * The addresses of the files the site publishes as they are, beside its pages: each drawing's
 * exports (src/pages/drawings), the vault's attachments (src/integrations/attachments.ts), and the
 * files of `public/`. Not percent-encoded, as an alias's address is not.
 */
export function publishedFiles(
  publicFolder: string = fileURLToPath(new URL("../../public/", import.meta.url)),
): string[] {
  // Listed as the dev server lists them: a missing export is the build's to report (docs/adr/0302).
  const exports = getDrawingExports({ strict: false }).map((each) => each.url)
  const own = fs
    .readdirSync(publicFolder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => `/${path.relative(publicFolder, path.join(entry.parentPath, entry.name)).split(path.sep).join("/")}`)
  return [...exports, ...publishedAttachments().keys(), ...own]
}

/**
 * The site's alias redirects, for Astro's `redirects`. An alias left without one is reported as the
 * config loads, and its page or file keeps the address.
 */
export function getAliasRedirects(): Record<string, string> {
  const { redirects, collisions } = aliasRedirects(getNotes(), staticPages(), publishedFiles())
  for (const { file, alias, address, holder } of collisions) {
    console.warn(`[aliases] ${file}: the alias "${alias}" has no redirect, since ${address} is ${holder}.`)
  }
  return redirects
}
