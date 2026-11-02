// Trailing slashes: the site builds each page as a file, `/a` as `a.html` (astro.config.ts), and
// GitHub Pages serves `/a/` only from `a/index.html`, so a link written with a trailing slash would
// be the 404 page. Each page, tag page and alias redirect gets a redirect at its folder's index
// instead, which forwards the reader to the address without the slash, through Astro's `redirects`.
//
// A trailing-slash redirect is no note, so nothing that asks the notes query lists one, as an
// alias redirect is not listed.

import { getNotes, tagsOf } from "./notes.ts"
import { tagUrl } from "./tags.ts"

/**
 * Astro's `redirects` from each address's folder index, `/a/index`, to where `/a` leads: to `/a`
 * itself for each of `pages`, and for each of `redirects`'s addresses straight to where it forwards,
 * so the reader is forwarded once. The home page and the 404 page get none, nor does an address
 * that is already a folder's index or the address of a file (an endpoint's, `/graph.json`). Nor does
 * one whose folder index `redirects` already sends somewhere else, by a name that differs only in
 * case: the build writes files, and not every file system tells `A/index.html` from `a/index.html`.
 */
export function trailingSlashRedirects(
  pages: Iterable<string>,
  redirects: Record<string, string> = {},
): Record<string, string> {
  const taken = new Map(Object.entries(redirects).map(([from, to]) => [from.toLowerCase(), to]))
  const result: Record<string, string> = {}
  const add = (address: string, to: string) => {
    if (address === "/" || address === "/404" || /\/index$/.test(address)) return
    if (/\.[^/]*$/.test(address)) return
    const route = `${address}/index`
    const held = taken.get(route.toLowerCase())
    if (held !== undefined && held !== to) return
    taken.set(route.toLowerCase(), to)
    result[route] = to
  }
  for (const page of pages) add(page, page)
  for (const [from, to] of Object.entries(redirects)) add(from, to)
  return result
}

/**
 * The site's trailing-slash redirects, for Astro's `redirects`: its notes' pages, its tags' pages,
 * `pages`, the site's other pages, and the addresses of `redirects`, its other redirects.
 */
export function getTrailingSlashRedirects(
  pages: Iterable<string>,
  redirects: Record<string, string>,
): Record<string, string> {
  const notes = getNotes()
  const tagPages = [...tagsOf(notes).keys()].map(tagUrl)
  return trailingSlashRedirects([...notes.map((note) => note.url), ...tagPages, ...pages], redirects)
}
