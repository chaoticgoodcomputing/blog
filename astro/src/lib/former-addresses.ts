// Former addresses: where the Quartz site served a page or a file that this site serves at another
// address. The Quartz site wrote a note's address in lower case, and an MDX note's with `.mdx` after
// it, an alias's in lower case (an MDX note's, with `.mdx` after it), and an attachment's path
// slugged and in lower case; this site keeps a name's case, gives an MDX note the
// address a Markdown note has, and publishes an attachment at its path in the vault. Each former address forwards the reader to
// the page or the file, through the address map (./addresses.ts), so a link to the old site
// keeps working.
//
// A former address is no note, so nothing that asks the notes query lists one, as an alias
// redirect is not listed.

import type { Note } from "./notes.ts"
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
 * Each former address that is not where its page or file is now, and where that is: each note's,
 * each of `aliases`'s (an alias's own address and the note it forwards to), and with `.mdx` after
 * it where the alias's note is MDX, as an MDX note's old address had, each of `attachments`'s (the
 * published attachments' addresses), and the tags index's. Plain addresses, as a reader writes
 * them: how Astro writes one as a redirect is ./addresses.ts's `toAstroRedirects`.
 */
export function formerAddresses(
  notes: Note[],
  aliases: Record<string, string> = {},
  attachments: Iterable<string> = [],
): Record<string, string> {
  const forwards: Record<string, string> = {}
  for (const note of notes) {
    const former = formerAddress(note)
    if (former !== note.url) forwards[former] = note.url
  }
  // An alias is a note's old path, and an MDX note was most likely MDX there too.
  const mdx = new Set(notes.filter((note) => note.file.extension === "mdx").map((note) => note.url))
  for (const [alias, page] of Object.entries(aliases)) {
    const former = alias.toLowerCase()
    if (mdx.has(page)) forwards[`${former}.mdx`] = page
    if (former !== alias) forwards[former] = page
  }
  for (const address of attachments) {
    const former = formerAttachmentAddress(address)
    // GitHub Pages serves `/a` from `a.html`, so an HTML attachment needs none there.
    if (former !== address && `${former}.html` !== address) forwards[former] = address
  }
  forwards[FORMER_TAGS_INDEX] = TAGS_INDEX
  return forwards
}

