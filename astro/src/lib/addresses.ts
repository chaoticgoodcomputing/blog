// The site's address map: every address that once led to a page or file of the site and now
// forwards to one, and where it leads. An alias is one, and so is a former address, where the
// Quartz site served a page or file. The map holds plain addresses, as a reader writes them;
// how Astro writes each as a redirect page is `toAstroRedirects`'s to say.

import { aliasRedirects, publishedFiles, staticPages } from "./aliases.ts"
import { publishedAttachments } from "./attachments.ts"
import { formerAddresses } from "./former-addresses.ts"
import { getNoteIndex, getNotes, tagsOf, type Note } from "./notes.ts"
import { resumeAddresses } from "./resume.ts"
import { tagUrl } from "./tags.ts"
import { trailingSlashRedirects } from "./trailing-slashes.ts"

/** Where an address leads, as `AddressMap.resolve` says. */
export type Resolve = (address: string) => string

export interface AddressMap {
  /** Each forwarding address, and the address it forwards to. */
  forwards: Record<string, string>
  /** Where an address leads: through the map to a page or file of the site, or itself. */
  resolve: Resolve
}

export interface AddressSources {
  notes: Note[]
  /** Each alias's address, and the address it forwards to (./aliases.ts). */
  aliases?: Record<string, string>
  /** The addresses of the files the site publishes from the vault, as they are now. */
  attachments?: Iterable<string>
}

/** The address map of `notes`, their `aliases` and `attachments`. An alias wins over a former address. */
export function addressMap({ notes, aliases = {}, attachments = [] }: AddressSources): AddressMap {
  const forwards = { ...formerAddresses(notes, aliases, attachments), ...aliases }
  return {
    forwards,
    resolve(address) {
      let at = address
      for (let hops = 0; hops < 3 && forwards[at] !== undefined; hops++) at = forwards[at]!
      return at
    },
  }
}

export interface BuiltAddresses {
  /** The addresses of the site's pages: its notes', its tags', and its other pages'. */
  pages: Iterable<string>
  /** The addresses of the files the site publishes as they are, beside its pages. */
  files?: Iterable<string>
}

/**
 * Astro's `redirects` for the map, as the build writes them. Astro writes a redirect from `/a` as
 * the page `a.html`. Where that file's name differs only in case from a file the build writes
 * anyway (a page's, a published file's, or another forwarding address's), a file system that
 * ignores case would hold one file for both, so the redirect is written as its folder's index,
 * `/a/index`, instead. Of two forwarding addresses that differ only in case, the lower-case one, a
 * former address, gives way. Then each page and each forwarding address gets a trailing-slash
 * redirect (./trailing-slashes.ts).
 */
export function toAstroRedirects(map: AddressMap, { pages, files = [] }: BuiltAddresses): Record<string, string> {
  const pageList = [...pages]
  const written = new Set([...pageList.map((page) => `${page}.html`), ...files].map((file) => file.toLowerCase()))
  const forwarding = Object.keys(map.forwards)
  const clashes = (from: string) =>
    written.has(`${from}.html`.toLowerCase()) ||
    (from === from.toLowerCase() && forwarding.some((other) => other !== from && other.toLowerCase() === from))
  const routes: Record<string, string> = {}
  for (const [from, to] of Object.entries(map.forwards)) routes[clashes(from) ? `${from}/index` : from] = to
  return { ...routes, ...trailingSlashRedirects(pageList, routes) }
}

let siteMap: AddressMap | undefined

/**
 * The site's address map: its notes' former addresses, its aliases, and its attachments' former
 * addresses. Worked out once, where the Astro config first asks for it as it loads: an alias left
 * without a redirect is reported then, and its page or file keeps the address.
 */
export function getAddressMap(): AddressMap {
  if (siteMap) return siteMap
  const index = getNoteIndex()
  const { notes } = index
  const { redirects: aliases, collisions } = aliasRedirects(notes, staticPages(), publishedFiles(), index.tagDescriptions())
  for (const { file, alias, address, holder } of collisions) {
    console.warn(`[aliases] ${file}: the alias "${alias}" has no redirect, since ${address} is ${holder}.`)
  }
  // The resume was an attachment of the vault's, and keeps its former address (./resume.ts).
  const attachments = [...publishedAttachments().keys(), ...resumeAddresses()]
  siteMap = addressMap({ notes, aliases, attachments })
  return siteMap
}

/** The site's redirects, for Astro's `redirects` (astro.config.ts). */
export function getAstroRedirects(): Record<string, string> {
  const notes = getNotes()
  const tagPages = [...tagsOf(notes).keys()].map(tagUrl)
  const pages = [...notes.map((note) => note.url), ...tagPages, ...staticPages()]
  return toAstroRedirects(getAddressMap(), { pages, files: publishedFiles() })
}
