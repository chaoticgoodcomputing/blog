// Former addresses: where the Quartz site served a page or a file that this site serves at another
// address. The Quartz site wrote a note's address in lower case, and an MDX note's with `.mdx` after
// it, an alias's in lower case, and an attachment's path slugged and in lower case; this site keeps a
// name's case (docs/adr/0003), gives an MDX note the address a Markdown note has, and publishes an
// attachment at its path in the vault (docs/adr/0101). Each former address forwards the reader to
// the page or the file, through Astro's `redirects` (astro.config.ts), so a link to the old site
// keeps working.
//
// A former address is no note, so nothing that asks the notes query lists one, as an alias
// redirect is not listed.

import { aliasRedirects, publishedFiles, staticPages } from "./aliases.ts"
import { publishedAttachments } from "./attachments.ts"
import { getNotes, type Note } from "./notes.ts"
import { TAGS_INDEX } from "./tags.ts"
import { slugFor } from "./vault.ts"

/** The address the Quartz site gave a note: its address in lower case, and an MDX note's with `.mdx` after it. */
export function formerAddress(note: Note): string {
  return `${note.url.toLowerCase()}${note.file.extension === "mdx" ? ".mdx" : ""}`
}

/**
 * The address the Quartz site gave an attachment, from the attachment's address on this site: its
 * path slugged as a note's is, in lower case, and an HTML file's without `.html`.
 */
export function formerAttachmentAddress(address: string): string {
  return slugFor(address).replace(/\.html$/, "").toLowerCase()
}

// The Quartz site's tags index was its `tags` folder's index page.
const FORMER_TAGS_INDEX = `${TAGS_INDEX}/index`

/**
 * The route Astro is given for a redirect from `former` to what is in the build's file `file`.
 * Astro writes a redirect as a page, to the file of its address with `.html` after it. Where that
 * differs from `file` only in case, a file system that ignores case would hold one file for both,
 * and the page would forward to itself, so the redirect is the index of a folder of its name
 * (docs/adr/2901).
 */
function redirectRoute(former: string, file: string): string {
  return `${former}.html`.toLowerCase() === file.toLowerCase() ? `${former}/index` : former
}

/**
 * Astro's `redirects` for the former addresses that are not where the page or file is now: each
 * note's, each of `aliases`'s (Astro's `redirects` for the aliases, src/lib/aliases.ts), each of
 * `attachments`'s (the published attachments' addresses), and the tags index's. An attachment that
 * GitHub Pages would serve at its former address, as it serves `/a` from `a.html`, needs none.
 */
export function formerAddressRedirects(
  notes: Note[],
  aliases: Record<string, string> = {},
  attachments: Iterable<string> = [],
): Record<string, string> {
  const redirects: Record<string, string> = {}
  for (const note of notes) {
    const former = formerAddress(note)
    if (former === note.url) continue
    redirects[redirectRoute(former, `${note.url}.html`)] = note.url
  }
  for (const [alias, page] of Object.entries(aliases)) {
    const former = alias.toLowerCase()
    if (former === alias) continue
    redirects[redirectRoute(former, `${alias}.html`)] = page
  }
  for (const address of attachments) {
    const former = formerAttachmentAddress(address)
    if (former === address || `${former}.html` === address) continue
    // Not percent-encoded: Astro encodes a redirect's destination as it writes it.
    redirects[redirectRoute(former, address)] = address
  }
  redirects[FORMER_TAGS_INDEX] = TAGS_INDEX
  return redirects
}

/** The site's former-address redirects, for Astro's `redirects`. */
export function getFormerAddressRedirects(): Record<string, string> {
  const notes = getNotes()
  // The aliases' redirects as `getAliasRedirects()` gives them, without reporting its collisions again.
  const aliases = aliasRedirects(notes, staticPages(), publishedFiles()).redirects
  return formerAddressRedirects(notes, aliases, publishedAttachments().keys())
}
